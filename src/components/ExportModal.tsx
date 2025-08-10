import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent } from '@/components/ui/card';
import { Download } from 'lucide-react';
import { organizedIncidentStorage, OrganizedIncident } from '@/utils/organizedIncidentStorage';
import { useToast } from '@/hooks/use-toast';

interface ExportModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const ExportModal = ({ open, onOpenChange }: ExportModalProps) => {
  const { toast } = useToast();
  const [incidents] = useState(() => organizedIncidentStorage.getAll());

  const handleExportIncident = (incidentId: string, title: string) => {
    try {
      const incident = organizedIncidentStorage.getById(incidentId);
      if (!incident) {
        toast({
          title: "Error",
          description: "Incident not found",
          variant: "destructive"
        });
        return;
      }

      const dataStr = organizedIncidentStorage.exportToText(incident);
      const dataBlob = new Blob([dataStr], { type: 'text/plain' });
      const url = URL.createObjectURL(dataBlob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = `incident-${title.replace(/[^a-zA-Z0-9]/g, '-')}-${incident.date}.txt`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast({
        title: "Export Complete",
        description: `${title} has been exported successfully.`
      });
    } catch (error) {
      toast({
        title: "Export Failed",
        description: "There was an error exporting the incident.",
        variant: "destructive"
      });
    }
  };

  const formatDate = (dateString: string) => {
    try {
      // Handle different date formats
      if (!dateString) return 'No date';
      
      // If it's already in a readable format, return as is
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="!left-1/2 !top-1/2 !-translate-x-1/2 !-translate-y-1/2 max-w-xs max-h-[80vh] rounded-xl shadow-2xl border-2 !m-0">
        <DialogHeader>
          <DialogTitle className="text-center">Export Incidents</DialogTitle>
        </DialogHeader>
        
        <ScrollArea className="h-[60vh] pr-4">
          <div className="space-y-3">
            {incidents.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No incidents found to export
              </div>
            ) : (
              incidents.map((incident) => (
                <Card key={incident.id} className="border border-border rounded-2xl shadow-sm hover:shadow-md transition-shadow cursor-pointer h-[130px]">
                  <CardContent className="p-3 h-full flex flex-col justify-between">
                    <div className="space-y-2">
                      <div className="flex flex-wrap gap-1">
                        <span className="px-2 py-1 text-[10px] font-medium bg-primary/10 text-primary rounded-full">
                          {formatDate(incident.date)}
                        </span>
                        <span className="px-2 py-1 text-[10px] font-medium bg-secondary/10 text-secondary-foreground rounded-full">
                          {incident.categoryOrIssue}
                        </span>
                      </div>
                      
                      <div className="space-y-1">
                        <h3 className="text-[12px] font-semibold text-foreground line-clamp-2 leading-tight">
                          {incident.categoryOrIssue}
                        </h3>
                        <p className="text-[11px] text-muted-foreground line-clamp-2">
                          {incident.what || 'No details available'}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex justify-end">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleExportIncident(incident.id, incident.categoryOrIssue);
                        }}
                        className="h-7 px-2 text-[10px] gap-1"
                      >
                        <Download className="h-3 w-3" />
                        Export
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};