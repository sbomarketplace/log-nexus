import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown, ChevronUp, Eye, Edit, Download, Trash2, X } from 'lucide-react';
import { OrganizedIncident } from '@/utils/organizedIncidentStorage';
import { ViewIncidentModal } from './ViewIncidentModal';

interface CompactIncidentModalProps {
  incident: OrganizedIncident | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEdit: (incident: OrganizedIncident) => void;
  onExport: (incident: OrganizedIncident) => void;
  onDelete: (id: string) => void;
}

export const CompactIncidentModal = ({ 
  incident, 
  open, 
  onOpenChange,
  onEdit,
  onExport,
  onDelete
}: CompactIncidentModalProps) => {
  const [showFullSummary, setShowFullSummary] = useState(false);
  const [timelineOpen, setTimelineOpen] = useState(false);
  const [policyOpen, setPolicyOpen] = useState(false);
  const [showFullModal, setShowFullModal] = useState(false);

  if (!incident) return null;

  const handleViewFull = () => {
    onOpenChange(false);
    setShowFullModal(true);
  };

  const handleAction = (action: () => void) => {
    onOpenChange(false);
    action();
  };

  const formatCreatedDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    });
  };

  const formatUpdatedDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    });
  };

  const getSummaryPreview = (text: string, maxLines = 5) => {
    const words = text.split(' ');
    const maxWords = maxLines * 12; // Approximate words per line
    if (words.length <= maxWords) return text;
    return words.slice(0, maxWords).join(' ') + '...';
  };

  const summaryPreview = getSummaryPreview(incident.notes);
  const needsExpansion = summaryPreview !== incident.notes;

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-[380px] max-h-[70vh] p-0 gap-0">
          {/* Sticky Header */}
          <DialogHeader className="p-4 pb-2 border-b sticky top-0 bg-background/95 backdrop-blur-sm">
            <div className="flex items-center justify-between">
              <DialogTitle className="text-sm font-medium">Incident Details</DialogTitle>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={() => onOpenChange(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </DialogHeader>

          {/* Scrollable Body */}
          <div className="p-4 space-y-4 overflow-y-auto flex-1">
            {/* Chips */}
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant="secondary" className="text-[11px] h-[22px] px-2">
                {incident.date}
              </Badge>
              <Badge variant="outline" className="text-[11px] h-[22px] px-2">
                {incident.categoryOrIssue}
              </Badge>
            </div>

            {/* Key Facts Grid */}
            <div className="grid grid-cols-2 gap-3 text-[12px]">
              <div>
                <div className="font-medium text-foreground mb-1">Who</div>
                <div className="text-muted-foreground" title={incident.who}>
                  {incident.who}
                </div>
              </div>
              <div>
                <div className="font-medium text-foreground mb-1">What</div>
                <div className="text-muted-foreground" title={incident.what}>
                  {incident.what.length > 50 ? `${incident.what.substring(0, 50)}...` : incident.what}
                </div>
              </div>
              <div>
                <div className="font-medium text-foreground mb-1">Where</div>
                <div className="text-muted-foreground" title={incident.where}>
                  {incident.where}
                </div>
              </div>
              <div>
                <div className="font-medium text-foreground mb-1">When</div>
                <div className="text-muted-foreground" title={incident.when}>
                  {incident.when || "Time Unspecified"}
                </div>
              </div>
              {incident.witnesses && (
                <div className="col-span-2">
                  <div className="font-medium text-foreground mb-1">Witnesses</div>
                  <div className="text-muted-foreground" title={incident.witnesses}>
                    {incident.witnesses}
                  </div>
                </div>
              )}
            </div>

            {/* Incident Summary */}
            <div>
              <div className="font-medium text-foreground mb-2 text-[12px]">Incident Summary</div>
              <div className="text-[12px] text-muted-foreground leading-relaxed">
                {showFullSummary || !needsExpansion ? incident.notes : summaryPreview}
                {needsExpansion && (
                  <Button
                    variant="link"
                    className="h-auto p-0 text-[12px] text-accent hover:text-accent/80 ml-1"
                    onClick={() => setShowFullSummary(!showFullSummary)}
                  >
                    {showFullSummary ? 'Show less' : 'Show more'}
                  </Button>
                )}
              </div>
            </div>

            {/* Timeline (collapsible) */}
            {incident.timeline && (
              <Collapsible open={timelineOpen} onOpenChange={setTimelineOpen}>
                <CollapsibleTrigger asChild>
                  <Button variant="ghost" className="w-full justify-between p-0 h-auto">
                    <span className="font-medium text-foreground text-[12px]">Timeline</span>
                    {timelineOpen ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="space-y-2 mt-2">
                  <div className="text-[12px] text-muted-foreground leading-relaxed">
                    {incident.timeline}
                  </div>
                </CollapsibleContent>
              </Collapsible>
            )}

            {/* Policy Notes (collapsible) */}
            {incident.policy && (
              <Collapsible open={policyOpen} onOpenChange={setPolicyOpen}>
                <CollapsibleTrigger asChild>
                  <Button variant="ghost" className="w-full justify-between p-0 h-auto">
                    <span className="font-medium text-foreground text-[12px]">Policy Notes</span>
                    {policyOpen ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="space-y-2 mt-2">
                  <div className="text-[12px] text-muted-foreground leading-relaxed">
                    {incident.policy}
                  </div>
                </CollapsibleContent>
              </Collapsible>
            )}

            {/* Timestamps */}
            <div className="text-[11px] text-muted-foreground space-y-1 pt-2 border-t">
              <div>Created: {formatCreatedDate(incident.createdAt)}</div>
              {incident.updatedAt !== incident.createdAt && (
                <div>Updated: {formatUpdatedDate(incident.updatedAt)}</div>
              )}
            </div>
          </div>

          {/* Sticky Footer */}
          <div className="p-4 pt-2 border-t bg-background/95 backdrop-blur-sm sticky bottom-0">
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant="outline"
                size="sm"
                className="h-8 text-[12px]"
                onClick={handleViewFull}
              >
                <Eye className="h-3 w-3 mr-1" />
                View Full
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-8 text-[12px]"
                onClick={() => handleAction(() => onEdit(incident))}
              >
                <Edit className="h-3 w-3 mr-1" />
                Edit
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-8 text-[12px]"
                onClick={() => handleAction(() => onExport(incident))}
              >
                <Download className="h-3 w-3 mr-1" />
                Export
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-8 text-[12px] text-destructive hover:text-destructive"
                onClick={() => handleAction(() => onDelete(incident.id))}
              >
                <Trash2 className="h-3 w-3 mr-1" />
                Delete
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Legacy Full Modal */}
      <ViewIncidentModal
        incident={incident}
        open={showFullModal}
        onOpenChange={setShowFullModal}
      />
    </>
  );
};