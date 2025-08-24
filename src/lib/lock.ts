type LockSettings = {
  appLockEnabled: boolean;
  webauthnCredentialId?: string | null;
  autoLockMinutes: number | null; // null = off
  requireUnlockForExport: boolean;
  hideSensitivePreviews: boolean;
};

type LockState = {
  locked: boolean;
  lastActiveAt: number;
};

const LS_KEY = "cc_security_settings_v1";
const STATE_KEY = "cc_lock_state_v1";

let settings: LockSettings = loadSettings();
let state: LockState = loadState();
let idleTimer: number | null = null;
const subs = new Set<() => void>();

function loadSettings(): LockSettings {
  try { const raw = localStorage.getItem(LS_KEY); if (raw) return JSON.parse(raw); } catch {}
  return {
    appLockEnabled: false,
    webauthnCredentialId: null,
    autoLockMinutes: null,
    requireUnlockForExport: false,
    hideSensitivePreviews: false,
  };
}

function saveSettings() { localStorage.setItem(LS_KEY, JSON.stringify(settings)); }

function loadState(): LockState {
  try { const raw = localStorage.getItem(STATE_KEY); if (raw) return JSON.parse(raw); } catch {}
  return { locked: false, lastActiveAt: Date.now() };
}
function saveState() { localStorage.setItem(STATE_KEY, JSON.stringify(state)); notify(); }
function notify() { subs.forEach((fn) => fn()); }

export function subscribe(fn: () => void) { 
  subs.add(fn); 
  return () => { 
    subs.delete(fn); 
  }; 
}

export function initLock() {
  // Initialize privacy screen for native apps
  (async () => {
    const { isNative } = await import('./platform');
    if (isNative) {
      const { initPrivacyScreen } = await import('./privacyScreen');
      await initPrivacyScreen();
    }
  })();
  
  // user activity listeners
  const bump = () => onUserActivity();
  window.addEventListener("pointerdown", bump);
  window.addEventListener("keydown", bump);
  window.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") onUserActivity(true);
  });
  restartIdleTimer();
  applyHideSensitivePreviews();
}

export function onUserActivity(fromVisibilityChange = false) {
  const prev = state.lastActiveAt;
  state.lastActiveAt = Date.now();
  saveState();
  if (fromVisibilityChange && settings.appLockEnabled && settings.autoLockMinutes) {
    const ms = settings.autoLockMinutes * 60_000;
    if (Date.now() - prev >= ms) lock("return-from-background");
  }
}

function restartIdleTimer() {
  if (idleTimer) window.clearInterval(idleTimer);
  idleTimer = window.setInterval(() => {
    if (!settings.appLockEnabled || !settings.autoLockMinutes) return;
    const ms = settings.autoLockMinutes * 60_000;
    if (!state.locked && Date.now() - state.lastActiveAt >= ms) lock("auto");
  }, 5_000);
}

export function isLocked() { return settings.appLockEnabled && state.locked; }
export function lock(_reason?: string | null) { if (!settings.appLockEnabled) return; state.locked = true; saveState(); }
export function unlock() { state.locked = false; state.lastActiveAt = Date.now(); saveState(); }

export function setAutoLockMinutes(mins: number | null) {
  settings.autoLockMinutes = mins;
  saveSettings();
  restartIdleTimer();
}
export function setRequireUnlockForExport(v: boolean) { settings.requireUnlockForExport = !!v; saveSettings(); }

export async function setHideSensitivePreviews(v: boolean) {
  settings.hideSensitivePreviews = !!v; 
  saveSettings(); 
  applyHideSensitivePreviews();
  
  // Update native privacy screen if available
  const { isNative } = await import('./platform');
  if (isNative) {
    const { setPrivacyScreenEnabled } = await import('./privacyScreen');
    await setPrivacyScreenEnabled(v);
  }
}
function applyHideSensitivePreviews() {
  const cls = "cc-sensitive-previews";
  if (settings.hideSensitivePreviews) document.documentElement.classList.add(cls);
  else document.documentElement.classList.remove(cls);
}

/** Enable App Lock by enrolling a platform authenticator. No passcode fallback. */
export async function enableAppLock(): Promise<boolean> {
  // Check if native auth is available
  const { isNative } = await import('./platform');
  if (isNative) {
    const { nativeIsAvailable, nativeRequireAuth } = await import('./nativeAuth');
    const available = await nativeIsAvailable();
    if (!available) {
      alert("This device doesn't support biometric authentication. Please ensure Face ID/Touch ID (or device PIN) is set up.");
      return false;
    }
    // Test authentication works before enabling
    const success = await nativeRequireAuth("Enable App Lock");
    if (!success) return false;
    
    settings.appLockEnabled = true;
    saveSettings();
    lock("enabled");
    return true;
  }
  
  // Web fallback - existing WebAuthn code
  if (!canUseWebAuthn()) {
    alert("This device/browser doesn't support secure device authentication (WebAuthn).");
    return false;
  }
  try {
    const cred = await navigator.credentials.create({
      publicKey: {
        challenge: crypto.getRandomValues(new Uint8Array(32)),
        rp: { name: "ClearCase" },
        user: {
          id: crypto.getRandomValues(new Uint8Array(16)),
          name: "clearcase-user",
          displayName: "ClearCase user",
        },
        pubKeyCredParams: [{ type: "public-key", alg: -7 }, { type: "public-key", alg: -257 }],
        authenticatorSelection: {
          authenticatorAttachment: "platform",
          userVerification: "required",
          residentKey: "preferred",
        },
        timeout: 60_000,
      },
    } as CredentialCreationOptions) as PublicKeyCredential | null;

    if (!cred) throw new Error("No credential created");
    settings.webauthnCredentialId = bufferToB64Url(cred.rawId);
    settings.appLockEnabled = true;
    saveSettings();
    lock("enabled");
    return true;
  } catch (e) {
    console.warn("WebAuthn enrollment failed", e);
    alert("Couldn't enable App Lock. Please ensure Face ID/Touch ID (or device PIN) is set up.");
    return false;
  }
}

/** Disabling requires successful device auth; if auth fails, remain enabled. */
export async function disableAppLock(): Promise<boolean> {
  const ok = await requireAuth("disable");
  if (ok !== "ok") return false;
  settings.appLockEnabled = false;
  settings.webauthnCredentialId = null;
  settings.autoLockMinutes = null;
  settings.requireUnlockForExport = false;
  saveSettings();
  unlock();
  return true;
}

/** Prompt the OS for Face ID/Touch ID/PIN. */
export async function requireAuth(_reason = "unlock"): Promise<"ok" | "denied"> {
  if (!settings.appLockEnabled) return "ok";
  
  // Use native auth if available
  const { isNative } = await import('./platform');
  if (isNative) {
    const { nativeRequireAuth } = await import('./nativeAuth');
    const success = await nativeRequireAuth(_reason);
    if (success) {
      unlock();
      return "ok";
    }
    return "denied";
  }
  
  // Web fallback - existing WebAuthn code
  if (!canUseWebAuthn() || !settings.webauthnCredentialId) return "denied";
  try {
    const assertion = await navigator.credentials.get({
      publicKey: {
        challenge: crypto.getRandomValues(new Uint8Array(32)),
        timeout: 60_000,
        userVerification: "required",
        allowCredentials: [{ id: b64UrlToBuffer(settings.webauthnCredentialId), type: "public-key" }],
      },
    } as CredentialRequestOptions) as PublicKeyCredential | null;
    if (assertion) { unlock(); return "ok"; }
  } catch (e) {
    console.warn("WebAuthn assertion failed", e);
  }
  return "denied";
}

function canUseWebAuthn() {
  return window.isSecureContext && "credentials" in navigator && "PublicKeyCredential" in window;
}
function bufferToB64Url(buf: ArrayBuffer) {
  const bytes = new Uint8Array(buf);
  let binary = ""; for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}
function b64UrlToBuffer(b64url: string) {
  const b64 = b64url.replace(/-/g, "+").replace(/_/g, "/") + "=".repeat((4 - (b64url.length % 4)) % 4);
  const binary = atob(b64); const len = binary.length; const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) bytes[i] = binary.charCodeAt(i);
  return bytes.buffer;
}

export const Lock = {
  initLock, subscribe,
  enableAppLock, disableAppLock,
  setAutoLockMinutes, setRequireUnlockForExport,
  setHideSensitivePreviews,
  requireAuth, isLocked, lock, unlock, onUserActivity,
};
export default Lock;