import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, Mail, FileText, Printer, Share, Save, File, FileImage } from 'lucide-react';
import { OrganizedIncident } from '@/utils/organizedIncidentStorage';
import { IncidentCardHeader } from '@/components/IncidentCardHeader';
import { briefIncidentSummary } from '@/utils/briefSummary';
import {
  exportPDF,
  exportPrint,
  exportTXT,
  exportDOCX,
  exportPDFToDevice,
  shareIncident,
  emailIncident
} from '@/utils/exporters';

interface ExportOptionsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  incident: OrganizedIncident | null;
}

export const ExportOptionsModal = ({ open, onOpenChange, incident }: ExportOptionsModalProps) => {
  const [loadingOption, setLoadingOption] = useState<string | null>(null);

  // Guard against null incident values
  if (!incident) {
    return null;
  }

  const executeExport = async (optionId: string, handler: () => Promise<any> | any) => {
    setLoadingOption(optionId);
    try {
      await handler();
      // Don't close modal automatically - let user decide if they want to export another format
    } catch (error) {
      console.error(`Export ${optionId} failed:`, error);
    } finally {
      setLoadingOption(null);
    }
  };

  const exportOptions = [
    {
      id: 'email',
      label: 'Email',
      icon: Mail,
      action: () => executeExport('email', () => emailIncident(incident))
    },
    {
      id: 'pdf',
      label: 'PDF',
      icon: FileImage,
      action: () => executeExport('pdf', () => exportPDF(incident))
    },
    {
      id: 'print',
      label: 'Print',
      icon: Printer,
      action: () => executeExport('print', () => exportPrint(incident))
    },
    {
      id: 'txt',
      label: 'TXT',
      icon: FileText,
      action: () => executeExport('txt', () => exportTXT(incident))
    },
    {
      id: 'docx',
      label: 'DOCX',
      icon: File,
      action: () => executeExport('docx', () => exportDOCX(incident))
    },
    {
      id: 'save',
      label: 'Save to Device',
      icon: Save,
      action: () => executeExport('save', () => exportPDFToDevice(incident))
    }
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent 
        className="max-w-md w-[calc(100vw-2rem)] max-h-[85vh] rounded-xl shadow-2xl border-2 flex flex-col"
        role="dialog"
        aria-modal="true"
        aria-labelledby="export-title"
      >
        <DialogHeader className="pb-4 flex-shrink-0">
          <DialogTitle id="export-title" className="text-center">
            Export Incident
          </DialogTitle>
        </DialogHeader>
        
        {/* Main Content - Scrollable */}
        <div className="flex-1 overflow-y-auto">
        {/* Export Options Grid */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          {exportOptions.map((option) => {
            const Icon = option.icon;
            const isLoading = loadingOption === option.id;
            const isDisabled = (option as any).disabled || isLoading;

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
            onClick={() => onOpenChange(false)}
            className="text-xs"
          >
            Cancel
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};