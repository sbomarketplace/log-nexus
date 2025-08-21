import { useSelection } from "@/state/selection";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { bulkExport, bulkDelete } from "@/lib/bulkActions";
import { useState } from "react";

interface IncidentListControlsProps {
  visibleIds: string[];
}

export function IncidentListControls({ visibleIds }: IncidentListControlsProps) {
  const { selected, setMany, clear, count } = useSelection();
  const [isExporting, setIsExporting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  
  const allChecked = visibleIds.length > 0 && visibleIds.every((id) => selected.has(id));
  const someChecked = !allChecked && visibleIds.some((id) => selected.has(id));

  function toggleAll() {
    allChecked ? clear() : setMany(visibleIds);
  }

  async function handleBulkExport() {
    setIsExporting(true);
    try {
      await bulkExport();
    } finally {
      setIsExporting(false);
    }
  }

  async function handleBulkDelete() {
    setIsDeleting(true);
    try {
      await bulkDelete();
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
          variant="default"
          size="sm"
          onClick={clear}
          disabled={isExporting || isDeleting}
          className="text-[10px] h-5 py-0.5 px-1 flex-shrink-0"
        >
          Clear
        </Button>
        <Button 
          variant="default" 
          size="sm" 
          onClick={handleBulkExport}
          disabled={isExporting || isDeleting}
          className="px-1.5 py-0.5 text-[10px] h-5 whitespace-nowrap"
        >
          {isExporting ? "Exporting..." : "Export"}
        </Button>
        <Button 
          variant="destructive" 
          size="sm" 
          onClick={handleBulkDelete}
          disabled={isExporting || isDeleting}
          className="px-1.5 py-0.5 text-[10px] h-5 whitespace-nowrap"
        >
          {isDeleting ? "Deleting..." : "Delete"}
        </Button>
      </div>
    </div>
  );
}