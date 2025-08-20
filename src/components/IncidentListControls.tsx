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

  return (
    <div className="flex items-center justify-between gap-2 py-2 px-1">
      <label className="inline-flex items-center gap-2 text-sm font-normal cursor-pointer">
        <Checkbox
          checked={allChecked}
          onCheckedChange={toggleAll}
          aria-label="Select all visible incidents"
          className="data-[state=indeterminate]:bg-primary data-[state=indeterminate]:text-primary-foreground"
          ref={(el) => {
            if (el) {
              const checkbox = el.querySelector('button');
              if (checkbox) {
                (checkbox as any).indeterminate = someChecked;
              }
            }
          }}
        />
        <span className="text-foreground/80">Select all</span>
      </label>

      {count() > 0 && (
        <div className="ml-auto flex items-center gap-2">
          <span className="text-sm text-foreground/70">{count()} selected</span>
          <Button variant="ghost" size="sm" onClick={clear} disabled={isExporting || isDeleting}>
            Clear
          </Button>
          <Button 
            variant="default" 
            size="sm" 
            onClick={handleBulkExport}
            disabled={isExporting || isDeleting}
          >
            {isExporting ? "Exporting..." : "Export"}
          </Button>
          <Button 
            variant="destructive" 
            size="sm" 
            onClick={handleBulkDelete}
            disabled={isExporting || isDeleting}
          >
            {isDeleting ? "Deleting..." : "Delete"}
          </Button>
        </div>
      )}
    </div>
  );
}