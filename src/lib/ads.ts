// AdMob integration for inline Banner ads only
// Bottom banner system removed - using inline ads only

const ADMOB_APP_ID = import.meta.env.VITE_ADMOB_APP_ID_IOS || '';

export async function initAds(): Promise<void> {
  // Legacy function - now handled in InlineAd component
  console.log('ads.ts - Legacy initAds called, now handled in InlineAd component');
}

export async function showBottomBanner(): Promise<void> {
  // Legacy function - bottom banners removed
  console.log('ads.ts - Bottom banners removed, use InlineAd component instead');
}

export async function hideBottomBanner(): Promise<void> {
  // Legacy function - bottom banners removed
  console.log('ads.ts - Bottom banners removed');
}

export function shouldShowAds(): boolean {
  // This function is still used by components to check subscription status
  const { isRemoveAdsActive } = require('@/lib/iap');
  return !isRemoveAdsActive();
}

export function isBannerShowing(): boolean {
  // Legacy function - always false since no bottom banners
  return false;
}