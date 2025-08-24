import { BiometricAuth, BiometryType } from '@aparajita/capacitor-biometric-auth';
import { isNative } from './platform';

export async function nativeIsAvailable(): Promise<boolean> {
  if (!isNative) return false;
  
  try {
    const result = await BiometricAuth.checkBiometry();
    return result.isAvailable && result.biometryType !== BiometryType.none;
  } catch {
    return false;
  }
}

export async function nativeRequireAuth(reason = 'Unlock ClearCase'): Promise<boolean> {
  if (!isNative) return false;
  
  try {
    const available = await nativeIsAvailable();
    if (!available) return false;

    await BiometricAuth.authenticate({
      reason,
      cancelTitle: 'Cancel',
      allowDeviceCredential: true,
      iosFallbackTitle: 'Use Passcode',
      androidTitle: 'Authenticate',
      androidSubtitle: reason,
      androidConfirmationRequired: false
    });
    
    return true;
  } catch (error) {
    console.warn('Native authentication failed:', error);
    return false;
  }
}