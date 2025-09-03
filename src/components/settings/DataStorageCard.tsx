import * as React from "react";
import { Database, Trash2 } from "lucide-react";
import ConfirmModal from "@/components/common/ConfirmModal";
import { deleteAllIncidents } from "@/lib/storageMaintenance";

export default function DataStorageCard() {
  const [confirmDeleteAll, setConfirmDeleteAll] = React.useState(false);
  const [busy, setBusy] = React.useState(false);

  async function onDeleteAll() {
    setBusy(true);
    try {
      await deleteAllIncidents();
    } finally {
      setBusy(false);
      setConfirmDeleteAll(false);
    }
  }

  return (
    <div className="rounded-xl border bg-white p-4">
      <div className="mb-3 flex items-center gap-2">
        <Database className="h-5 w-5 text-gray-600" />
        <p className="font-semibold">Data &amp; Storage</p>
      </div>

      <div className="rounded-xl border p-4">
        <p className="text-sm text-gray-700 mb-3">Manage your incident data</p>

        <button
          onClick={() => setConfirmDeleteAll(true)}
          disabled={busy}
          className="inline-flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 hover:bg-red-100 disabled:opacity-60"
        >
          <Trash2 className="h-4 w-4" />
          Delete all incident reports
        </button>
      </div>

      {/* Double confirm: delete all incidents */}
      <ConfirmModal
        open={confirmDeleteAll}
        onClose={() => setConfirmDeleteAll(false)}
        title="Delete ALL incident reports?"
        description={
          <div className="space-y-2">
            <p>This permanently deletes every incident you've saved on this device.</p>
          </div>
        }
        confirmLabel={busy ? "Deleting…" : "Delete permanently"}
        danger
        requireText="DELETE"
        onConfirm={onDeleteAll}
      />
    </div>
  );
}