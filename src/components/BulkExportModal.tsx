import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Loader2, Mail, FileText, Printer, Share, Save, File, FileImage, Archive, Table } from 'lucide-react';
import { OrganizedIncident } from '@/utils/organizedIncidentStorage';
import {
  exportBulkSinglePDF,
  exportBulkZipPDFs,
  exportBulkCSV,
  exportBulkDocxZip,
  exportBulkTxtZip,
  exportBulkShare,
  exportBulkPrint
} from '@/utils/exporters';

interface BulkExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  incidents: OrganizedIncident[];
}

export const BulkExportModal = ({ isOpen, onClose, incidents }: BulkExportModalProps) => {
  const [loadingOption, setLoadingOption] = useState<string | null>(null);
  
  const incidentCount = incidents?.length || 0;
  
  console.log('BulkExportModal render:', { isOpen, incidentCount, incidents: incidents?.length });
  
  if (!isOpen) return null;
  
  // Allow modal to open with any number of incidents, just show appropriate message
  if (incidentCount === 0) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>No Incidents Selected</DialogTitle>
          </DialogHeader>
          <p>Please select incidents to export.</p>
          <Button onClick={onClose}>Close</Button>
        </DialogContent>
      </Dialog>
    );
  }
  
  if (incidentCount === 1) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Single Incident Export</DialogTitle>
          </DialogHeader>
          <p>Use the single incident export modal for individual incidents.</p>
          <Button onClick={onClose}>Close</Button>
        </DialogContent>
      </Dialog>
    );
  }

  const executeExport = async (optionId: string, handler: () => Promise<any> | any) => {
    setLoadingOption(optionId);
    try {
      await handler();
      // Close modal after successful export
      onClose();
    } catch (error) {
      console.error(`Bulk export ${optionId} failed:`, error);
    } finally {
      setLoadingOption(null);
    }
  };

  const exportOptions = [
    {
      id: 'combinedPdf',
      label: 'Single PDF',
      icon: FileImage,
      action: () => executeExport('combinedPdf', () => exportBulkSinglePDF(incidents, {}))
    },
    {
      id: 'pdfZip',
      label: 'ZIP of PDFs',
      icon: Archive,
      action: () => executeExport('pdfZip', () => exportBulkZipPDFs(incidents, {}))
    },
    {
      id: 'csv',
      label: 'CSV summary',
      icon: Table,
      action: () => executeExport('csv', () => exportBulkCSV(incidents, {}))
    },
    {
      id: 'docxZip',
      label: 'DOCX (ZIP)',
      icon: File,
      action: () => executeExport('docxZip', () => exportBulkDocxZip(incidents, {}))
    },
    {
      id: 'txtZip',
      label: 'TXT (ZIP)',
      icon: FileText,
      action: () => executeExport('txtZip', () => exportBulkTxtZip(incidents, {}))
    },
    {
      id: 'share',
      label: 'Share…',
      icon: Share,
      action: () => executeExport('share', () => exportBulkShare(incidents, {})),
      disabled: !navigator.share
    },
    {
      id: 'print',
      label: 'Print',
      icon: Printer,
      action: () => executeExport('print', () => exportBulkPrint(incidents, {}))
    }
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent 
        className="max-w-md w-[calc(100vw-2rem)] max-h-[85vh] rounded-xl shadow-2xl border-2 flex flex-col"
        role="dialog"
        aria-modal="true"
        aria-labelledby="bulk-export-title"
      >
        <DialogHeader className="pb-4 flex-shrink-0">
          <DialogTitle id="bulk-export-title" className="text-center">
            Multiple Incident Export
          </DialogTitle>
          <div className="text-sm text-muted-foreground text-center">
            {incidentCount} incidents selected
          </div>
        </DialogHeader>
        
        {/* Main Content - Scrollable */}
        <div className="flex-1 overflow-y-auto">
          {/* Export Options Grid */}
          <div className="grid grid-cols-2 gap-3 mb-4 sm:grid-cols-3">
            {exportOptions.map((option) => {
              const Icon = option.icon;
              const isLoading = loadingOption === option.id;
              const isDisabled = option.disabled || isLoading;

              return (
                <Button
                  key={option.id}
                  variant="outline"
                  className="h-auto p-3 flex flex-col items-center gap-2 text-center hover:bg-accent/50 transition-colors disabled:opacity-50"
                  onClick={option.action}
                  disabled={isDisabled}
                  aria-label={option.label}
                >
                  {isLoading ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <Icon className="h-5 w-5" />
                  )}
                  <div className="font-medium text-xs">
                    {option.label}
                  </div>
                </Button>
              );
            })}
          </div>
        </div>

        {/* Footer - Fixed at bottom */}
        <div className="flex justify-center pt-4 border-t flex-shrink-0">
          <Button 
            variant="ghost" 
            onClick={onClose}
            className="text-xs"
          >
            Cancel
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};