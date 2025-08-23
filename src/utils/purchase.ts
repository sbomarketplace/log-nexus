import { useSettingsStore } from '@/state/settingsStore';

// Product IDs for App Store Connect
export const PRODUCT_IDS = {
  PACK_5: 'cc.parsing.5',
  PACK_60: 'cc.parsing.60', 
  UNLIMITED_MONTHLY: 'cc.parsing.unlimited.month'
} as const;

interface Product {
  id: string;
  price: string;
  title: string;
  description: string;
}

interface NativeBridge {
  purchases: {
    getProducts: (params: { ids: string[] }) => Promise<Product[]>;
    purchase: (params: { id: string }) => Promise<{ success: boolean; receipt?: string }>;
    restore: () => Promise<{ success: boolean; purchases: Array<{ id: string; receipt: string }> }>;
  };
  secure: {
    set: (key: string, value: string) => Promise<void>;
    get: (key: string) => Promise<string | null>;
  };
  device: {
    toast: (message: string) => void;
  };
}

declare global {
  interface Window {
    __NATIVE__?: NativeBridge;
  }
}

let cachedProducts: Product[] = [];

export const isNativeAvailable = (): boolean => {
  return Boolean(window.__NATIVE__?.purchases);
};

export const nativeToast = (message: string) => {
  if (window.__NATIVE__?.device?.toast) {
    window.__NATIVE__.device.toast(message);
  } else {
    // Fallback for web
    console.log('Toast:', message);
  }
};

export const loadProducts = async (): Promise<Product[]> => {
  if (!isNativeAvailable()) {
    throw new Error('Native purchases not available');
  }

  if (cachedProducts.length > 0) {
    return cachedProducts;
  }

  try {
    const products = await window.__NATIVE__!.purchases.getProducts({
      ids: [PRODUCT_IDS.PACK_5, PRODUCT_IDS.PACK_60, PRODUCT_IDS.UNLIMITED_MONTHLY]
    });
    cachedProducts = products;
    return products;
  } catch (error) {
    console.error('Failed to load products:', error);
    throw error;
  }
};

export const buyPack5 = async (): Promise<boolean> => {
  if (!isNativeAvailable()) {
    throw new Error('Native purchases not available');
  }

  try {
    const result = await window.__NATIVE__!.purchases.purchase({
      id: PRODUCT_IDS.PACK_5
    });

    if (result.success && result.receipt) {
      // Store receipt securely
      await window.__NATIVE__!.secure.set('receipt_pack5_' + Date.now(), result.receipt);
      
      // Update store
      const store = useSettingsStore.getState();
      store.setParsing({
        plan: 'pack',
        remaining: store.parsing.remaining + 5,
        lifetimeUsed: store.parsing.lifetimeUsed
      });

      nativeToast('Purchase successful.');
      return true;
    }

    nativeToast('Purchase canceled.');
    return false;
  } catch (error) {
    console.error('Purchase failed:', error);
    nativeToast('Purchase canceled.');
    return false;
  }
};

export const buyPack60 = async (): Promise<boolean> => {
  if (!isNativeAvailable()) {
    throw new Error('Native purchases not available');
  }

  try {
    const result = await window.__NATIVE__!.purchases.purchase({
      id: PRODUCT_IDS.PACK_60
    });

    if (result.success && result.receipt) {
      // Store receipt securely
      await window.__NATIVE__!.secure.set('receipt_pack60_' + Date.now(), result.receipt);
      
      // Update store
      const store = useSettingsStore.getState();
      store.setParsing({
        plan: 'pack',
        remaining: store.parsing.remaining + 60,
        lifetimeUsed: store.parsing.lifetimeUsed
      });

      nativeToast('Purchase successful.');
      return true;
    }

    nativeToast('Purchase canceled.');
    return false;
  } catch (error) {
    console.error('Purchase failed:', error);
    nativeToast('Purchase canceled.');
    return false;
  }
};

export const buyUnlimited = async (): Promise<boolean> => {
  if (!isNativeAvailable()) {
    throw new Error('Native purchases not available');
  }

  try {
    const result = await window.__NATIVE__!.purchases.purchase({
      id: PRODUCT_IDS.UNLIMITED_MONTHLY
    });

    if (result.success && result.receipt) {
      // Store receipt securely
      await window.__NATIVE__!.secure.set('receipt_unlimited', result.receipt);
      
      // Update store
      const store = useSettingsStore.getState();
      store.setParsing({
        plan: 'unlimited',
        subscriptionActive: true,
        lastReceiptCheck: Date.now()
      });

      nativeToast('Purchase successful.');
      return true;
    }

    nativeToast('Purchase canceled.');
    return false;
  } catch (error) {
    console.error('Purchase failed:', error);
    nativeToast('Purchase canceled.');
    return false;
  }
};

export const restorePurchases = async (): Promise<boolean> => {
  if (!isNativeAvailable()) {
    throw new Error('Native purchases not available');
  }

  try {
    const result = await window.__NATIVE__!.purchases.restore();

    if (result.success && result.purchases.length > 0) {
      let creditsToAdd = 0;
      let hasUnlimited = false;

      for (const purchase of result.purchases) {
        // Store receipt
        await window.__NATIVE__!.secure.set('restored_' + purchase.id, purchase.receipt);

        // Process purchase
        if (purchase.id === PRODUCT_IDS.PACK_5) {
          creditsToAdd += 5;
        } else if (purchase.id === PRODUCT_IDS.PACK_60) {
          creditsToAdd += 60;
        } else if (purchase.id === PRODUCT_IDS.UNLIMITED_MONTHLY) {
          hasUnlimited = true;
        }
      }

      // Update store
      const store = useSettingsStore.getState();
      if (hasUnlimited) {
        store.setParsing({
          plan: 'unlimited',
          subscriptionActive: true,
          lastReceiptCheck: Date.now()
        });
      } else if (creditsToAdd > 0) {
        store.setParsing({
          plan: 'pack',
          remaining: store.parsing.remaining + creditsToAdd
        });
      }

      nativeToast('Purchases restored.');
      return true;
    }

    nativeToast('No purchases to restore.');
    return false;
  } catch (error) {
    console.error('Restore failed:', error);
    nativeToast('Restore failed.');
    return false;
  }
};