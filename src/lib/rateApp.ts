import { isNative } from './platform';

/** -------- persistent state for prompting cadence -------- */
type PromptState = {
  lastPromptAt?: number;
  timesShown?: number;
  neverAsk?: boolean;
};
const LS_KEY = 'cc_rate_prompt_v1';

function load(): PromptState {
  try { const raw = localStorage.getItem(LS_KEY); if (raw) return JSON.parse(raw); } catch {}
  return { timesShown: 0, neverAsk: false };
}
function save(s: PromptState) { localStorage.setItem(LS_KEY, JSON.stringify(s)); }

/** Count sessions (or call after "happy moments" like export complete) */
export function bumpSessionCounter() {
  const key = 'cc_sessions';
  const n = Number(localStorage.getItem(key) || '0') + 1;
  localStorage.setItem(key, String(n));
}

/** Should we auto-show the prompt? */
export function shouldShowRatePrompt(opts?: { minSessions?: number; minDaysSinceLast?: number }) {
  const { minSessions = 3, minDaysSinceLast = 7 } = opts || {};
  const st = load();
  if (st.neverAsk) return false;

  const sessions = Number(localStorage.getItem('cc_sessions') || '0');
  if (sessions < minSessions) return false;

  if (st.lastPromptAt) {
    const days = (Date.now() - st.lastPromptAt) / (1000 * 60 * 60 * 24);
    if (days < minDaysSinceLast) return false;
  }
  return true;
}

/** Allow App.tsx to register a controller to open the modal */
let externalController: { open: () => void } | null = null;
export function registerRateModalController(ctrl: { open: () => void }) {
  externalController = ctrl;
}

/** Open the modal now and record that we showed it */
export function triggerRatePromptNow() {
  if (externalController) {
    externalController.open();
    const st = load();
    st.timesShown = (st.timesShown || 0) + 1;
    st.lastPromptAt = Date.now();
    save(st);
  }
}

/** Optional: let users disable future prompts */
export function neverAskAgain() {
  const st = load();
  st.neverAsk = true;
  save(st);
}

/** -------- store review (native or web fallback) -------- */
export async function openStoreReview() {
  if (isNative) {
    try {
      const { AppReview } = await import('@capawesome/capacitor-app-review');
      await AppReview.requestReview(); // native in-app review sheet
      return;
    } catch {
      // fall through to web links
    }
  }

  // Web fallback: open store pages
  const IOS_APP_ID = import.meta.env.VITE_IOS_APP_ID as string | undefined;
  const ANDROID_PKG = import.meta.env.VITE_ANDROID_PACKAGE as string | undefined;
  const ua = navigator.userAgent || '';
  const isiOS = /iPad|iPhone|iPod/.test(ua);
  const isAndroid = /Android/i.test(ua);

  if (isiOS && IOS_APP_ID) {
    window.location.href = `itms-apps://apps.apple.com/app/id${IOS_APP_ID}?action=write-review`;
    return;
  }
  if (isAndroid && ANDROID_PKG) {
    window.location.href = `market://details?id=${ANDROID_PKG}`;
    return;
  }

  // Final fallback: open store pages in new tabs if IDs exist
  if (IOS_APP_ID) window.open(`https://apps.apple.com/app/id${IOS_APP_ID}`, '_blank');
  if (ANDROID_PKG) window.open(`https://play.google.com/store/apps/details?id=${ANDROID_PKG}`, '_blank');
}

/** Used by RateAppModal when the user picks 1–3 stars */
export function sendFeedbackEmail() {
  const to = "SBOMarketplaceapp@gmail.com";
  const subject = "ClearCase feedback";
  const body = [
    "Tell us what could be better:",
    "",
    "- What were you trying to do?",
    "- What didn't work?",
    "- Device/OS:"
  ].join("\n");
  window.location.href =
    `mailto:${encodeURIComponent(to)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}