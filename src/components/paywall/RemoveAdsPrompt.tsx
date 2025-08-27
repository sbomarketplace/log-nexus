import React, { useState } from "react";
import { useSubscription } from "@/lib/subscription";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

interface RemoveAdsPromptProps {
  open: boolean;
  onClose: () => void;
}

function bumpCounters() {
  // Increment counters or perform other actions after purchase
  console.log("Purchase completed, updating counters");
}

export function RemoveAdsPrompt({ open, onClose }: RemoveAdsPromptProps) {
  const { purchaseRemoveAds, restorePurchases } = useSubscription();
  const [loading, setLoading] = useState(false);

  if (!open) return null;

  async function onPurchase() {
    try {
      setLoading(true);
      await purchaseRemoveAds();
    } finally {
      setLoading(false);
      // Force immediate hide of any currently displayed ad (defensive)
      window.dispatchEvent(new CustomEvent("ads:disable"));
      bumpCounters();
      onClose();
    }
  }

  async function onRestore() {
    try {
      setLoading(true);
      await restorePurchases();
    } finally {
      setLoading(false);
      onClose();
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
      <div className="bg-background rounded-lg max-w-md w-full p-6 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-muted-foreground hover:text-foreground"
        >
          <X className="h-5 w-5" />
        </button>
        
        <div className="text-center space-y-4">
          <h2 className="text-xl font-semibold">Remove Ads</h2>
          <p className="text-muted-foreground">
            Hide ads across the app and enjoy a cleaner experience.
          </p>
          
          <div className="space-y-3">
            <Button 
              onClick={onPurchase} 
              disabled={loading}
              className="w-full"
              size="lg"
            >
              {loading ? "Processing..." : "$4.99/mo – Continue"}
            </Button>
            
            <Button 
              onClick={onRestore} 
              disabled={loading}
              variant="outline"
              className="w-full"
            >
              {loading ? "Restoring..." : "Restore Purchases"}
            </Button>
          </div>
          
          <p className="mt-3 text-[11px] text-muted-foreground leading-snug text-center">
            Subscription auto-renews monthly at $4.99 until canceled. Manage or cancel anytime in your{" "}
            <a className="underline underline-offset-2" href="itms-apps://apps.apple.com/account/subscriptions">Apple Subscriptions</a>.
            By continuing you agree to our <a className="underline underline-offset-2" href="/terms" target="_blank" rel="noopener">Terms</a> and
            <a className="underline underline-offset-2" href="/privacy" target="_blank" rel="noopener"> Privacy Policy</a>.
          </p>
        </div>
      </div>
    </div>
  );
}