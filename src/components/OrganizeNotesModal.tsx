import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { IncidentEvent } from '@/types/incidents';
import { OrganizedIncident, organizedIncidentStorage } from '@/utils/organizedIncidentStorage';
import { X, Loader2 } from 'lucide-react';

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

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [open]);

  // Handle Escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && open) {
        resetModal();
      }
    };

    if (open) {
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [open]);

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
        description: "Failed to organize notes. Please try again.",
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

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      resetModal();
    }
  };

  if (!open) {
    return (
      <Button 
        variant="outline" 
        className="border-primary text-primary hover:bg-primary/10"
        onClick={() => setOpen(true)}
      >
        📝 Organize Notes
      </Button>
    );
  }

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/45 backdrop-blur-[2px] z-50"
        onClick={handleBackdropClick}
        style={{ backdropFilter: 'blur(2px)' }}
      />
      
      {/* Modal Container */}
      <div 
        className="fixed inset-0 z-50 grid place-items-center p-3 sm:p-6"
        role="dialog" 
        aria-modal="true"
        aria-labelledby="organize-notes-title"
      >
        <div className="w-full max-w-[720px] bg-background rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.18)] p-5 sm:p-6 max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <h2 id="organize-notes-title" className="text-xl font-semibold">
              Organize Incident Notes
            </h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={resetModal}
              className="rounded-full w-8 h-8 p-0"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>

          <p className="text-sm text-muted-foreground mb-6">
            Paste your raw notes below. We'll organize them into clearly labeled incidents.
          </p>

          {!showResults ? (
            <div className="space-y-6">
              <div>
                <Label htmlFor="raw-notes" className="text-sm font-medium mb-2 block">
                  Raw Notes
                </Label>
                <Textarea
                  id="raw-notes"
                  placeholder="Paste your raw incident notes here... Be sure to include Who, What, When, Where, Why, and How to capture the full details."
                  value={rawNotes}
                  onChange={(e) => setRawNotes(e.target.value)}
                  className="min-h-[220px] w-full rounded-xl border border-border focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
                  autoFocus
                />
              </div>
              
              <div className="flex gap-3 pt-4">
                <Button 
                  onClick={handleOrganizeNotes}
                  disabled={isProcessing}
                  className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-xl px-6 min-w-[140px]"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Organizing…
                    </>
                  ) : (
                    'Organize Now'
                  )}
                </Button>
                <Button 
                  variant="outline" 
                  onClick={resetModal}
                  className="rounded-xl px-6"
                >
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium">
                  Organized Incidents ({organizedIncidents.length})
                </h3>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleStartOver}
                  className="rounded-xl"
                >
                  Start Over
                </Button>
              </div>
              
              <div className="space-y-4 max-h-[400px] overflow-y-auto">
                {organizedIncidents.map((incident, index) => (
                  <Card key={index} className="border rounded-xl">
                    <CardContent className="p-4">
                      <div className="space-y-3">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant="secondary" className="text-xs rounded-lg">
                            📅 {incident.date}
                          </Badge>
                          <Badge variant="outline" className="text-xs rounded-lg">
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

              <div className="flex gap-3 pt-4 border-t">
                <Button 
                  onClick={handleSaveIncidents}
                  className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-xl px-6"
                >
                  Save All Incidents
                </Button>
                <Button 
                  variant="outline" 
                  onClick={resetModal}
                  className="rounded-xl px-6"
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};