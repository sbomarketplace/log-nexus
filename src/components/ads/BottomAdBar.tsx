import { useEffect, useState } from 'react';
import { isRemoveAdsActive } from '@/lib/iap';

export default function BottomAdBar() {
  const [showAds, setShowAds] = useState(true);

  useEffect(() => {
    // Check subscription status
    const hasActiveSubscription = isRemoveAdsActive();
    setShowAds(!hasActiveSubscription);
    
    // Initialize AdMob if ads should show (native only)
    if (!hasActiveSubscription && (window as any).cordova) {
      initAds();
    }
  }, []);

  const initAds = async () => {
    try {
      // AdMob initialization would go here
      // For now, just show a placeholder banner
      console.log('AdMob initialized');
    } catch (error) {
      console.warn('Failed to initialize AdMob:', error);
    }
  };

  if (!showAds) return null;

  return (
    <div 
      className="fixed bottom-0 left-0 right-0 z-40 h-[50px] bg-muted/90 border-t flex items-center justify-center"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <div className="text-xs text-muted-foreground">
        Ad Banner Placeholder
      </div>
    </div>
  );
}