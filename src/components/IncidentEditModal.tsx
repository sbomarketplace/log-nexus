import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Calendar, MapPin, Users, Tag, Save, X } from 'lucide-react';

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

interface IncidentEditModalProps {
  isOpen: boolean;
  incident: ParsedIncident | null;
  index: number;
  onClose: () => void;
  onSave: (index: number, incident: ParsedIncident) => void;
}

const INCIDENT_CATEGORIES = [
  'Harassment',
  'Safety Violation',
  'Wrongful Accusation',
  'Favoritism',
  'Retaliation',
  'Disciplinary Action', 
  'Workplace Conflict',
  'Policy Violation',
  'Work Environment',
  'Other'
];

export const IncidentEditModal: React.FC<IncidentEditModalProps> = ({
  isOpen,
  incident,
  index,
  onClose,
  onSave
}) => {
  const [editedIncident, setEditedIncident] = React.useState<ParsedIncident>({});

  React.useEffect(() => {
    if (incident) {
      setEditedIncident({ ...incident });
    }
  }, [incident]);

  const updateField = (field: keyof ParsedIncident, value: any) => {
    setEditedIncident(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = () => {
    if (editedIncident.title?.trim()) {
      onSave(index, editedIncident);
      onClose();
    }
  };

  const formatDateCategory = () => {
    const date = editedIncident.date ? new Date(editedIncident.date).toLocaleDateString('en-US', { month: 'numeric', day: 'numeric' }) : '';
    const category = editedIncident.category || 'Incident';
    return date ? `${date} — ${category}` : category;
  };

  if (!incident) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl shadow-2xl border-0 bg-background/95 backdrop-blur-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Edit Incident: {formatDateCategory()}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Title - Required Field */}
          <div className="space-y-1">
            <Label className="text-xs font-medium text-destructive">Title *</Label>
            <Input
              value={editedIncident.title || ''}
              onChange={(e) => updateField('title', e.target.value)}
              placeholder="Enter incident title (required)"
              className="text-sm"
              required
            />
          </div>

          {/* Category */}
          <div className="space-y-1">
            <Label className="text-xs font-medium flex items-center gap-1">
              <Tag className="h-3 w-3" />
              Category
            </Label>
            <Select 
              value={editedIncident.category || ''} 
              onValueChange={(value) => updateField('category', value)}
            >
              <SelectTrigger className="text-sm">
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                {INCIDENT_CATEGORIES.map((category) => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Date and Time */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs font-medium">Date</Label>
              <Input
                type="date"
                value={editedIncident.date || ''}
                onChange={(e) => updateField('date', e.target.value)}
                className="text-sm"
              />
            </div>
            
            <div className="space-y-1">
              <Label className="text-xs font-medium">Time</Label>
              <Input
                type="time"
                value={editedIncident.time || ''}
                onChange={(e) => updateField('time', e.target.value)}
                className="text-sm"
              />
            </div>
          </div>

          {/* Location */}
          <div className="space-y-1">
            <Label className="text-xs font-medium flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              Location
            </Label>
            <Input
              value={editedIncident.location || ''}
              onChange={(e) => updateField('location', e.target.value)}
              placeholder="Room, area, or department"
              className="text-sm"
            />
          </div>
          
          {/* People Involved (Who) */}
          <div className="space-y-1">
            <Label className="text-xs font-medium flex items-center gap-1">
              <Users className="h-3 w-3" />
              Who (People Involved)
            </Label>
            <Input
              value={editedIncident.peopleInvolved?.join(', ') || ''}
              onChange={(e) => updateField('peopleInvolved', 
                e.target.value.split(',').map(p => p.trim()).filter(p => p)
              )}
              placeholder="Enter names separated by commas"
              className="text-sm"
            />
          </div>

          {/* Witnesses */}
          <div className="space-y-1">
            <Label className="text-xs font-medium">Witnesses</Label>
            <Input
              value={editedIncident.witnesses?.map(w => w.name).join(', ') || ''}
              onChange={(e) => {
                const names = e.target.value.split(',').map(n => n.trim()).filter(n => n);
                updateField('witnesses', names.map(name => ({ name })));
              }}
              placeholder="Enter witness names separated by commas"
              className="text-sm"
            />
          </div>
          
          {/* What (Summary) */}
          <div className="space-y-1">
            <Label className="text-xs font-medium">What (Summary)</Label>
            <Textarea
              value={editedIncident.summary || editedIncident.what || ''}
              onChange={(e) => {
                updateField('summary', e.target.value);
                updateField('what', e.target.value);
              }}
              placeholder="Brief summary of what happened"
              rows={3}
              className="text-sm"
            />
          </div>
          
          {/* Where (Location Details) */}
          <div className="space-y-1">
            <Label className="text-xs font-medium">Where (Location Details)</Label>
            <Textarea
              value={editedIncident.where || ''}
              onChange={(e) => updateField('where', e.target.value)}
              placeholder="Detailed description of where the incident occurred"
              rows={2}
              className="text-sm"
            />
          </div>

          {/* Notes */}
          <div className="space-y-1">
            <Label className="text-xs font-medium">Additional Notes</Label>
            <Textarea
              value={editedIncident.notes || ''}
              onChange={(e) => updateField('notes', e.target.value)}
              placeholder="Any additional context or notes"
              rows={3}
              className="text-sm"
            />
          </div>
          
          {/* Preview badges */}
          <div className="flex flex-wrap gap-1">
            {editedIncident.date && (
              <Badge variant="secondary" className="text-xs">
                📅 {new Date(editedIncident.date).toLocaleDateString()}
              </Badge>
            )}
            {editedIncident.location && (
              <Badge variant="outline" className="text-xs">
                📍 {editedIncident.location}
              </Badge>
            )}
            {editedIncident.category && (
              <Badge variant="default" className="text-xs">
                🏷️ {editedIncident.category}
              </Badge>
            )}
            {editedIncident.peopleInvolved && editedIncident.peopleInvolved.length > 0 && (
              <Badge variant="outline" className="text-xs">
                👥 {editedIncident.peopleInvolved.length} people
              </Badge>
            )}
          </div>
          
          {/* Action buttons */}
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={onClose}>
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
            <Button 
              onClick={handleSave} 
              disabled={!editedIncident.title?.trim()}
              className="bg-primary text-primary-foreground"
            >
              <Save className="h-4 w-4 mr-2" />
              Save Changes
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default IncidentEditModal;