// AdMob integration for banner ads with ATT support
import { isRemoveAdsActive } from '@/lib/iap';

const ADMOB_APP_ID = import.meta.env.VITE_ADMOB_APP_ID_IOS || '';
const BANNER_ID = import.meta.env.VITE_ADMOB_BANNER_ID_IOS || '';

let adsInitialized = false;
let bannerShowing = false;
let attPermissionRequested = false;

// Set CSS variables for banner height
function setBannerVars(visible: boolean, height = 50) {
  const root = document.documentElement;
  root.style.setProperty('--banner-h', visible ? `${height}px` : '0px');
}

// Request ATT permission and return NPA flag
async function requestATTAndGetNpaFlag(): Promise<string> {
  if (attPermissionRequested) return '0'; // Already requested, assume allowed
  
  try {
    // Try App Tracking Transparency plugin first
    if ((window as any).AppTrackingTransparency?.requestPermission) {
      const result = await (window as any).AppTrackingTransparency.requestPermission();
      attPermissionRequested = true;
      return result.status === 'authorized' ? '0' : '1';
    }
    
    // Fallback to AdMob ATT if available
    if ((window as any).AdMob?.requestTrackingAuthorization) {
      const result = await (window as any).AdMob.requestTrackingAuthorization();
      attPermissionRequested = true;
      return result.status === 'authorized' ? '0' : '1';
    }
    
    // No ATT available, assume non-personalized
    return '1';
  } catch (error) {
    console.warn('ATT request failed:', error);
    return '1'; // Default to non-personalized ads
  }
}

export async function initAds(): Promise<void> {
  if (adsInitialized || !(window as any).cordova) return;
  
  try {
    // Initialize AdMob
    if ((window as any).AdMob?.initialize) {
      await (window as any).AdMob.initialize({
        appId: ADMOB_APP_ID,
        testDeviceIds: [], // Add test device IDs for development
      });
      adsInitialized = true;
      console.log('AdMob initialized successfully');
    }
  } catch (error) {
    console.warn('Failed to initialize AdMob:', error);
  }
}

export async function showBottomBanner(): Promise<void> {
  if (!adsInitialized || bannerShowing || !(window as any).cordova || !BANNER_ID) return;
  
  try {
    // Get ATT permission status and set NPA flag
    const npa = await requestATTAndGetNpaFlag();
    
    await (window as any).AdMob?.showBanner({
      adId: BANNER_ID,
      position: 'BOTTOM_CENTER',
      size: 'ADAPTIVE_BANNER',
      margin: 0,
      extras: { npa } // Non-personalized ads if ATT denied
    });
    
    bannerShowing = true;
    setBannerVars(true, 50);
    console.log('Banner ad shown with NPA flag:', npa);
  } catch (error) {
    console.warn('Failed to show banner ad:', error);
    setBannerVars(false, 0);
  }
}

export async function hideBottomBanner(): Promise<void> {
  if (!bannerShowing || !(window as any).cordova) return;
  
  try {
    await (window as any).AdMob?.hideBanner();
    bannerShowing = false;
    setBannerVars(false, 0);
    console.log('Banner ad hidden');
  } catch (error) {
    console.warn('Failed to hide banner ad:', error);
  }
}

export function shouldShowAds(): boolean {
  return !isRemoveAdsActive();
}

// For web fallback or when AdMob isn't available
export function isBannerShowing(): boolean {
  return bannerShowing;
}