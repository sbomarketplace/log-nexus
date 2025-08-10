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
      <DialogContent className="max-w-md max-h-[80vh] rounded-xl shadow-2xl border-2">
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
                <Card key={incident.id} className="border border-border">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-foreground text-sm leading-tight break-words">
                          {incident.categoryOrIssue}
                        </h3>
                        <p className="text-sm text-muted-foreground mt-1">
                          {formatDate(incident.date)}
                        </p>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleExportIncident(incident.id, incident.categoryOrIssue)}
                        className="flex items-center gap-2 shrink-0"
                      >
                        <Download className="h-4 w-4" />
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