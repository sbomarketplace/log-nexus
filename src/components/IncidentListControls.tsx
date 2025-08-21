import { useSelection } from "@/state/selection";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { bulkDelete } from "@/lib/bulkActions";
import { useState } from "react";
import { BulkExportModal } from "@/components/BulkExportModal";
import { ExportOptionsModal } from "@/components/ExportOptionsModal";
import { ConfirmDeleteModal } from "@/components/ConfirmDeleteModal";
import { organizedIncidentStorage } from "@/utils/organizedIncidentStorage";

interface IncidentListControlsProps {
  visibleIds: string[];
}

export function IncidentListControls({ visibleIds }: IncidentListControlsProps) {
  const { selected, setMany, clear, count } = useSelection();
  const [isDeleting, setIsDeleting] = useState(false);
  const [showBulkExport, setShowBulkExport] = useState(false);
  const [showSingleExport, setShowSingleExport] = useState(false);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [singleIncident, setSingleIncident] = useState(null);
  
  const allChecked = visibleIds.length > 0 && visibleIds.every((id) => selected.has(id));
  const someChecked = !allChecked && visibleIds.some((id) => selected.has(id));

  function toggleAll() {
    allChecked ? clear() : setMany(visibleIds);
  }

  function handleExportClick() {
    const selectedCount = count();
    
    if (selectedCount === 0) return;
    
    if (selectedCount === 1) {
      // Open single export modal
      const incidentId = Array.from(selected)[0];
      const incident = organizedIncidentStorage.getAll().find(i => i.id === incidentId);
      if (incident) {
        setSingleIncident(incident);
        setShowSingleExport(true);
      }
    } else {
      // Open bulk export modal
      setShowBulkExport(true);
    }
  }

  function getSelectedIncidents() {
    const allIncidents = organizedIncidentStorage.getAll();
    return Array.from(selected).map(id => 
      allIncidents.find(incident => incident.id === id)
    ).filter(Boolean);
  }

  function handleDeleteClick() {
    setShowConfirmDelete(true);
  }

  async function handleConfirmDelete() {
    setIsDeleting(true);
    try {
      await bulkDelete();
      setShowConfirmDelete(false);
    } finally {
      setIsDeleting(false);
    }
  }

  if (visibleIds.length === 0) return null;

  const qty = count();

  return (
    <div className="flex items-center justify-between text-[11px] w-full py-2 px-1 min-w-0">
      {/* Left side: Select all + count + clear */}
      <div className="flex items-center gap-1.5 whitespace-nowrap flex-1 min-w-0">
        <label className="inline-flex items-center gap-1.5 flex-shrink-0">
          <input
            type="checkbox"
            checked={allChecked}
            ref={(el) => { if (el) el.indeterminate = someChecked; }}
            onChange={toggleAll}
            aria-label="Select all visible incidents"
            className="h-4 w-4 flex-shrink-0"
          />
          <span className="leading-none text-foreground/80">Select all</span>
        </label>

        <span className="opacity-50 flex-shrink-0">•</span>

        <span className="leading-none text-foreground/70 flex-shrink-0">
          <span className="tabular-nums">{qty}</span> selected
        </span>
      </div>

      {/* Right side: Actions with even spacing */}
      <div className="flex items-center gap-2 flex-shrink-0 ml-8">
        <Button
          variant="blue"
          size="sm"
          onClick={clear}
          disabled={isDeleting}
          className="px-1.5 py-0.5 text-[10px] h-5 whitespace-nowrap"
        >
          Clear
        </Button>
        <Button 
          variant="default" 
          size="sm" 
          onClick={handleExportClick}
          disabled={isDeleting || count() === 0}
          className="px-1.5 py-0.5 text-[10px] h-5 whitespace-nowrap"
        >
          Export
        </Button>
        <Button 
          variant="destructive" 
          size="sm" 
          onClick={handleDeleteClick}
          disabled={isDeleting || count() === 0}
          className="px-1.5 py-0.5 text-[10px] h-5 whitespace-nowrap"
        >
          Delete
        </Button>
      </div>

      <BulkExportModal
        isOpen={showBulkExport}
        onClose={() => setShowBulkExport(false)}
        incidents={getSelectedIncidents()}
      />
      
      <ExportOptionsModal
        open={showSingleExport}
        onOpenChange={setShowSingleExport}
        incident={singleIncident}
      />

      <ConfirmDeleteModal
        isOpen={showConfirmDelete}
        onClose={() => setShowConfirmDelete(false)}
        onConfirm={handleConfirmDelete}
        count={count()}
        isDeleting={isDeleting}
      />
    </div>
  );
}