import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { CalendarIcon, ClockIcon, Hash } from 'lucide-react';
import { getCategoryTagClass } from '@/utils/categoryMappings';

// Ultra-compact chip component for mobile
function ChipXs({ children, icon }: { children: React.ReactNode; icon?: React.ReactNode }) {
  return (
    <span
      className="
        inline-flex items-center gap-1 rounded-full
        bg-muted/80 text-foreground/80
        px-2 py-[3px]
        chip-xs-text font-medium leading-tight
        max-w-full
      "
    >
      {icon}
      <span className="truncate chip-xs-text">{children}</span>
    </span>
  );
}

interface IncidentCardProps {
  incident: {
    id: string;
    title: string;
    date?: string;
    time?: string;
    caseNumber?: string;
    category?: string;
    what?: string;
  };
  onView: () => void;
  onDelete: () => void;
  selected?: boolean;
  onSelect?: (checked: boolean) => void;
}

export const IncidentCard = ({ 
  incident, 
  onView, 
  onDelete, 
  selected = false,
  onSelect
}: IncidentCardProps) => {
  const categoryClass = getCategoryTagClass(incident.category || '');
  
  return (
    <Card className="rounded-2xl border border-black/10 bg-card shadow-sm ring-1 ring-black/5 overflow-hidden hover:shadow-md transition-shadow">
      <CardContent className="px-3 py-2 sm:px-4 sm:py-3">
        <div className="w-full min-w-0 flex items-start gap-2">
          <Checkbox
            checked={selected}
            onCheckedChange={onSelect}
            aria-label={`Select incident ${incident.title}`}
            className="mt-0.5 flex-shrink-0 h-3.5 w-3.5"
          />
          
          <div className="min-w-0 flex-1 flex flex-col sm:flex-row sm:items-center gap-1.5 sm:gap-2">
            {/* Title - 2-line on mobile */}
            <div className="min-w-0 flex-1 text-[13px] sm:text-[14px] font-normal leading-snug
                            whitespace-normal line-clamp-2 sm:line-clamp-1 text-left">
              {incident.title || incident.what || "Untitled Incident"}
            </div>
            
            {/* Chips row - compact and responsive */}
            <div className="flex flex-wrap items-center gap-x-1.5 gap-y-1 sm:ml-auto">
              {/* Date Chip */}
              {incident.date && (
                <ChipXs icon={<CalendarIcon className="h-3.5 w-3.5" aria-hidden />}>
                  {incident.date}
                </ChipXs>
              )}

              {/* Time Chip */}
              {incident.time && (
                <ChipXs icon={<ClockIcon className="h-3.5 w-3.5" aria-hidden />}>
                  {incident.time}
                </ChipXs>
              )}

              {/* Case Chip */}
              {incident.caseNumber && (
                <ChipXs icon={<Hash className="h-3.5 w-3.5" aria-hidden />}>
                  {incident.caseNumber}
                </ChipXs>
              )}

              {/* Category Badge */}
              {incident.category && (
                <Badge className={`chip-xs-text px-2 py-[3px] ${categoryClass}`}>
                  {incident.category.length > 15 ? `${incident.category.slice(0, 12)}...` : incident.category}
                </Badge>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};