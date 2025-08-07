import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Layout } from '@/components/Layout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { storage } from '@/utils/storage';
import { Incident } from '@/types/incident';
import { AlertIcon, FileIcon } from '@/components/icons/CustomIcons';
import jsPDF from 'jspdf';

const Home = () => {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const navigate = useNavigate();

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
        <div className="mb-6">
          <h1 className="text-lg font-medium text-foreground">Incidents</h1>
          <p className="text-xs text-muted-foreground">All workplace incidents</p>
        </div>

        {/* New Incident Button */}
        <div className="mb-6">
          <Link to="/add">
            <Button className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg px-4 py-2 text-sm font-medium">
              + New Incident
            </Button>
          </Link>
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