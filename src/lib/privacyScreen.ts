import { Capacitor } from '@capacitor/core';
import { App } from '@capacitor/app';
import { PrivacyScreen } from '@capacitor-community/privacy-screen';
import { isNative } from './platform';
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
  if (!isNative) return;
  
  try {
    const settings = JSON.parse(localStorage.getItem("cc_security_settings_v1") || "{}");
    const enabled = settings?.hideSensitivePreviews || false;
    
    if (enabled) {
      await PrivacyScreen.enable();
    } else {
      await PrivacyScreen.disable();
    }
  } catch (error) {
    console.warn('Failed to apply privacy screen from storage:', error);
  }
}

export async function initPrivacyScreen() {
  if (!isNative || isInitialized) return;
  
  try {
    // Re-apply on app state changes so background/app switcher is correct
    await App.addListener('appStateChange', async ({ isActive }) => {
      const settings = JSON.parse(localStorage.getItem("cc_security_settings_v1") || "{}");
      const enabled = settings?.hideSensitivePreviews || false;
      
      try {
        if (enabled) {
          await PrivacyScreen.enable();
          if (!isActive && Capacitor.getPlatform() === "ios") {
            // just before going inactive, veil immediately
            showVeil(1000);
          }
        } else {
          await PrivacyScreen.disable();
        }
      } catch (error) {
        console.warn('Failed to handle app state change for privacy screen:', error);
      }
    });

    // iOS screenshot hint (cannot block, just mask briefly)
    if (Capacitor.getPlatform() === "ios") {
      // @ts-ignore: iOS posts this DOM event in webview; safe to no-op if absent
      window.addEventListener("userDidTakeScreenshot", () => {
        const settings = JSON.parse(localStorage.getItem("cc_security_settings_v1") || "{}");
        if (settings?.hideSensitivePreviews) {
          showVeil(1000);
          showInfoToast("Sensitive content hidden");
        }
      });
    }
    
    isInitialized = true;
  } catch (error) {
    console.warn('Failed to initialize privacy screen:', error);
  }
}

export async function setPrivacyScreenEnabled(enabled: boolean) {
  if (!isNative) return;
  
  try {
    if (enabled) {
      await PrivacyScreen.enable();
    } else {
      await PrivacyScreen.disable();
    }
  } catch (error) {
    console.warn('Failed to set privacy screen:', error);
  }
}