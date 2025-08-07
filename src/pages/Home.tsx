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
import { ImportNotesModal } from '@/components/ImportNotesModal';
import { useToast } from '@/hooks/use-toast';
import jsPDF from 'jspdf';

const Home = () => {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
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

  const handleImportNotes = (parsedIncidents: any[], batchTitle: string) => {
    try {
      let savedCount = 0;
      const batchId = `batch_${Date.now()}`;
      
      parsedIncidents.forEach((parsed, index) => {
        const incident: Incident = {
          id: `incident_${Date.now()}_${Math.random().toString(36).substr(2, 9)}_${index}`,
          title: parsed.title || `Incident ${index + 1} from ${batchTitle}`,
          date: parsed.date || new Date().toISOString().split('T')[0],
          time: parsed.time || new Date().toTimeString().slice(0, 5),
          summary: parsed.what || 'Imported incident',
          location: parsed.location,
          category: parsed.category,
          peopleInvolved: parsed.peopleInvolved,
          who: parsed.who || [],
          what: parsed.what || '',
          where: parsed.where || parsed.location || '',
          why: parsed.why || '',
          how: parsed.how || '',
          witnesses: parsed.witnesses || [],
          unionInvolvement: parsed.unionInvolvement || [],
          files: [],
          tags: [`import:${batchTitle}`, `batch:${batchId}`],
          folder: batchTitle, // Store batch title as folder for grouping
        };
        
        storage.saveIncident(incident);
        savedCount++;
      });
      
      setIncidents(storage.getIncidents());
      
      toast({
        title: "Import Successful",
        description: `Imported ${savedCount} incident${savedCount > 1 ? 's' : ''} from "${batchTitle}".`,
      });
    } catch (error) {
      console.error('Error importing notes:', error);
      toast({
        title: "Import Failed", 
        description: "There was an error importing your notes. Please try again.",
        variant: "destructive",
      });
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
            <Button 
              onClick={() => setIsImportModalOpen(true)}
              className="bg-accent text-white rounded p-2 text-sm"
            >
              Import Notes
            </Button>
            
            <ImportNotesModal
              isOpen={isImportModalOpen}
              onClose={() => setIsImportModalOpen(false)}
              onImport={handleImportNotes}
            />
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
                <Card key={incident.id} className="border rounded-lg">
                  <CardContent className="p-4">
                    <div className="space-y-3">
                      {/* Enhanced header with date and title */}
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge variant="secondary" className="text-xs px-2 py-1">
                              {formatDate(incident.date)}
                            </Badge>
                            {incident.category && (
                              <Badge variant="outline" className="text-xs px-2 py-1">
                                {incident.category}
                              </Badge>
                            )}
                          </div>
                          <h3 className="font-medium text-sm leading-tight mb-2 line-clamp-2">
                            {incident.title}
                          </h3>
                        </div>
                      </div>

                      {/* Enhanced metadata row */}
                      <div className="text-xs text-muted-foreground space-y-1">
                        <div className="flex flex-wrap gap-3">
                          {incident.location && (
                            <span className="flex items-center gap-1">
                              <span className="font-medium">Location:</span>
                              <span className="truncate max-w-[120px]">{incident.location}</span>
                            </span>
                          )}
                          {incident.peopleInvolved && incident.peopleInvolved.length > 0 && (
                            <span className="flex items-center gap-1">
                              <span className="font-medium">People:</span>
                              <span className="truncate max-w-[140px]">
                                {incident.peopleInvolved.slice(0, 2).join(', ')}
                                {incident.peopleInvolved.length > 2 && ` +${incident.peopleInvolved.length - 2}`}
                              </span>
                            </span>
                          )}
                        </div>
                        <div className="text-xs opacity-75">
                          Created: {new Date(incident.date + ' ' + incident.time).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            hour: 'numeric',
                            minute: '2-digit'
                          })}
                        </div>
                      </div>

                      {/* Action buttons */}
                      <div className="flex gap-2 pt-2">
                        <Link to={`/incident/${incident.id}`}>
                          <Button variant="outline" size="sm" className="text-sm px-3 py-1">
                            View
                          </Button>
                        </Link>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="text-sm px-3 py-1"
                          onClick={() => navigate(`/add?id=${incident.id}`)}
                        >
                          Edit
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="text-sm px-3 py-1"
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