// AdMob integration for banner ads
import { isRemoveAdsActive } from '@/lib/iap';

const ADMOB_APP_ID = import.meta.env.VITE_ADMOB_APP_ID_IOS || '';
const BANNER_ID = import.meta.env.VITE_ADMOB_BANNER_ID_IOS || '';

let adsInitialized = false;
let bannerShowing = false;

export async function initAds(): Promise<void> {
  if (adsInitialized || !(window as any).cordova) return;
  
  try {
    // Request ATT permission first (iOS 14.5+)
    if ((window as any).AdMob?.requestTrackingAuthorization) {
      await (window as any).AdMob.requestTrackingAuthorization();
    }
    
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
    await (window as any).AdMob?.showBanner({
      adId: BANNER_ID,
      position: 'BOTTOM_CENTER',
      size: 'BANNER', // 320x50
    });
    bannerShowing = true;
    console.log('Banner ad shown');
  } catch (error) {
    console.warn('Failed to show banner ad:', error);
  }
}

export async function hideBottomBanner(): Promise<void> {
  if (!bannerShowing || !(window as any).cordova) return;
  
  try {
    await (window as any).AdMob?.hideBanner();
    bannerShowing = false;
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