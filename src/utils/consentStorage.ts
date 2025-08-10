const CONSENT_STORAGE_KEY = 'userConsentRecord';

export const POLICIES_VERSION = "2025-08-09";

export interface UserConsentRecord {
  consentAccepted: boolean;
  consentAcceptedAt: string;
  policiesVersion: string;
  source: string;
}

export const consentStorage = {
  getConsent(): UserConsentRecord | null {
    try {
      const stored = localStorage.getItem(CONSENT_STORAGE_KEY);
      if (!stored) return null;
      return JSON.parse(stored);
    } catch (error) {
      console.error('Error reading consent from storage:', error);
      return null;
    }
  },

  setConsent(consent: UserConsentRecord): void {
    try {
      localStorage.setItem(CONSENT_STORAGE_KEY, JSON.stringify(consent));
    } catch (error) {
      console.error('Error saving consent to storage:', error);
    }
  },

  clearConsent(): void {
    try {
      localStorage.removeItem(CONSENT_STORAGE_KEY);
    } catch (error) {
      console.error('Error clearing consent from storage:', error);
    }
  },

  needsConsent(currentVersion: string = POLICIES_VERSION): boolean {
    const consent = this.getConsent();
    return !consent || !consent.consentAccepted || consent.policiesVersion !== currentVersion;
  },

  hasValidConsent(): boolean {
    return !this.needsConsent();
  }
};