import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import Layout from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { SearchIcon, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { organizeQuickNotes } from '@/lib/invokeOrganizeNotes';
import { OrganizeNotesModal } from '@/components/OrganizeNotesModal';
import { IncidentModal } from '@/components/IncidentModal';
import { ensureAIAllowed } from '@/lib/ai-quota';
import InlineAd from '@/components/ads/InlineAd';
import IncidentExplorer from '@/components/incidents/IncidentExplorer';

import { OrganizedIncident, organizedIncidentStorage } from '@/utils/organizedIncidentStorage';
import { processIncident } from '@/services/incidentProcessor';
import PageHero from '@/components/common/PageHero';
import { cn } from '@/lib/utils';
import { getDateSafely } from '@/utils/safeDate';

// Home page keeps Quick Entry, then uses the shared explorer for the list.
const Home = () => {
  const [organizedIncidents, setOrganizedIncidents] = useState<OrganizedIncident[]>([]);
  const [quickNotes, setQuickNotes] = useState('');
  const [quickNotesTitle, setQuickNotesTitle] = useState('');
  const [quickNotesError, setQuickNotesError] = useState('');
  const [titleError, setTitleError] = useState('');
  const [showPaywall, setShowPaywall] = useState(false);

  const MAX_CHARS = 10000;
  const WARN_THRESHOLD = 8000;
  const [limitReached, setLimitReached] = useState(false);
  const [limitAnnounce, setLimitAnnounce] = useState('');
  const [isOrganizing, setIsOrganizing] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const [searchParams, setSearchParams] = useSearchParams();

  const handleQuickNotesOrganize = async () => {
    await ensureAIAllowed(); // AI is unlimited
    return runOrganize();
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

  useEffect(() => {
    loadIncidents();

    // restore quick notes drafts
    const saved = localStorage.getItem('quickNotesDraft');
    const savedTitle = localStorage.getItem('quickNotesTitleDraft');
    if (saved) setQuickNotes(saved);
    if (savedTitle) setQuickNotesTitle(savedTitle);
  }, []);

  // Save quick notes draft to localStorage (throttled)
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (quickNotes.trim()) localStorage.setItem('quickNotesDraft', quickNotes);
      else localStorage.removeItem('quickNotesDraft');

      if (quickNotesTitle.trim()) localStorage.setItem('quickNotesTitleDraft', quickNotesTitle);
      else localStorage.removeItem('quickNotesTitleDraft');
    }, 500);
    return () => clearTimeout(timeoutId);
  }, [quickNotes, quickNotesTitle]);

  // Auto-grow textarea
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
  useEffect(() => { adjustTextareaHeight(); }, [quickNotes]);

  const runOrganize = async () => {
    await ensureAIAllowed(); // AI is unlimited
    setQuickNotesError('');
    setTitleError('');

    const trimmedTitle = quickNotesTitle.trim();
    if (!trimmedTitle) {
      setTitleError('Title is required');
      toast({ title: "Add a title", description: "A title is required before you can organize notes.", variant: "destructive" });
      return;
    }
    if (trimmedTitle.length > 80) {
      setTitleError('Title must be 80 characters or fewer');
      toast({ title: "Title too long", description: "Keep it under 80 characters.", variant: "destructive" });
      return;
    }
    if (!quickNotes.trim()) {
      setQuickNotesError('Please enter notes to organize.');
      return;
    }

    setIsOrganizing(true);
    try {
      const result = await organizeQuickNotes({ title: quickNotesTitle, notes: quickNotes });
      const results = result?.normalized?.incidents || [];

      if (!results?.length) {
        setQuickNotesError('No incidents were identified. Please review your notes and try again.');
      } else {
        const incidentsToSave = await Promise.all(
          results.map(async (incident: any) => {
            const baseIncident: OrganizedIncident = {
              id: crypto.randomUUID(),
              title: trimmedTitle,
              date: getDateSafely(incident, ''),
              categoryOrIssue: incident.categoryOrIssue,
              who: incident.who,
              what: incident.what,
              where: incident.where,
              when: incident.when,
              witnesses: incident.witnesses,
              notes: incident.notes,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            };
            return await processIncident(baseIncident, {
              authorPerspective: 'first_person',
              rawNotes: quickNotes,
              improveGrammar: false,
            });
          })
        );

        organizedIncidentStorage.saveMultiple(incidentsToSave);

        setQuickNotes('');
        setQuickNotesTitle('');
        setLimitReached(false);
        setLimitAnnounce('');
        localStorage.removeItem('quickNotesDraft');
        localStorage.removeItem('quickNotesTitleDraft');

        // open the first new incident in the shared explorer modal via URL param
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

  return (
    <Layout>
      <div className="max-w-screen-md mx-auto px-4 space-y-4">
        {/* Quick Incident Entry */}
        <div className="mb-4">
          <div className="mx-auto w-full max-w-xl">
            <div className="bg-card border border-border rounded-2xl shadow-sm p-4 sm:p-5">
              <section aria-labelledby="quick-entry-title">
                <PageHero 
                  title="Quick Incident Entry" 
                  subtitle="Use ClearCase to document workplace incidents, protect your rights, and stay organized."
                  pad="pt-3"
                />
                <p id="quick-entry-guidance" className="text-xs text-muted-foreground mb-3">
                  Include Who, What, When, Where, Why, and How for best results.
                </p>

                {/* Title */}
                <div className="mb-3">
                  <div className="mb-1 flex items-baseline justify-between gap-2 flex-wrap">
                    <label htmlFor="quick-title-input" className="text-xs font-medium text-foreground block">
                      Title <span className="text-red-600">*</span>
                    </label>
                    <span className="text-xs text-muted-foreground">{80 - quickNotesTitle.length} characters left</span>
                  </div>
                  <Input
                    id="quick-title-input"
                    type="text"
                    value={quickNotesTitle}
                    onChange={(e) => {
                      const value = e.target.value.slice(0, 80);
                      if (titleError) setTitleError('');
                      setQuickNotesTitle(value);
                    }}
                    onBlur={() => setQuickNotesTitle((prev) => prev.trim())}
                    required
                    maxLength={80}
                    placeholder="Short, clear title (max 80)"
                    className={cn("rounded-2xl shadow-sm border border-border", titleError ? "border-red-500 animate-shake" : "")}
                    aria-invalid={Boolean(titleError)}
                    aria-describedby={titleError ? "title-error" : undefined}
                  />
                  {titleError && <div id="title-error" className="mt-1 text-xs text-red-600">{titleError}</div>}
                </div>

                {/* Notes */}
                <div className="mb-2">
                  <div className="mb-1 flex items-baseline justify-between gap-2 flex-wrap">
                    <label htmlFor="quick-notes-input" className="text-xs font-medium text-foreground block">Notes</label>
                    <span id="quick-notes-counter" role="status" aria-live="polite" className={`text-xs ${quickNotes.length >= MAX_CHARS ? 'text-destructive' : quickNotes.length >= WARN_THRESHOLD ? 'text-primary' : 'text-muted-foreground'} ml-auto`}>
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
                      // adjust height
                      const el = quickNotesRef.current;
                      if (el) {
                        el.style.height = 'auto';
                        const newHeight = Math.min(Math.max(el.scrollHeight, 225), 375);
                        el.style.height = `${newHeight}px`;
                        el.style.overflowY = el.scrollHeight > 375 ? 'auto' : 'hidden';
                      }
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
                        const area = quickNotesRef.current;
                        if (area) {
                          area.style.height = 'auto';
                          const newHeight = Math.min(Math.max(area.scrollHeight, 225), 375);
                          area.style.height = `${newHeight}px`;
                          area.style.overflowY = area.scrollHeight > 375 ? 'auto' : 'hidden';
                        }
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
                  {limitReached && <div id="quick-notes-limit" className="mt-1 text-xs text-destructive">Limit reached (10,000 characters).</div>}
                  {quickNotesError && <div id="quick-notes-error" className="mt-1 text-xs text-red-600">{quickNotesError}</div>}
                </div>

                <div className="mt-2">
                  <div className="flex flex-wrap gap-2">
                    <Button onClick={handleQuickNotesOrganize} disabled={isOrganizing} aria-label="Organize Quick Notes" className="flex-1 min-w-[150px] h-11 rounded-xl">
                      {isOrganizing ? (<><Loader2 className="h-4 w-4 mr-2 animate-spin" />Organizing...</>) : ('Organize Quick Notes')}
                    </Button>
                    <Link to="/add" onClick={(e) => { if (isOrganizing) e.preventDefault(); }} className="flex-1 min-w-[150px]">
                      <Button variant="outline" disabled={isOrganizing} aria-label="Log Manually" className="w-full h-11 rounded-xl">Log Manually</Button>
                    </Link>
                  </div>
                  <p className="mt-2 text-xs text-muted-foreground">AI will structure your notes into a report.</p>
                </div>
              </section>
            </div>
          </div>
        </div>

        {/* Inline banner that is already on Home */}
        <InlineAd slot="home" />

        {/* Shared explorer renders the full list, search, filters, modals */}
        <IncidentExplorer />
      </div>
    </Layout>
  );
};

export default Home;
