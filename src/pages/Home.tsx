import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Layout } from '@/components/Layout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { AlertIcon } from '@/components/icons/CustomIcons';
import { SearchIcon, X, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { organizeIncidents } from '@/services/ai';
import { OrganizeNotesModal } from '@/components/OrganizeNotesModal';
import { ViewIncidentModal } from '@/components/ViewIncidentModal';
import { EditIncidentModal } from '@/components/EditIncidentModal';

import { OrganizedIncident, organizedIncidentStorage } from '@/utils/organizedIncidentStorage';
import { getAllCategories } from '@/utils/incidentCategories';

import jsPDF from 'jspdf';

const Home = () => {
  const [organizedIncidents, setOrganizedIncidents] = useState<OrganizedIncident[]>([]);
  const [filteredIncidents, setFilteredIncidents] = useState<OrganizedIncident[]>([]);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [viewIncident, setViewIncident] = useState<OrganizedIncident | null>(null);
  const [editIncident, setEditIncident] = useState<OrganizedIncident | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'date' | 'category'>('date');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  // Quick notes state
  const [quickNotes, setQuickNotes] = useState('');
  const [quickNotesError, setQuickNotesError] = useState('');
  const [isOrganizing, setIsOrganizing] = useState(false);
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

  // Filter and sort incidents based on search term, category filter, and sort option
  useEffect(() => {
    let filtered = organizedIncidents;

    // Apply search filter
    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(incident => 
        incident.what.toLowerCase().includes(searchLower) ||
        incident.who.toLowerCase().includes(searchLower) ||
        incident.where.toLowerCase().includes(searchLower) ||
        incident.categoryOrIssue.toLowerCase().includes(searchLower) ||
        incident.notes.toLowerCase().includes(searchLower)
      );
    }

    // Apply category filter
    if (filterCategory !== 'all') {
      filtered = filtered.filter(incident => incident.categoryOrIssue === filterCategory);
    }

    // Apply sorting
    if (sortBy === 'date') {
      filtered = filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    } else if (sortBy === 'category') {
      filtered = filtered.sort((a, b) => a.categoryOrIssue.localeCompare(b.categoryOrIssue));
    }

    setFilteredIncidents(filtered);
  }, [organizedIncidents, searchTerm, filterCategory, sortBy]);

  useEffect(() => {
    loadIncidents();
    // Restore quick notes draft from localStorage
    const saved = localStorage.getItem('quickNotesDraft');
    if (saved) {
      setQuickNotes(saved);
    }
  }, []);

  // Save quick notes draft to localStorage (throttled)
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (quickNotes.trim()) {
        localStorage.setItem('quickNotesDraft', quickNotes);
      } else {
        localStorage.removeItem('quickNotesDraft');
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [quickNotes]);

  const handleOrganizeComplete = () => {
    loadIncidents();
  };

  const handleQuickNotesOrganize = async () => {
    setQuickNotesError('');
    
    if (!quickNotes.trim()) {
      setQuickNotesError('Please enter notes to organize.');
      return;
    }

    setIsOrganizing(true);
    try {
      const results = await organizeIncidents(quickNotes);
      if (!results?.length) {
        setQuickNotesError('No incidents were identified. Please review your notes and try again.');
      } else {
        // Save all organized incidents
        const incidentsToSave = results.map(incident => ({
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
          updatedAt: new Date().toISOString()
        }));
        
        organizedIncidentStorage.saveMultiple(incidentsToSave);
        
        // Clear the textarea and draft
        setQuickNotes('');
        localStorage.removeItem('quickNotesDraft');
        loadIncidents();
        
        // Scroll to the top of the incidents list
        setTimeout(() => {
          const incidentsList = document.querySelector('#incidents-list');
          if (incidentsList) {
            incidentsList.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
        }, 100);
        
        toast({
          title: "Success",
          description: `${results.length} incident${results.length === 1 ? '' : 's'} organized and saved.`,
        });
      }
    } catch (error: any) {
      setQuickNotesError(error?.message || 'Failed to organize notes. Please try again.');
    } finally {
      setIsOrganizing(false);
    }
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
        <div className="text-center mb-4">
          <p className="text-sm text-muted-foreground">
            Use ClearCase to document workplace incidents, protect your rights, and stay organized.
          </p>
        </div>

        {/* Header */}
        <div className="mb-4 text-center">
          <h1 className="text-lg font-medium text-foreground">Incidents</h1>
          <p className="text-xs text-muted-foreground">All workplace incidents</p>
        </div>

        {/* Action Buttons */}
        <div className="mb-4">
          <div className="mx-auto w-full max-w-xl">
            <div className="bg-card border border-border rounded-2xl shadow-sm p-4 sm:p-5">
              {/* Quick Notes Section */}
              <section aria-labelledby="quick-notes-title">
                <h2 id="quick-notes-title" className="sr-only">Quick Notes</h2>
                
                <div className="mb-4">
                  <label htmlFor="quick-notes-input" className="sr-only">
                    Quick Notes
                  </label>
                  <Textarea
                    id="quick-notes-input"
                    value={quickNotes}
                    onChange={(e) => setQuickNotes(e.target.value)}
                    placeholder="Type or Paste raw incident notes here. Please add Who, What, When, Where, Why, and How to record the most detail..."
                    className="min-h-[240px] max-h-[400px] rounded-2xl border-border shadow-sm resize-none"
                    aria-describedby={quickNotesError ? "quick-notes-error" : "quick-notes-hint"}
                    onKeyDown={(e) => {
                      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
                        e.preventDefault();
                        handleQuickNotesOrganize();
                      }
                    }}
                  />
                  {quickNotesError && (
                    <div 
                      id="quick-notes-error" 
                      className="mt-2 text-xs text-red-600 dark:text-red-400"
                    >
                      {quickNotesError}
                    </div>
                  )}
                </div>
              </section>

              <div className="flex flex-col gap-4 justify-center">
                {/* Organize Quick Notes */}
                <div className="flex flex-col items-center">
                  <Button
                    onClick={handleQuickNotesOrganize}
                    disabled={isOrganizing}
                    aria-label="Organize Quick Notes"
                    className="w-full h-11 rounded-xl font-semibold bg-blue-600 hover:bg-blue-700 text-white transition-all duration-200 hover:scale-[1.02] hover:shadow-lg active:scale-[0.98] disabled:opacity-50 disabled:scale-100"
                  >
                    {isOrganizing ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Organizing...
                      </>
                    ) : (
                      'Organize Quick Notes'
                    )}
                  </Button>
                  <span
                    id="quick-notes-hint"
                    className="mt-2 text-xs leading-5 text-muted-foreground text-center"
                  >
                    Paste raw notes above and AI will structure them into a report.
                  </span>
                </div>

                {/* New Incident */}
                <div className="flex flex-col items-center">
                  <Link to="/add" className="w-full">
                    <Button
                      id="btn-new-incident"
                      aria-describedby="hint-new-incident"
                      className="w-full h-11 rounded-xl font-semibold bg-[hsl(25,95%,53%)] text-white transition-all duration-200 hover:bg-[hsl(25,95%,53%)] hover:scale-[1.02] hover:shadow-lg active:scale-[0.98]"
                    >
                      + New Incident
                    </Button>
                  </Link>
                  <span
                    id="hint-new-incident"
                    className="mt-2 text-xs leading-5 text-muted-foreground text-center"
                  >
                    Log a new workplace incident manually.
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Search and Filter Controls */}
        {organizedIncidents.length > 0 && (
          <div className="mb-6 space-y-3">
            {/* Search Bar */}
            <div className="relative">
              <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search incidents..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-10 rounded-lg"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 rounded-full bg-muted-foreground/20 hover:bg-muted-foreground/40 flex items-center justify-center transition-colors"
                  aria-label="Clear search"
                >
                  <X className="h-3 w-3 text-muted-foreground" />
                </button>
              )}
            </div>
            
            {/* Filter Controls */}
            <div>
              <Select value={filterCategory} onValueChange={setFilterCategory}>
                <SelectTrigger className="w-full rounded-lg">
                  <SelectValue placeholder="Filter by category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {getAllCategories().map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        )}

        {/* Incidents List */}
        <div id="incidents-list" className="space-y-3">
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
          ) : filteredIncidents.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <SearchIcon className="h-8 w-8 text-muted-foreground mb-3" />
                <h3 className="text-sm font-medium mb-1">No incidents found</h3>
                <p className="text-xs text-muted-foreground text-center">
                  Try adjusting your search terms or filters.
                </p>
              </CardContent>
            </Card>
          ) : (
            filteredIncidents.map((incident) => (
                <Card key={incident.id} className="border rounded-lg">
                  <CardContent className="p-3">
                    <div className="space-y-2">
                      {/* Enhanced header with date and category */}
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge variant="secondary" className="text-[10px] px-1.5 py-0.5">
                              {incident.date}
                            </Badge>
                            <Badge variant="outline" className="text-[10px] px-1.5 py-0.5">
                              {incident.categoryOrIssue}
                            </Badge>
                          </div>
                          <h3 className="font-medium text-xs leading-tight mb-1 line-clamp-2">
                            {incident.what.length > 100 ? `${incident.what.substring(0, 100)}...` : incident.what}
                          </h3>
                        </div>
                      </div>

                      {/* Created timestamp */}
                      <div className="text-[10px] text-muted-foreground opacity-75">
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

                      {/* Action buttons */}
                      <div className="flex gap-2 pt-1 justify-center">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="text-[10px] px-2 py-1"
                          onClick={() => setViewIncident(incident)}
                        >
                          View
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="text-[10px] px-2 py-1"
                          onClick={() => setEditIncident(incident)}
                        >
                          Edit
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="text-[10px] px-2 py-1"
                          onClick={() => handleExport(incident)}
                        >
                          Export
                        </Button>
                        <Button 
                          variant="destructive" 
                          size="sm" 
                          className="text-[10px] px-2 py-1"
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