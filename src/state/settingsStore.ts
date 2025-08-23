import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AppLockSettings {
  enabled: boolean;
  autoLockMins: number;
  requireUnlockForExport: boolean;
}

interface ParsingSettings {
  plan: 'free' | 'pack' | 'unlimited';
  remaining: number;
  lifetimeUsed: number;
  subscriptionActive: boolean;
  lastReceiptCheck: number;
}

interface DataStorageSettings {
  attachmentsQuality: 'original' | 'medium' | 'small';
  wifiOnlyUploads: boolean;
  dataRetentionDays: 30 | 60 | 90;
}

interface IncidentDefaultsSettings {
  timeFormat: '12h' | '24h';
  timezone: string;
  defaultCategory: string;
  defaultRole: string;
  defaultUnion: string;
  smartParsing: boolean;
  titleSuggestions: boolean;
  exportDefaults: {
    includeFullDetails: boolean;
    redactNames: boolean;
    summaryLimit: boolean;
    pageSize: 'letter' | 'a4';
  };
}

interface NotificationSettings {
  endOfShiftReminder: boolean;
  endOfShiftTime: string;
  exportFinished: boolean;
  resourceUpdates: boolean;
}

interface IntegrationSettings {
  fileProviders: {
    icloud: boolean;
    googleDrive: boolean;
    dropbox: boolean;
  };
  permissions: {
    contacts: boolean;
    calendar: boolean;
  };
}

interface SettingsState {
  // Security & Privacy
  hidePreviews: boolean;
  appLock: AppLockSettings;
  
  // Account & Subscription
  parsing: ParsingSettings;
  
  // Data & Storage
  dataStorage: DataStorageSettings;
  
  // Incident Defaults & Templates
  incidentDefaults: IncidentDefaultsSettings;
  
  // Notifications
  notifications: NotificationSettings;
  
  // Integrations
  integrations: IntegrationSettings;
  
  // Actions
  setHidePreviews: (value: boolean) => void;
  setAppLock: (settings: Partial<AppLockSettings>) => void;
  setParsing: (settings: Partial<ParsingSettings>) => void;
  setDataStorage: (settings: Partial<DataStorageSettings>) => void;
  setIncidentDefaults: (settings: Partial<IncidentDefaultsSettings>) => void;
  setNotifications: (settings: Partial<NotificationSettings>) => void;
  setIntegrations: (settings: Partial<IntegrationSettings>) => void;
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
        subscriptionActive: false,
        lastReceiptCheck: 0,
      },
      dataStorage: {
        attachmentsQuality: 'medium',
        wifiOnlyUploads: true,
        dataRetentionDays: 60,
      },
      incidentDefaults: {
        timeFormat: '12h',
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        defaultCategory: '',
        defaultRole: '',
        defaultUnion: '',
        smartParsing: true,
        titleSuggestions: true,
        exportDefaults: {
          includeFullDetails: true,
          redactNames: false,
          summaryLimit: true,
          pageSize: 'letter',
        },
      },
      notifications: {
        endOfShiftReminder: false,
        endOfShiftTime: '17:00',
        exportFinished: true,
        resourceUpdates: false,
      },
      integrations: {
        fileProviders: {
          icloud: false,
          googleDrive: false,
          dropbox: false,
        },
        permissions: {
          contacts: false,
          calendar: false,
        },
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
      setDataStorage: (settings) =>
        set((state) => ({
          dataStorage: { ...state.dataStorage, ...settings }
        })),
      setIncidentDefaults: (settings) =>
        set((state) => ({
          incidentDefaults: { ...state.incidentDefaults, ...settings }
        })),
      setNotifications: (settings) =>
        set((state) => ({
          notifications: { ...state.notifications, ...settings }
        })),
      setIntegrations: (settings) =>
        set((state) => ({
          integrations: { ...state.integrations, ...settings }
        })),
    }),
    {
      name: 'clearcase-settings',
      // TODO: Also sync with user profile when signed in
    }
  )
);