import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent } from '@/components/ui/card';
import { Download } from 'lucide-react';
import { organizedIncidentStorage, OrganizedIncident } from '@/utils/organizedIncidentStorage';
import { useToast } from '@/hooks/use-toast';
import { ExportOptionsModal } from '@/components/ExportOptionsModal';
import { formatDateForUI } from '@/utils/safeDate';

interface ExportModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const ExportModal = ({ open, onOpenChange }: ExportModalProps) => {
  const { toast } = useToast();
  const [incidents] = useState(() => organizedIncidentStorage.getAll());
  const [selectedIncident, setSelectedIncident] = useState<OrganizedIncident | null>(null);

  const handleExportIncident = (incidentId: string) => {
    const incident = organizedIncidentStorage.getById(incidentId);
    if (!incident) {
      toast({
        title: "Error",
        description: "Incident not found",
        variant: "destructive"
      });
      return;
    }
    setSelectedIncident(incident);
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
      <DialogContent className="cc-modal max-w-md w-[calc(100vw-2rem)] max-h-[80vh] rounded-xl shadow-2xl border-2">
        <DialogHeader className="pb-4">
          <DialogTitle className="text-center">Export Incidents</DialogTitle>
        </DialogHeader>
        
        <ScrollArea className="max-h-[50vh] pr-2">
          <div className="space-y-3">
            {incidents.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No incidents found to export
              </div>
            ) : (
              incidents.map((incident) => (
                <Card key={incident.id} className="border border-border rounded-lg shadow-sm hover:shadow-md transition-shadow">
                  <CardContent className="p-4 space-y-3">
                    <div className="flex flex-wrap gap-2 mb-3">
                      <span className="px-2 py-1 text-xs font-medium bg-primary/10 text-primary rounded-full">
                        {formatDateForUI(incident?.date)}
                      </span>
                      <span className="px-2 py-1 text-xs font-medium bg-secondary text-secondary-foreground rounded-full">
                        {incident.categoryOrIssue}
                      </span>
                    </div>
                    
                    <div className="space-y-2 mb-4">
                      <h3 className="text-sm font-semibold text-foreground">
                        {incident.categoryOrIssue}
                      </h3>
                      <p className="text-xs text-muted-foreground line-clamp-2">
                        {incident.what || 'No details available'}
                      </p>
                    </div>
                    
                    <div className="flex justify-end">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleExportIncident(incident.id);
                        }}
                        className="text-xs gap-1"
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
      
      <ExportOptionsModal 
        incident={selectedIncident}
        open={!!selectedIncident}
        onOpenChange={(open) => !open && setSelectedIncident(null)}
      />
    </Dialog>
  );
};