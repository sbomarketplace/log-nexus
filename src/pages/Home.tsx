import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
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
import { IncidentModal } from '@/components/IncidentModal';
import { withAIGate } from '@/utils/aiGate';
import { PaywallWrapper } from '@/components/paywall/PaywallWrapper';
import { IncidentCard } from '@/components/IncidentCard';
import { ViewIncidentModal } from '@/components/ViewIncidentModal';
import { ExportOptionsModal } from '@/components/ExportOptionsModal';
import { IncidentListControls } from '@/components/IncidentListControls';
import { BulkBarMobile } from '@/components/BulkBarMobile';

import { OrganizedIncident, organizedIncidentStorage } from '@/utils/organizedIncidentStorage';
import { getAllCategories } from '@/utils/incidentCategories';
import { processIncident } from '@/services/incidentProcessor';
import { makePhoneNumbersClickable } from '@/utils/phoneUtils';
import { getDateSafely, hasValidDate } from '@/utils/safeDate';
import { getPreferredDateTime } from '@/utils/timelineParser';
import { deriveIncidentOccurrence, formatPrimaryChip, formatTimeChip, formatSecondaryCreated, formatRelativeUpdate, hasTimeOnly } from '@/ui/incidentDisplay';
import { cn } from '@/lib/utils';
import { usePin } from '@/state/pin';

import jsPDF from 'jspdf';

const Home = () => {
  const [organizedIncidents, setOrganizedIncidents] = useState<OrganizedIncident[]>([]);
  const [filteredIncidents, setFilteredIncidents] = useState<OrganizedIncident[]>([]);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [exportIncident, setExportIncident] = useState<OrganizedIncident | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'date' | 'category'>('date');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const orderWithPins = usePin((s) => s.orderWithPins);
  // Quick notes state
  const [quickNotes, setQuickNotes] = useState('');
  const [quickNotesTitle, setQuickNotesTitle] = useState('');
  const [quickNotesError, setQuickNotesError] = useState('');
  const [titleError, setTitleError] = useState('');
  const [showPaywall, setShowPaywall] = useState(false);
  
  const openPaywall = () => setShowPaywall(true);
  const MAX_CHARS = 10000;
  const WARN_THRESHOLD = 8000;
  const [limitReached, setLimitReached] = useState(false);
  const [limitAnnounce, setLimitAnnounce] = useState('');
  const [isOrganizing, setIsOrganizing] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  
  // Query params for modal management
  const [searchParams, setSearchParams] = useSearchParams();
  const incidentId = searchParams.get('incidentId');
  const mode = searchParams.get('mode'); // 'edit' or null (for view)

  const handleSaveAndView = (savedIncident: OrganizedIncident) => {
    // Reload incidents to reflect changes
    loadIncidents();
    // Switch to view mode
    setSearchParams({ incidentId: savedIncident.id });
  };

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
      // Normalize search term for case number matching (remove spaces, punctuation, lowercase)
      const searchNorm = searchTerm.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
      
      filtered = filtered.filter(incident => 
        // Search in title (new field)
        (incident.title && incident.title.toLowerCase().includes(searchLower)) ||
        incident.what.toLowerCase().includes(searchLower) ||
        incident.who.toLowerCase().includes(searchLower) ||
        incident.where.toLowerCase().includes(searchLower) ||
        incident.categoryOrIssue.toLowerCase().includes(searchLower) ||
        incident.notes.toLowerCase().includes(searchLower) ||
        // Case number exact match
        (incident.caseNumber && incident.caseNumber.toLowerCase().includes(searchLower)) ||
        // Case number normalized partial match (strips punctuation/spaces for flexible matching)
        (incident.caseNumber && searchNorm && 
         incident.caseNumber.replace(/[^a-zA-Z0-9]/g, '').toLowerCase().includes(searchNorm))
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
    
    // Listen for incidents updates from bulk operations
    const handleIncidentsUpdated = () => {
      loadIncidents();
    };
    
    window.addEventListener('incidentsUpdated', handleIncidentsUpdated);
    
    // Restore quick notes draft from localStorage
    const saved = localStorage.getItem('quickNotesDraft');
    const savedTitle = localStorage.getItem('quickNotesTitleDraft');
    if (saved) {
      setQuickNotes(saved);
    }
    if (savedTitle) {
      setQuickNotesTitle(savedTitle);
    }
    
    return () => {
      window.removeEventListener('incidentsUpdated', handleIncidentsUpdated);
    };
  }, []);

  // Save quick notes draft to localStorage (throttled)
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (quickNotes.trim()) {
        localStorage.setItem('quickNotesDraft', quickNotes);
      } else {
        localStorage.removeItem('quickNotesDraft');
      }
      
      if (quickNotesTitle.trim()) {
        localStorage.setItem('quickNotesTitleDraft', quickNotesTitle);
      } else {
        localStorage.removeItem('quickNotesTitleDraft');
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [quickNotes, quickNotesTitle]);

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

  const runOrganize = async () => {
    setQuickNotesError('');
    setTitleError('');
    
    // Validate title
    const trimmedTitle = quickNotesTitle.trim();
    if (!trimmedTitle) {
      setTitleError('Title is required');
      toast({
        title: "Add a title",
        description: "A title is required before you can organize notes.",
        variant: "destructive",
      });
      return;
    }
    
    if (trimmedTitle.length > 80) {
      setTitleError('Title must be 80 characters or fewer');
      toast({
        title: "Title too long",
        description: "Keep it under 80 characters.",
        variant: "destructive",
      });
      return;
    }
    
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
        const incidentsToSave = await Promise.all(results.map(async incident => {
          const baseIncident: OrganizedIncident = {
            id: crypto.randomUUID(),
            title: trimmedTitle, // Use the provided title
            date: getDateSafely(incident, ''),
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
          
          // Process incident for enhanced features (fast parsing)
          return await processIncident(baseIncident, {
            authorPerspective: 'first_person',
            rawNotes: quickNotes,
            improveGrammar: false
          });
        }));
        
        organizedIncidentStorage.saveMultiple(incidentsToSave);
        
        // Clear the textarea and draft
        setQuickNotes('');
        setQuickNotesTitle('');
        setLimitReached(false);
        setLimitAnnounce('');
        localStorage.removeItem('quickNotesDraft');
        localStorage.removeItem('quickNotesTitleDraft');
        loadIncidents();
        
        // Success toast is already shown by organizer.ts

        // Scroll to incident reports section after organizing
        setTimeout(() => {
          const incidentSection = document.querySelector('[data-incident-reports-section]');
          if (incidentSection) {
            incidentSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
        }, 100);

        // Open the incident modal for the first organized incident
        if (incidentsToSave.length > 0) {
          setSearchParams({ incidentId: incidentsToSave[0].id });
        }
      }
    } catch (error: any) {
      setQuickNotesError(error?.message || 'Failed to organize notes. Please try again.');
    } finally {
      setIsOrganizing(false);
    }
  };

  const handleQuickNotesOrganize = withAIGate(runOrganize, openPaywall);

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
    // First check for preferred date from original text
    if (incident.originalEventDateText || incident.timeline) {
      const preferred = getPreferredDateTime(incident);
      
      if (preferred.date) {
        try {
          const date = new Date(preferred.date);
          if (!isNaN(date.getTime())) {
            return date.toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric'
            });
          }
        } catch {
          // Fall through to canonical date
        }
      }
    }
    
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

    // Parse the date string to check if it's the current year - null safety
    const dateString = getDateSafely(incident, '');
    if (!dateString || dateString === 'No date' || dateString === 'Unknown date') {
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



  const handleViewIncident = (incident: OrganizedIncident) => {
    setSearchParams({ incidentId: incident.id });
  };

  // handleEditIncident removed - old Edit behavior disabled
  // const handleEditIncident = (incident: OrganizedIncident) => {
  //   setSearchParams({ incidentId: incident.id, mode: 'edit' });
  // };

  const handleCloseIncidentModal = () => {
    setSearchParams({});
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

                <p id="quick-entry-guidance" className="text-xs text-muted-foreground mb-3">
                  Include Who, What, When, Where, Why, and How for best results.
                </p>

                {/* Title Input */}
                <div className="mb-3">
                  <div className="mb-1 flex items-baseline justify-between gap-2 flex-wrap">
                    <label htmlFor="quick-title-input" className="text-xs font-medium text-foreground block">
                      Title <span className="text-red-600">*</span>
                    </label>
                    <span className="text-xs text-muted-foreground">
                      {80 - quickNotesTitle.length} characters left
                    </span>
                  </div>
                  <Input
                    id="quick-title-input"
                    type="text"
                    value={quickNotesTitle}
                    onChange={(e) => {
                      const value = e.target.value.slice(0, 80);
                      setQuickNotesTitle(value);
                      if (titleError) {
                        setTitleError('');
                      }
                    }}
                    onBlur={() => setQuickNotesTitle(prev => prev.trim())}
                    required
                    maxLength={80}
                    placeholder="Short, clear title (max 80)"
                    className={cn(
                      "rounded-2xl shadow-sm border border-border",
                      titleError ? "border-red-500 animate-shake" : ""
                    )}
                    aria-invalid={Boolean(titleError)}
                    aria-describedby={titleError ? "title-error" : undefined}
                  />
                  {titleError && (
                    <div id="title-error" className="mt-1 text-xs text-red-600">
                      {titleError}
                    </div>
                  )}
                </div>

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
                placeholder="Search by keyword, person, or Case #"
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
        <div className="space-y-3 incident-list">
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
            <>
              <IncidentListControls visibleIds={filteredIncidents.map(i => i.id)} />
              
              {filteredIncidents.length === 0 ? (
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
                orderWithPins(filteredIncidents).map((incident, index) => (
                  <IncidentCard
                    key={incident.id}
                    incident={incident}
                    index={index}
                    pageIds={orderWithPins(filteredIncidents).map(i => i.id)}
                    onView={() => handleViewIncident(incident)}
                    onExport={() => handleExport(incident)}
                    onDelete={() => setDeleteId(incident.id)}
                    onUpdate={loadIncidents}
                    getCategoryTagClass={getCategoryTagClass}
                    initialEditMode={mode === 'edit' && incident.id === incidentId}
                  />
                ))
              )}
            </>
          )}
        </div>
        
        <BulkBarMobile />

        {/* Unified Incident Modal - View Mode */}
        {incidentId && mode !== 'edit' && (
          <ViewIncidentModal 
            incident={organizedIncidents.find(i => i.id === incidentId) || null}
            open={!!incidentId && mode !== 'edit'}
            onOpenChange={(open) => !open && handleCloseIncidentModal()}
            onIncidentUpdate={loadIncidents}
          />
        )}

        {/* Edit Modal - disabled, old Edit behavior removed */}
        {/* {incidentId && mode === 'edit' && (
          <EditIncidentModal 
            incident={organizedIncidents.find(i => i.id === incidentId) || null}
            open={!!incidentId && mode === 'edit'}
            onOpenChange={(open) => !open && handleCloseIncidentModal()}
            onSaveAndView={handleSaveAndView}
          />
        )} */}

        {/* Legacy Incident Modal for backwards compatibility */}
        <IncidentModal 
          incidentId={null}
          open={false}
          onOpenChange={() => {}}
          onIncidentUpdate={loadIncidents}
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
      
      <PaywallWrapper
        isOpen={showPaywall}
        onClose={() => setShowPaywall(false)}
      />
    </Layout>
  );
};

export default Home;