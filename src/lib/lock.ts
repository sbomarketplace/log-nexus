type LockSettings = {
  appLockEnabled: boolean;
  authMethod: "webauthn" | "passcode" | null;
  autoLockMinutes: number | null; // null = off
  requireUnlockForExport: boolean;
  hideSensitivePreviews: boolean;
  // passcode hash & salt (if using passcode fallback)
  passcodeHash?: string | null;
  passcodeSalt?: string | null;
  // webauthn
  webauthnCredentialId?: string | null;
};

type LockState = {
  locked: boolean;
  lastActiveAt: number;
  // used to drive UnlockModal visibility (consumer decides whether to show it)
  pendingReason: string | null;
};

const LS_KEY = "cc_security_settings_v1";
const STATE_KEY = "cc_lock_state_v1";

let settings: LockSettings = loadSettings();
let state: LockState = loadState();
let idleTimer: number | null = null;
const subs = new Set<() => void>();

function loadSettings(): LockSettings {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return {
    appLockEnabled: false,
    authMethod: null,
    autoLockMinutes: null,
    requireUnlockForExport: false,
    hideSensitivePreviews: false,
    passcodeHash: null,
    passcodeSalt: null,
    webauthnCredentialId: null,
  };
}

function saveSettings() {
  localStorage.setItem(LS_KEY, JSON.stringify(settings));
}

function loadState(): LockState {
  try {
    const raw = localStorage.getItem(STATE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return { locked: false, lastActiveAt: Date.now(), pendingReason: null };
}

function saveState() {
  localStorage.setItem(STATE_KEY, JSON.stringify(state));
  notify();
}

function notify() {
  subs.forEach((fn) => fn());
}

/** Call once at app bootstrap and on settings changes */
export function initLock() {
  attachActivityListeners();
  restartIdleTimer();
  applyHideSensitivePreviews();
}

function attachActivityListeners() {
  const bump = () => onUserActivity();
  window.addEventListener("pointerdown", bump);
  window.addEventListener("keydown", bump);
  window.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") {
      // Consider switching apps as inactivity
      onUserActivity(true);
    }
  });
}

function restartIdleTimer() {
  if (idleTimer) window.clearInterval(idleTimer);
  idleTimer = window.setInterval(() => {
    if (!settings.appLockEnabled || !settings.autoLockMinutes) return;
    const ms = settings.autoLockMinutes * 60_000;
    if (Date.now() - state.lastActiveAt >= ms && !state.locked) {
      lock();
    }
  }, 5_000);
}

export function onUserActivity(fromVisibilityChange = false) {
  state.lastActiveAt = Date.now();
  saveState();
  // If user returns to foreground and the timeout elapsed, ensure locked
  if (fromVisibilityChange && settings.appLockEnabled && settings.autoLockMinutes) {
    const ms = settings.autoLockMinutes * 60_000;
    if (Date.now() - state.lastActiveAt >= ms) lock();
  }
}

export function subscribe(fn: () => void) {
  subs.add(fn);
  return () => {
    subs.delete(fn);
  };
}

export function isLocked() {
  return settings.appLockEnabled && state.locked;
}

export function lock(reason: string | null = null) {
  if (!settings.appLockEnabled) return;
  state.locked = true;
  state.pendingReason = reason ?? state.pendingReason;
  saveState();
}

export function unlock() {
  state.locked = false;
  state.pendingReason = null;
  state.lastActiveAt = Date.now();
  saveState();
}

/** Consumer should show UnlockModal when this returns "passcode" and isLocked() */
export async function requireAuth(reason = "unlock"): Promise<"ok" | "passcode" | "webauthn-error" | "denied"> {
  if (!settings.appLockEnabled) return "ok";
  // If WebAuthn is available and enrolled, try that first
  if (settings.authMethod === "webauthn" && settings.webauthnCredentialId && canUseWebAuthn()) {
    try {
      const assertion = await navigator.credentials.get({
        publicKey: {
          challenge: crypto.getRandomValues(new Uint8Array(32)),
          timeout: 60_000,
          userVerification: "required" as UserVerificationRequirement,
          allowCredentials: [
            {
              id: base64ToArrayBuffer(settings.webauthnCredentialId),
              type: "public-key" as PublicKeyCredentialType,
            },
          ],
        },
      });
      if (assertion) {
        unlock();
        return "ok";
      }
    } catch (e) {
      console.warn("WebAuthn auth failed", e);
      return "webauthn-error";
    }
  }
  // Fall back to passcode modal
  state.pendingReason = reason;
  saveState();
  return "passcode";
}

export function setRequireUnlockForExport(v: boolean) {
  settings.requireUnlockForExport = !!v;
  saveSettings();
}

export function setAutoLockMinutes(mins: number | null) {
  settings.autoLockMinutes = mins;
  saveSettings();
  restartIdleTimer();
}

export async function enableAppLock(): Promise<"webauthn" | "passcode"> {
  // Try to enroll WebAuthn
  if (canUseWebAuthn()) {
    try {
      const cred = (await navigator.credentials.create({
        publicKey: {
          challenge: crypto.getRandomValues(new Uint8Array(32)),
          rp: { name: "ClearCase" },
          user: {
            id: crypto.getRandomValues(new Uint8Array(16)),
            name: "clearcase-user",
            displayName: "ClearCase user",
          },
          pubKeyCredParams: [{ type: "public-key" as PublicKeyCredentialType, alg: -7 }],
          authenticatorSelection: { userVerification: "required" as UserVerificationRequirement },
          timeout: 60_000,
        },
      })) as PublicKeyCredential | null;
      if (cred) {
        const idB64 = arrayBufferToBase64(cred.rawId);
        settings.webauthnCredentialId = idB64;
        settings.authMethod = "webauthn";
        settings.appLockEnabled = true;
        saveSettings();
        lock("app_lock_enabled");
        return "webauthn";
      }
    } catch (e) {
      console.warn("WebAuthn enrollment failed; falling back to passcode", e);
    }
  }
  // Fallback: request the user to create a passcode – handled by UI (UnlockModal in "setup" mode)
  settings.authMethod = "passcode";
  settings.appLockEnabled = true;
  settings.webauthnCredentialId = null;
  saveSettings();
  lock("setup-passcode");
  return "passcode";
}

export function disableAppLock() {
  settings.appLockEnabled = false;
  settings.authMethod = null;
  settings.autoLockMinutes = null;
  settings.requireUnlockForExport = false;
  settings.passcodeHash = null;
  settings.passcodeSalt = null;
  settings.webauthnCredentialId = null;
  saveSettings();
  unlock();
}

export function setHideSensitivePreviews(v: boolean) {
  settings.hideSensitivePreviews = !!v;
  saveSettings();
  applyHideSensitivePreviews();
}

function applyHideSensitivePreviews() {
  const cls = "cc-sensitive-previews";
  if (settings.hideSensitivePreviews) {
    document.documentElement.classList.add(cls);
  } else {
    document.documentElement.classList.remove(cls);
  }
}

/** Passcode helpers */
export async function setPasscode(newPass: string) {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const hash = await sha256Hex(newPass, salt);
  settings.passcodeSalt = arrayBufferToBase64(salt.buffer);
  settings.passcodeHash = hash;
  saveSettings();
}

export async function verifyPasscode(pass: string): Promise<boolean> {
  if (!settings.passcodeSalt || !settings.passcodeHash) return false;
  const salt = base64ToArrayBuffer(settings.passcodeSalt);
  const hash = await sha256Hex(pass, new Uint8Array(salt));
  return hash === settings.passcodeHash;
}

function canUseWebAuthn() {
  return window.isSecureContext && "credentials" in navigator && "PublicKeyCredential" in window;
}

async function sha256Hex(text: string, salt?: Uint8Array) {
  const enc = new TextEncoder();
  const data = salt ? concatUint8(salt, enc.encode(text)) : enc.encode(text);
  const buf = await crypto.subtle.digest("SHA-256", data);
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

function concatUint8(a: Uint8Array, b: Uint8Array) {
  const out = new Uint8Array(a.length + b.length);
  out.set(a, 0); out.set(b, a.length);
  return out;
}

function arrayBufferToBase64(buf: ArrayBuffer) {
  const bytes = new Uint8Array(buf);
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary);
}

function base64ToArrayBuffer(b64: string) {
  const binary = atob(b64);
  const len = binary.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) bytes[i] = binary.charCodeAt(i);
  return bytes.buffer;
}

export const Lock = {
  initLock,
  enableAppLock,
  disableAppLock,
  setAutoLockMinutes,
  setRequireUnlockForExport,
  setHideSensitivePreviews,
  requireAuth,
  unlock,
  lock,
  isLocked,
  onUserActivity,
  subscribe,
};

export default Lock;