import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { X } from 'lucide-react';
import { OrganizedIncident } from '@/utils/organizedIncidentStorage';
import { formatDisplayDate } from '@/utils/dateParser';

interface ViewIncidentModalProps {
  incident: OrganizedIncident | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const ViewIncidentModal = ({ incident, open, onOpenChange }: ViewIncidentModalProps) => {
  if (!incident) return null;

  const displayDate = incident.canonicalEventDate 
    ? formatDisplayDate(incident.canonicalEventDate)
    : incident.date !== 'No date' 
      ? incident.date 
      : 'No date';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent 
        className="fixed left-[50%] top-[50%] z-50 w-[92%] max-w-[520px] translate-x-[-50%] translate-y-[-50%] rounded-2xl border bg-background p-0 shadow-2xl duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] sm:max-w-[600px]"
        onPointerDownOutside={(e) => {
          // Allow closing on outside click unless user is scrolling content
          const target = e.target as Element;
          const scrollContainer = target.closest('[data-scroll-container]');
          if (!scrollContainer) {
            onOpenChange(false);
          }
        }}
      >
        <div className="flex max-h-[85vh] flex-col">
          {/* Header */}
          <div className="flex items-center justify-between border-b px-6 py-4 sm:px-8">
            <DialogTitle className="text-lg font-semibold text-center flex-1">
              Incident Details
            </DialogTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onOpenChange(false)}
              className="h-8 w-8 p-0 rounded-full"
            >
              <X className="h-4 w-4" />
              <span className="sr-only">Close</span>
            </Button>
          </div>

          {/* Scrollable Content */}
          <div 
            className="flex-1 overflow-y-auto px-6 py-4 sm:px-8" 
            data-scroll-container
          >

            <div className="space-y-4">
              {/* Header Badges */}
              <div className="flex items-center gap-2 mb-6">
                <Badge variant="secondary" className="text-sm font-medium">
                  {displayDate}
                </Badge>
                <Badge variant="outline" className="text-sm">
                  {incident.categoryOrIssue}
                </Badge>
              </div>

              {/* Incident Details */}
              <div className="space-y-5">
                <div>
                  <h4 className="font-medium text-sm text-muted-foreground mb-2">Who</h4>
                  <p className="text-sm leading-relaxed">{incident.who}</p>
                </div>

                <div>
                  <h4 className="font-medium text-sm text-muted-foreground mb-2">What</h4>
                  <p className="text-sm leading-relaxed">{incident.what}</p>
                </div>

                <div>
                  <h4 className="font-medium text-sm text-muted-foreground mb-2">Where</h4>
                  <p className="text-sm leading-relaxed">{incident.where}</p>
                </div>

                <div>
                  <h4 className="font-medium text-sm text-muted-foreground mb-2">When</h4>
                  <p className="text-sm leading-relaxed">{incident.when}</p>
                </div>

                <div>
                  <h4 className="font-medium text-sm text-muted-foreground mb-2">Witnesses</h4>
                  <p className="text-sm leading-relaxed">{incident.witnesses}</p>
                </div>

                {incident.timeline && (
                  <div>
                    <h4 className="font-medium text-sm text-muted-foreground mb-2">Timeline</h4>
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">{incident.timeline}</p>
                  </div>
                )}

                {incident.requests && (
                  <div>
                    <h4 className="font-medium text-sm text-muted-foreground mb-2">Requests</h4>
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">{incident.requests}</p>
                  </div>
                )}

                {incident.policy && (
                  <div>
                    <h4 className="font-medium text-sm text-muted-foreground mb-2">Policy</h4>
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">{incident.policy}</p>
                  </div>
                )}

                {incident.evidence && (
                  <div>
                    <h4 className="font-medium text-sm text-muted-foreground mb-2">Evidence</h4>
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">{incident.evidence}</p>
                  </div>
                )}

                <div>
                  <h4 className="font-medium text-sm text-muted-foreground mb-2">Incident Summary</h4>
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">{incident.notes}</p>
                </div>
              </div>

              {/* Timestamps */}
              <div className="border-t pt-4 mt-6 text-xs text-muted-foreground">
                <div className="space-y-1">
                  <div>Created: {new Date(incident.createdAt).toLocaleString()}</div>
                  <div>Last Updated: {new Date(incident.updatedAt).toLocaleString()}</div>
                  {incident.originalEventDateText && (
                    <div>Original Date Text: "{incident.originalEventDateText}"</div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="border-t px-6 py-4 sm:px-8">
            <div className="flex justify-end">
              <Button 
                variant="outline" 
                onClick={() => onOpenChange(false)} 
                className="rounded-lg"
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};