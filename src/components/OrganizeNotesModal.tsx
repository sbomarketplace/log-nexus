import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { IncidentEvent } from '@/types/incidents';
import { OrganizedIncident, organizedIncidentStorage } from '@/utils/organizedIncidentStorage';

interface OrganizeNotesModalProps {
  onOrganizeComplete: () => void;
}

export const OrganizeNotesModal = ({ onOrganizeComplete }: OrganizeNotesModalProps) => {
  const [open, setOpen] = useState(false);
  const [rawNotes, setRawNotes] = useState('');
  const [organizedIncidents, setOrganizedIncidents] = useState<IncidentEvent[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const { toast } = useToast();

  const handleOrganizeNotes = async () => {
    if (!rawNotes.trim()) {
      toast({
        title: "Missing Input",
        description: "Please enter some notes to organize.",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);
    try {
      const { data, error } = await supabase.functions.invoke('parse-incident-notes', {
        body: { rawNotes: rawNotes.trim() }
      });

      if (error) {
        throw new Error(error.message);
      }

      if (!data?.events || !Array.isArray(data.events)) {
        throw new Error('Invalid response format');
      }

      setOrganizedIncidents(data.events);
      setShowResults(true);
      
      toast({
        title: "Notes Organized",
        description: `Successfully organized ${data.events.length} incident${data.events.length !== 1 ? 's' : ''}.`,
      });
    } catch (error) {
      console.error('Error organizing notes:', error);
      toast({
        title: "Organization Failed",
        description: error instanceof Error ? error.message : "Failed to organize notes. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSaveIncidents = async () => {
    if (organizedIncidents.length === 0) return;

    try {
      const newIncidents: OrganizedIncident[] = organizedIncidents.map(event => ({
        id: crypto.randomUUID(),
        date: event.date,
        categoryOrIssue: event.category,
        who: event.who,
        what: event.what,
        where: event.where,
        when: event.when,
        witnesses: event.witnesses,
        notes: event.notes,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }));

      organizedIncidentStorage.saveMultiple(newIncidents);
      
      toast({
        title: "Incidents Saved",
        description: `Successfully saved ${organizedIncidents.length} organized incident${organizedIncidents.length !== 1 ? 's' : ''}.`,
      });

      resetModal();
      onOrganizeComplete();
    } catch (error) {
      console.error('Error saving incidents:', error);
      toast({
        title: "Save Failed",
        description: "Failed to save incidents. Please try again.",
        variant: "destructive",
      });
    }
  };

  const resetModal = () => {
    setRawNotes('');
    setOrganizedIncidents([]);
    setShowResults(false);
    setOpen(false);
  };

  const handleStartOver = () => {
    setOrganizedIncidents([]);
    setShowResults(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button 
          variant="outline" 
          className="border-primary text-primary hover:bg-primary/10"
        >
          📝 Organize Notes
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto" aria-describedby="organize-notes-description">
        <DialogHeader>
          <DialogTitle>Organize Incident Notes</DialogTitle>
        </DialogHeader>

        <div id="organize-notes-description" className="text-sm text-muted-foreground mb-4">
          Paste your raw notes below. The AI will organize them into separate, clearly labeled incidents.
        </div>

        {!showResults ? (
          <div className="space-y-4">
            <div>
              <Label htmlFor="raw-notes">Raw Notes</Label>
              <Textarea
                id="raw-notes"
                placeholder="Paste your raw incident notes here..."
                value={rawNotes}
                onChange={(e) => setRawNotes(e.target.value)}
                className="min-h-[200px] mt-2"
              />
            </div>
            <div className="flex gap-2">
              <Button 
                onClick={handleOrganizeNotes}
                disabled={isProcessing}
                className="bg-primary text-primary-foreground hover:bg-primary/90"
              >
                {isProcessing ? 'Organizing...' : 'Organize Now'}
              </Button>
              <Button variant="outline" onClick={resetModal}>
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium">Organized Incidents ({organizedIncidents.length})</h3>
              <Button variant="outline" size="sm" onClick={handleStartOver}>
                Start Over
              </Button>
            </div>
            
            <div className="space-y-4 max-h-[400px] overflow-y-auto">
              {organizedIncidents.map((incident, index) => (
                <Card key={index} className="border">
                  <CardContent className="p-4">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="secondary" className="text-xs">
                          📅 {incident.date}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {incident.category}
                        </Badge>
                      </div>
                      
                      <div className="text-sm space-y-1">
                        <div><strong>Who:</strong> {incident.who}</div>
                        <div><strong>What:</strong> {incident.what}</div>
                        <div><strong>Where:</strong> {incident.where}</div>
                        <div><strong>When:</strong> {incident.when}</div>
                        <div><strong>Witnesses:</strong> {incident.witnesses}</div>
                        <div><strong>Notes:</strong> {incident.notes}</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="flex gap-2 pt-4 border-t">
              <Button 
                onClick={handleSaveIncidents}
                className="bg-primary text-primary-foreground hover:bg-primary/90"
              >
                Save All Incidents
              </Button>
              <Button variant="outline" onClick={resetModal}>
                Cancel
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};