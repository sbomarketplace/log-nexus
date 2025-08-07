import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { X, Edit2, Calendar, MapPin, Users, Tag } from 'lucide-react';
import { parseMultipleIncidents } from '@/utils/parser';
import { toast } from '@/hooks/use-toast';

interface ParsedIncident {
  title?: string;
  date?: string;
  time?: string;
  location?: string;
  category?: string;
  peopleInvolved?: string[];
  what?: string;
  where?: string;
  why?: string;
  how?: string;
  who?: Array<{ name: string; role?: string }>;
  witnesses?: Array<{ name: string }>;
  unionInvolvement?: Array<{ name: string; union: string; notes?: string }>;
}

interface ImportNotesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (incidents: ParsedIncident[], batchTitle: string) => void;
}

const INCIDENT_CATEGORIES = [
  'Wrongful Accusation',
  'Disciplinary Action', 
  'Harassment',
  'Safety Violation',
  'Workplace Conflict',
  'Policy Violation',
  'Retaliation',
  'Work Environment',
  'Other'
];

export const ImportNotesModal: React.FC<ImportNotesModalProps> = ({ 
  isOpen, 
  onClose, 
  onImport 
}) => {
  const [rawNotes, setRawNotes] = useState('');
  const [batchTitle, setBatchTitle] = useState('');
  const [parsedIncidents, setParsedIncidents] = useState<ParsedIncident[]>([]);
  const [showReview, setShowReview] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  const handleParse = () => {
    if (!rawNotes.trim()) {
      toast({
        title: "Error",
        description: "Please enter some notes to parse.",
        variant: "destructive",
      });
      return;
    }

    if (!batchTitle.trim()) {
      toast({
        title: "Error", 
        description: "Please enter a batch title for this import.",
        variant: "destructive",
      });
      return;
    }

    try {
      const parsed = parseMultipleIncidents(rawNotes);
      
      if (parsed.length === 0) {
        toast({
          title: "No Incidents Found",
          description: "Could not parse any valid incidents from the provided notes.",
          variant: "destructive",
        });
        return;
      }

      setParsedIncidents(parsed);
      setShowReview(true);
      
      toast({
        title: "Parsing Complete",
        description: `Found ${parsed.length} incident${parsed.length > 1 ? 's' : ''} to review.`,
      });
    } catch (error) {
      toast({
        title: "Parsing Error",
        description: "There was an error parsing your notes. Please check the format and try again.",
        variant: "destructive",
      });
    }
  };

  const handleSubmitAll = () => {
    if (parsedIncidents.length === 0) {
      toast({
        title: "No Incidents",
        description: "No incidents to import.",
        variant: "destructive",
      });
      return;
    }

    onImport(parsedIncidents, batchTitle);
    handleClose();
  };

  const handleClose = () => {
    setRawNotes('');
    setBatchTitle('');
    setParsedIncidents([]);
    setShowReview(false);
    setEditingIndex(null);
    onClose();
  };

  const updateIncident = (index: number, field: keyof ParsedIncident, value: any) => {
    const updated = [...parsedIncidents];
    updated[index] = { ...updated[index], [field]: value };
    setParsedIncidents(updated);
  };

  const removeIncident = (index: number) => {
    const updated = parsedIncidents.filter((_, i) => i !== index);
    setParsedIncidents(updated);
    setEditingIndex(null);
  };

  if (showReview) {
    return (
      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit2 className="h-5 w-5" />
              Review Parsed Incidents ({parsedIncidents.length})
            </DialogTitle>
            <p className="text-sm text-muted-foreground">
              Batch: <span className="font-medium">{batchTitle}</span>
            </p>
          </DialogHeader>
          
          <div className="space-y-4">
            {parsedIncidents.map((incident, index) => (
              <Card key={index} className="relative">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      Incident {index + 1}
                    </CardTitle>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeIncident(index)}
                      className="text-destructive hover:text-destructive"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label className="text-xs font-medium">Title</Label>
                      <Input
                        value={incident.title || ''}
                        onChange={(e) => updateIncident(index, 'title', e.target.value)}
                        placeholder="Enter incident title"
                        className="text-sm"
                      />
                    </div>
                    
                    <div className="space-y-1">
                      <Label className="text-xs font-medium">Date</Label>
                      <Input
                        type="date"
                        value={incident.date || ''}
                        onChange={(e) => updateIncident(index, 'date', e.target.value)}
                        className="text-sm"
                      />
                    </div>
                    
                    <div className="space-y-1">
                      <Label className="text-xs font-medium flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        Location
                      </Label>
                      <Input
                        value={incident.location || ''}
                        onChange={(e) => updateIncident(index, 'location', e.target.value)}
                        placeholder="Room, area, or department"
                        className="text-sm"
                      />
                    </div>
                    
                    <div className="space-y-1">
                      <Label className="text-xs font-medium flex items-center gap-1">
                        <Tag className="h-3 w-3" />
                        Category
                      </Label>
                      <Select 
                        value={incident.category || ''} 
                        onValueChange={(value) => updateIncident(index, 'category', value)}
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
                  </div>
                  
                  <div className="space-y-1">
                    <Label className="text-xs font-medium flex items-center gap-1">
                      <Users className="h-3 w-3" />
                      People Involved
                    </Label>
                    <Input
                      value={incident.peopleInvolved?.join(', ') || ''}
                      onChange={(e) => updateIncident(index, 'peopleInvolved', 
                        e.target.value.split(',').map(p => p.trim()).filter(p => p)
                      )}
                      placeholder="Enter names separated by commas"
                      className="text-sm"
                    />
                  </div>
                  
                  <div className="space-y-1">
                    <Label className="text-xs font-medium">Summary</Label>
                    <Textarea
                      value={incident.what || ''}
                      onChange={(e) => updateIncident(index, 'what', e.target.value)}
                      placeholder="What happened?"
                      rows={3}
                      className="text-sm"
                    />
                  </div>
                  
                  {/* Display extracted metadata as badges */}
                  <div className="flex flex-wrap gap-1">
                    {incident.date && (
                      <Badge variant="secondary" className="text-xs">
                        {incident.date}
                      </Badge>
                    )}
                    {incident.location && (
                      <Badge variant="outline" className="text-xs">
                        📍 {incident.location}
                      </Badge>
                    )}
                    {incident.category && (
                      <Badge variant="default" className="text-xs">
                        🏷️ {incident.category}
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
            ))}
            
            <Separator />
            
            <div className="flex justify-between items-center pt-4">
              <div className="text-sm text-muted-foreground">
                {parsedIncidents.length} incident{parsedIncidents.length > 1 ? 's' : ''} ready to import
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setShowReview(false)}>
                  Back to Edit
                </Button>
                <Button onClick={handleSubmitAll} className="bg-primary text-primary-foreground">
                  Import All Incidents
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Import Raw Notes</DialogTitle>
          <p className="text-sm text-muted-foreground">
            Paste multiple incident notes below. The parser will automatically detect separate incidents by date anchors.
          </p>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="batch-title">Batch Title *</Label>
            <Input
              id="batch-title"
              value={batchTitle}
              onChange={(e) => setBatchTitle(e.target.value)}
              placeholder="e.g., 'November Notes Import' or 'Q4 Incidents'"
              className="text-sm"
            />
            <p className="text-xs text-muted-foreground">
              This helps organize your imports and can be used for filtering later.
            </p>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="import-notes">Raw Notes</Label>
            <Textarea
              id="import-notes"
              value={rawNotes}
              onChange={(e) => setRawNotes(e.target.value)}
              placeholder="11/15/23 - John was written up by supervisor Mark in the break room for being 5 minutes late.

11/16/23 - Sarah filed harassment complaint against manager Tom. Witnessed by Lisa and Mike.

11/17/23 - Safety violation in warehouse section A. Equipment malfunction caused minor injury to Alex."
              rows={12}
              className="min-h-[300px] text-sm font-mono"
            />
          </div>
          
          <div className="bg-muted/50 p-3 rounded-lg text-xs text-muted-foreground">
            <strong>Tip:</strong> The parser will automatically detect incidents by date patterns like:
            <br />• MM/DD/YY or MM/DD/YYYY
            <br />• Month Day, Year
            <br />• Date: MM/DD/YY
            <br />Each date block will become a separate incident for review.
          </div>
          
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button
              onClick={handleParse}
              disabled={!rawNotes.trim() || !batchTitle.trim()}
            >
              Parse & Review
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};