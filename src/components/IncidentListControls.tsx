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
    <div className="flex items-center gap-1.5 sm:gap-2 text-[13px] sm:text-sm whitespace-nowrap w-full py-1.5 px-1">
      {/* Left side: Select all + count + clear */}
      <div className="flex items-center gap-1.5 sm:gap-2 whitespace-nowrap min-w-0">
        <label className="inline-flex items-center gap-1.5">
          <input
            type="checkbox"
            checked={allChecked}
            ref={(el) => { if (el) el.indeterminate = someChecked; }}
            onChange={toggleAll}
            aria-label="Select all visible incidents"
            className="h-3.5 w-3.5"
          />
          <span className="leading-none text-foreground/80">Select all</span>
        </label>

        <span className="opacity-50 text-xs">•</span>

        <span className="leading-none text-foreground/70">
          <span className="tabular-nums">{qty}</span> selected
        </span>

        <Button
          variant="ghost"
          size="sm"
          onClick={clear}
          disabled={isExporting || isDeleting}
          className="ml-1 text-[13px] h-auto py-0.5 px-1 hover:underline"
        >
          Clear
        </Button>
      </div>

      {/* Right side: Actions */}
      <div className="ml-auto flex items-center gap-1.5">
        <Button 
          variant="default" 
          size="sm" 
          onClick={handleBulkExport}
          disabled={isExporting || isDeleting}
          className="px-2.5 py-1 text-[13px] h-auto"
        >
          {isExporting ? "Exporting..." : "Export"}
        </Button>
        <Button 
          variant="destructive" 
          size="sm" 
          onClick={handleBulkDelete}
          disabled={isExporting || isDeleting}
          className="px-2.5 py-1 text-[13px] h-auto"
        >
          {isDeleting ? "Deleting..." : "Delete"}
        </Button>
      </div>
    </div>
  );
}