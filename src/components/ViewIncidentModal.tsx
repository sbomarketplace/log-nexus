import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { OrganizedIncident } from '@/utils/organizedIncidentStorage';

interface ViewIncidentModalProps {
  incident: OrganizedIncident | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const ViewIncidentModal = ({ incident, open, onOpenChange }: ViewIncidentModalProps) => {
  if (!incident) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Incident Details</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-center gap-2 mb-4">
            <Badge variant="secondary" className="text-sm">
              📅 {incident.date}
            </Badge>
            <Badge variant="outline" className="text-sm">
              {incident.categoryOrIssue}
            </Badge>
          </div>

          {/* Incident Details */}
          <div className="space-y-4">
            <div>
              <h4 className="font-medium text-sm mb-1">Who:</h4>
              <p className="text-sm text-muted-foreground">{incident.who}</p>
            </div>

            <div>
              <h4 className="font-medium text-sm mb-1">What:</h4>
              <p className="text-sm text-muted-foreground">{incident.what}</p>
            </div>

            <div>
              <h4 className="font-medium text-sm mb-1">Where:</h4>
              <p className="text-sm text-muted-foreground">{incident.where}</p>
            </div>

            <div>
              <h4 className="font-medium text-sm mb-1">When:</h4>
              <p className="text-sm text-muted-foreground">{incident.when}</p>
            </div>

            <div>
              <h4 className="font-medium text-sm mb-1">Witnesses:</h4>
              <p className="text-sm text-muted-foreground">{incident.witnesses}</p>
            </div>

            <div>
              <h4 className="font-medium text-sm mb-1">Notes:</h4>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">{incident.notes}</p>
            </div>
          </div>

          {/* Timestamps */}
          <div className="border-t pt-4 text-xs text-muted-foreground">
            <div>Created: {new Date(incident.createdAt).toLocaleString()}</div>
            <div>Last Updated: {new Date(incident.updatedAt).toLocaleString()}</div>
          </div>

          {/* Close Button */}
          <div className="flex justify-end pt-4 border-t">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};