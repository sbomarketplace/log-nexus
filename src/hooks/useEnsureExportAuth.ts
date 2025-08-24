import Lock from "@/lib/lock";
import { useEffect, useState } from "react";

export default function useEnsureExportAuth() {
  const [needsPasscode, setNeedsPasscode] = useState(false);

  useEffect(() => {
    const unsubscribe = Lock.subscribe(() => setNeedsPasscode(Lock.isLocked()));
    return () => unsubscribe();
  }, []);

  /** Returns true if export may proceed */
  async function ensure(): Promise<boolean> {
    const settings = JSON.parse(localStorage.getItem("cc_security_settings_v1") || "{}");
    if (!settings?.requireUnlockForExport) return true;

    const res = await Lock.requireAuth("export");
    if (res === "ok") return true;
    if (res === "passcode") {
      // consumer should show UnlockModal; for convenience we return false so UI can open it
      return false;
    }
    return false;
  }

  return { ensure, needsPasscode };
}