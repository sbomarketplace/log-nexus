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
import { ViewIncidentModal } from '@/components/ViewIncidentModal';
import { EditIncidentModal } from '@/components/EditIncidentModal';

import { OrganizedIncident, organizedIncidentStorage } from '@/utils/organizedIncidentStorage';

import jsPDF from 'jspdf';

const Home = () => {
  const [organizedIncidents, setOrganizedIncidents] = useState<OrganizedIncident[]>([]);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [viewIncident, setViewIncident] = useState<OrganizedIncident | null>(null);
  const [editIncident, setEditIncident] = useState<OrganizedIncident | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  const loadIncidents = () => {
    try {
      const incidents = organizedIncidentStorage.getAll();
      setOrganizedIncidents(incidents);
    } catch (error) {
      console.error('Error loading incidents:', error);
      toast({
        title: "Load Failed",
        description: "Failed to load incidents from storage.",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    loadIncidents();
  }, []);

  const handleOrganizeComplete = () => {
    loadIncidents();
  };

  const handleDeleteIncident = async (id: string) => {
    try {
      organizedIncidentStorage.delete(id);
      loadIncidents();
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



  const handleExport = (incident: OrganizedIncident) => {
    try {
      organizedIncidentStorage.downloadAsFile(incident);
      toast({
        title: "Export Successful",
        description: "Incident has been downloaded as a text file.",
      });
    } catch (error) {
      console.error('Error exporting incident:', error);
      toast({
        title: "Export Failed",
        description: "Failed to export incident. Please try again.",
        variant: "destructive",
      });
    }
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
          {organizedIncidents.length === 0 ? (
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
            organizedIncidents
              .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
              .map((incident) => (
                <Card key={incident.id} className="border rounded-lg">
                  <CardContent className="p-4">
                    <div className="space-y-3">
                      {/* Enhanced header with date and category */}
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge variant="secondary" className="text-xs px-2 py-1">
                              📅 {incident.date}
                            </Badge>
                            <Badge variant="outline" className="text-xs px-2 py-1">
                              {incident.categoryOrIssue}
                            </Badge>
                          </div>
                          <h3 className="font-medium text-sm leading-tight mb-2 line-clamp-2">
                            {incident.what.length > 100 ? `${incident.what.substring(0, 100)}...` : incident.what}
                          </h3>
                        </div>
                      </div>

                      {/* Event details summary */}
                      <div className="text-xs text-muted-foreground space-y-1">
                        <div className="flex flex-wrap gap-3">
                          <span className="flex items-center gap-1">
                            <span className="font-medium">Who:</span>
                            <span className="truncate max-w-[140px]">{incident.who}</span>
                          </span>
                          <span className="flex items-center gap-1">
                            <span className="font-medium">Where:</span>
                            <span className="truncate max-w-[120px]">{incident.where}</span>
                          </span>
                          <span className="flex items-center gap-1">
                            <span className="font-medium">When:</span>
                            <span className="truncate max-w-[100px]">{incident.when}</span>
                          </span>
                        </div>
                        <div className="text-xs opacity-75">
                          Created: {new Date(incident.createdAt).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            hour: 'numeric',
                            minute: '2-digit'
                          })}
                          {incident.updatedAt !== incident.createdAt && (
                            <span className="ml-2">
                              • Updated: {new Date(incident.updatedAt).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                hour: 'numeric',
                                minute: '2-digit'
                              })}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Action buttons */}
                      <div className="flex gap-2 pt-2">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="text-sm px-3 py-1"
                          onClick={() => setViewIncident(incident)}
                        >
                          View
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="text-sm px-3 py-1"
                          onClick={() => setEditIncident(incident)}
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
                        <Button 
                          variant="destructive" 
                          size="sm" 
                          className="text-sm px-3 py-1"
                          onClick={() => setDeleteId(incident.id)}
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

        {/* View Incident Modal */}
        <ViewIncidentModal 
          incident={viewIncident}
          open={!!viewIncident}
          onOpenChange={(open) => !open && setViewIncident(null)}
        />

        {/* Edit Incident Modal */}
        <EditIncidentModal 
          incident={editIncident}
          open={!!editIncident}
          onOpenChange={(open) => !open && setEditIncident(null)}
          onSave={loadIncidents}
        />

        {/* Delete Confirmation Modal */}
        {deleteId && (
          <>
            {/* Backdrop */}
            <div 
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
              onClick={() => setDeleteId(null)}
            />
            
            {/* Modal Container */}
            <div className="fixed inset-0 z-50 grid place-items-center p-4">
              <div className="w-full max-w-md bg-background rounded-2xl shadow-2xl p-6 transform transition-all">
                {/* Header */}
                <div className="text-center mb-6">
                  <h2 className="text-xl font-semibold text-foreground mb-2">
                    Delete Incident
                  </h2>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    Are you sure you want to delete this incident? This action cannot be undone.
                  </p>
                </div>
                
                {/* Actions */}
                <div className="space-y-3">
                  <Button 
                    onClick={() => deleteId && handleDeleteIncident(deleteId)}
                    className="w-full bg-destructive text-destructive-foreground hover:bg-destructive/90 rounded-xl py-3 font-medium"
                  >
                    Delete
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => setDeleteId(null)}
                    className="w-full rounded-xl py-3 font-medium"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </Layout>
  );
};

export default Home;