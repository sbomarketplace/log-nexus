import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '@/components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { FileText, Upload, Eye, Edit, Download, Trash2, ArrowLeft } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { storage } from '@/utils/storage';
import { Incident } from '@/types/incident';
import jsPDF from 'jspdf';

interface ParsedIncident {
  title: string;
  category: string;
  date: string;
  location: string;
  peopleInvolved: string[];
  summary: string;
  who?: string;
  what?: string;
  where?: string;
  when?: string;
  witnesses?: string;
  notes?: string;
}

const ParseNotes = () => {
  const [rawNotes, setRawNotes] = useState('');
  const [parsedIncidents, setParsedIncidents] = useState<ParsedIncident[]>([]);
  const [isLoading, setParsing] = useState(false);
  const [selectedIncident, setSelectedIncident] = useState<ParsedIncident | null>(null);
  const [editingIncident, setEditingIncident] = useState<ParsedIncident | null>(null);
  const [deleteIndex, setDeleteIndex] = useState<number | null>(null);
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.type === 'text/plain') {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        setRawNotes(content);
      };
      reader.readAsText(file);
    } else {
      toast({
        title: "Unsupported File Type",
        description: "Please upload a .txt file.",
        variant: "destructive",
      });
    }
  };

  const parseNotes = async () => {
    if (!rawNotes.trim()) {
      toast({
        title: "No Notes to Parse",
        description: "Please enter some raw notes or upload a file.",
        variant: "destructive",
      });
      return;
    }

    setParsing(true);
    try {
      // Mock parsing for now - replace with actual GPT-4o API call
      // This would normally call your parsing service
      const mockParsedResults: ParsedIncident[] = [
        {
          title: "Inappropriate Comment",
          category: "Harassment", 
          date: "11/18",
          location: "Office desk area",
          peopleInvolved: ["Troy Malone"],
          summary: "Inappropriate comment made during team meeting",
          who: "Troy Malone",
          what: "Asked if an Indian QA had an OnlyFans account during a team meeting",
          where: "At our desks",
          when: "6:00 AM",
          witnesses: "Mark, Jake, Billy, AL, Darryl, 2 AOG contractors",
          notes: "Occurred during formal team setting"
        },
        {
          title: "Workplace Dispute",
          category: "Conflict",
          date: "11/19", 
          location: "Conference Room B",
          peopleInvolved: ["Sarah Wilson", "Mike Chen"],
          summary: "Disagreement over project timeline escalated",
          who: "Sarah Wilson, Mike Chen",
          what: "Heated argument over project deadline changes leading to raised voices",
          where: "Conference Room B",
          when: "2:30 PM",
          witnesses: "Jennifer Adams, Tom Rodriguez",
          notes: "Meeting had to be paused for 10 minutes to de-escalate"
        }
      ];

      setParsedIncidents(mockParsedResults);
      toast({
        title: "Notes Parsed Successfully",
        description: `Found ${mockParsedResults.length} incident${mockParsedResults.length > 1 ? 's' : ''}.`,
      });
    } catch (error) {
      console.error('Parsing error:', error);
      toast({
        title: "Parsing Failed",
        description: "Unable to parse the notes. Please try again.",
        variant: "destructive",
      });
    } finally {
      setParsing(false);
    }
  };

  const saveIncident = (incident: ParsedIncident, index: number) => {
    const newIncident: Incident = {
      id: `incident_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      title: incident.title,
      date: incident.date.includes('/') ? 
        `2024-${incident.date.split('/')[0].padStart(2, '0')}-${incident.date.split('/')[1]?.padStart(2, '0') || '01'}` :
        new Date().toISOString().split('T')[0],
      time: incident.when?.includes(':') ? incident.when : '00:00',
      summary: incident.summary,
      location: incident.location,
      category: incident.category,
      peopleInvolved: incident.peopleInvolved,
      who: incident.peopleInvolved.map(name => ({ name, role: '' })),
      what: incident.what || incident.summary,
      where: incident.where || incident.location || 'Not specified',
      why: '',
      how: '',
      witnesses: incident.witnesses ? 
        incident.witnesses.split(',').map(name => ({ name: name.trim(), role: '' })) : [],
      unionInvolvement: [],
      files: []
    };

    storage.saveIncident(newIncident);
    
    // Remove from parsed list
    setParsedIncidents(prev => prev.filter((_, i) => i !== index));
    
    toast({
      title: "Incident Saved",
      description: "The incident has been saved to your incident list.",
    });
  };

  const exportToPDF = (incident: ParsedIncident) => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;
    const margin = 20;
    
    doc.setFontSize(16);
    doc.text(incident.title, margin, 30);
    
    doc.setFontSize(12);
    const lines = doc.splitTextToSize(incident.summary, pageWidth - 2 * margin);
    doc.text(lines, margin, 50);
    
    doc.save(`incident-${incident.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.pdf`);
  };

  const confirmDelete = (index: number) => {
    setParsedIncidents(prev => prev.filter((_, i) => i !== index));
    setDeleteIndex(null);
    toast({
      title: "Incident Deleted",
      description: "The parsed incident has been removed.",
    });
  };

  return (
    <Layout>
      <main className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <section className="flex items-center space-x-3">
          <Button variant="ghost" size="sm" onClick={() => navigate('/')}>
            <ArrowLeft size={16} />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Parse Notes</h1>
            <p className="text-sm text-muted-foreground">Convert raw incident notes into structured summaries</p>
          </div>
        </section>

        {/* Input Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <FileText size={20} />
              <span>Raw Incident Notes</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="rawNotes">Paste raw incident notes below</Label>
              <Textarea
                id="rawNotes"
                placeholder="Paste your raw incident notes here... (e.g., '11/18 Who: John Doe What: Inappropriate comment...')"
                value={rawNotes}
                onChange={(e) => setRawNotes(e.target.value)}
                rows={8}
                className="mt-2"
              />
            </div>
            
            <div className="flex items-center space-x-4">
              <div>
                <Label htmlFor="fileUpload" className="cursor-pointer">
                  <div className="flex items-center space-x-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
                    <Upload size={16} />
                    <span>Or upload a .txt file</span>
                  </div>
                </Label>
                <Input
                  id="fileUpload"
                  type="file"
                  accept=".txt"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </div>
              
              <Button 
                onClick={parseNotes} 
                disabled={isLoading || !rawNotes.trim()}
                className="ml-auto"
              >
                {isLoading ? "Parsing..." : "Parse Notes"}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Parsed Results */}
        {parsedIncidents.length > 0 && (
          <section>
            <h2 className="text-xl font-semibold mb-4">Parsed Incidents ({parsedIncidents.length})</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {parsedIncidents.map((incident, index) => (
                <article key={index} className="border border-border rounded-lg p-4 bg-card">
                  <header className="mb-3">
                    <h3 className="font-medium text-sm text-foreground">{incident.title}</h3>
                    <div className="flex items-center space-x-2 mt-1">
                      <Badge variant="secondary" className="text-xs">{incident.category}</Badge>
                      <span className="text-xs text-muted-foreground">{incident.date}</span>
                    </div>
                  </header>
                  
                  <div className="text-xs text-muted-foreground mb-3 space-y-1">
                    <p><strong>Who:</strong> {incident.who || 'Not specified'}</p>
                    <p><strong>Where:</strong> {incident.where || incident.location || 'Not specified'}</p>
                  </div>
                  
                  <footer className="flex flex-wrap gap-1">
                    <Button 
                      size="sm" 
                      variant="outline" 
                      onClick={() => setSelectedIncident(incident)}
                      className="text-xs h-7"
                    >
                      <Eye size={12} className="mr-1" />
                      View
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      onClick={() => setEditingIncident(incident)}
                      className="text-xs h-7"
                    >
                      <Edit size={12} className="mr-1" />
                      Edit
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      onClick={() => exportToPDF(incident)}
                      className="text-xs h-7"
                    >
                      <Download size={12} className="mr-1" />
                      Export
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      onClick={() => saveIncident(incident, index)}
                      className="text-xs h-7 bg-primary text-primary-foreground hover:bg-primary/90"
                    >
                      Save
                    </Button>
                    <Button 
                      size="sm" 
                      variant="destructive" 
                      onClick={() => setDeleteIndex(index)}
                      className="text-xs h-7"
                    >
                      <Trash2 size={12} className="mr-1" />
                      Delete
                    </Button>
                  </footer>
                </article>
              ))}
            </div>
          </section>
        )}

        {/* View Modal */}
        <Dialog open={!!selectedIncident} onOpenChange={() => setSelectedIncident(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center space-x-2">
                <span>📅 {selectedIncident?.date} — {selectedIncident?.category}</span>
              </DialogTitle>
            </DialogHeader>
            <section className="space-y-4">
              <div className="grid grid-cols-1 gap-3">
                <article className="space-y-3">
                  <div className="flex items-start space-x-2">
                    <span className="font-medium text-sm">• Who:</span>
                    <span className="text-sm text-muted-foreground">{selectedIncident?.who || 'Not specified'}</span>
                  </div>
                  
                  <div className="flex items-start space-x-2">
                    <span className="font-medium text-sm">• What:</span>
                    <span className="text-sm text-muted-foreground">{selectedIncident?.what || 'Not specified'}</span>
                  </div>
                  
                  <div className="flex items-start space-x-2">
                    <span className="font-medium text-sm">• Where:</span>
                    <span className="text-sm text-muted-foreground">{selectedIncident?.where || 'Not specified'}</span>
                  </div>
                  
                  <div className="flex items-start space-x-2">
                    <span className="font-medium text-sm">• When:</span>
                    <span className="text-sm text-muted-foreground">{selectedIncident?.when || 'Not specified'}</span>
                  </div>
                  
                  <div className="flex items-start space-x-2">
                    <span className="font-medium text-sm">• Witnesses:</span>
                    <span className="text-sm text-muted-foreground">{selectedIncident?.witnesses || 'None noted'}</span>
                  </div>
                  
                  <div className="flex items-start space-x-2">
                    <span className="font-medium text-sm">• Notes:</span>
                    <span className="text-sm text-muted-foreground">{selectedIncident?.notes || 'None noted'}</span>
                  </div>
                </article>
              </div>
            </section>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation */}
        <AlertDialog open={deleteIndex !== null} onOpenChange={() => setDeleteIndex(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Parsed Incident</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete this parsed incident? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction 
                onClick={() => deleteIndex !== null && confirmDelete(deleteIndex)}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </main>
    </Layout>
  );
};

export default ParseNotes;