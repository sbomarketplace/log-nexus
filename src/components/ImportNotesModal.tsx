import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertIcon } from '@/components/icons/CustomIcons';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { storage } from '@/utils/storage';
import { Incident } from '@/types/incident';

interface ParsedIncident {
  date: string;
  category: string;
  who: string;
  what: string;
  where: string;
  when: string;
  witnesses: string;
  notes: string;
}

interface ImportNotesModalProps {
  onImportComplete: () => void;
}

export const ImportNotesModal = ({ onImportComplete }: ImportNotesModalProps) => {
  const [open, setOpen] = useState(false);
  const [rawNotes, setRawNotes] = useState('');
  const [parsedIncidents, setParsedIncidents] = useState<ParsedIncident[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isParsed, setIsParsed] = useState(false);
  const { toast } = useToast();

  const handleParseNotes = async () => {
    if (!rawNotes.trim()) {
      toast({
        title: "Error",
        description: "Please enter some notes to parse.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('openai-completion', {
        body: { rawNotes: rawNotes.trim() }
      });

      if (error) {
        console.error('Edge function error:', error);
        toast({
          title: "Error",
          description: "Failed to parse notes. Please try again.",
          variant: "destructive",
        });
        return;
      }

      if (data && Array.isArray(data)) {
        setParsedIncidents(data);
        setIsParsed(true);
        toast({
          title: "Success",
          description: `Parsed ${data.length} incident${data.length !== 1 ? 's' : ''} from your notes.`,
        });
      } else {
        throw new Error('Invalid response format');
      }
    } catch (error) {
      console.error('Parse error:', error);
      toast({
        title: "Error",
        description: "Failed to parse notes. Please check your connection and try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const convertToIncident = (parsed: ParsedIncident): Incident => {
    const id = crypto.randomUUID();
    const currentDate = new Date();
    
    // Extract people from the "who" field
    const peopleNames = parsed.who.split(',').map(name => name.trim()).filter(name => name && name !== 'None noted');
    const people = peopleNames.map(name => ({ name }));
    
    // Extract witnesses
    const witnessNames = parsed.witnesses === 'None noted' ? [] : 
      parsed.witnesses.split(',').map(name => name.trim()).filter(name => name);
    const witnesses = witnessNames.map(name => ({ name }));

    return {
      id,
      title: `${parsed.category} - ${parsed.date}`,
      date: currentDate.toISOString().split('T')[0], // Use current date for storage
      time: currentDate.toTimeString().split(' ')[0], // Use current time for storage
      summary: parsed.what,
      location: parsed.where === 'None noted' ? undefined : parsed.where,
      category: parsed.category,
      peopleInvolved: peopleNames.length > 0 ? peopleNames : undefined,
      who: people,
      what: parsed.what,
      where: parsed.where === 'None noted' ? '' : parsed.where,
      why: parsed.notes,
      how: parsed.notes,
      witnesses: witnesses.length > 0 ? witnesses : undefined,
    };
  };

  const handleImportAll = () => {
    try {
      parsedIncidents.forEach(parsed => {
        const incident = convertToIncident(parsed);
        storage.saveIncident(incident);
      });

      toast({
        title: "Success",
        description: `Imported ${parsedIncidents.length} incident${parsedIncidents.length !== 1 ? 's' : ''} successfully.`,
      });

      // Reset modal state
      setRawNotes('');
      setParsedIncidents([]);
      setIsParsed(false);
      setOpen(false);
      onImportComplete();
    } catch (error) {
      console.error('Import error:', error);
      toast({
        title: "Error",
        description: "Failed to import incidents. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleImportSingle = (index: number) => {
    try {
      const incident = convertToIncident(parsedIncidents[index]);
      storage.saveIncident(incident);

      toast({
        title: "Success",
        description: "Incident imported successfully.",
      });

      // Remove the imported incident from the list
      const newParsedIncidents = parsedIncidents.filter((_, i) => i !== index);
      setParsedIncidents(newParsedIncidents);
      
      if (newParsedIncidents.length === 0) {
        setRawNotes('');
        setIsParsed(false);
        setOpen(false);
      }
      
      onImportComplete();
    } catch (error) {
      console.error('Import error:', error);
      toast({
        title: "Error",
        description: "Failed to import incident. Please try again.",
        variant: "destructive",
      });
    }
  };

  const resetModal = () => {
    setRawNotes('');
    setParsedIncidents([]);
    setIsParsed(false);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="border-primary text-primary hover:bg-primary/10">
          📝 Import Notes
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto" aria-describedby="import-notes-description">
        <DialogHeader>
          <DialogTitle>Import HR Incident Notes</DialogTitle>
        </DialogHeader>
        <div id="import-notes-description" className="text-sm text-muted-foreground mb-4">
          Paste your raw incident notes and our AI will parse them into structured incident reports.
        </div>

        {!isParsed ? (
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
                onClick={handleParseNotes} 
                disabled={isLoading || !rawNotes.trim()}
                className="bg-primary text-primary-foreground hover:bg-primary/90"
              >
                {isLoading ? 'Parsing...' : 'Parse Notes'}
              </Button>
              <Button variant="outline" onClick={resetModal}>
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium">Parsed Incidents ({parsedIncidents.length})</h3>
              <div className="flex gap-2">
                <Button 
                  onClick={handleImportAll}
                  className="bg-success text-success-foreground hover:bg-success/90"
                >
                  Import All ({parsedIncidents.length})
                </Button>
                <Button variant="outline" onClick={() => setIsParsed(false)}>
                  ← Back to Edit
                </Button>
              </div>
            </div>

            <div className="space-y-3 max-h-[60vh] overflow-y-auto">
              {parsedIncidents.map((incident, index) => (
                <Card key={index} className="border rounded-lg">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <CardTitle className="text-sm font-medium mb-2">
                          {incident.category} - {incident.date}
                        </CardTitle>
                        <div className="flex gap-2">
                          <Badge variant="secondary" className="text-xs">
                            {incident.date}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            {incident.category}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                      <div>
                        <span className="font-medium text-muted-foreground">Who:</span>
                        <p className="mt-1">{incident.who}</p>
                      </div>
                      <div>
                        <span className="font-medium text-muted-foreground">Where:</span>
                        <p className="mt-1">{incident.where}</p>
                      </div>
                      <div>
                        <span className="font-medium text-muted-foreground">When:</span>
                        <p className="mt-1">{incident.when}</p>
                      </div>
                      <div>
                        <span className="font-medium text-muted-foreground">Witnesses:</span>
                        <p className="mt-1">{incident.witnesses}</p>
                      </div>
                    </div>
                    <div>
                      <span className="font-medium text-muted-foreground text-xs">What Happened:</span>
                      <p className="text-xs mt-1">{incident.what}</p>
                    </div>
                    {incident.notes !== 'None noted' && (
                      <div>
                        <span className="font-medium text-muted-foreground text-xs">Notes:</span>
                        <p className="text-xs mt-1">{incident.notes}</p>
                      </div>
                    )}
                    <div className="flex gap-2 pt-2">
                      <Button 
                        size="sm" 
                        onClick={() => handleImportSingle(index)}
                        className="bg-success text-success-foreground hover:bg-success/90"
                      >
                        Import This One
                      </Button>
                      <Button variant="outline" size="sm">
                        View
                      </Button>
                      <Button variant="outline" size="sm">
                        Edit
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {parsedIncidents.length === 0 && (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-8">
                  <AlertIcon className="h-8 w-8 text-muted-foreground mb-3" />
                  <p className="text-sm text-muted-foreground text-center">
                    No incidents found in the notes. Try editing your input and parsing again.
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};