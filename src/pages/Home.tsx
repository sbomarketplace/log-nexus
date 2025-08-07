import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Layout } from '@/components/Layout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { storage } from '@/utils/storage';
import { Incident } from '@/types/incident';
import { AlertIcon, FileIcon } from '@/components/icons/CustomIcons';
import { parseMultipleIncidents } from '@/utils/parser';
import { useToast } from '@/hooks/use-toast';
import jsPDF from 'jspdf';
import mammoth from 'mammoth';

const Home = () => {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [rawNotes, setRawNotes] = useState('');
  const [isFileProcessing, setIsFileProcessing] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    setIncidents(storage.getIncidents());
  }, []);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const handleImportNotes = () => {
    if (!rawNotes.trim()) {
      toast({
        title: "Error",
        description: "Please enter some notes to parse.",
        variant: "destructive",
      });
      return;
    }

    try {
      const parsedIncidents = parseMultipleIncidents(rawNotes);
      
      if (parsedIncidents.length === 0) {
        toast({
          title: "No Incidents Found",
          description: "Could not parse any valid incidents from the provided notes.",
          variant: "destructive",
        });
        return;
      }

      let savedCount = 0;
      
      parsedIncidents.forEach((parsed, index) => {
        const incident: Incident = {
          id: `incident_${Date.now()}_${Math.random().toString(36).substr(2, 9)}_${index}`,
          title: parsed.title || `Imported Incident ${index + 1}`,
          date: parsed.date || new Date().toISOString().split('T')[0],
          time: parsed.time || new Date().toTimeString().slice(0, 5),
          summary: parsed.what || 'Imported incident',
          who: parsed.who || [],
          what: parsed.what || '',
          where: parsed.where || '',
          why: parsed.why || '',
          how: parsed.how || '',
          witnesses: parsed.witnesses || [],
          unionInvolvement: parsed.unionInvolvement || [],
          files: [],
          tags: [],
        };
        
        storage.saveIncident(incident);
        savedCount++;
      });
      
      setIncidents(storage.getIncidents());
      setRawNotes('');
      setIsImportModalOpen(false);
      
      toast({
        title: "Import Successful",
        description: `Successfully imported ${savedCount} incident${savedCount > 1 ? 's' : ''}.`,
      });
      
    } catch (error) {
      toast({
        title: "Parsing Error",
        description: "There was an error parsing your notes. Please check the format and try again.",
        variant: "destructive",
      });
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const allowedTypes = ['.txt', '.md', '.docx', '.rtf'];
    const fileExtension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));
    
    if (!allowedTypes.includes(fileExtension)) {
      toast({
        title: "Unsupported File Type",
        description: `Please upload one of these file types: ${allowedTypes.join(', ')}`,
        variant: "destructive",
      });
      event.target.value = '';
      return;
    }

    setIsFileProcessing(true);

    try {
      let text = '';

      if (fileExtension === '.txt' || fileExtension === '.md') {
        text = await file.text();
      } else if (fileExtension === '.docx') {
        const arrayBuffer = await file.arrayBuffer();
        const result = await mammoth.extractRawText({ arrayBuffer });
        text = result.value;
      } else if (fileExtension === '.rtf') {
        // Basic RTF text extraction (removes RTF formatting)
        const rawText = await file.text();
        text = rawText.replace(/\\[a-z]+\d*\s?/g, '').replace(/[{}]/g, '').replace(/\s+/g, ' ').trim();
      }

      if (text.trim()) {
        setRawNotes(prev => prev ? `${prev}\n\n${text}` : text);
        toast({
          title: "File Uploaded",
          description: "File content has been added to the text area. Review and edit as needed.",
        });
      } else {
        toast({
          title: "Empty File",
          description: "The uploaded file appears to be empty or could not be processed.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "File Processing Error",
        description: "There was an error processing the uploaded file.",
        variant: "destructive",
      });
    } finally {
      setIsFileProcessing(false);
      event.target.value = '';
    }
  };

  const handleExport = (incident: Incident) => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 20;
    let yPos = 30;

    // Title
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text(incident.title, margin, yPos);
    yPos += 20;

    // Basic info
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text(`Date: ${incident.date}`, margin, yPos);
    yPos += 10;
    doc.text(`Time: ${incident.time}`, margin, yPos);
    yPos += 10;
    doc.text(`Location: ${incident.where}`, margin, yPos);
    yPos += 20;

    // Summary
    doc.setFont('helvetica', 'bold');
    doc.text('Summary:', margin, yPos);
    yPos += 10;
    doc.setFont('helvetica', 'normal');
    const summaryLines = doc.splitTextToSize(incident.summary, pageWidth - 2 * margin);
    doc.text(summaryLines, margin, yPos);
    yPos += summaryLines.length * 6 + 10;

    // People involved
    if (incident.who.length > 0) {
      doc.setFont('helvetica', 'bold');
      doc.text('People Involved:', margin, yPos);
      yPos += 10;
      doc.setFont('helvetica', 'normal');
      incident.who.forEach(person => {
        doc.text(`• ${person.name}${person.role ? ` (${person.role})` : ''}`, margin + 5, yPos);
        yPos += 8;
      });
      yPos += 10;
    }

    // Details sections
    const sections = [
      { title: 'What Happened', content: incident.what },
      { title: 'Why It Happened', content: incident.why },
      { title: 'How It Happened', content: incident.how }
    ];

    sections.forEach(section => {
      if (section.content) {
        doc.setFont('helvetica', 'bold');
        doc.text(`${section.title}:`, margin, yPos);
        yPos += 10;
        doc.setFont('helvetica', 'normal');
        const contentLines = doc.splitTextToSize(section.content, pageWidth - 2 * margin);
        doc.text(contentLines, margin, yPos);
        yPos += contentLines.length * 6 + 15;
      }
    });

    doc.save(`incident-${incident.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.pdf`);
  };

  return (
    <Layout>
      <div className="space-y-4">
        {/* Intro Description */}
        <div className="text-center mb-8">
          <p className="text-sm text-muted-foreground">
            Use ClearCase to document workplace incidents, protect your rights, and stay organized.
          </p>
        </div>

        {/* Header */}
        <div className="mb-6 text-center">
          <h1 className="text-lg font-medium text-foreground">Incidents</h1>
          <p className="text-xs text-muted-foreground">All workplace incidents</p>
        </div>

        {/* Action Buttons */}
        <div className="mb-6 text-center space-y-3">
          <Link to="/add">
            <Button className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg px-4 py-2 text-sm font-medium">
              + New Incident
            </Button>
          </Link>
          
          <div>
            <Dialog open={isImportModalOpen} onOpenChange={setIsImportModalOpen}>
              <DialogTrigger asChild>
                <Button className="bg-accent text-white rounded p-2 text-sm">
                  Import Notes
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Import Raw Notes</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="import-notes">Paste your raw notes below</Label>
                      <Textarea
                        id="import-notes"
                        value={rawNotes}
                        onChange={(e) => setRawNotes(e.target.value)}
                        placeholder="Paste multiple incident notes here. The parser will automatically detect separate incidents and create individual reports..."
                        rows={10}
                        className="min-h-[250px]"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="file-upload">Or upload a document</Label>
                      <div className="flex items-center gap-2">
                        <input
                          id="file-upload"
                          type="file"
                          accept=".txt,.md,.docx,.rtf"
                          onChange={handleFileUpload}
                          disabled={isFileProcessing}
                          className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-foreground file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                        />
                        {isFileProcessing && (
                          <span className="text-sm text-muted-foreground">Processing...</span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Supports .txt, .md, .docx, and .rtf files
                      </p>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Supports multi-date logs (e.g., "7/18 - Incident..." and "7/22 - Incident..."), 
                    union involvement, witnesses, and other details. Each incident will be saved separately.
                  </p>
                  <div className="flex gap-3 justify-end">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setIsImportModalOpen(false);
                        setRawNotes('');
                      }}
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleImportNotes}
                      disabled={!rawNotes.trim()}
                    >
                      Parse Notes
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Incidents List */}
        <div className="space-y-3">
          {incidents.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <AlertIcon className="h-8 w-8 text-muted-foreground mb-3" />
                <h3 className="text-sm font-medium mb-1">No incidents recorded</h3>
                <p className="text-xs text-muted-foreground text-center">
                  Start by creating your first incident report.
                </p>
              </CardContent>
            </Card>
          ) : (
            incidents
              .sort((a, b) => new Date(b.date + ' ' + b.time).getTime() - new Date(a.date + ' ' + a.time).getTime())
              .map((incident) => (
                <Card key={incident.id} className="border rounded p-2">
                  <CardContent className="p-2">
                    <div className="flex flex-col sm:flex-row justify-between items-start gap-3">
                      <div className="flex-1">
                        <div className="flex items-start justify-between mb-2">
                          <h3 className="font-medium text-sm">{incident.title}</h3>
                          <div className="flex flex-col gap-1 items-end">
                            <Badge variant="secondary" className="text-xs">
                              {formatDate(incident.date)}
                            </Badge>
                            {incident.folder && (
                              <Badge variant="outline" className="text-xs">
                                <FileIcon className="mr-1" size={12} />
                                {incident.folder}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Link to={`/incident/${incident.id}`}>
                          <Button variant="outline" size="sm" className="text-sm p-2">
                            View
                          </Button>
                        </Link>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="text-sm p-2"
                          onClick={() => navigate(`/add?id=${incident.id}`)}
                        >
                          Edit
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="text-sm p-2"
                          onClick={() => handleExport(incident)}
                        >
                          Export
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
          )}
        </div>
      </div>
    </Layout>
  );
};

export default Home;