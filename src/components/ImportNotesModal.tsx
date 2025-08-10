import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { OrganizedIncident, organizedIncidentStorage } from '@/utils/organizedIncidentStorage';
import { Upload, FileText } from 'lucide-react';

interface ImportNotesModalProps {
  onImportComplete: () => void;
}

interface RawIncident {
  date: string;
  categoryOrIssue: string;
  who: string;
  what: string;
  where: string;
  when: string;
  witnesses: string;
  notes: string;
}

export const ImportNotesModal = ({ onImportComplete }: ImportNotesModalProps) => {
  const [open, setOpen] = useState(false);
  const [rawNotes, setRawNotes] = useState('');
  const [organizedIncidents, setOrganizedIncidents] = useState<RawIncident[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const { toast } = useToast();

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      toast({
        title: "File Too Large",
        description: "Please select a file smaller than 10MB.",
        variant: "destructive",
      });
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      if (content.length > 10000) {
        toast({
          title: "Content Too Long",
          description: "Please limit content to 10,000 characters.",
          variant: "destructive",
        });
        return;
      }
      setRawNotes(content);
    };

    if (file.type === 'text/plain') {
      reader.readAsText(file);
    } else {
      toast({
        title: "Unsupported File Type",
        description: "Please upload a .txt file. Other formats coming soon.",
        variant: "destructive",
      });
    }
  };

  const handleOrganizeIncidents = async () => {
    if (!rawNotes.trim()) {
      toast({
        title: "Missing Input",
        description: "Please enter some notes or upload a file to organize.",
        variant: "destructive",
      });
      return;
    }

    if (rawNotes.length > 10000) {
      toast({
        title: "Content Too Long",
        description: "Please limit content to 10,000 characters.",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);
    try {
      const systemPrompt = `You are an AI assistant that organizes raw workplace incident notes into clean, structured incident summaries. 
Each incident must be returned as its own object inside an array, following this exact JSON format:

{
  "incidents": [
    {
      "date": "string",
      "categoryOrIssue": "string",
      "who": "string",
      "what": "string",
      "where": "string",
      "when": "string",
      "witnesses": "string",
      "notes": "string"
    }
  ]
}

Rules:
- Identify and split multiple incidents based on date changes, clear context shifts, or topic changes.
- Never combine separate incidents into one summary.
- Do not fabricate or remove details; only use what is provided.
- Capitalize all names and list individuals separately with commas.
- Keep "Who", "What", "Where", "When", "Witnesses", and "Notes" in clear, full sentences.
- Use "None noted" for missing fields except date (use "Unknown" for missing dates).
- Return only valid JSON with the incidents array, no extra text.`;

      const { data, error } = await supabase.functions.invoke('openai-completion', {
        body: { 
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: rawNotes.trim() }
          ]
        }
      });

      if (error) {
        throw new Error(error.message);
      }

      if (!data?.content) {
        throw new Error('No response from AI service');
      }

      // Parse the AI response
      let parsedIncidents;
      try {
        const parsed = JSON.parse(data.content);
        parsedIncidents = parsed.incidents;
        
        if (!Array.isArray(parsedIncidents)) {
          throw new Error('Invalid response format');
        }
      } catch (parseError) {
        console.error('JSON parsing error:', parseError, 'Raw response:', data.content);
        throw new Error('Invalid AI response format');
      }

      if (parsedIncidents.length === 0) {
        toast({
          title: "No Incidents Found",
          description: "No incidents could be organized. Please review your notes and try again.",
          variant: "default",
        });
        return;
      }

      setOrganizedIncidents(parsedIncidents);
      setShowResults(true);
      
      toast({
        title: "Incidents Organized",
        description: `Successfully organized ${parsedIncidents.length} incident${parsedIncidents.length !== 1 ? 's' : ''}.`,
      });
    } catch (error) {
      console.error('Error organizing incidents:', error);
      toast({
        title: "Organization Failed",
        description: error instanceof Error ? error.message : "Error connecting to AI service. Please try again later.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSaveIncident = (incident: RawIncident, index: number) => {
    try {
      const organizedIncident: OrganizedIncident = {
        id: crypto.randomUUID(),
        date: incident.date,
        categoryOrIssue: incident.categoryOrIssue,
        who: incident.who,
        what: incident.what,
        where: incident.where,
        when: incident.when,
        witnesses: incident.witnesses,
        notes: incident.notes,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      organizedIncidentStorage.save(organizedIncident);
      
      // Remove from display
      setOrganizedIncidents(prev => prev.filter((_, i) => i !== index));
      
      toast({
        title: "Incident Saved",
        description: "The incident has been saved successfully.",
      });

      onImportComplete();
    } catch (error) {
      console.error('Error saving incident:', error);
      toast({
        title: "Save Failed",
        description: "Failed to save incident. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleSaveAll = () => {
    try {
      const newIncidents: OrganizedIncident[] = organizedIncidents.map(incident => ({
        id: crypto.randomUUID(),
        date: incident.date,
        categoryOrIssue: incident.categoryOrIssue,
        who: incident.who,
        what: incident.what,
        where: incident.where,
        when: incident.when,
        witnesses: incident.witnesses,
        notes: incident.notes,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }));

      organizedIncidentStorage.saveMultiple(newIncidents);
      
      toast({
        title: "All Incidents Saved",
        description: `Successfully saved ${organizedIncidents.length} incident${organizedIncidents.length !== 1 ? 's' : ''}.`,
      });

      resetModal();
      onImportComplete();
    } catch (error) {
      console.error('Error saving all incidents:', error);
      toast({
        title: "Save Failed",
        description: "Failed to save incidents. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteIncident = (index: number) => {
    setOrganizedIncidents(prev => prev.filter((_, i) => i !== index));
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
          variant="default" 
          className="bg-primary text-primary-foreground hover:bg-primary/90"
        >
          📂 Import Notes
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto" aria-describedby="import-notes-description">
        <DialogHeader>
          <DialogTitle>Import & Organize Incident Notes</DialogTitle>
        </DialogHeader>

        <div id="import-notes-description" className="text-sm text-muted-foreground mb-4">
          Paste your raw incident notes here. Be sure to include WHO, WHAT, WHEN, WHERE, WHY, and HOW for each event to capture the whole incident.
        </div>

        {!showResults ? (
          <div className="space-y-4">
            <div>
              <Label htmlFor="raw-notes">Raw Incident Notes</Label>
              <Textarea
                id="raw-notes"
                placeholder="Paste your raw incident notes here..."
                value={rawNotes}
                onChange={(e) => setRawNotes(e.target.value)}
                className="min-h-[200px] mt-2"
                maxLength={10000}
              />
              <div className="text-xs text-muted-foreground mt-1">
                {rawNotes.length}/10,000 characters
              </div>
            </div>

            <div className="border-t pt-4">
              <Label className="text-sm font-medium mb-2 block">Or upload a file</Label>
              <div className="flex items-center gap-2">
                <input
                  type="file"
                  accept=".txt"
                  onChange={handleFileUpload}
                  className="hidden"
                  id="file-upload"
                />
                <label htmlFor="file-upload">
                  <Button variant="outline" className="cursor-pointer" asChild>
                    <span>
                      <Upload className="w-4 h-4 mr-2" />
                      Upload File (.txt)
                    </span>
                  </Button>
                </label>
                <span className="text-xs text-muted-foreground">
                  Supports .txt files up to 10MB
                </span>
              </div>
            </div>

            <div className="flex gap-2 pt-4 border-t">
              <Button 
                onClick={handleOrganizeIncidents}
                disabled={isProcessing}
                className="bg-primary text-primary-foreground hover:bg-primary/90"
              >
                {isProcessing ? 'Organizing incidents...' : 'Organize Incidents'}
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
              <div className="flex gap-2">
                {organizedIncidents.length > 1 && (
                  <Button onClick={handleSaveAll} className="bg-primary text-primary-foreground hover:bg-primary/90">
                    Save All
                  </Button>
                )}
                <Button variant="outline" size="sm" onClick={handleStartOver}>
                  Start Over
                </Button>
              </div>
            </div>
            
            <div className="space-y-4 max-h-[400px] overflow-y-auto">
              {organizedIncidents.map((incident, index) => (
                <Card key={index} className="border">
                  <CardContent className="p-4">
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="secondary" className="text-xs">
                          {incident.date}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {incident.categoryOrIssue}
                        </Badge>
                      </div>
                      
                      <div className="text-sm space-y-2">
                        <div><strong>Who:</strong> {incident.who}</div>
                        <div><strong>What:</strong> {incident.what}</div>
                        <div><strong>Where:</strong> {incident.where}</div>
                        <div><strong>When:</strong> {incident.when}</div>
                        <div><strong>Witnesses:</strong> {incident.witnesses}</div>
                        <div><strong>Notes:</strong> {incident.notes}</div>
                      </div>

                      <div className="flex gap-2 pt-2 border-t justify-center">
                        <Button 
                          size="sm"
                          onClick={() => handleSaveIncident(incident, index)}
                          className="bg-primary text-primary-foreground hover:bg-primary/90"
                        >
                          Save
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => {
                            const content = organizedIncidentStorage.exportToText({
                              id: 'temp',
                              date: incident.date,
                              categoryOrIssue: incident.categoryOrIssue,
                              who: incident.who,
                              what: incident.what,
                              where: incident.where,
                              when: incident.when,
                              witnesses: incident.witnesses,
                              notes: incident.notes,
                              createdAt: new Date().toISOString(),
                              updatedAt: new Date().toISOString(),
                            });
                            
                            const blob = new Blob([content], { type: 'text/plain' });
                            const url = URL.createObjectURL(blob);
                            const link = document.createElement('a');
                            link.href = url;
                            link.download = `incident-${incident.date.replace(/[\/\s]/g, '-')}-${incident.categoryOrIssue.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.txt`;
                            document.body.appendChild(link);
                            link.click();
                            document.body.removeChild(link);
                            URL.revokeObjectURL(url);
                          }}
                        >
                          <FileText className="w-3 h-3 mr-1" />
                          Export
                        </Button>
                        <Button 
                          variant="destructive" 
                          size="sm"
                          onClick={() => handleDeleteIncident(index)}
                        >
                          Delete
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="flex gap-2 pt-4 border-t">
              <Button variant="outline" onClick={resetModal}>
                Close
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};