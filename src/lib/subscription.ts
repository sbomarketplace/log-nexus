import React, { createContext, useContext, useMemo } from "react";

type SubscriptionContextValue = {
  isSubscribed: boolean;
  loading: boolean;
  purchaseRemoveAds: () => Promise<void>;
  restorePurchases: () => Promise<void>;
};

const SubscriptionContext = createContext<SubscriptionContextValue>({
  isSubscribed: false,
  loading: false,
  purchaseRemoveAds: async () => {},
  restorePurchases: async () => {},
});

export function SubscriptionProvider({ children }: { children: React.ReactNode }) {
  // No native calls here. This is a pure stub so the app can render safely.
  const value = useMemo<SubscriptionContextValue>(() => {
    return {
      isSubscribed: false,
      loading: false,
      purchaseRemoveAds: async () => {},
      restorePurchases: async () => {},
    };
  }, []);

  return React.createElement(
    SubscriptionContext.Provider,
    { value },
    children
  );
}

export function useSubscription() {
  return useContext(SubscriptionContext);
}