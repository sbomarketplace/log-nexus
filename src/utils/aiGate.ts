import { consumeOne } from "@/lib/credits";
import { initIAP } from "@/lib/iap";

export function withAIGate(fn: () => Promise<void>, openPaywall: () => void) {
  return async () => {
    await initIAP(); // ensure store is ready
    const result = await consumeOne();
    if (result === 'paywall') { 
      openPaywall(); 
      return; 
    }
    await fn();
  };
}