import Lock from "@/lib/lock";

export default function useEnsureExportAuth() {
  async function ensure(): Promise<boolean> {
    const settings = JSON.parse(localStorage.getItem("cc_security_settings_v1") || "{}");
    if (!settings?.requireUnlockForExport) return true;
    const res = await Lock.requireAuth("export");
    return res === "ok";
  }
  return { ensure };
}