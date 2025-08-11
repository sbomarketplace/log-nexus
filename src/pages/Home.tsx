import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Layout } from '@/components/Layout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { AlertIcon } from '@/components/icons/CustomIcons';
import { SearchIcon, X, Loader2, Info } from 'lucide-react';
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

  // Auto-grow textarea up to max height
  const quickNotesRef = useRef<HTMLTextAreaElement | null>(null);
  const MAX_QN_HEIGHT = 220;
  const MIN_QN_HEIGHT = 136;
  const adjustTextareaHeight = () => {
    const el = quickNotesRef.current;
    if (!el) return;
    el.style.height = 'auto';
    const newHeight = Math.min(Math.max(el.scrollHeight, MIN_QN_HEIGHT), MAX_QN_HEIGHT);
    el.style.height = `${newHeight}px`;
    el.style.overflowY = el.scrollHeight > MAX_QN_HEIGHT ? 'auto' : 'hidden';
  };

  useEffect(() => {
    adjustTextareaHeight();
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
          title: "Notes organized.",
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
              <section aria-labelledby="quick-entry-title">
                <div className="mb-2 flex items-center justify-between">
                  <h2 id="quick-entry-title" className="text-sm font-semibold">Quick Incident Entry</h2>
                  <Popover>
                    <PopoverTrigger asChild>
                      <button
                        type="button"
                        aria-label="Tips for quick entry"
                        className="inline-flex items-center text-muted-foreground hover:text-foreground"
                      >
                        <Info className="h-4 w-4" />
                      </button>
                    </PopoverTrigger>
                    <PopoverContent align="end" className="text-xs max-w-xs">
                      Include Who, What, When, Where, Why, and How for best results.
                    </PopoverContent>
                  </Popover>
                </div>

                <p id="quick-entry-guidance" className="text-xs text-muted-foreground mb-2">
                  Include Who, What, When, Where, Why, and How for best results.
                </p>

                <div className="mb-2">
                  <label htmlFor="quick-notes-input" className="text-xs font-medium text-foreground mb-1 block">
                    Notes
                  </label>
                  <Textarea
                    id="quick-notes-input"
                    ref={quickNotesRef}
                    value={quickNotes}
                    onChange={(e) => setQuickNotes(e.target.value)}
                    onInput={adjustTextareaHeight}
                    placeholder="Type or paste raw notes…"
                    className="rounded-2xl shadow-sm resize-none min-h-[136px] max-h-[220px] border border-border"
                    aria-describedby={`quick-entry-guidance${quickNotesError ? ' quick-notes-error' : ''}`}
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
                      className="mt-1 text-xs text-red-600 dark:text-red-400"
                    >
                      {quickNotesError}
                    </div>
                  )}
                </div>

                <div className="mt-2">
                  <div className="flex flex-wrap gap-2">
                    <Button
                      onClick={handleQuickNotesOrganize}
                      disabled={isOrganizing}
                      aria-label="Organize Quick Notes"
                      className="flex-1 min-w-[150px] h-11 rounded-xl"
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

                    <Link
                      to="/add"
                      onClick={(e) => { if (isOrganizing) e.preventDefault(); }}
                      className="flex-1 min-w-[150px]"
                    >
                      <Button
                        variant="outline"
                        disabled={isOrganizing}
                        aria-label="Log Manually"
                        className="w-full h-11 rounded-xl"
                      >
                        Log Manually
                      </Button>
                    </Link>
                  </div>
                  <p className="mt-2 text-xs text-muted-foreground">AI will structure your notes into a report.</p>
                </div>
              </section>
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