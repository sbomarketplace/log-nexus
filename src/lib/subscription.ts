import React, { createContext, useContext, useState, useEffect } from "react";

// Type declarations for window.store (cordova-plugin-purchase)
declare global {
  interface Window {
    store: any;
  }
}

const LS_KEY = "removeAdsActive";
const PRODUCT_ID = import.meta.env.VITE_IAP_REMOVE_ADS_MONTHLY || "";

interface SubscriptionContextType {
  isSubscribed: boolean;
  loading: boolean;
  purchaseRemoveAds: () => Promise<void>;
  restorePurchases: () => Promise<void>;
}

const SubCtx = createContext<SubscriptionContextType | null>(null);

export function useSubscription() {
  const ctx = useContext(SubCtx);
  if (!ctx) throw new Error("useSubscription must be used within SubscriptionProvider");
  return ctx;
}

function setupStore(updateOwned: (owned: boolean) => void) {
  if (!window.store) return;
  const store = window.store;
  store.register({
    id: PRODUCT_ID,
    type: store.PAID_SUBSCRIPTION
  });
  store.when(PRODUCT_ID).approved((p: any) => {
    try { p.finish(); } catch {}
    updateOwned(true);
    localStorage.setItem(LS_KEY, "1");
    // Immediately tell UI to hide any ads already shown
    window.dispatchEvent(new CustomEvent("ads:disable"));
  });
  store.when(PRODUCT_ID).owned(() => {
    updateOwned(true);
    localStorage.setItem(LS_KEY, "1");
    window.dispatchEvent(new CustomEvent("ads:disable"));
  });
  store.error((e: any) => {
    console.warn("IAP error", e);
  });
  store.refresh();
}

export function SubscriptionProvider({ children }: { children: React.ReactNode }) {
  const [isSubscribed, setIsSubscribed] = useState<boolean>(localStorage.getItem(LS_KEY) === "1");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if ((window as any).cordova) {
      setupStore(setIsSubscribed);
    }
    setLoading(false);
  }, []);

  async function purchaseRemoveAds() {
    if (!window.store) return;
    await window.store.order(PRODUCT_ID);
    // Optimistic flip in case platform emits events with delay
    setIsSubscribed(true);
    localStorage.setItem(LS_KEY, "1");
    window.dispatchEvent(new CustomEvent("ads:disable"));
  }

  async function restorePurchases() {
    if (!window.store) return;
    await window.store.refresh();
    // If ownership is detected the listeners above will flip state and broadcast.
    // We also send a best-effort broadcast now to hide any current ad instantly.
    window.dispatchEvent(new CustomEvent("ads:disable"));
  }

  return React.createElement(
    SubCtx.Provider, 
    { value: { isSubscribed, loading, purchaseRemoveAds, restorePurchases } },
    children
  );
}