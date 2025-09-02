import { useEffect, useState } from "react";
import { PrivacyScreen } from "@capacitor-community/privacy-screen";
import { readSecuritySettings, writeSecuritySettings } from "@/lib/securitySettings";
import { Switch } from "@/components/ui/switch";

export default function PrivacyPreviewToggle() {
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    setEnabled(readSecuritySettings().hideSensitivePreviews);
  }, []);

  async function onChange(next: boolean) {
    setEnabled(next);
    writeSecuritySettings({ hideSensitivePreviews: next });
    try {
      if (next) await PrivacyScreen.enable();
      else await PrivacyScreen.disable();
    } catch {
      setEnabled(!next);
      writeSecuritySettings({ hideSensitivePreviews: !next });
    }
  }

  return (
    <Switch
      checked={enabled}
      onCheckedChange={onChange}
      aria-label="Hide sensitive previews"
    />
  );
}