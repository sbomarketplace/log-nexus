import { Capacitor } from '@capacitor/core';
import { App } from '@capacitor/app';
import { PrivacyScreen } from '@capacitor-community/privacy-screen';
import { readSecuritySettings } from './securitySettings';
import { showInfoToast } from './showToast';

let veilEl: HTMLDivElement | null = null;
let isInitialized = false;

function showVeil(ms = 1000) {
  if (veilEl) return;
  veilEl = document.createElement("div");
  veilEl.setAttribute("data-privacy-veil", "true");
  Object.assign(veilEl.style, {
    position: "fixed",
    inset: "0",
    background: "#ffffff",
    opacity: "1",
    zIndex: "2147483647",
    transition: "opacity 200ms ease",
  });
  document.body.appendChild(veilEl);
  setTimeout(() => {
    if (!veilEl) return;
    veilEl.style.opacity = "0";
    setTimeout(() => {
      veilEl?.remove();
      veilEl = null;
    }, 220);
  }, ms);
}

export async function applyPrivacyFromStorage() {
  try {
    const enabled = readSecuritySettings().hideSensitivePreviews;
    if (enabled) {
      await PrivacyScreen.enable();
    } else {
      await PrivacyScreen.disable();
    }
  } catch (err) {
    console.warn("Failed to apply privacy screen from storage:", err);
  }
}

export async function initPrivacyScreen() {
  if (isInitialized) return;
  try {
    // Keep app switcher state in sync with the toggle
    await App.addListener("appStateChange", async ({ isActive }) => {
      const enabled = readSecuritySettings().hideSensitivePreviews;
      try {
        if (enabled) {
          await PrivacyScreen.enable();
          if (!isActive && Capacitor.getPlatform() === "ios") {
            showVeil(1000);
          }
        } else {
          await PrivacyScreen.disable();
        }
      } catch (err) {
        console.warn("Failed to handle appStateChange for privacy screen:", err);
      }
    });

    // iOS screenshot hint - briefly veil and show a toast if enabled
    // Newer versions expose 'screenshotTaken' listener
    try {
      // @ts-ignore
      PrivacyScreen.addListener?.("screenshotTaken", () => {
        if (readSecuritySettings().hideSensitivePreviews) {
          showVeil(1000);
          showInfoToast("Sensitive content hidden");
        }
      });
    } catch {}

    isInitialized = true;
  } catch (err) {
    console.warn("Failed to initialize privacy screen:", err);
  }
}

export async function setPrivacyScreenEnabled(enabled: boolean) {
  try {
    if (enabled) {
      await PrivacyScreen.enable();
    } else {
      await PrivacyScreen.disable();
    }
  } catch (err) {
    console.warn("Failed to set privacy screen:", err);
  }
}
