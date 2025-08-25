// StoreKit via cordova-plugin-purchase (CdvPurchase)
import 'cordova-plugin-purchase'; // IMPORTANT: side-effect import to attach global
type Store = any;  // CdvPurchase.Store
declare const CdvPurchase: any;

const P5   = import.meta.env.VITE_IAP_CREDIT_PACK_5;
const P60  = import.meta.env.VITE_IAP_CREDIT_PACK_60;
const PSUB = import.meta.env.VITE_IAP_SUB_MONTHLY;

let store: Store | null = null;
let initialized = false;

// Consumers import these to update UI prices
export type ProductInfo = { id: string; title: string; priceString: string; type: 'consumable'|'subscription' };

export async function initIAP(): Promise<void> {
  if (initialized) return;
  await waitCordovaReady();

  store = CdvPurchase.store;

  // Register products
  store.register([
    { id: P5,  type: CdvPurchase.ProductType.CONSUMABLE,        platform: CdvPurchase.Platform.APPLE_APPSTORE },
    { id: P60, type: CdvPurchase.ProductType.CONSUMABLE,        platform: CdvPurchase.Platform.APPLE_APPSTORE },
    { id: PSUB,type: CdvPurchase.ProductType.PAID_SUBSCRIPTION, platform: CdvPurchase.Platform.APPLE_APPSTORE },
  ]);

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

  initialized = true;
}

// Simple Product list for UI labels (localized price)
export function getProducts(): ProductInfo[] {
  if (!store) return [
    { id: P5,  title: 'Get 5 AI reports',  priceString: '$1.99', type: 'consumable' },
    { id: P60, title: 'Get 60 AI reports', priceString: '$19.99',type: 'consumable' },
    { id: PSUB,title: 'Go Unlimited',      priceString: '$99/mo',type: 'subscription' },
  ];
  const p5  = store.get(P5);
  const p60 = store.get(P60);
  const sub = store.get(PSUB);
  return [
    { id: P5,  title: p5?.title || 'Get 5 AI reports',  priceString: p5?.price?.micros ? p5?.price?.localized : (p5?.priceString || '$1.99'), type: 'consumable' },
    { id: P60, title: p60?.title|| 'Get 60 AI reports', priceString: p60?.price?.micros ? p60?.price?.localized: (p60?.priceString|| '$19.99'), type: 'consumable' },
    { id: PSUB,title: sub?.title|| 'Go Unlimited',      priceString: sub?.price?.localized || (sub?.priceString || '$99/mo'), type: 'subscription' },
  ];
}

export async function purchase(productId: string): Promise<{ok:boolean; error?:string}> {
  try {
    await initIAP();
    const product = store.get(productId);
    if (!product) return { ok:false, error:'Product not found' };
    const offer = product.getOffer?.();
    const error = await offer?.order();
    if (error) {
      if (error.code === CdvPurchase.ErrorCode.PAYMENT_CANCELLED) return { ok:false, error:'cancelled' };
      return { ok:false, error:String(error?.message || error) };
    }
    return { ok:true };
  } catch (e:any) {
    return { ok:false, error:String(e?.message || e) };
  }
}

// Restore: asks App Store for past non-consumable/subscriptions
export async function restore(): Promise<void> {
  await initIAP();
  await store?.refresh(); // triggers productUpdated/verified as needed
}

// Called after a verified receipt; update credits/sub state.
import { addPack, setSubscription } from '@/lib/credits';
async function onVerified(receipt: any) {
  // Mark active subscription if PSUB is owned
  try {
    const subOwned = store?.owned?.(PSUB);
    await setSubscription(!!subOwned);
  } catch {}

  // Consumables are verified per transaction, but we don't get quantity here.
  // Instead, add credits on purchase success (see paywall button handlers below).
}

// Helper
function waitCordovaReady() {
  return new Promise<void>(resolve => {
    if ((window as any).cordova) {
      document.addEventListener('deviceready', () => resolve(), { once: true });
    } else {
      resolve(); // web fallback
    }
  });
}