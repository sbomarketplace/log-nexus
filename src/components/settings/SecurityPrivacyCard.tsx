import * as React from "react";
import { Shield } from "lucide-react";
import Lock from "@/lib/lock";

const AUTO_OPTIONS = [
  { label: "1 minute", value: 1 },
  { label: "5 minutes", value: 5 },
  { label: "15 minutes", value: 15 },
  { label: "Never", value: null },
];

export default function SecurityPrivacyCard() {
  const [, force] = React.useReducer((x) => x + 1, 0);

  React.useEffect(() => {
    Lock.initLock();
    const unsubscribe = Lock.subscribe(() => force());
    return unsubscribe;
  }, []);

  const settings = JSON.parse(localStorage.getItem("cc_security_settings_v1") || "{}");

  async function onToggleAppLock(next: boolean) {
    if (next) {
      const ok = await Lock.enableAppLock();
      if (!ok) return; // leave off if enrollment failed
    } else {
      const ok = await Lock.disableAppLock();
      if (!ok) return; // keep on if auth failed
    }
    force();
  }

  function onSetAuto(mins: number | null) {
    if (!settings?.appLockEnabled) return;
    Lock.setAutoLockMinutes(mins);
  }

  async function onToggleExport(next: boolean) {
    if (next && !settings?.appLockEnabled) {
      const ok = await Lock.enableAppLock();
      if (!ok) return; // don't enable gating without app lock
    }
    Lock.setRequireUnlockForExport(next);
    force();
  }

  return (
    <div className="rounded-xl border bg-white p-4">
      <div className="mb-3 flex items-center gap-2">
        <Shield className="h-5 w-5 text-gray-600" />
        <p className="font-semibold">Security &amp; Privacy</p>
      </div>

      <div className="space-y-6">
        {/* Hide Sensitive Previews */}
        <Row
          title="Hide Sensitive Previews"
          subtitle="Blur app switcher/screenshot overlay"
          right={<Switch checked={!!settings?.hideSensitivePreviews} onChange={(v)=>{ Lock.setHideSensitivePreviews(v); }} />}
        />

        <Row
          title="App Lock"
          subtitle="Face ID / Touch ID / Passcode (device)"
          right={<Switch checked={!!settings?.appLockEnabled} onChange={onToggleAppLock} />}
        />

        <Row
          title="Auto-lock"
          subtitle="Automatically lock the app after inactivity"
          right={
            <select
              className="rounded-xl border px-3 py-2 disabled:opacity-60"
              disabled={!settings?.appLockEnabled}
              value={settings?.autoLockMinutes ?? ""}
              onChange={(e)=>onSetAuto(e.target.value === "" ? null : Number(e.target.value))}
            >
              {AUTO_OPTIONS.map((o)=>(
                <option key={String(o.value ?? "")} value={o.value ?? ""}>{o.label}</option>
              ))}
            </select>
          }
        />

        <Row
          title="Require unlock to export/share"
          subtitle="Additional security for sensitive data"
          right={<Switch checked={!!settings?.requireUnlockForExport} onChange={onToggleExport} />}
        />
      </div>

    </div>
  );
}

/* tiny presentational helpers */
function Row({ title, subtitle, right }: { title: string; subtitle?: string; right: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between border-b last:border-b-0 pb-4">
      <div>
        <p className="font-medium">{title}</p>
        {subtitle && <p className="text-sm text-gray-500">{subtitle}</p>}
      </div>
      <div className="pl-4">{right}</div>
    </div>
  );
}

function Switch({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-7 w-12 items-center rounded-full transition ${
        checked ? "bg-orange-500" : "bg-gray-300"
      }`}
      aria-pressed={checked}
    >
      <span
        className={`inline-block h-6 w-6 transform rounded-full bg-white transition ${
          checked ? "translate-x-6" : "translate-x-1"
        }`}
      />
    </button>
  );
}