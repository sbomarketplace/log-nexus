import { useAIQuota } from "@/state/aiQuotaStore";

export function withAIGate(fn: () => Promise<void>, openPaywall: () => void) {
  const { canUseAI, consume } = useAIQuota.getState();
  return async () => {
    if (!canUseAI()) { 
      openPaywall(); 
      return; 
    }
    await fn();
    consume();
  };
}