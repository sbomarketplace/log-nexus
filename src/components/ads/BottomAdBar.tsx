import { useEffect, useState } from 'react';
import { initAds, shouldShowAds, showBottomBanner, hideBottomBanner } from '@/lib/ads';
import { isRemoveAdsActive } from '@/lib/iap';

export default function BottomAdBar() {
  const [showAds, setShowAds] = useState(shouldShowAds());

  useEffect(() => {
    // Initialize ads system
    initAds().catch(console.error);
    
    // Update ad visibility based on subscription status
    updateAdVisibility();
  }, []);

  // Listen for subscription changes
  useEffect(() => {
    const interval = setInterval(() => {
      const newShowAds = shouldShowAds();
      if (newShowAds !== showAds) {
        setShowAds(newShowAds);
        updateAdVisibility();
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [showAds]);

  const updateAdVisibility = async () => {
    if (shouldShowAds()) {
      await showBottomBanner();
    } else {
      await hideBottomBanner();
    }
  };

  if (!showAds) return null;

  // Show placeholder on web or fallback
  return (
    <div className="cc-ad-bottom h-[50px] bg-muted/90 border-t flex items-center justify-center">
      <div className="text-xs text-muted-foreground">
        {(window as any).cordova ? 'Loading ad...' : 'Ad Banner (Mobile Only)'}
      </div>
    </div>
  );
}