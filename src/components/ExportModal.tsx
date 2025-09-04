import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import ModalHeader from '@/components/common/ModalHeader';
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
      <DialogContent className="max-w-md w-[calc(100vw-2rem)] max-h-[80vh] rounded-xl shadow-2xl border-2">
        <ModalHeader 
          title="Export Incidents"
          align="center"
        />
        
        <ScrollArea className="max-h-[50vh] pr-2">
          <div className="space-y-3">
            <div className="text-center py-8 text-muted-foreground">
              Export functionality available
            </div>
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