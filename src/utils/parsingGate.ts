import { useSettingsStore } from '@/state/settingsStore';

export const canParse = (): boolean => {
  const { parsing } = useSettingsStore.getState();
  
  // Unlimited plan always allows parsing
  if (parsing.plan === 'unlimited' && parsing.subscriptionActive) {
    return true;
  }
  
  // Check if user has remaining credits
  return parsing.remaining > 0;
};

export const consumeParse = async (): Promise<void> => {
  const store = useSettingsStore.getState();
  const { parsing } = store;
  
  // No-op for unlimited plan
  if (parsing.plan === 'unlimited' && parsing.subscriptionActive) {
    return;
  }
  
  // Decrement remaining credits and increment lifetime usage
  if (parsing.remaining > 0) {
    store.setParsing({
      remaining: parsing.remaining - 1,
      lifetimeUsed: parsing.lifetimeUsed + 1
    });
  }
};

export const getRemainingCredits = (): number => {
  const { parsing } = useSettingsStore.getState();
  
  if (parsing.plan === 'unlimited' && parsing.subscriptionActive) {
    return Infinity;
  }
  
  return parsing.remaining;
};

export const getPlanDisplayInfo = (): { 
  displayText: string; 
  isUnlimited: boolean;
  remaining: number;
} => {
  const { parsing } = useSettingsStore.getState();
  
  if (parsing.plan === 'unlimited' && parsing.subscriptionActive) {
    return {
      displayText: 'Unlimited active',
      isUnlimited: true,
      remaining: Infinity
    };
  }
  
  if (parsing.plan === 'pack') {
    return {
      displayText: `${parsing.remaining} credits`,
      isUnlimited: false,
      remaining: parsing.remaining
    };
  }
  
  // Free plan
  const freeRemaining = Math.max(0, 3 - parsing.lifetimeUsed);
  return {
    displayText: `${freeRemaining} free parsings remaining`,
    isUnlimited: false,
    remaining: freeRemaining
  };
};