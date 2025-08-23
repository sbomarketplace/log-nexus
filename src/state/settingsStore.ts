import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AppLockSettings {
  enabled: boolean;
  autoLockMins: number;
  requireUnlockForExport: boolean;
}

interface ParsingSettings {
  plan: 'free' | 'pack5' | 'pack60' | 'unlimited';
  remaining: number;
  lifetimeUsed: number;
}

interface SettingsState {
  // Security & Privacy
  hidePreviews: boolean;
  appLock: AppLockSettings;
  
  // Account & Subscription
  parsing: ParsingSettings;
  
  // Actions
  setHidePreviews: (value: boolean) => void;
  setAppLock: (settings: Partial<AppLockSettings>) => void;
  setParsing: (settings: Partial<ParsingSettings>) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      // Default values
      hidePreviews: true,
      appLock: {
        enabled: true,
        autoLockMins: 5,
        requireUnlockForExport: true,
      },
      parsing: {
        plan: 'free',
        remaining: 3,
        lifetimeUsed: 0,
      },
      
      // Actions
      setHidePreviews: (value) => set({ hidePreviews: value }),
      setAppLock: (settings) => 
        set((state) => ({
          appLock: { ...state.appLock, ...settings }
        })),
      setParsing: (settings) =>
        set((state) => ({
          parsing: { ...state.parsing, ...settings }
        })),
    }),
    {
      name: 'clearcase-settings',
      // TODO: Also sync with user profile when signed in
    }
  )
);