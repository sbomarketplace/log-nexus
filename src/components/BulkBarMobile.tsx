import { useSelection } from "@/state/selection";
import { Button } from "@/components/ui/button";
import { bulkDelete } from "@/lib/bulkActions";
import { useState } from "react";
import { BulkExportModal } from "@/components/BulkExportModal";
import { ExportOptionsModal } from "@/components/ExportOptionsModal";
import { organizedIncidentStorage } from "@/utils/organizedIncidentStorage";

export function BulkBarMobile() {
  const { count, clear, selected } = useSelection();
  const [isDeleting, setIsDeleting] = useState(false);
  const [showBulkExport, setShowBulkExport] = useState(false);
  const [showSingleExport, setShowSingleExport] = useState(false);
  const [singleIncident, setSingleIncident] = useState(null);
  
  if (count() === 0) return null;

  function handleExportClick() {
    const selectedCount = count();
    console.log('Export clicked, selected count:', selectedCount);
    
    if (selectedCount === 0) return;
    
    if (selectedCount === 1) {
      // Open single export modal
      const incidentId = Array.from(selected)[0];
      const incident = organizedIncidentStorage.getAll().find(i => i.id === incidentId);
      console.log('Single incident found:', incident ? 'yes' : 'no');
      if (incident) {
        setSingleIncident(incident);
        setShowSingleExport(true);
      }
    } else {
      // Open bulk export modal
      console.log('Opening bulk export modal');
      setShowBulkExport(true);
    }
  }

  function getSelectedIncidents() {
    const allIncidents = organizedIncidentStorage.getAll();
    return Array.from(selected).map(id => 
      allIncidents.find(incident => incident.id === id)
    ).filter(Boolean);
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
          onClick={handleExportClick}
          disabled={isDeleting || count() === 0}
          className="h-8"
        >
          Export
        </Button>
        <Button 
          variant="destructive" 
          size="sm" 
          onClick={handleBulkDelete}
          disabled={isDeleting}
          className="h-8"
        >
          {isDeleting ? "Deleting..." : "Delete"}
        </Button>
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={clear}
          disabled={isDeleting}
          className="h-8"
        >
          Clear
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
    </div>
  );
}