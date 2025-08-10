import { useState } from 'react';
import { CompactModal } from '@/components/CompactModal';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { OrganizedIncident } from '@/utils/organizedIncidentStorage';
import { Eye, Edit, Download, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ViewIncidentModalProps {
  incident: OrganizedIncident | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const ViewIncidentModal = ({ incident, open, onOpenChange }: ViewIncidentModalProps) => {
  const [showFullSummary, setShowFullSummary] = useState(false);
  const [timelineOpen, setTimelineOpen] = useState(false);
  const [policyOpen, setPolicyOpen] = useState(false);

  if (!incident) return null;

  const formatTime = (timeStr: string) => {
    if (!timeStr || timeStr.toLowerCase().includes('unspecified')) return 'Time Unspecified';
    return timeStr;
  };

  const truncateText = (text: string, maxLength: number = 150) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  const footer = (
    <div className="flex items-center justify-between gap-2">
      <div className="flex items-center gap-1">
        <Button variant="ghost" size="sm" className="h-9 px-2 text-xs">
          <Eye className="h-4 w-4" />
          <span className="hidden sm:inline ml-1">View Full</span>
        </Button>
        <Button variant="ghost" size="sm" className="h-9 px-2 text-xs">
          <Edit className="h-4 w-4" />
          <span className="hidden sm:inline ml-1">Edit</span>
        </Button>
      </div>
      <div className="flex items-center gap-1">
        <Button variant="ghost" size="sm" className="h-9 px-2 text-xs">
          <Download className="h-4 w-4" />
          <span className="hidden sm:inline ml-1">Export</span>
        </Button>
        <Button variant="ghost" size="sm" className="h-9 px-2 text-xs text-destructive hover:text-destructive">
          <Trash2 className="h-4 w-4" />
          <span className="hidden sm:inline ml-1">Delete</span>
        </Button>
      </div>
    </div>
  );

  return (
    <CompactModal
      open={open}
      onOpenChange={onOpenChange}
      title="Incident Details"
      footer={footer}
    >
      {/* Top row chips */}
      <div className="flex flex-wrap items-center gap-2 mb-3">
        <Badge variant="secondary" className="h-7 rounded-full px-2 text-xs">
          {incident.date}
        </Badge>
        <Badge variant="outline" className="h-7 rounded-full px-2 text-xs">
          {incident.categoryOrIssue}
        </Badge>
      </div>

      {/* Key facts grid */}
      <div className="space-y-2">
        <div className="grid grid-cols-1 sm:grid-cols-[96px_1fr] gap-x-3 gap-y-1">
          <h3 className="text-sm font-semibold text-foreground">Who:</h3>
          <p className="text-xs text-muted-foreground break-words" title={incident.who}>
            {truncateText(incident.who, 80)}
          </p>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-[96px_1fr] gap-x-3 gap-y-1">
          <h3 className="text-sm font-semibold text-foreground">What:</h3>
          <p className="text-xs text-muted-foreground break-words" title={incident.what}>
            {truncateText(incident.what, 80)}
          </p>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-[96px_1fr] gap-x-3 gap-y-1">
          <h3 className="text-sm font-semibold text-foreground">Where:</h3>
          <p className="text-xs text-muted-foreground break-words" title={incident.where}>
            {truncateText(incident.where, 80)}
          </p>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-[96px_1fr] gap-x-3 gap-y-1">
          <h3 className="text-sm font-semibold text-foreground">When:</h3>
          <time className="text-xs text-muted-foreground">
            {formatTime(incident.when)}
          </time>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-[96px_1fr] gap-x-3 gap-y-1">
          <h3 className="text-sm font-semibold text-foreground">Witnesses:</h3>
          <p className="text-xs text-muted-foreground break-words" title={incident.witnesses}>
            {truncateText(incident.witnesses, 80)}
          </p>
        </div>
      </div>

      {/* Incident Summary */}
      <div className="border-t border-border pt-3 mt-3">
        <h3 className="text-sm font-semibold text-foreground mb-2">Incident Summary</h3>
        <div className="space-y-2">
          <p className={cn(
            "text-xs text-muted-foreground whitespace-pre-wrap leading-relaxed",
            !showFullSummary && "line-clamp-3"
          )}>
            {incident.notes}
          </p>
          {incident.notes.length > 150 && (
            <button
              onClick={() => setShowFullSummary(!showFullSummary)}
              className="text-xs text-accent hover:text-accent/80 font-medium"
            >
              {showFullSummary ? 'Show less' : 'Show more'}
            </button>
          )}
        </div>
      </div>

      {/* Timeline (collapsible) */}
      {incident.timeline && (
        <div className="border-t border-border pt-3 mt-3">
          <button
            onClick={() => setTimelineOpen(!timelineOpen)}
            className="flex items-center justify-between w-full text-left"
            aria-expanded={timelineOpen}
          >
            <h3 className="text-sm font-semibold text-foreground">Timeline</h3>
            {timelineOpen ? (
              <ChevronUp className="h-4 w-4 text-muted-foreground" />
            ) : (
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            )}
          </button>
          {timelineOpen && (
            <div className="mt-2 space-y-1">
              <p className="text-xs text-muted-foreground whitespace-pre-wrap leading-relaxed">
                {incident.timeline}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Policy Notes (collapsible) */}
      {incident.policy && (
        <div className="border-t border-border pt-3 mt-3">
          <button
            onClick={() => setPolicyOpen(!policyOpen)}
            className="flex items-center justify-between w-full text-left"
            aria-expanded={policyOpen}
          >
            <h3 className="text-sm font-semibold text-foreground">Policy Notes</h3>
            {policyOpen ? (
              <ChevronUp className="h-4 w-4 text-muted-foreground" />
            ) : (
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            )}
          </button>
          {policyOpen && (
            <div className="mt-2">
              <p className="text-xs text-muted-foreground whitespace-pre-wrap leading-relaxed">
                {incident.policy}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Timestamps */}
      <div className="border-t border-border pt-3 mt-3 text-xs text-muted-foreground space-y-1">
        <div>Created: {new Date(incident.createdAt).toLocaleString()}</div>
        <div>Last Updated: {new Date(incident.updatedAt).toLocaleString()}</div>
      </div>
    </CompactModal>
  );
};