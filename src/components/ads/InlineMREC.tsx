import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { isRemoveAdsActive } from '@/lib/iap';

interface InlineMRECProps {
  slot: string; // "home", "settings", etc.
}

const ADMOB_APP_ID = import.meta.env.VITE_ADMOB_APP_ID_IOS || '';
const MREC_ID = import.meta.env.VITE_ADMOB_MREC_ID_IOS || '';

// Frequency caps
const MAX_IMPRESSIONS_PER_DAY = 5;
const IMPRESSION_KEY = 'admob_impressions';
const LAST_RESET_KEY = 'admob_last_reset';

let adsInitialized = false;
const sessionImpressions = new Set<string>(); // Track per-session impressions by slot

// Get ATT permission and return NPA flag
async function requestATTAndGetNpaFlag(): Promise<string> {
  try {
    // Try App Tracking Transparency plugin first
    if ((window as any).AppTrackingTransparency?.requestPermission) {
      const result = await (window as any).AppTrackingTransparency.requestPermission();
      return result.status === 'authorized' ? '0' : '1';
    }
    
    // Fallback to AdMob ATT if available
    if ((window as any).AdMob?.requestTrackingAuthorization) {
      const result = await (window as any).AdMob.requestTrackingAuthorization();
      return result.status === 'authorized' ? '0' : '1';
    }
    
    // No ATT available, assume non-personalized
    return '1';
  } catch (error) {
    console.warn('ATT request failed:', error);
    return '1'; // Default to non-personalized ads
  }
}

// Check and update daily impression count
function canShowAd(): boolean {
  const today = new Date().toDateString();
  const lastReset = localStorage.getItem(LAST_RESET_KEY);
  
  // Reset counter if it's a new day
  if (lastReset !== today) {
    localStorage.setItem(LAST_RESET_KEY, today);
    localStorage.setItem(IMPRESSION_KEY, '0');
    return true;
  }
  
  const impressions = parseInt(localStorage.getItem(IMPRESSION_KEY) || '0');
  return impressions < MAX_IMPRESSIONS_PER_DAY;
}

function incrementImpressionCount(): void {
  const impressions = parseInt(localStorage.getItem(IMPRESSION_KEY) || '0');
  localStorage.setItem(IMPRESSION_KEY, (impressions + 1).toString());
}

async function initializeAdMob(): Promise<void> {
  if (adsInitialized || !(window as any).cordova || !ADMOB_APP_ID) return;
  
  try {
    if ((window as any).AdMob?.initialize) {
      await (window as any).AdMob.initialize({
        appId: ADMOB_APP_ID,
        testDeviceIds: [], // Add test device IDs for development
      });
      adsInitialized = true;
      console.log('AdMob initialized for MREC ads');
    }
  } catch (error) {
    console.warn('Failed to initialize AdMob:', error);
  }
}

export default function InlineMREC({ slot }: InlineMRECProps) {
  const [adLoaded, setAdLoaded] = useState(false);
  const [showAd, setShowAd] = useState(false);

  useEffect(() => {
    // Don't show ads if user has premium subscription
    if (isRemoveAdsActive()) {
      return;
    }

    // Don't show if already shown in this session for this slot
    if (sessionImpressions.has(slot)) {
      return;
    }

    // Don't show if daily limit reached
    if (!canShowAd()) {
      return;
    }

    // Only show on mobile with Cordova
    if (!(window as any).cordova || !MREC_ID) {
      return;
    }

    setShowAd(true);
    loadAd();
  }, [slot]);

  const loadAd = async () => {
    try {
      await initializeAdMob();
      
      if (!adsInitialized) {
        console.warn('AdMob not initialized');
        return;
      }

      // Get ATT permission status and set NPA flag
      const npa = await requestATTAndGetNpaFlag();
      
      const admob = (window as any).AdMob;
      if (!admob?.showInterstitial) {
        console.warn('AdMob interstitial not available');
        return;
      }

      // Use interstitial API for MREC (medium rectangle) ads
      await admob.showInterstitial({
        adId: MREC_ID,
        extras: { npa } // Non-personalized ads if ATT denied
      });

      // Mark as loaded and track impression
      setAdLoaded(true);
      sessionImpressions.add(slot);
      incrementImpressionCount();
      
      console.log('MREC ad loaded for slot:', slot, 'with NPA flag:', npa);
    } catch (error) {
      console.warn('Failed to load MREC ad:', error);
      setShowAd(false);
    }
  };

  // Don't render anything if we shouldn't show the ad
  if (!showAd) {
    return null;
  }

  // Show placeholder on web or when ad fails to load
  return (
    <Card className="my-4 border-muted bg-muted/20">
      <CardHeader className="pb-2">
        <Badge variant="outline" className="w-fit text-xs">
          Ad
        </Badge>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="h-[250px] flex items-center justify-center bg-muted/50 rounded-lg border-2 border-dashed border-muted-foreground/20">
          <div className="text-center">
            <p className="text-xs text-muted-foreground">
              {(window as any).cordova 
                ? (adLoaded ? 'Ad Content' : 'Loading ad...') 
                : 'MREC Ad (Mobile Only)'}
            </p>
            <p className="text-xs text-muted-foreground/60 mt-1">
              300×250
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}