const IOS_APP_ID = import.meta.env.VITE_IOS_APP_ID;              // e.g., "1234567890"
const ANDROID_PKG = import.meta.env.VITE_ANDROID_PACKAGE;        // e.g., "com.yourco.clearcase"

type PromptState = {
  lastPromptAt?: number;
  timesShown?: number;
  neverAsk?: boolean;
};
const LS_KEY = "cc_rate_prompt_v1";

function load(): PromptState {
  try { const raw = localStorage.getItem(LS_KEY); if (raw) return JSON.parse(raw); } catch {}
  return { timesShown: 0, neverAsk: false };
}
function save(s: PromptState) { localStorage.setItem(LS_KEY, JSON.stringify(s)); }

export function shouldShowRatePrompt(opts?: { minSessions?: number; minDaysSinceLast?: number }) {
  const { minSessions = 3, minDaysSinceLast = 7 } = opts || {};
  const st = load();
  if (st.neverAsk) return false;

  // Optional: gate on sessions/exports (increment this in your app bootstrap or after successful export)
  const sessions = Number(localStorage.getItem("cc_sessions") || "0");
  if (sessions < minSessions) return false;

  if (st.lastPromptAt) {
    const days = (Date.now() - st.lastPromptAt) / (1000 * 60 * 60 * 24);
    if (days < minDaysSinceLast) return false;
  }
  return true;
}

let externalModalController: { open: () => void } | null = null;
/** Let the app register a controller so we can open the modal from anywhere */
export function registerRateModalController(ctrl: { open: () => void }) {
  externalModalController = ctrl;
}

export function triggerRatePromptNow() {
  if (externalModalController) {
    externalModalController.open();
    const st = load();
    st.timesShown = (st.timesShown || 0) + 1;
    st.lastPromptAt = Date.now();
    save(st);
  }
}

/** Increment this at app start or after key happy events (e.g., successful export) */
export function bumpSessionCounter() {
  const sessions = Number(localStorage.getItem("cc_sessions") || "0") + 1;
  localStorage.setItem("cc_sessions", String(sessions));
}

export function neverAskAgain() {
  const st = load();
  st.neverAsk = true;
  save(st);
}

/** Open the native store review page directly */
export async function openStoreReview() {
  // Check if we're in native and can use in-app review
  const { isNative } = await import('./platform');
  if (isNative) {
    try {
      const { RateApp } = await import('capacitor-rate-app');
      await RateApp.requestReview();
      return;
    } catch (error) {
      console.warn('Native review failed, falling back to store link:', error);
      // Continue to web fallback below
    }
  }
  
  // Web fallback - existing store links
  const ua = navigator.userAgent || "";
  const isiOS = /iPad|iPhone|iPod/.test(ua);
  const isAndroid = /Android/i.test(ua);

  if (isiOS && IOS_APP_ID) {
    // Launch App Store review page
    const deep = `itms-apps://apps.apple.com/app/id${IOS_APP_ID}?action=write-review`;
    const web = `https://apps.apple.com/app/id${IOS_APP_ID}?action=write-review`;
    tryOpen(deep, web);
    return;
  }

  if (isAndroid && ANDROID_PKG) {
    const deep = `market://details?id=${ANDROID_PKG}`;
    const web = `https://play.google.com/store/apps/details?id=${ANDROID_PKG}&reviewId=0`;
    tryOpen(deep, web);
    return;
  }

  // Unknown platform → open a landing page or both store links if you have them
  if (IOS_APP_ID) window.open(`https://apps.apple.com/app/id${IOS_APP_ID}`, "_blank");
  if (ANDROID_PKG) window.open(`https://play.google.com/store/apps/details?id=${ANDROID_PKG}`, "_blank");
}

function tryOpen(primary: string, fallback: string) {
  // Best-effort: try deep link, then fall back to web after a tick
  const t = setTimeout(() => { window.open(fallback, "_blank"); }, 900);
  window.location.href = primary;
  // If the deep link succeeds, the page loses focus and the fallback timeout is harmless.
  // If it fails, fallback opens shortly after.
  setTimeout(() => clearTimeout(t), 2000);
}

/** Private feedback path (email) */
export function sendFeedbackEmail() {
  const to = "SBOMarketplaceapp@gmail.com";
  const subj = "ClearCase feedback";
  const body = "Tell us what could be better:\n\n- What were you trying to do?\n- What didn't work?\n- Device/OS:\n";
  window.location.href = `mailto:${encodeURIComponent(to)}?subject=${encodeURIComponent(subj)}&body=${encodeURIComponent(body)}`;
}