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
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <Badge variant="secondary" className="h-7 rounded-full px-3 text-xs font-medium">
          {incident.date}
        </Badge>
        <Badge variant="outline" className="h-7 rounded-full px-3 text-xs font-medium">
          {incident.categoryOrIssue}
        </Badge>
      </div>

      {/* Title/Summary */}
      <div className="mb-6">
        <p className="text-sm text-foreground leading-relaxed">
          {incident.notes}
        </p>
      </div>

      {/* Created date */}
      <div className="text-xs text-muted-foreground">
        Created: {new Date(incident.createdAt).toLocaleDateString('en-US', { 
          month: 'short', 
          day: 'numeric',
          hour: 'numeric',
          minute: '2-digit',
          hour12: true 
        })}
      </div>
    </CompactModal>
  );
};