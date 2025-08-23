import { create } from "zustand";

type Plan = "free" | "pack" | "unlimited";
const FREE_TOTAL = 3;

type State = {
  plan: Plan;
  freeUsed: number;     // 0..3
  credits: number;      // paid credits from packs
  subscriptionActive: boolean;
  lastPackAdded?: 5 | 60 | null;
  canUseAI: () => boolean;
  consume: () => void;
  addCredits: (n: number) => void;
  setUnlimited: (active: boolean) => void;
  resetFreeIfNeeded?: () => void; // hook if you later add monthly resets
};

export const useAIQuota = create<State>((set, get) => ({
  plan: "free",
  freeUsed: 0,
  credits: 0,
  subscriptionActive: false,
  lastPackAdded: null,
  canUseAI: () => {
    const s = get();
    if (s.subscriptionActive) return true;
    const remainingFree = Math.max(0, FREE_TOTAL - s.freeUsed);
    return remainingFree > 0 || s.credits > 0;
  },
  consume: () => {
    const s = get();
    if (s.subscriptionActive) return; // unlimited
    if (s.credits > 0) { 
      set({ credits: s.credits - 1, plan: "pack" }); 
      return; 
    }
    const used = Math.min(FREE_TOTAL, s.freeUsed + 1);
    set({ freeUsed: used });
  },
  addCredits: (n) => set((s) => ({ 
    credits: s.credits + n, 
    plan: "pack", 
    lastPackAdded: (n === 5 ? 5 : n === 60 ? 60 : null) as any 
  })),
  setUnlimited: (active) => set({ 
    subscriptionActive: active, 
    plan: active ? "unlimited" : "free" 
  }),
}));

export { FREE_TOTAL };