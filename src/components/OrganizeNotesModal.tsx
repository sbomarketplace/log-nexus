import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { organizeNotes } from '@/services/organizer';
import { StructuredIncident } from '@/types/structured-incidents';
import { adaptApiToStructuredIncident } from '@/utils/incidentAdapter';
import { organizedIncidentStorage } from '@/utils/organizedIncidentStorage';
import { getDateSafely, sanitizeIncidentArray } from '@/utils/safeDate';
import { processIncident } from '@/services/incidentProcessor';
import { X, Loader2, FolderOpen, Edit, Save, Download, Trash2 } from 'lucide-react';

interface OrganizeNotesModalProps {
  onOrganizeComplete: () => void;
}

export const OrganizeNotesModal = ({ onOrganizeComplete }: OrganizeNotesModalProps) => {
  const [open, setOpen] = useState(false);
  const [rawNotes, setRawNotes] = useState('');
  const [organizedIncidents, setOrganizedIncidents] = useState<StructuredIncident[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [error, setError] = useState<string | null>(null);
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
      const apiIncidents = await organizeNotes(rawNotes.trim());
      
      if (apiIncidents.length === 0) {
        setError('No incidents could be organized. Please review your notes and try again.');
        return;
      }
      
      const structuredIncidents = apiIncidents.map(adaptApiToStructuredIncident);
      setOrganizedIncidents(structuredIncidents);
      setShowResults(true);
      
      toast({
        title: "Notes Organized",
        description: `Successfully organized ${structuredIncidents.length} incident${structuredIncidents.length !== 1 ? 's' : ''}.`,
      });
    } catch (error) {
      console.error('Error organizing notes - Full payload:', error);
      
      // Check if it's a quota error
      let errorMessage = 'We couldn\'t organize these notes. Please try again in a minute.';
      
      if (error instanceof Error) {
        const message = error.message.toLowerCase();
        if (message.includes('quota') || message.includes('insufficient_quota')) {
          errorMessage = 'We couldn\'t organize notes because the AI quota is exhausted. Add credits or raise your OpenAI monthly limit, then try again.';
        } else {
          errorMessage = error.message;
        }
      }
      
      setError(errorMessage);
      
      // Keep the raw notes in the textarea so nothing is lost
      // No need to clear rawNotes here
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSaveIncident = async (incident: StructuredIncident) => {
    try {
      // Convert StructuredIncident to OrganizedIncident for home page storage
      const organizedIncident = {
        id: crypto.randomUUID(),
        date: getDateSafely(incident, 'Unknown'),
        categoryOrIssue: incident.category,
        who: Object.values(incident.who).flat().join(", "),
        what: incident.whatHappened,
        where: incident.where || "None noted",
        when: incident.timeline?.map(t => `${t.time || 'Time unspecified'}: ${t.event}`).join("; ") || "Time unspecified",
        witnesses: incident.witnesses?.join(", ") || "",
        notes: `${incident.notes?.join(" ") || ""} | Timeline: ${incident.timeline?.map(t => `${t.time || 'Time unspecified'}: ${t.event}`).join("; ") || ""} | Requests: ${incident.requestsAndResponses?.map(r => `${r.request} - ${r.response}${r.byWhom ? ` by ${r.byWhom}` : ''}`).join("; ") || ""} | Policy: ${incident.policyOrProcedure?.join("; ") || ""} | Evidence: ${incident.evidenceOrTests?.map(e => `${e.type}: ${e.detail || ''} (${e.status || 'unknown'})`).join("; ") || ""}`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      // Save to the same storage system that home page uses (fast parsing)
      const processedIncident = await processIncident(organizedIncident, {
        authorPerspective: 'first_person',
        rawNotes: rawNotes,
        improveGrammar: false
      });
      
      organizedIncidentStorage.save(processedIncident);
      
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
      // Convert and process all incidents with grammar improvement
      const processedIncidents = await Promise.all(organizedIncidents.map(async (incident) => {
        const organizedIncident = {
          id: crypto.randomUUID(),
          date: getDateSafely(incident, 'Unknown'),
          categoryOrIssue: incident.category,
          who: Object.values(incident.who).flat().join(", "),
          what: incident.whatHappened,
          where: incident.where || "None noted",
          when: incident.timeline?.map(t => `${t.time || 'Time unspecified'}: ${t.event}`).join("; ") || "Time unspecified",
          witnesses: incident.witnesses?.join(", ") || "",
          notes: `${incident.notes?.join(" ") || ""} | Timeline: ${incident.timeline?.map(t => `${t.time || 'Time unspecified'}: ${t.event}`).join("; ") || ""} | Requests: ${incident.requestsAndResponses?.map(r => `${r.request} - ${r.response}${r.byWhom ? ` by ${r.byWhom}` : ''}`).join("; ") || ""} | Policy: ${incident.policyOrProcedure?.join("; ") || ""} | Evidence: ${incident.evidenceOrTests?.map(e => `${e.type}: ${e.detail || ''} (${e.status || 'unknown'})`).join("; ") || ""}`,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        
        return await processIncident(organizedIncident, {
          authorPerspective: 'first_person',
          rawNotes: rawNotes,
          improveGrammar: false
        });
      }));
      
      // Save all to the same storage system that home page uses
      organizedIncidentStorage.saveMultiple(processedIncidents);
      
      toast({
        title: "Incidents saved",
        description: `${organizedIncidents.length} incidents have been saved successfully with improved grammar.`,
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

  const handleExportIncident = (incident: StructuredIncident) => {
    const content = `${getDateSafely(incident, 'Unknown')} — ${incident.category}

Who:
- Accused: ${incident.who.accused?.join(', ') || 'None'}
- Accusers: ${incident.who.accusers?.join(', ') || 'None'}
- Managers: ${incident.who.managers?.join(', ') || 'None'}
- Union Stewards: ${incident.who.unionStewards?.join(', ') || 'None'}
- Security: ${incident.who.security?.join(', ') || 'None'}
- Others: ${incident.who.others?.join(', ') || 'None'}

What Happened: ${incident.whatHappened}
Where: ${incident.where || 'None noted'}

Timeline:
${incident.timeline?.map(t => `• ${t.time || 'Time unspecified'}: ${t.event}${t.quotes?.length ? `\n  Quotes: ${t.quotes.join('; ')}` : ''}`).join('\n') || 'No timeline available'}

Requests & Responses:
${incident.requestsAndResponses?.map(r => `• ${r.request} - ${r.response}${r.byWhom ? ` by ${r.byWhom}` : ''}`).join('\n') || 'None'}

Policy/Procedure:
${incident.policyOrProcedure?.map(p => `• ${p}`).join('\n') || 'None'}

Evidence/Tests:
${incident.evidenceOrTests?.map(e => `• ${e.type}: ${e.detail || ''} (${e.status || 'unknown'})`).join('\n') || 'None'}

Witnesses: ${incident.witnesses?.join(', ') || 'None'}
Outcome/Next: ${incident.outcomeOrNext || 'None noted'}

Incident Summary:
${incident.notes?.map(n => `• ${n}`).join('\n') || 'None'}`;

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `incident-${getDateSafely(incident, 'unknown')}-${incident.category.toLowerCase().replace(/\s+/g, '-')}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleDeleteIncident = (incident: StructuredIncident) => {
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
        id="btn-organize-notes"
        aria-describedby="hint-organize-notes"
        className="w-full h-11 rounded-xl font-semibold bg-[hsl(214,100%,50%)] text-white transition-all duration-200 hover:bg-[hsl(214,100%,50%)] hover:scale-[1.02] hover:shadow-lg active:scale-[0.98]"
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
                  placeholder="Paste your raw incident notes here… Include Who, What, When, Where, Why, and How; list times (e.g., 8:00 AM, 9:25 AM), quotes, requests made/denied, policies involved, and all people present."
                  value={rawNotes}
                  onChange={(e) => setRawNotes(e.target.value)}
                  className="min-h-[220px] w-full rounded-xl border border-border focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
                  autoFocus
                />
              </div>
              
              {error && (
                <div className="mt-4 p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
                  <p className="text-destructive text-sm font-medium">
                    {error}
                  </p>
                  <a 
                    href="https://supabase.com/dashboard/project/higuokkqenvesmexzozx/functions/organize-incidents/logs" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-xs text-muted-foreground hover:text-foreground underline mt-1 inline-block"
                  >
                    View function logs
                  </a>
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
                        <div className="space-y-4 text-left">
                           {/* Header */}
                           <div className="mb-4">
                             <h3 className="text-sm font-semibold">
                               Date — {getDateSafely(incident, 'Unknown')} — {incident.category || 'Uncategorized'}
                             </h3>
                           </div>
                           
                            {/* Who Section */}
                            <div className="mb-4">
                              <h4 className="text-sm font-medium mb-2">Who:</h4>
                              <div className="space-y-1 text-xs">
                                <div>{incident.who.others?.join(', ') || 'No individuals specified'}</div>
                              </div>
                            </div>

                          {/* What */}
                          <div className="mb-4">
                            <h4 className="text-sm font-medium mb-2">What:</h4>
                            <p className="text-xs text-muted-foreground">{incident.whatHappened}</p>
                          </div>

                          {/* Where */}
                          <div className="mb-4">
                            <h4 className="text-sm font-medium mb-1">Where:</h4>
                            <p className="text-xs text-muted-foreground">{incident.where || 'None noted'}</p>
                          </div>

                           {/* When */}
                           <div className="mb-4">
                             <h4 className="text-sm font-medium mb-1">When:</h4>
                             <p className="text-xs text-muted-foreground">
                               {incident.timeline?.[0]?.time || 'Time unspecified'}
                             </p>
                           </div>

                            {/* Witnesses */}
                            {incident.witnesses && incident.witnesses.length > 0 && (
                              <div className="mb-4">
                                <h4 className="text-sm font-medium mb-2">Witnesses:</h4>
                                <div className="space-y-1 text-xs">
                                  <div>{incident.witnesses.join(', ')}</div>
                                </div>
                              </div>
                            )}

                           {/* Timeline */}
                           {incident.timeline?.length > 0 && (
                            <div className="mb-4">
                              <h4 className="text-sm font-medium mb-2">Timeline:</h4>
                              <div className="space-y-2">
                                {incident.timeline.map((event, eventIndex) => (
                                  <div key={eventIndex} className="text-xs">
                                    <strong>{event.time || 'Time unspecified'}</strong> - {event.event}
                                    {event.quotes && event.quotes.length > 0 && (
                                      <div className="italic mt-1 ml-4 text-xs text-muted-foreground">
                                        "{event.quotes.join('; ')}"
                                      </div>
                                    )}
                                  </div>
                                ))}
                                {incident.requestsAndResponses && incident.requestsAndResponses.length > 0 && (
                                  <>
                                    {incident.requestsAndResponses.map((req, reqIndex) => (
                                      <div key={`req-${reqIndex}`} className="text-xs">
                                        <strong>Later</strong> - {req.request} {req.response === 'denied' ? 'denied' : req.response === 'approved' ? 'approved' : req.response}{req.byWhom ? ` by ${req.byWhom}` : ''}
                                      </div>
                                    ))}
                                  </>
                                )}
                                {incident.evidenceOrTests && incident.evidenceOrTests.length > 0 && (
                                  <>
                                    {incident.evidenceOrTests.map((evidence, evidenceIndex) => (
                                      <div key={`evidence-${evidenceIndex}`} className="text-xs">
                                        <strong>Lab testing</strong> - {evidence.type}: {evidence.detail || ''} ({evidence.status || 'status unknown'})
                                      </div>
                                    ))}
                                  </>
                                )}
                              </div>
                            </div>
                          )}

                          {/* Notes Section */}
                          <div className="mb-4">
                            <h4 className="text-sm font-medium mb-2">Incident Summary:</h4>
                            <div className="space-y-1 text-xs text-muted-foreground">
                              {incident.policyOrProcedure && incident.policyOrProcedure.length > 0 && (
                                <>
                                  {incident.policyOrProcedure.map((policy, policyIndex) => (
                                    <div key={`policy-${policyIndex}`}>
                                      Policy violation: {policy}
                                    </div>
                                  ))}
                                </>
                              )}
                              {incident.outcomeOrNext && (
                                <div>Outcome: {incident.outcomeOrNext}</div>
                              )}
                              {incident.notes && incident.notes.length > 0 && (
                                <>
                                  {incident.notes.map((note, noteIndex) => (
                                    <div key={`note-${noteIndex}`}>
                                      {note}
                                    </div>
                                  ))}
                                </>
                              )}
                            </div>
                          </div>

                         {/* Action Buttons */}
                         <div className="flex gap-2 pt-3 border-t justify-center">
                           <Button 
                             onClick={() => handleSaveIncident(incident)}
                             size="sm"
                             className="bg-green-600 text-white hover:bg-green-700"
                           >
                             <Save className="h-3 w-3 mr-1" />
                             Save
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