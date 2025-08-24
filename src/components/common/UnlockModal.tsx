import * as React from "react";
import { X, Lock as LockIcon } from "lucide-react";
import Lock, { verifyPasscode, setPasscode } from "@/lib/lock";

type Props = {
  open: boolean;
  mode: "unlock" | "setup-passcode";
  onClose: () => void;
};

export default function UnlockModal({ open, mode, onClose }: Props) {
  const [pass, setPass] = React.useState("");
  const [confirm, setConfirm] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const title = mode === "setup-passcode" ? "Set App Passcode" : "Unlock App";

  React.useEffect(() => {
    if (!open) {
      setPass(""); setConfirm(""); setBusy(false);
    }
  }, [open]);

  if (!open) return null;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      if (mode === "setup-passcode") {
        if (!pass || pass !== confirm) { alert("Passcodes do not match."); return; }
        await setPasscode(pass);
        Lock.unlock();
        onClose();
      } else {
        const ok = await verifyPasscode(pass);
        if (!ok) { alert("Incorrect passcode."); return; }
        Lock.unlock();
        onClose();
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <div role="dialog" aria-modal="true" className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative mx-4 w-full max-w-sm rounded-2xl bg-white shadow-xl">
        <div className="flex items-center justify-between px-5 py-4 border-b">
          <h3 className="text-lg font-semibold">{title}</h3>
          <button onClick={onClose} aria-label="Close" className="inline-flex h-8 w-8 items-center justify-center rounded-full hover:bg-gray-100">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={submit} className="px-5 py-4 space-y-3">
          <div className="flex items-center gap-2 text-gray-700">
            <LockIcon className="h-4 w-4" />
            <p className="text-sm">{mode === "setup-passcode" ? "Create a passcode as a fallback if biometrics aren't available." : "Enter your app passcode."}</p>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">{mode === "setup-passcode" ? "New passcode" : "Passcode"}</label>
            <input
              type="password"
              inputMode="numeric"
              className="w-full rounded-xl border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={pass}
              onChange={(e) => setPass(e.target.value)}
            />
          </div>

          {mode === "setup-passcode" && (
            <div className="space-y-2">
              <label className="text-sm font-medium">Confirm passcode</label>
              <input
                type="password"
                inputMode="numeric"
                className="w-full rounded-xl border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
              />
            </div>
          )}

          <div className="flex items-center justify-end gap-2 pt-1">
            <button type="button" onClick={onClose} className="rounded-xl px-4 py-2 text-sm text-gray-800 bg-gray-100 hover:bg-gray-200">
              Cancel
            </button>
            <button disabled={busy} className="rounded-xl bg-blue-600 px-4 py-2 text-sm text-white hover:opacity-90">
              {busy ? "Please wait…" : mode === "setup-passcode" ? "Save passcode" : "Unlock"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}