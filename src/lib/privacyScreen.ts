import { App } from '@capacitor/app';
import { PrivacyScreen } from '@capacitor-community/privacy-screen';
import { isNative } from './platform';

export async function initPrivacyScreen() {
  if (!isNative) return;

  try {
    await App.addListener('appStateChange', async ({ isActive }) => {
      if (isActive) {
        await PrivacyScreen.disable();
      } else {
        // Only enable if user has the setting on
        const settings = JSON.parse(localStorage.getItem("cc_security_settings_v1") || "{}");
        if (settings?.hideSensitivePreviews) {
          await PrivacyScreen.enable();
        }
      }
    });
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