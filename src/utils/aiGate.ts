import { consumeOne } from "@/lib/credits";

export function withAIGate(fn: () => Promise<void>, openPaywall: () => void) {
  return async () => {
    const result = await consumeOne();
    if (result === 'paywall') { 
      openPaywall(); 
      return; 
    }
    await fn();
  };
}