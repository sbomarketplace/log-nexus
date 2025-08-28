import * as React from "react";
import { Database, Trash2 } from "lucide-react";
import ConfirmModal from "@/components/common/ConfirmModal";
import { clearAllAppCaches, deleteAllIncidents, getCacheStats } from "@/lib/storageMaintenance";

function formatBytes(b: number) {
  if (!b) return "0 B";
  const u = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(b) / Math.log(1024));
  return `${(b / Math.pow(1024, i)).toFixed(1)} ${u[i]}`;
}

export default function DataStorageCard() {
  const [stats, setStats] = React.useState<{ items: number; bytes: number }>({ items: 0, bytes: 0 });
  const [confirmClear, setConfirmClear] = React.useState(false);
  const [confirmDeleteAll, setConfirmDeleteAll] = React.useState(false);
  const [busy, setBusy] = React.useState<"clear" | "delete" | null>(null);

  async function refresh() {
    const s = await getCacheStats();
    setStats(s);
  }

  React.useEffect(() => {
    refresh();
  }, []);

  async function onClear() {
    setBusy("clear");
    try {
      await clearAllAppCaches();
      await refresh();
    } finally {
      setBusy(null);
      setConfirmClear(false);
    }
  }

  async function onDeleteAll() {
    setBusy("delete");
    try {
      await deleteAllIncidents();
      // Optionally, also clear caches so export thumbnails, etc. are removed
      // await clearAllAppCaches();
    } finally {
      setBusy(null);
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
        <p className="text-sm text-gray-700">Cached files</p>
        <p className="text-xs text-gray-500">{stats.items} items • {formatBytes(stats.bytes)}</p>

        <div className="mt-3 flex flex-wrap gap-2">
          {/* Clear Cache removed per product decision */}
          <button
            onClick={() => setConfirmDeleteAll(true)}
            disabled={busy === "delete"}
            className="inline-flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 hover:bg-red-100 disabled:opacity-60"
          >
            <Trash2 className="h-4 w-4" />
            Delete all incident reports
          </button>
        </div>
      </div>

      {/* Clear Cache functionality removed */}

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
        confirmLabel={busy === "delete" ? "Deleting…" : "Delete permanently"}
        danger
        requireText="DELETE"
        onConfirm={onDeleteAll}
      />
    </div>
  );
}