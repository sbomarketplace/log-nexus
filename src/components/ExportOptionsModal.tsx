import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, Mail, FileText, Printer, Download, Share, Save, File, FileImage } from 'lucide-react';
import { OrganizedIncident } from '@/utils/organizedIncidentStorage';
import { useExportIncident } from '@/hooks/useExportIncident';
import { ExportOption } from '@/types/export';

interface ExportOptionsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  incident: OrganizedIncident | null;
}

export const ExportOptionsModal = ({ open, onOpenChange, incident }: ExportOptionsModalProps) => {
  const [loadingOption, setLoadingOption] = useState<string | null>(null);
  const exportHandlers = useExportIncident(incident);

  const executeExport = async (optionId: string, handler: () => Promise<void> | void) => {
    setLoadingOption(optionId);
    try {
      await handler();
      onOpenChange(false);
    } catch (error) {
      console.error(`Export ${optionId} failed:`, error);
    } finally {
      setLoadingOption(null);
    }
  };

  const exportOptions: ExportOption[] = [
    {
      id: 'email',
      label: 'Email',
      description: 'Send via your email app (attaches PDF when supported)',
      icon: Mail,
      action: () => executeExport('email', exportHandlers.exportEmail)
    },
    {
      id: 'pdf',
      label: 'PDF',
      description: 'Download a formatted PDF',
      icon: FileImage,
      action: () => executeExport('pdf', exportHandlers.exportPDF)
    },
    {
      id: 'print',
      label: 'Print',
      description: 'Open printer-friendly view',
      icon: Printer,
      action: () => executeExport('print', exportHandlers.exportPrint)
    },
    {
      id: 'txt',
      label: 'TXT',
      description: 'Download plain text',
      icon: FileText,
      action: () => executeExport('txt', exportHandlers.exportTXT)
    },
    {
      id: 'docx',
      label: 'DOCX',
      description: 'Download a Word document',
      icon: File,
      action: () => executeExport('docx', exportHandlers.exportDOCX)
    },
    {
      id: 'save',
      label: 'Save to Device',
      description: 'Save PDF to your device',
      icon: Save,
      action: () => executeExport('save', exportHandlers.exportSave)
    },
    {
      id: 'share',
      label: 'Share…',
      description: 'Use your device\'s share sheet',
      icon: Share,
      action: () => executeExport('share', exportHandlers.exportShare),
      disabled: !navigator.share
    }
  ];

  const formatDate = (dateString: string) => {
    try {
      if (!dateString) return 'No date';
      
      if (dateString.includes('/') || dateString.includes('-')) {
        const date = new Date(dateString);
        if (!isNaN(date.getTime())) {
          return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
          });
        }
      }
      
      return dateString;
    } catch {
      return 'Invalid date';
    }
  };

  if (!incident) return null;

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
          <p className="text-sm text-muted-foreground text-center">
            Choose a format to save or share this report.
          </p>
        </DialogHeader>
        
        {/* Main Content - Scrollable */}
        <div className="flex-1 overflow-y-auto">
          {/* Incident Info */}
          <div className="mb-4 p-3 bg-muted/30 rounded-lg">
          <div className="flex flex-wrap gap-2 mb-2">
            <Badge variant="outline" className="text-xs">
              {formatDate(incident.date)}
            </Badge>
            <Badge variant="secondary" className="text-xs">
              {incident.categoryOrIssue}
            </Badge>
          </div>
          <h3 className="text-sm font-medium text-foreground line-clamp-1">
            {incident.categoryOrIssue}
          </h3>
        </div>

        {/* Export Options Grid */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          {exportOptions.map((option) => {
            const Icon = option.icon;
            const isLoading = loadingOption === option.id;
            const isDisabled = option.disabled || isLoading || !exportHandlers.isReady;

            return (
              <Button
                key={option.id}
                variant="outline"
                className="h-auto p-3 flex flex-col items-center gap-2 text-center hover:bg-accent/50 transition-colors disabled:opacity-50"
                onClick={option.action}
                disabled={isDisabled}
                aria-label={`${option.label} - ${option.description}`}
              >
                {isLoading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <Icon className="h-5 w-5" />
                )}
                <div>
                  <div className="font-medium text-xs">
                    {option.label}
                  </div>
                  <div className="text-xs text-muted-foreground line-clamp-2 mt-1">
                    {option.description}
                  </div>
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