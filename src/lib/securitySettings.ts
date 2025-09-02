export type SecuritySettings = { hideSensitivePreviews: boolean };

const KEY = "cc_security_settings_v1";

export function readSecuritySettings(): SecuritySettings {
  try {
    const raw = localStorage.getItem(KEY);
    const parsed = raw ? JSON.parse(raw) : {};
    return { hideSensitivePreviews: !!parsed.hideSensitivePreviews };
  } catch {
    return { hideSensitivePreviews: false };
  }
}

export function writeSecuritySettings(next: Partial<SecuritySettings>) {
  const current = readSecuritySettings();
  const merged = { ...current, ...next };
  localStorage.setItem(KEY, JSON.stringify(merged));
  return merged;
}