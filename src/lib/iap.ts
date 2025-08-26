// StoreKit via cordova-plugin-purchase (CdvPurchase)
import 'cordova-plugin-purchase'; // IMPORTANT: side-effect import to attach global
type Store = any;  // CdvPurchase.Store
declare const CdvPurchase: any;

const PID_5  = import.meta.env.VITE_IAP_CREDIT_PACK_5  || import.meta.env.VITE_IAP_CREDITS_5  || '';
const PID_60 = import.meta.env.VITE_IAP_CREDIT_PACK_60 || import.meta.env.VITE_IAP_CREDITS_60 || '';
const PID_SUB = import.meta.env.VITE_IAP_SUB_MONTHLY   || import.meta.env.VITE_IAP_SUBSCRIPTION_MONTHLY || '';

// Warn about missing product IDs
if (!PID_5) console.warn('Missing env var: VITE_IAP_CREDIT_PACK_5');
if (!PID_60) console.warn('Missing env var: VITE_IAP_CREDIT_PACK_60');
if (!PID_SUB) console.warn('Missing env var: VITE_IAP_SUB_MONTHLY');

let store: Store | null = null;
let initialized = false;

// Consumers import these to update UI prices
export type ProductInfo = { id: string; title: string; priceString: string; type: 'consumable'|'subscription' };

// Credit packs mapping
const PACK_CREDITS: { [key: string]: number } = {
  [PID_5]: 5,
  [PID_60]: 60,
};

// Export utilities for compatibility
export const isNative = Boolean((window as any).__NATIVE__?.purchases);
export function toast(msg: string) {
  (window as any).__NATIVE__?.device?.toast?.(msg) ?? console.log("[toast]", msg);
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
  if (PID_5) productsToRegister.push({ id: PID_5,  type: CdvPurchase.ProductType.CONSUMABLE,        platform: CdvPurchase.Platform.APPLE_APPSTORE });
  if (PID_60) productsToRegister.push({ id: PID_60, type: CdvPurchase.ProductType.CONSUMABLE,        platform: CdvPurchase.Platform.APPLE_APPSTORE });
  if (PID_SUB) productsToRegister.push({ id: PID_SUB,type: CdvPurchase.ProductType.PAID_SUBSCRIPTION, platform: CdvPurchase.Platform.APPLE_APPSTORE });
  
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
  if (PID_5) fallbackProducts.push({ id: PID_5,  title: 'Get 5 AI reports',  priceString: '$1.99', type: 'consumable' as const });
  if (PID_60) fallbackProducts.push({ id: PID_60, title: 'Get 60 AI reports', priceString: '$19.99',type: 'consumable' as const });
  if (PID_SUB) fallbackProducts.push({ id: PID_SUB,title: 'Go Unlimited',      priceString: '$99/mo',type: 'subscription' as const });
  
  if (!store || !(window as any).cordova) return fallbackProducts;
  
  const products = [];
  if (PID_5) {
    const p5 = store.get(PID_5);
    products.push({ id: PID_5,  title: p5?.title || 'Get 5 AI reports',  priceString: p5?.price?.micros ? p5?.price?.localized : (p5?.priceString || '$1.99'), type: 'consumable' });
  }
  if (PID_60) {
    const p60 = store.get(PID_60);
    products.push({ id: PID_60, title: p60?.title|| 'Get 60 AI reports', priceString: p60?.price?.micros ? p60?.price?.localized: (p60?.priceString|| '$19.99'), type: 'consumable' });
  }
  if (PID_SUB) {
    const sub = store.get(PID_SUB);
    products.push({ id: PID_SUB,title: sub?.title|| 'Go Unlimited',      priceString: sub?.price?.localized || (sub?.priceString || '$99/mo'), type: 'subscription' });
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
    
    // Award credits immediately for successful consumable purchases
    const credits = PACK_CREDITS[productId] || 0;
    if (credits > 0) {
      await addPack(credits);
    }
    
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

// Called after a verified receipt; update credits/sub state.
import { addPack, setSubscription } from '@/lib/credits';
async function onVerified(receipt: any) {
  // Mark active subscription if PID_SUB is owned
  try {
    if (PID_SUB) {
      const subOwned = store?.owned?.(PID_SUB);
      await setSubscription(!!subOwned);
    }
  } catch {}

  // Award consumable credits from receipt transactions
  try {
    if (receipt?.transactions) {
      for (const transaction of receipt.transactions) {
        const productId = transaction.productId;
        const creditsPerPack = PACK_CREDITS[productId];
        if (creditsPerPack) {
          const quantity = transaction.quantity || 1;
          await addPack(creditsPerPack * quantity);
        }
      }
    }
  } catch (error) {
    console.warn('Failed to process consumable credits from receipt:', error);
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