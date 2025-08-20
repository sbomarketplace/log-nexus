import { useSelection } from "@/state/selection";
import { Button } from "@/components/ui/button";
import { bulkExport, bulkDelete } from "@/lib/bulkActions";
import { useState } from "react";

export function BulkBarMobile() {
  const { count, clear } = useSelection();
  const [isExporting, setIsExporting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  
  if (count() === 0) return null;

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

  return (
    <div className="fixed bottom-3 left-3 right-3 z-40 rounded-2xl bg-card/95 backdrop-blur-sm shadow-xl border border-border px-3 py-2.5 flex items-center gap-2">
      <span className="text-sm font-medium">{count()} selected</span>
      <div className="ml-auto flex items-center gap-2">
        <Button 
          size="sm" 
          onClick={handleBulkExport}
          disabled={isExporting || isDeleting}
          className="h-8"
        >
          {isExporting ? "Exporting..." : "Export"}
        </Button>
        <Button 
          variant="destructive" 
          size="sm" 
          onClick={handleBulkDelete}
          disabled={isExporting || isDeleting}
          className="h-8"
        >
          {isDeleting ? "Deleting..." : "Delete"}
        </Button>
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={clear}
          disabled={isExporting || isDeleting}
          className="h-8"
        >
          Clear
        </Button>
      </div>
    </div>
  );
}