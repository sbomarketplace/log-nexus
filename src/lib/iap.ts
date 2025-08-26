// StoreKit via cordova-plugin-purchase (CdvPurchase)
import 'cordova-plugin-purchase'; // IMPORTANT: side-effect import to attach global
type Store = any;  // CdvPurchase.Store
declare const CdvPurchase: any;

const PID_SUB = import.meta.env.VITE_IAP_REMOVE_ADS_MONTHLY || '';

// Warn about missing product IDs
if (!PID_SUB) console.warn('Missing env var: VITE_IAP_REMOVE_ADS_MONTHLY');

let store: Store | null = null;
let initialized = false;

// Consumers import these to update UI prices
export type ProductInfo = { id: string; title: string; priceString: string; type: 'consumable'|'subscription' };

// Single subscription model - no credit packs

// Export utilities for compatibility
export const isNative = Boolean((window as any).__NATIVE__?.purchases);
export function toast(msg: string) {
  (window as any).__NATIVE__?.device?.toast?.(msg) ?? console.log("[toast]", msg);
}

// For the single subscription model (Remove Ads)
export function isRemoveAdsActive(): boolean {
  // Check both store state and local storage for persistence
  if (store && PID_SUB) {
    return Boolean(store.owned(PID_SUB));
  }
  // Fallback to localStorage for web or when store not ready
  return localStorage.getItem('removeAdsActive') === 'true';
}

export async function purchaseRemoveAds(): Promise<{ok:boolean; error?:string}> {
  const result = await purchase(PID_SUB);
  if (result.ok) {
    localStorage.setItem('removeAdsActive', 'true');
  }
  return result;
}

export async function restorePurchases(): Promise<void> {
  await restore();
  // After restore, check if subscription is now active
  if (isRemoveAdsActive()) {
    localStorage.setItem('removeAdsActive', 'true');
  }
}

export async function initIAP(): Promise<void> {
  if (initialized) return;
  
  // Guard web builds - cordova plugin only works on native
  if (!(window as any).cordova) {
    initialized = true;
    return;
  }
  
  await waitCordovaReady();

  store = CdvPurchase.store;

  // Register products (only if PID is available)
  const productsToRegister = [];
  if (PID_SUB) productsToRegister.push({ id: PID_SUB, type: CdvPurchase.ProductType.PAID_SUBSCRIPTION, platform: CdvPurchase.Platform.APPLE_APPSTORE });
  
  if (productsToRegister.length > 0) {
    store.register(productsToRegister);
  }

  // Event handlers
  store.when()
    .productUpdated(() => {})
    .approved(async (tx: any) => {
      // For subscriptions + consumables, verify if possible then finish.
      try { await tx?.verify?.(); } catch { /* fall through */ }
      try { await tx?.finish?.(); } catch {}
    })
    .verified(async (receipt: any) => {
      // Receipt verified: unlock entitlement(s)
      await onVerified(receipt);
    });

  // Initialize the store (iOS)
  store.initialize([{
    platform: CdvPurchase.Platform.APPLE_APPSTORE,
    options: { needAppReceipt: true }
  }]);

  // Update product info from store
  await store.update();

  initialized = true;
}

// Simple Product list for UI labels (localized price)
export function getProducts(): ProductInfo[] {
  // Fallback prices for web builds or when store isn't available
  const fallbackProducts = [];
  if (PID_SUB) fallbackProducts.push({ id: PID_SUB, title: 'Remove Ads', priceString: '$4.99/mo', type: 'subscription' as const });
  
  if (!store || !(window as any).cordova) return fallbackProducts;
  
  const products = [];
  if (PID_SUB) {
    const sub = store.get(PID_SUB);
    products.push({ id: PID_SUB, title: sub?.title || 'Remove Ads', priceString: sub?.price?.localized || (sub?.priceString || '$4.99/mo'), type: 'subscription' });
  }
  return products;
}

export async function purchase(productId: string): Promise<{ok:boolean; error?:string}> {
  try {
    // Guard web builds
    if (!(window as any).cordova) {
      return { ok:false, error:'In-app purchases not available on web' };
    }
    
    await initIAP();
    const product = store.get(productId);
    if (!product) return { ok:false, error:'Product not found' };
    const offer = product.getOffer?.();
    const error = await offer?.order();
    if (error) {
      if (error.code === CdvPurchase.ErrorCode.PAYMENT_CANCELLED) return { ok:false, error:'cancelled' };
      return { ok:false, error:String(error?.message || error) };
    }
    
    // For subscription, no immediate action needed - handled in onVerified
    
    return { ok:true };
  } catch (e:any) {
    return { ok:false, error:String(e?.message || e) };
  }
}

// Restore: asks App Store for past non-consumable/subscriptions
export async function restore(): Promise<void> {
  // Guard web builds
  if (!(window as any).cordova) {
    throw new Error('Restore purchases not available on web');
  }
  
  await initIAP();
  await store?.refresh(); // triggers productUpdated/verified as needed
}

// Called after a verified receipt; update subscription state.
async function onVerified(receipt: any) {
  // Mark active subscription if PID_SUB is owned
  try {
    if (PID_SUB && store) {
      const subOwned = store.owned(PID_SUB);
      // Store subscription state (could use localStorage or other persistence)
      if (subOwned) {
        localStorage.setItem('removeAdsActive', 'true');
      }
    }
  } catch (error) {
    console.warn('Failed to update subscription state:', error);
  }
}

// Helper
function waitCordovaReady() {
  return new Promise<void>(resolve => {
    if ((window as any).cordova) {
      if ((window as any).CdvPurchase) {
        resolve();
      } else {
        document.addEventListener('deviceready', () => resolve(), { once: true });
      }
    } else {
      resolve(); // web fallback
    }
  });
}