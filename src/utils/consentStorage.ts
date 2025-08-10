const CONSENT_STORAGE_KEY = 'clearcase-user-consent';

export interface UserConsent {
  userConsent: boolean;
  consentAcceptedAt: string;
  policiesVersion: string;
}

export const consentStorage = {
  getConsent(): UserConsent | null {
    try {
      const stored = localStorage.getItem(CONSENT_STORAGE_KEY);
      if (!stored) return null;
      return JSON.parse(stored);
    } catch (error) {
      console.error('Error reading consent from storage:', error);
      return null;
    }
  },

  setConsent(consent: UserConsent): void {
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

  hasValidConsent(): boolean {
    const consent = this.getConsent();
    return consent?.userConsent === true && consent?.policiesVersion === '2025-08-09';
  }
};