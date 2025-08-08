import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, MapPin, Users, Tag, Edit2, X } from 'lucide-react';

interface ParsedIncident {
  title?: string;
  date?: string;
  time?: string;
  location?: string;
  category?: string;
  peopleInvolved?: string[];
  summary?: string;
  what?: string;
  where?: string;
  when?: string;
  why?: string;
  how?: string;
  who?: Array<{ name: string; role?: string }>;
  witnesses?: Array<{ name: string }>;
  unionInvolvement?: Array<{ name: string; union: string; notes?: string }>;
  notes?: string;
}

interface IncidentSummaryBoxProps {
  incident: ParsedIncident;
  index: number;
  onEdit: (index: number) => void;
  onRemove: (index: number) => void;
}

export const IncidentSummaryBox: React.FC<IncidentSummaryBoxProps> = ({
  incident,
  index,
  onEdit,
  onRemove
}) => {
  const formatDateCategory = () => {
    const date = incident.date ? new Date(incident.date).toLocaleDateString('en-US', { month: 'numeric', day: 'numeric' }) : '';
    const category = incident.category || 'Incident';
    return date ? `${date} — ${category}` : category;
  };

  const getWho = () => {
    if (incident.who && incident.who.length > 0) {
      return incident.who.map(p => p.role ? `${p.name} (${p.role})` : p.name).join(', ');
    }
    if (incident.peopleInvolved && incident.peopleInvolved.length > 0) {
      return incident.peopleInvolved.join(', ');
    }
    return 'None noted';
  };

  const getWitnesses = () => {
    if (incident.witnesses && incident.witnesses.length > 0) {
      return incident.witnesses.map(w => w.name).join(', ');
    }
    return 'None noted';
  };

  return (
    <Card className="relative group hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Calendar className="h-4 w-4 text-primary" />
            {formatDateCategory()}
          </CardTitle>
          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onEdit(index)}
              className="h-8 w-8 p-0"
              title="Edit incident"
            >
              <Edit2 className="h-3 w-3" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onRemove(index)}
              className="h-8 w-8 p-0 text-destructive hover:text-destructive"
              title="Remove incident"
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-3 text-sm">
        {/* Who */}
        <div>
          <div className="flex items-center gap-1 mb-1">
            <Users className="h-3 w-3 text-muted-foreground" />
            <span className="font-medium text-xs text-muted-foreground">Who:</span>
          </div>
          <p className="text-xs leading-relaxed">{getWho()}</p>
        </div>

        {/* What */}
        <div>
          <span className="font-medium text-xs text-muted-foreground">What:</span>
          <p className="text-xs leading-relaxed mt-1">
            {incident.summary || incident.what || 'No description provided'}
          </p>
        </div>

        {/* Where */}
        <div>
          <div className="flex items-center gap-1 mb-1">
            <MapPin className="h-3 w-3 text-muted-foreground" />
            <span className="font-medium text-xs text-muted-foreground">Where:</span>
          </div>
          <p className="text-xs leading-relaxed">
            {incident.where || incident.location || 'Location not specified'}
          </p>
        </div>

        {/* When */}
        <div>
          <span className="font-medium text-xs text-muted-foreground">When:</span>
          <p className="text-xs leading-relaxed mt-1">
            {incident.date && incident.time 
              ? `${new Date(incident.date).toLocaleDateString()} at ${incident.time}`
              : incident.date 
              ? new Date(incident.date).toLocaleDateString()
              : 'Date not specified'}
          </p>
        </div>

        {/* Witnesses */}
        <div>
          <span className="font-medium text-xs text-muted-foreground">Witnesses:</span>
          <p className="text-xs leading-relaxed mt-1">{getWitnesses()}</p>
        </div>

        {/* Notes */}
        {incident.notes && (
          <div>
            <span className="font-medium text-xs text-muted-foreground">Notes:</span>
            <p className="text-xs leading-relaxed mt-1">{incident.notes}</p>
          </div>
        )}

        {/* Badges */}
        <div className="flex flex-wrap gap-1 pt-2">
          {incident.category && (
            <Badge variant="default" className="text-xs">
              <Tag className="h-2 w-2 mr-1" />
              {incident.category}
            </Badge>
          )}
          {incident.peopleInvolved && incident.peopleInvolved.length > 0 && (
            <Badge variant="outline" className="text-xs">
              👥 {incident.peopleInvolved.length} people
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default IncidentSummaryBox;