import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Eye, Edit, Download, Trash2 } from 'lucide-react';
import { OrganizedIncident } from '@/utils/organizedIncidentStorage';
import { CompactIncidentModal } from './CompactIncidentModal';

interface CompactIncidentCardProps {
  incident: OrganizedIncident;
  onEdit: (incident: OrganizedIncident) => void;
  onExport: (incident: OrganizedIncident) => void;
  onDelete: (id: string) => void;
}

export const CompactIncidentCard = ({ 
  incident, 
  onEdit, 
  onExport, 
  onDelete 
}: CompactIncidentCardProps) => {
  const [showModal, setShowModal] = useState(false);

  const handleCardClick = (e: React.MouseEvent) => {
    // Don't open modal if clicking on action buttons
    if ((e.target as HTMLElement).closest('button')) {
      return;
    }
    setShowModal(true);
  };

  const formatCreatedDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    });
  };

  return (
    <>
      <Card 
        className="h-[130px] cursor-pointer transition-all duration-200 hover:shadow-md hover:border-accent/50"
        onClick={handleCardClick}
      >
        <CardContent className="p-3 h-full flex flex-col justify-between">
          {/* Row 1: Chips + Summary */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant="secondary" className="text-[11px] h-[22px] px-2">
                {incident.date}
              </Badge>
              <Badge variant="outline" className="text-[11px] h-[22px] px-2">
                {incident.categoryOrIssue}
              </Badge>
            </div>
            
            <h3 
              className="text-sm font-semibold line-clamp-2 leading-tight" 
              title={incident.what}
            >
              {incident.what}
            </h3>
          </div>

          {/* Row 2: Meta Grid + Actions */}
          <div className="flex items-end justify-between gap-2">
            <div className="flex-1 min-w-0 space-y-1">
              {/* Meta row */}
              <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-[12px] text-muted-foreground">
                <div className="flex items-center gap-1">
                  <span className="font-medium shrink-0">Who:</span>
                  <span className="truncate" title={incident.who}>
                    {incident.who}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="font-medium shrink-0">Where:</span>
                  <span className="truncate" title={incident.where}>
                    {incident.where}
                  </span>
                </div>
                <div className="flex items-center gap-1 col-span-2">
                  <span className="font-medium shrink-0">When:</span>
                  <span className="truncate" title={incident.when}>
                    {incident.when || "Time Unspecified"}
                  </span>
                </div>
              </div>
              
              {/* Timestamp */}
              <div className="text-[11px] text-muted-foreground">
                Created: {formatCreatedDate(incident.createdAt)}
              </div>
            </div>

            {/* Compact Actions */}
            <div className="flex gap-1 shrink-0">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowModal(true);
                }}
                title="View Details"
                aria-label="View incident details"
              >
                <Eye className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit(incident);
                }}
                title="Edit"
                aria-label="Edit incident"
              >
                <Edit className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={(e) => {
                  e.stopPropagation();
                  onExport(incident);
                }}
                title="Export"
                aria-label="Export incident"
              >
                <Download className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-destructive hover:text-destructive"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(incident.id);
                }}
                title="Delete"
                aria-label="Delete incident"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <CompactIncidentModal
        incident={incident}
        open={showModal}
        onOpenChange={setShowModal}
        onEdit={onEdit}
        onExport={onExport}
        onDelete={onDelete}
      />
    </>
  );
};