import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';

// TODO: Remove this flag when parser is rebuilt
const PARSE_ENABLED = false;

interface ImportNotesModalProps {
  onImportComplete: () => void;
}

export const ImportNotesModal = ({ onImportComplete }: ImportNotesModalProps) => {
  const [open, setOpen] = useState(false);
  const [rawNotes, setRawNotes] = useState('');
  const { toast } = useToast();

  // TODO: Restore original parsing functionality when parser is rebuilt
  const handleParseNotes = () => {
    toast({
      title: "Parser is being rebuilt",
      description: "Check back soon.",
      variant: "default",
    });
  };

  const resetModal = () => {
    setRawNotes('');
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button 
          variant="outline" 
          className="border-primary text-primary hover:bg-primary/10"
          data-testid="parser-disabled"
        >
          📝 Import Notes
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto" aria-describedby="import-notes-description">
        <DialogHeader>
          <DialogTitle>Import HR Incident Notes</DialogTitle>
        </DialogHeader>
        
        {/* Temporary banner */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
          <Badge variant="outline" className="text-yellow-800 bg-yellow-100 border-yellow-300">
            Parser temporarily disabled during rebuild
          </Badge>
        </div>

        <div id="import-notes-description" className="text-sm text-muted-foreground mb-4">
          Paste your raw incident notes and our AI will parse them into structured incident reports.
        </div>

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
              disabled={!PARSE_ENABLED}
              className="bg-primary text-primary-foreground hover:bg-primary/90"
              data-testid="parse-notes-disabled"
            >
              Parse Notes
            </Button>
            <Button variant="outline" onClick={resetModal}>
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};