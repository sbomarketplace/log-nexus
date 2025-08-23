export const isNative = Boolean((window as any).__NATIVE__?.purchases);

type ProductId = "cc.ai.5" | "cc.ai.60" | "cc.ai.unlimited.month";

export async function getProducts(ids: ProductId[]) {
  if (!isNative) return [];
  return (window as any).__NATIVE__.purchases.getProducts({ ids });
}

export async function purchase(id: ProductId) {
  if (!isNative) throw new Error("Native purchases unavailable");
  return (window as any).__NATIVE__.purchases.purchase({ id });
}

export async function restore() {
  if (!isNative) throw new Error("Native purchases unavailable");
  return (window as any).__NATIVE__.purchases.restore();
}

export function toast(msg: string) {
  (window as any).__NATIVE__?.device?.toast?.(msg) ?? console.log("[toast]", msg);
}