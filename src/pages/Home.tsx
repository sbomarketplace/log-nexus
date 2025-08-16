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
import { ExportOptionsModal } from '@/components/ExportOptionsModal';

import { OrganizedIncident, organizedIncidentStorage } from '@/utils/organizedIncidentStorage';
import { getAllCategories } from '@/utils/incidentCategories';
import { processIncident } from '@/services/incidentProcessor';
import { makePhoneNumbersClickable } from '@/utils/phoneUtils';

import jsPDF from 'jspdf';

const Home = () => {
  const [organizedIncidents, setOrganizedIncidents] = useState<OrganizedIncident[]>([]);
  const [filteredIncidents, setFilteredIncidents] = useState<OrganizedIncident[]>([]);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [viewIncident, setViewIncident] = useState<OrganizedIncident | null>(null);
  const [editIncident, setEditIncident] = useState<OrganizedIncident | null>(null);
  const [exportIncident, setExportIncident] = useState<OrganizedIncident | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'date' | 'category'>('date');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  // Quick notes state
  const [quickNotes, setQuickNotes] = useState('');
  const [quickNotesError, setQuickNotesError] = useState('');
  const MAX_CHARS = 10000;
  const WARN_THRESHOLD = 8000;
  const [limitReached, setLimitReached] = useState(false);
  const [limitAnnounce, setLimitAnnounce] = useState('');
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
  const MAX_QN_HEIGHT = 375;
  const MIN_QN_HEIGHT = 225;
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

  const handleOrganizeCompleteWithScroll = () => {
    loadIncidents();
    // Scroll to incident reports section after modal closes
    setTimeout(() => {
      const incidentSection = document.querySelector('[data-incident-reports-section]');
      if (incidentSection) {
        incidentSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 100);
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
        // Save all organized incidents with processing
        const incidentsToSave = results.map(incident => {
          const baseIncident: OrganizedIncident = {
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
          };
          
          // Process incident for enhanced features
          return processIncident(baseIncident, {
            authorPerspective: 'first_person',
            rawNotes: quickNotes
          });
        });
        
        organizedIncidentStorage.saveMultiple(incidentsToSave);
        
        // Clear the textarea and draft
        setQuickNotes('');
        setLimitReached(false);
        setLimitAnnounce('');
        localStorage.removeItem('quickNotesDraft');
        loadIncidents();
        
        toast({
          title: "Notes organized.",
        });

        // Scroll to incident reports section after organizing
        setTimeout(() => {
          const incidentSection = document.querySelector('[data-incident-reports-section]');
          if (incidentSection) {
            incidentSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
        }, 100);

        // Navigate to the first incident's details
        if (incidentsToSave.length > 0) {
          setViewIncident(incidentsToSave[0]);
        }
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

  const formatDate = (incident: OrganizedIncident): string => {
    // Use canonical date if available
    if (incident.canonicalEventDate) {
      try {
        const date = new Date(incident.canonicalEventDate);
        const hasTime = date.getHours() !== 12 || date.getMinutes() !== 0;
        
        if (hasTime) {
          return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: 'numeric',
            minute: '2-digit'
          });
        }
        
        return date.toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric'
        });
      } catch {
        // Fall through to legacy formatting
      }
    }

    const dateString = incident.date;
    if (!dateString || dateString === 'No date' || dateString.trim() === '') {
      return 'No date';
    }
    
    try {
      // Handle various date formats
      let date: Date;
      
      // Check if it's already in a good format like "Aug 11, 2024"
      if (dateString.match(/^[A-Za-z]{3}\s+\d{1,2},\s+\d{4}$/)) {
        return dateString;
      }
      
      // Handle MM/DD/YYYY or similar formats
      if (dateString.match(/^\d{1,2}\/\d{1,2}(\/\d{2,4})?$/)) {
        const parts = dateString.split('/');
        const currentYear = new Date().getFullYear();
        const year = parts[2] ? (parts[2].length === 2 ? 2000 + parseInt(parts[2]) : parseInt(parts[2])) : currentYear;
        date = new Date(year, parseInt(parts[0]) - 1, parseInt(parts[1]));
      } else {
        date = new Date(dateString);
      }
      
      if (isNaN(date.getTime())) {
        return 'No date';
      }
      
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
    } catch {
      return 'No date';
    }
  };

  const extractDateFromContent = (incident: OrganizedIncident): string => {
    // Use the new formatDate function that handles canonical dates
    return formatDate(incident);
  };

  const getCategoryTagClass = (category: string) => {
    const lowerCategory = category.toLowerCase();
    if (lowerCategory.includes('safety') || lowerCategory.includes('accident') || lowerCategory.includes('injury')) {
      return 'category-safety';
    } else if (lowerCategory.includes('harassment') || lowerCategory.includes('discrimination') || lowerCategory.includes('bullying')) {
      return 'category-harassment';
    } else if (lowerCategory.includes('wrongful') || lowerCategory.includes('accusation') || lowerCategory.includes('false')) {
      return 'category-accusation';
    } else if (lowerCategory.includes('policy') || lowerCategory.includes('violation') || lowerCategory.includes('misconduct')) {
      return 'category-policy';
    } else {
      return 'category-default';
    }
  };



  const handleExport = (incident: OrganizedIncident) => {
    setExportIncident(incident);
  };

  return (
    <Layout>
      <div className="space-y-4 -mt-4">
        {/* Action Buttons */}
        <div className="mb-4">
          <div className="mx-auto w-full max-w-xl">
            <div className="bg-card border border-border rounded-2xl shadow-sm p-4 sm:p-5">
              <section aria-labelledby="quick-entry-title">
                <div className="mb-2 text-center">
                  <h2 id="quick-entry-title" className="text-sm font-semibold">Quick Incident Entry</h2>
                </div>

                <p className="text-xs text-muted-foreground mb-2">
                  Use ClearCase to document workplace incidents, protect your rights, and stay organized.
                </p>

                <p id="quick-entry-guidance" className="text-xs text-muted-foreground mb-2">
                  Include Who, What, When, Where, Why, and How for best results.
                </p>

                <div className="mb-2">
                  <div className="mb-1 flex items-baseline justify-between gap-2 flex-wrap">
                    <label htmlFor="quick-notes-input" className="text-xs font-medium text-foreground block">
                      Notes
                    </label>
                    <span
                      id="quick-notes-counter"
                      role="status"
                      aria-live="polite"
                      className={`text-xs ${quickNotes.length >= MAX_CHARS ? 'text-destructive' : quickNotes.length >= WARN_THRESHOLD ? 'text-primary' : 'text-muted-foreground'} ml-auto`}
                    >
                      {quickNotes.length} / 10,000
                    </span>
                  </div>
                  <Textarea
                    id="quick-notes-input"
                    ref={quickNotesRef}
                    value={quickNotes}
                    onInput={(e) => {
                      let v = (e.currentTarget as HTMLTextAreaElement).value;
                      if (v.length > MAX_CHARS) {
                        v = v.slice(0, MAX_CHARS);
                        setLimitAnnounce("Character limit reached.");
                        setLimitReached(true);
                      } else {
                        setLimitAnnounce("");
                        setLimitReached(false);
                      }
                      setQuickNotes(v);
                      adjustTextareaHeight();
                    }}
                    onPaste={(e) => {
                      const el = e.currentTarget;
                      const paste = e.clipboardData.getData("text");
                      const start = el.selectionStart ?? el.value.length;
                      const end = el.selectionEnd ?? el.value.length;
                      const before = el.value.slice(0, start);
                      const after = el.value.slice(end);
                      const remaining = MAX_CHARS - (before.length + after.length);
                      const insert = remaining > 0 ? paste.slice(0, remaining) : "";
                      let next = before + insert + after;
                      if (next.length >= MAX_CHARS) {
                        setLimitAnnounce("Character limit reached.");
                        setLimitReached(true);
                      } else {
                        setLimitAnnounce("");
                        setLimitReached(false);
                      }
                      e.preventDefault();
                      setQuickNotes(next);
                      setTimeout(() => {
                        adjustTextareaHeight();
                      }, 0);
                    }}
                    placeholder="Type or paste raw notes…"
                    className="rounded-2xl shadow-sm resize-none min-h-[225px] max-h-[375px] border border-border"
                    aria-describedby={`quick-entry-guidance quick-notes-counter${quickNotesError ? ' quick-notes-error' : ''}${limitReached ? ' quick-notes-limit' : ''}`}
                    onKeyDown={(e) => {
                      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
                        e.preventDefault();
                        handleQuickNotesOrganize();
                      }
                    }}
                  />
                  <div aria-live="polite" className="sr-only">{limitAnnounce}</div>
                  {limitReached && (
                    <div id="quick-notes-limit" className="mt-1 text-xs text-destructive">
                      Limit reached (10,000 characters).
                    </div>
                  )}
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

        {/* Section Title and Search/Filter Controls */}
        {organizedIncidents.length > 0 && (
          <div className="mb-6 space-y-4" data-incident-reports-section>
            {/* Section Title */}
            <div className="space-y-1 text-center">
              <h2 className="text-xl font-bold text-foreground">Workplace Incident Reports</h2>
              <p className="text-sm text-muted-foreground">View, edit, export, or delete any past incident reports</p>
            </div>

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
                <Card key={incident.id} className="border rounded-lg shadow-sm hover:shadow-md transition-shadow overflow-hidden">
                  <CardContent className="p-3">
                    <div className="space-y-2">
                      {/* Date and category badges in responsive header row - category wraps below date if needed */}
                      <div className="flex flex-col gap-1 mb-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge 
                            variant="secondary" 
                            className="text-xs px-2 py-1 font-medium shrink-0 h-7 flex items-center bg-muted text-muted-foreground border"
                          >
                            {extractDateFromContent(incident)}
                          </Badge>
                          <div className={`${getCategoryTagClass(incident.categoryOrIssue)} text-white text-xs font-medium h-7 px-2 rounded-full flex items-center justify-center break-words min-w-0 flex-1`}
                               style={{ fontSize: 'clamp(10px, 1.6vw, 12px)' }}>
                            {incident.categoryOrIssue}
                          </div>
                        </div>
                      </div>

                       {/* Title/Description - compact and clean, with phone number support */}
                       <div className="min-h-[2.5rem]">
                         <h3 className="text-xs font-medium leading-snug text-foreground line-clamp-2 break-words overflow-wrap-anywhere">
                           <span dangerouslySetInnerHTML={{ __html: makePhoneNumbersClickable(incident.what) }} />
                         </h3>
                       </div>

                      {/* Created timestamp - smaller and lighter */}
                      <div className="text-[9px] text-muted-foreground">
                        Created {new Date(incident.createdAt).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          hour: 'numeric',
                          minute: '2-digit'
                        })}
                        {incident.updatedAt !== incident.createdAt && (
                          <span className="ml-1">
                            • Updated {new Date(incident.updatedAt).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric'
                            })}
                          </span>
                        )}
                      </div>

                      {/* Compact action bar */}
                      <div className="flex gap-1.5 pt-1">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="text-[10px] px-2.5 py-1 h-7 flex-1"
                          onClick={() => setViewIncident(incident)}
                        >
                          View
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="text-[10px] px-2.5 py-1 h-7 flex-1"
                          onClick={() => setEditIncident(incident)}
                        >
                          Edit
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="text-[10px] px-2.5 py-1 h-7 flex-1"
                          onClick={() => handleExport(incident)}
                        >
                          Export
                        </Button>
                        <Button 
                          variant="destructive" 
                          size="sm" 
                          className="text-[10px] px-2.5 py-1 h-7 flex-1"
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

        {/* Export Options Modal */}
        <ExportOptionsModal 
          incident={exportIncident}
          open={!!exportIncident}
          onOpenChange={(open) => !open && setExportIncident(null)}
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