import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { organizeNotes } from '@/services/organizer';
import { Incident, OrganizedIncident } from '@/types/incidents';
import { incidentService } from '@/services/incidents';
import { IncidentRecord } from '@/types/incidents';
import { X, Loader2, FolderOpen, Edit, Save, Download, Trash2 } from 'lucide-react';

interface OrganizeNotesModalProps {
  onOrganizeComplete: () => void;
}

export const OrganizeNotesModal = ({ onOrganizeComplete }: OrganizeNotesModalProps) => {
  const [open, setOpen] = useState(false);
  const [rawNotes, setRawNotes] = useState('');
  const [organizedIncidents, setOrganizedIncidents] = useState<OrganizedIncident[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingIncident, setEditingIncident] = useState<string | null>(null);
  const [editingData, setEditingData] = useState<OrganizedIncident | null>(null);
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
    setError(null);
    try {
      const incidents = await organizeNotes(rawNotes.trim());
      
      if (incidents.length === 0) {
        setError('No incidents could be organized. Please review your notes and try again.');
        return;
      }
      
      // Convert Incident to OrganizedIncident format
      const converted = incidents.map(incident => ({
        date: incident.date,
        categoryOrIssue: incident.category,
        who: incident.who,
        what: incident.what,
        where: incident.where,
        when: incident.when,
        witnesses: incident.witnesses,
        notes: incident.notes,
      }));
      
      setOrganizedIncidents(converted);
      setShowResults(true);
      
      toast({
        title: "Notes Organized",
        description: `Successfully organized ${incidents.length} incident${incidents.length !== 1 ? 's' : ''}.`,
      });
    } catch (error) {
      console.error('Error organizing notes:', error);
      const errorMessage = error instanceof Error ? error.message : 'We couldn\'t organize these notes. Please try again.';
      setError(errorMessage);
      
      // Keep the raw notes in the textarea so nothing is lost
      // No need to clear rawNotes here
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSaveIncident = async (incident: OrganizedIncident) => {
    try {
      const incidentRecord: IncidentRecord = {
        id: crypto.randomUUID(),
        created_at: new Date().toISOString(),
        events: [{
          date: incident.date,
          category: incident.categoryOrIssue,
          who: incident.who,
          what: incident.what,
          where: incident.where,
          when: incident.when,
          witnesses: incident.witnesses,
          notes: incident.notes
        }]
      };
      
      await incidentService.createIncident(incidentRecord);
      
      // Remove from preview
      setOrganizedIncidents(prev => prev.filter(inc => inc !== incident));
      
      toast({
        title: "Incident saved",
        description: "The incident has been saved successfully.",
      });
      
      // If no more incidents, close modal and refresh
      if (organizedIncidents.length === 1) {
        resetModal();
        onOrganizeComplete();
      }
    } catch (error) {
      console.error('Error saving incident:', error);
      toast({
        title: "Error",
        description: "Failed to save incident. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleSaveAllIncidents = async () => {
    try {
      for (const incident of organizedIncidents) {
        const incidentRecord: IncidentRecord = {
          id: crypto.randomUUID(),
          created_at: new Date().toISOString(),
          events: [{
            date: incident.date,
            category: incident.categoryOrIssue,
            who: incident.who,
            what: incident.what,
            where: incident.where,
            when: incident.when,
            witnesses: incident.witnesses,
            notes: incident.notes
          }]
        };
        
        await incidentService.createIncident(incidentRecord);
      }
      
      toast({
        title: "Incidents saved",
        description: `${organizedIncidents.length} incidents have been saved successfully.`,
      });
      
      resetModal();
      onOrganizeComplete();
    } catch (error) {
      console.error('Error saving incidents:', error);
      toast({
        title: "Error",
        description: "Failed to save incidents. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleEditIncident = (incident: OrganizedIncident) => {
    setEditingIncident(organizedIncidents.indexOf(incident).toString());
    setEditingData({ ...incident });
  };

  const handleSaveEdit = () => {
    if (editingData && editingIncident !== null) {
      const index = parseInt(editingIncident);
      setOrganizedIncidents(prev => prev.map((inc, i) => i === index ? editingData : inc));
      setEditingIncident(null);
      setEditingData(null);
    }
  };

  const handleCancelEdit = () => {
    setEditingIncident(null);
    setEditingData(null);
  };

  const handleExportIncident = (incident: OrganizedIncident) => {
    const content = `📅 ${incident.date} — ${incident.categoryOrIssue}
Who: ${incident.who}
What: ${incident.what}
Where: ${incident.where}
When: ${incident.when}
Witnesses: ${incident.witnesses}
Notes: ${incident.notes}`;

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `incident-${incident.date}-${incident.categoryOrIssue.toLowerCase().replace(/\s+/g, '-')}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleDeleteIncident = (incident: OrganizedIncident) => {
    setOrganizedIncidents(prev => prev.filter(inc => inc !== incident));
    
    // If no more incidents, go back to input view
    if (organizedIncidents.length === 1) {
      setShowResults(false);
    }
  };

  const resetModal = () => {
    setRawNotes('');
    setOrganizedIncidents([]);
    setShowResults(false);
    setError(null);
    setEditingIncident(null);
    setEditingData(null);
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
        className="bg-[hsl(214,100%,50%)] text-white hover:bg-[hsl(214,100%,45%)] active:bg-[hsl(214,100%,40%)] rounded-lg px-4 py-2 text-sm font-medium"
        onClick={() => setOpen(true)}
        aria-label="Organize incident notes using AI"
      >
        <FolderOpen className="w-4 h-4 mr-2" aria-hidden="true" />
        Organize Notes
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
              
              {error && (
                <div className="mt-4 p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
                  <p className="text-destructive text-sm font-medium">
                    {error.includes('quota') ? 
                      "We couldn't organize these notes because the AI quota is exhausted. Please add credits and try again." : 
                      error
                    }
                  </p>
                </div>
              )}
              
              <div className="flex gap-3 pt-4 justify-center">
                <Button 
                  onClick={handleOrganizeNotes}
                  disabled={isProcessing || !rawNotes.trim()}
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

              {organizedIncidents.length > 1 && (
                <div className="flex justify-center">
                  <Button 
                    onClick={handleSaveAllIncidents}
                    className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-xl px-6"
                  >
                    Save All ({organizedIncidents.length}) Incidents
                  </Button>
                </div>
              )}
              
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
                            {incident.categoryOrIssue}
                          </Badge>
                        </div>
                        
                        {editingIncident === index.toString() && editingData ? (
                          <div className="space-y-3">
                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <Label className="text-xs">Date</Label>
                                <Input 
                                  value={editingData.date}
                                  onChange={(e) => setEditingData({...editingData, date: e.target.value})}
                                  className="h-8 text-xs"
                                />
                              </div>
                              <div>
                                <Label className="text-xs">Category</Label>
                                <Input 
                                  value={editingData.categoryOrIssue}
                                  onChange={(e) => setEditingData({...editingData, categoryOrIssue: e.target.value})}
                                  className="h-8 text-xs"
                                />
                              </div>
                            </div>
                            <div>
                              <Label className="text-xs">Who</Label>
                              <Input 
                                value={editingData.who}
                                onChange={(e) => setEditingData({...editingData, who: e.target.value})}
                                className="h-8 text-xs"
                              />
                            </div>
                            <div>
                              <Label className="text-xs">What</Label>
                              <Textarea 
                                value={editingData.what}
                                onChange={(e) => setEditingData({...editingData, what: e.target.value})}
                                className="min-h-[60px] text-xs"
                              />
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <Label className="text-xs">Where</Label>
                                <Input 
                                  value={editingData.where}
                                  onChange={(e) => setEditingData({...editingData, where: e.target.value})}
                                  className="h-8 text-xs"
                                />
                              </div>
                              <div>
                                <Label className="text-xs">When</Label>
                                <Input 
                                  value={editingData.when}
                                  onChange={(e) => setEditingData({...editingData, when: e.target.value})}
                                  className="h-8 text-xs"
                                />
                              </div>
                            </div>
                            <div>
                              <Label className="text-xs">Witnesses</Label>
                              <Input 
                                value={editingData.witnesses}
                                onChange={(e) => setEditingData({...editingData, witnesses: e.target.value})}
                                className="h-8 text-xs"
                              />
                            </div>
                            <div>
                              <Label className="text-xs">Notes</Label>
                              <Textarea 
                                value={editingData.notes}
                                onChange={(e) => setEditingData({...editingData, notes: e.target.value})}
                                className="min-h-[60px] text-xs"
                              />
                            </div>
                            <div className="flex gap-2 pt-2">
                              <Button 
                                onClick={handleSaveEdit}
                                size="sm"
                                className="bg-green-600 text-white hover:bg-green-700"
                              >
                                <Save className="h-3 w-3 mr-1" />
                                Save
                              </Button>
                              <Button 
                                onClick={handleCancelEdit}
                                size="sm"
                                variant="outline"
                              >
                                Cancel
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <>
                            <div className="text-sm space-y-1">
                              <div><strong>Who:</strong> {incident.who}</div>
                              <div><strong>What:</strong> {incident.what}</div>
                              <div><strong>Where:</strong> {incident.where}</div>
                              <div><strong>When:</strong> {incident.when}</div>
                              <div><strong>Witnesses:</strong> {incident.witnesses}</div>
                              <div><strong>Notes:</strong> {incident.notes}</div>
                            </div>
                            <div className="flex gap-2 pt-3 border-t">
                              <Button 
                                onClick={() => handleSaveIncident(incident)}
                                size="sm"
                                className="bg-green-600 text-white hover:bg-green-700"
                              >
                                <Save className="h-3 w-3 mr-1" />
                                Save
                              </Button>
                              <Button 
                                onClick={() => handleEditIncident(incident)}
                                size="sm"
                                variant="outline"
                              >
                                <Edit className="h-3 w-3 mr-1" />
                                Edit
                              </Button>
                              <Button 
                                onClick={() => handleExportIncident(incident)}
                                size="sm"
                                variant="outline"
                              >
                                <Download className="h-3 w-3 mr-1" />
                                Export
                              </Button>
                              <Button 
                                onClick={() => handleDeleteIncident(incident)}
                                size="sm"
                                variant="outline"
                                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                              >
                                <Trash2 className="h-3 w-3 mr-1" />
                                Delete
                              </Button>
                            </div>
                          </>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <div className="flex gap-3 pt-4 border-t justify-center">
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