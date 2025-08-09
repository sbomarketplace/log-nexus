import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Layout } from '@/components/Layout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { AlertIcon } from '@/components/icons/CustomIcons';
import { useToast } from '@/hooks/use-toast';
import { OrganizeNotesModal } from '@/components/OrganizeNotesModal';
import { incidentService } from '@/services/incidents';
import { IncidentRecord, IncidentEvent } from '@/types/incidents';

import jsPDF from 'jspdf';

const Home = () => {
  const [incidentRecords, setIncidentRecords] = useState<IncidentRecord[]>([]);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  const loadIncidents = async () => {
    try {
      const records = await incidentService.getAllIncidents();
      setIncidentRecords(records);
    } catch (error) {
      console.error('Error loading incidents:', error);
      toast({
        title: "Load Failed",
        description: "Failed to load incidents from database.",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    loadIncidents();
  }, []);

  const handleOrganizeComplete = () => {
    // Reload incidents from the database
    loadIncidents();
  };

  const handleDeleteIncident = async (id: string) => {
    try {
      await incidentService.deleteIncident(id);
      await loadIncidents();
      setDeleteId(null);
      toast({
        title: "Incident Deleted",
        description: "The incident has been permanently removed.",
      });
    } catch (error) {
      console.error('Error deleting incident:', error);
      toast({
        title: "Delete Failed",
        description: "Failed to delete incident. Please try again.",
        variant: "destructive",
      });
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };



  const handleExport = (event: IncidentEvent, recordDate: string) => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 20;
    let yPos = 30;

    // Title
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text(`${event.category} - ${event.date}`, margin, yPos);
    yPos += 20;

    // Basic info
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text(`Date: ${event.date}`, margin, yPos);
    yPos += 10;
    doc.text(`Time: ${event.when}`, margin, yPos);
    yPos += 10;
    doc.text(`Location: ${event.where}`, margin, yPos);
    yPos += 20;

    // Summary
    doc.setFont('helvetica', 'bold');
    doc.text('What Happened:', margin, yPos);
    yPos += 10;
    doc.setFont('helvetica', 'normal');
    const whatLines = doc.splitTextToSize(event.what, pageWidth - 2 * margin);
    doc.text(whatLines, margin, yPos);
    yPos += whatLines.length * 6 + 10;

    // People involved
    doc.setFont('helvetica', 'bold');
    doc.text('People Involved:', margin, yPos);
    yPos += 10;
    doc.setFont('helvetica', 'normal');
    doc.text(event.who, margin, yPos);
    yPos += 15;

    // Witnesses
    if (event.witnesses !== "None noted") {
      doc.setFont('helvetica', 'bold');
      doc.text('Witnesses:', margin, yPos);
      yPos += 10;
      doc.setFont('helvetica', 'normal');
      doc.text(event.witnesses, margin, yPos);
      yPos += 15;
    }

    // Notes
    if (event.notes) {
      doc.setFont('helvetica', 'bold');
      doc.text('Additional Notes:', margin, yPos);
      yPos += 10;
      doc.setFont('helvetica', 'normal');
      const notesLines = doc.splitTextToSize(event.notes, pageWidth - 2 * margin);
      doc.text(notesLines, margin, yPos);
    }

    doc.save(`incident-${event.category.replace(/[^a-z0-9]/gi, '_').toLowerCase()}-${event.date}.pdf`);
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
          <div className="flex justify-center gap-3">
            <Link to="/add">
              <Button className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg px-4 py-2 text-sm font-medium">
                + New Incident
              </Button>
            </Link>
            <OrganizeNotesModal onOrganizeComplete={handleOrganizeComplete} />
          </div>
        </div>

        {/* Incidents List */}
        <div className="space-y-3">
          {incidentRecords.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <AlertIcon className="h-8 w-8 text-muted-foreground mb-3" />
                <h3 className="text-sm font-medium mb-1">No incidents recorded</h3>
                <p className="text-xs text-muted-foreground text-center">
                  Start by organizing your first incident notes or creating a new incident report.
                </p>
              </CardContent>
            </Card>
          ) : (
            incidentRecords
              .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
              .flatMap((record) => 
                record.events.map((event, index) => ({ 
                  ...event, 
                  recordId: record.id, 
                  recordDate: record.created_at,
                  eventIndex: index 
                }))
              )
              .map((event, globalIndex) => (
                <Card key={`${event.recordId}-${event.eventIndex}`} className="border rounded-lg">
                  <CardContent className="p-4">
                    <div className="space-y-3">
                      {/* Enhanced header with date and category */}
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge variant="secondary" className="text-xs px-2 py-1">
                              📅 {event.date}
                            </Badge>
                            <Badge variant="outline" className="text-xs px-2 py-1">
                              {event.category}
                            </Badge>
                          </div>
                          <h3 className="font-medium text-sm leading-tight mb-2 line-clamp-2">
                            {event.what}
                          </h3>
                        </div>
                      </div>

                      {/* Event details */}
                      <div className="text-xs text-muted-foreground space-y-1">
                        <div className="flex flex-wrap gap-3">
                          <span className="flex items-center gap-1">
                            <span className="font-medium">Who:</span>
                            <span className="truncate max-w-[140px]">{event.who}</span>
                          </span>
                          <span className="flex items-center gap-1">
                            <span className="font-medium">Where:</span>
                            <span className="truncate max-w-[120px]">{event.where}</span>
                          </span>
                          <span className="flex items-center gap-1">
                            <span className="font-medium">When:</span>
                            <span className="truncate max-w-[100px]">{event.when}</span>
                          </span>
                        </div>
                        {event.witnesses !== "None noted" && (
                          <div className="flex items-center gap-1">
                            <span className="font-medium">Witnesses:</span>
                            <span className="truncate max-w-[200px]">{event.witnesses}</span>
                          </div>
                        )}
                        <div className="text-xs opacity-75">
                          Organized: {new Date(event.recordDate).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            hour: 'numeric',
                            minute: '2-digit'
                          })}
                        </div>
                      </div>

                      {/* Action buttons */}
                      <div className="flex gap-2 pt-2">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="text-sm px-3 py-1"
                          onClick={() => {
                            // Show detailed view in a modal or navigate to detail page
                            toast({
                              title: "Event Details",
                              description: event.notes || "No additional notes available.",
                            });
                          }}
                        >
                          View
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="text-sm px-3 py-1"
                          onClick={() => navigate(`/add?eventData=${encodeURIComponent(JSON.stringify(event))}`)}
                        >
                          Edit
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="text-sm px-3 py-1"
                          onClick={() => handleExport(event, event.recordDate)}
                        >
                          Export
                        </Button>
                        <Button 
                          variant="destructive" 
                          size="sm" 
                          className="text-sm px-3 py-1"
                          onClick={() => setDeleteId(event.recordId)}
                        >
                          Delete
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
          )}
        </div>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Incident</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete this incident? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction 
                onClick={() => deleteId && handleDeleteIncident(deleteId)}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </Layout>
  );
};

export default Home;