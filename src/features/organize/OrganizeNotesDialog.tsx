import React, { useState } from "react";
import { organizeIncidents } from "@/services/ai";
import { incidentService } from "@/services/incidents";
import type { OrganizedIncident } from "@/types/incidents";
import { IncidentRecord } from "@/types/incidents";
import { getDateSafely } from "@/utils/safeDate";

function exportText(inc: OrganizedIncident) {
  const lines = [
    `${getDateSafely(inc, 'No date')} — ${inc.categoryOrIssue}`,
    `Who: ${inc.who}`,
    `What: ${inc.what}`,
    `Where: ${inc.where}`,
    `When: ${inc.when}`,
    `Witnesses: ${inc.witnesses}`,
    `Notes: ${inc.notes}`,
  ].join("\n");
  const blob = new Blob([lines], { type: "text/plain;charset=utf-8" });
  const a = document.createElement("a");
  const safe = (inc.categoryOrIssue || "incident").toLowerCase().replace(/[^a-z0-9]+/g, "-");
  a.href = URL.createObjectURL(blob);
  a.download = `incident-${getDateSafely(inc, 'unknown')}-${safe}.txt`;
  a.click();
  URL.revokeObjectURL(a.href);
}

export default function OrganizeNotesDialog(props: { onClose: () => void; onSaved?: () => void; }) {
  const [raw, setRaw] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<OrganizedIncident[]>([]);

  const handleOrganize = async () => {
    setError(null);
    setLoading(true);
    setPreview([]);
    try {
      const results = await organizeIncidents(raw);
      if (!results?.length) {
        setError("No incidents were identified. Please review your notes and try again.");
      } else {
        setPreview(results);
      }
    } catch (e: any) {
      setError(e?.message || "We couldn't organize these notes. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteFromPreview = (idx: number) => {
    setPreview((arr) => arr.filter((_, i) => i !== idx));
  };

  const handleSave = async (inc: OrganizedIncident) => {
    const incidentRecord: IncidentRecord = {
      id: crypto.randomUUID(),
      created_at: new Date().toISOString(),
      events: [{
        date: getDateSafely(inc, ''),
        category: inc.categoryOrIssue,
        who: inc.who,
        what: inc.what,
        where: inc.where,
        when: inc.when,
        witnesses: inc.witnesses,
        notes: inc.notes
      }]
    };
    
    await incidentService.createIncident(incidentRecord);
  };

  const handleSaveAll = async () => {
    for (const inc of preview) await handleSave(inc);
    props.onClose?.();
    props.onSaved?.();
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <div>
        <h2 className="text-xl font-semibold mb-2">Organize Incident Notes</h2>
        <p className="text-sm text-muted-foreground">
          Paste your raw notes below. We'll organize them into clearly labeled incidents.
        </p>
      </div>

      <textarea
        value={raw}
        onChange={(e) => setRaw(e.target.value)}
        placeholder="Paste your raw incident notes here... Be sure to include Who, What, When, Where, Why, and How to capture the full details."
        className="w-full min-h-[200px] rounded-xl border p-3"
      />

      {error && (
        <div className="rounded-md bg-red-50 text-red-700 px-3 py-2 text-sm">{error}</div>
      )}

      <div className="flex items-center justify-center gap-3">
        <button
          onClick={handleOrganize}
          disabled={loading || !raw.trim()}
          className="rounded-lg px-5 py-2 font-medium text-white disabled:opacity-60"
          style={{ background: "#2563eb" }} // blue
        >
          {loading ? "Organizing…" : "Organize Now"}
        </button>
        <button className="rounded-lg px-5 py-2" onClick={props.onClose}>
          Cancel
        </button>
      </div>

      {/* Preview list */}
      {!!preview.length && (
        <div className="mt-3 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div className="font-semibold">{preview.length} incident(s) found</div>
            {preview.length > 1 && (
              <button
                onClick={handleSaveAll}
                className="rounded-lg bg-emerald-600 px-4 py-2 text-white"
              >
                Save All
              </button>
            )}
          </div>

          {preview.map((inc, idx) => (
            <div key={idx} className="rounded-xl border p-3 shadow-sm">
              <div className="font-semibold mb-1">{getDateSafely(inc, 'No date')} — {inc.categoryOrIssue}</div>
              <div className="text-sm leading-6">
                <div><strong>Who:</strong> {inc.who}</div>
                <div><strong>What:</strong> {inc.what}</div>
                <div><strong>Where:</strong> {inc.where}</div>
                <div><strong>When:</strong> {inc.when}</div>
                <div><strong>Witnesses:</strong> {inc.witnesses}</div>
                <div><strong>Notes:</strong> {inc.notes}</div>
              </div>

              <div className="mt-3 flex gap-2">
                <button
                  onClick={() => handleSave(inc)}
                  className="rounded-md bg-orange-600 px-3 py-1.5 text-white"
                >
                  Save
                </button>
                <button
                  onClick={() => exportText(inc)}
                  className="rounded-md border px-3 py-1.5"
                >
                  Export
                </button>
                <button
                  onClick={() => handleDeleteFromPreview(idx)}
                  className="rounded-md border px-3 py-1.5"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}