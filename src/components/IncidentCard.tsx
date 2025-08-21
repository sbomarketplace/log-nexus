import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { CalendarIcon, ClockIcon, Hash, X, FileDown, Trash2 } from 'lucide-react';
import { caseChipText } from '@/lib/caseFormat';
import { OrganizedIncident, organizedIncidentStorage } from '@/utils/organizedIncidentStorage';
import { deriveIncidentOccurrence, formatPrimaryChip, formatTimeChip, formatSecondaryCreated, formatRelativeUpdate, hasTimeOnly } from '@/ui/incidentDisplay';
import { makePhoneNumbersClickable } from '@/utils/phoneUtils';
import { showSuccessToast, showErrorToast } from '@/lib/showToast';
import { useSelection } from "@/state/selection";
import { cn } from '@/lib/utils';

// Ultra-compact chip component for mobile
function ChipXs({ children, icon }: { children: React.ReactNode; icon?: React.ReactNode }) {
  return (
    <span
      className="
        inline-flex items-center gap-1 rounded-full
        bg-muted/80 text-foreground/80
        px-2 py-[3px]
        text-[11px] sm:text-[12px] leading-tight
        max-w-full
      "
    >
      {icon}
      <span className="truncate">{children}</span>
    </span>
  );
}

type Draft = {
  datePart?: string | null;    // "YYYY-MM-DD"
  timePart?: string | null;    // "HH:mm" 24h
  dateTime?: string | null;    // ISO (UTC)
  caseNumber?: string | null;
  category?: string | null;
  who?: string;                // comma-separated
  what?: string | null;        // summary / what
  where?: string | null;
  witnesses?: string;          // comma- or line-separated
  quotes?: string;             // bullets or lines
  requests?: string;
  notes?: string;              // raw notes
  title?: string;              // Add title field
};

interface IncidentCardProps {
  incident: OrganizedIncident;
  onView: () => void;
  onExport: () => void;
  onDelete: () => void;
  onUpdate: () => void;
  getCategoryTagClass: (category: string) => string;
  index?: number;
  pageIds?: string[];
}

export const IncidentCard = ({ 
  incident, 
  onView, 
  onExport, 
  onDelete, 
  onUpdate, 
  getCategoryTagClass,
  index,
  pageIds = []
}: IncidentCardProps) => {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<Draft>(buildDraft(incident));
  const [saving, setSaving] = useState(false);
  const [isAccordionOpen, setIsAccordionOpen] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const bodyRef = useRef<HTMLDivElement>(null);
  const firstInputRef = useRef<HTMLInputElement>(null);
  const { isSelected, toggle } = useSelection();
  const checked = isSelected(incident.id);

  const dirty = isDirty(incident, draft);

  // Rebuild draft when incident changes
  useEffect(() => {
    setDraft(buildDraft(incident));
  }, [incident]);

  // Helper functions
  function buildDraft(i: OrganizedIncident): Draft {
    // Prefer parts if present, else split dateTime into local for inputs
    const base: Draft = {
      caseNumber: i.caseNumber ?? "",
      category: i.categoryOrIssue ?? "",
      who: Array.isArray(i.who) ? i.who.join(", ") : (i.who ?? ""),
      what: i.what ?? "",
      where: i.where ?? "",
      witnesses: Array.isArray(i.witnesses) ? i.witnesses.join(", ") : (i.witnesses ?? ""),
      quotes: Array.isArray(i.quotes) ? i.quotes.map((q: string) => `- ${q}`).join("\n") : (i.quotes ?? ""),
      requests: i.requests ?? "",
      notes: i.notes ?? "",
      title: i.title ?? "", // Add title to draft
    };

    if (i.datePart || i.timePart) {
      return {
        ...base,
        datePart: i.datePart ?? null,
        timePart: i.timePart ?? null,
        dateTime: null
      };
    }
    if (i.dateTime) {
      const d = new Date(i.dateTime); // stored UTC, shown local
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, "0");
      const day = String(d.getDate()).padStart(2, "0");
      const hh = String(d.getHours()).padStart(2, "0");
      const mm = String(d.getMinutes()).padStart(2, "0");
      return { 
        ...base,
        datePart: `${y}-${m}-${day}`, 
        timePart: `${hh}:${mm}`, 
        dateTime: null 
      };
    }
    return { 
      ...base,
      datePart: null, 
      timePart: null, 
      dateTime: null 
    };
  }

  function isDirty(i: OrganizedIncident, d: Draft): boolean {
    // Compare with normalized current
    const a = buildDraft(i);
    return JSON.stringify(a) !== JSON.stringify({ ...d, dateTime: null });
  }

  function sanitizeCase(s: string): string {
    return s.replace(/[^A-Za-z0-9\-\/ ]/g, "").replace(/\s{2,}/g, " ").trim();
  }

  // Event handlers
  const handleEditClick = () => {
    setEditing(true);
    // Focus first editable field after state update
    setTimeout(() => {
      firstInputRef.current?.focus();
    }, 50);
  };

  const handleCancel = () => {
    if (dirty) {
      if (window.confirm('You have unsaved changes. Discard your changes?')) {
        setDraft(buildDraft(incident));
        setEditing(false);
      }
    } else {
      setEditing(false);
    }
  };

  const saveFromCard = async () => {
    try {
      setSaving(true);
      console.log('Save attempt - draft:', draft);
      console.log('Save attempt - incident before:', incident);

      // Validate title
      const cleanTitle = (draft.title || "").trim();
      if (!cleanTitle) {
        showErrorToast("Add a title", "Title is required.");
        return;
      }
      if (cleanTitle.length > 80) {
        showErrorToast("Title too long", "Keep it under 80 characters.");
        return;
      }

      // Build payload per rules
      const payload: any = {
        title: cleanTitle,
        caseNumber: draft.caseNumber?.trim() || null,
        categoryOrIssue: draft.category || null,
        what: draft.what?.trim() ?? null,
        where: draft.where?.trim() ?? null,
        requests: draft.requests?.trim() ?? null,
        notes: draft.notes?.trim() ?? null,
        updatedAt: new Date().toISOString()
      };

      // Parse people, witnesses, quotes
      const split = (s?: string) => (s || "").split(/[\n,]+/).map(t => t.trim()).filter(Boolean);
      payload.who = split(draft.who);
      payload.witnesses = split(draft.witnesses);
      payload.quotes = draft.quotes ? draft.quotes.split(/\n+/).map(l => l.replace(/^-\s*/, "").trim()).filter(Boolean) : [];

      const hasDate = Boolean(draft.datePart);
      const hasTime = Boolean(draft.timePart);
      console.log('Date/time processing:', { hasDate, hasTime, datePart: draft.datePart, timePart: draft.timePart });

      if (hasDate && hasTime) {
        // Combine local date+time -> UTC ISO
        const local = new Date(`${draft.datePart}T${draft.timePart}:00`);
        payload.dateTime = local.toISOString();
        payload.datePart = null;
        payload.timePart = null;
        console.log('Combined date+time:', { local: local.toString(), utc: payload.dateTime });
      } else if (hasDate) {
        payload.datePart = draft.datePart;
        payload.timePart = null;
        payload.dateTime = null;
        console.log('Date only:', payload.datePart);
      } else if (hasTime) {
        payload.timePart = draft.timePart;
        payload.datePart = null;
        payload.dateTime = null;
        console.log('Time only:', payload.timePart);
      } else {
        payload.dateTime = null;
        payload.datePart = null;
        payload.timePart = null;
        console.log('No date/time');
      }

      console.log('Final payload:', payload);

      // Update the incident
      const updatedIncident = { ...incident, ...payload };
      console.log('Updated incident:', updatedIncident);
      organizedIncidentStorage.save(updatedIncident);

      // Exit edit mode
      setEditing(false);
      setDraft(buildDraft(updatedIncident));

      // Green toast 2.5s
      showSuccessToast("Incident updated successfully", undefined); 

      // Notify parent to refresh
      onUpdate();

    } catch (e) {
      console.error('Error saving incident:', e);
      showErrorToast("Could not save", undefined);
    } finally {
      setSaving(false);
    }
  };

  // Keyboard handling
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!editing) return;
      
      if (e.key === 'Escape') {
        e.preventDefault();
        handleCancel();
      } else if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        if (dirty && !saving) {
          saveFromCard();
        }
      }
    };

    if (editing) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [editing, dirty, saving]);

  // Auto-scroll when accordion opens or edit mode starts
  useEffect(() => {
    if (editing) {
      // For edit mode, scroll card to be right under the sticky top bar
      setTimeout(() => {
        const card = cardRef.current;
        if (!card) return;
        
        // Get sticky header height (estimate 60px if not found)
        const stickyHeader = document.querySelector('[data-sticky-header]') || 
                           document.querySelector('header') || 
                           document.querySelector('.sticky');
        const headerHeight = stickyHeader ? stickyHeader.getBoundingClientRect().height : 60;
        
        const rect = card.getBoundingClientRect();
        const scrollTop = window.pageYOffset + rect.top - headerHeight - 16; // 16px buffer under header
        
        window.scrollTo({ top: Math.max(0, scrollTop), behavior: "smooth" });
      }, 100); // Small delay to ensure DOM is updated
    } else if (isAccordionOpen) {
      // For expand mode, ensure full content is visible above bottom bar
      requestAnimationFrame(() => {
        const card = cardRef.current;
        const body = bodyRef.current;
        if (!card || !body) return;

        const barH = Number(getComputedStyle(document.documentElement)
          .getPropertyValue("--cc-bottom-bar-h")
          .replace("px", "")) || 72;

        const viewportH = window.innerHeight;
        const rect = body.getBoundingClientRect();
        const overflow = rect.bottom - (viewportH - barH - 16); // 16px buffer
        
        if (overflow > 0) {
          // Scroll just enough so the whole dropdown is visible
          window.scrollBy({ top: overflow, left: 0, behavior: "smooth" });
        }
      });
    }
  }, [isAccordionOpen, editing]);

  // Derived display values
  console.log('IncidentCard debug:', { incident, draft, editing });
  const occ = deriveIncidentOccurrence(incident);
  console.log('Occurrence debug:', occ);
  const dateChip = formatPrimaryChip(occ);
  const timeChip = formatTimeChip(occ);
  const hasTime = Boolean(timeChip);
  const caseTxt = caseChipText(incident.caseNumber);
  console.log('Chips debug:', { dateChip, timeChip, hasTime });

  // Get title with fallback for existing incidents without titles
  const getDisplayTitle = () => {
    if (incident.title) return incident.title;
    
    // Backfill logic: what → summary → "{Category} — {Date}"
    if (incident.what) return incident.what.slice(0, 80);
    if ((incident as any).summary) return (incident as any).summary.slice(0, 80);
    
    const category = incident.categoryOrIssue || "Incident";
    const date = dateChip || "Unknown date";
    return `${category} — ${date}`;
  };

  // Control accordion open state and prevent collapse in edit mode
  const canToggle = !editing;
  const effectiveOpen = editing ? true : isAccordionOpen;

  return (
    <div ref={cardRef} className="relative w-full">
      <Accordion 
        type="single" 
        collapsible={canToggle} 
        className="w-full"
        value={effectiveOpen ? incident.id : ""}
        onValueChange={(value) => canToggle && setIsAccordionOpen(value === incident.id)}
      >
        <AccordionItem 
          value={incident.id} 
          data-selected={checked}
          className={cn(
            "rounded-2xl border border-black/10 bg-card shadow-sm",
            "ring-1 ring-black/5 overflow-hidden",
            "data-[state=open]:shadow-md hover:shadow-md transition-shadow",
            checked && "ring-2 ring-primary/50"
          )}
        >
          <AccordionTrigger 
            className={cn(
              "px-3 py-2 sm:px-4 sm:py-3 hover:no-underline",
              !canToggle && "cursor-default [&[data-state=open]>svg]:hidden"
            )}
            disabled={!canToggle}
          >
            <div className="w-full min-w-0 flex items-start gap-2">
              <Checkbox
                checked={checked}
                onCheckedChange={(checked) => {
                  const event = window.event as MouseEvent;
                  toggle(incident.id, index, event?.shiftKey, pageIds);
                }}
                onClick={(e) => e.stopPropagation()}
                aria-label={`Select incident ${incident.title || getDisplayTitle()}`}
                className="mt-0.5 flex-shrink-0"
              />
              
              <div className="min-w-0 flex-1 flex flex-col sm:flex-row sm:items-center gap-1.5 sm:gap-2">
                {/* Title - editable in edit mode, 2-line on mobile */}
                {editing ? (
                  <Input
                    className={cn(
                      "truncate bg-white/80 border rounded-md px-2 py-1 text-[15px] sm:text-[16px] font-normal flex-1",
                      draft.title?.trim() ? "" : "border-red-500"
                    )}
                    value={draft.title ?? ""}
                    onChange={(e) => setDraft(v => ({ ...v, title: e.target.value.slice(0, 80) }))}
                    onBlur={() => setDraft(v => ({ ...v, title: (v.title || "").trim() }))}
                    required
                    maxLength={80}
                    aria-label="Incident title"
                    onClick={(e) => e.stopPropagation()}
                  />
                ) : (
                  <div className="min-w-0 flex-1 text-[15px] sm:text-[16px] font-normal leading-snug
                                  whitespace-normal line-clamp-2 sm:line-clamp-1 text-left">
                    {getDisplayTitle()}
                  </div>
                )}
                
                {/* Chips row - compact and responsive */}
                <div className="flex flex-wrap items-center gap-x-1.5 gap-y-1 sm:ml-auto">
                  {/* Date Chip */}
                  {editing ? (
                    <div className="inline-flex items-center gap-1.5 rounded-full bg-muted px-3 py-1 text-xs">
                      <CalendarIcon className="h-3 w-3" aria-hidden />
                      <Input
                        type="date"
                        value={draft.datePart || ""}
                        onChange={(e) => setDraft(v => ({ ...v, datePart: e.target.value || null }))}
                        className="bg-white border rounded-full px-2 py-0 text-xs h-6 w-24"
                        aria-label="Incident date"
                        onClick={(e) => e.stopPropagation()}
                      />
                    </div>
                  ) : (
                    <ChipXs icon={<CalendarIcon className="h-3.5 w-3.5" aria-hidden />}>
                      {dateChip}
                    </ChipXs>
                  )}

                  {/* Time Chip */}
                  {(hasTime || editing) && (
                    editing ? (
                      <div className="inline-flex items-center gap-1.5 rounded-full bg-muted px-3 py-1 text-xs">
                        <ClockIcon className="h-3 w-3" aria-hidden />
                        <Input
                          type="time"
                          value={draft.timePart || ""}
                          onChange={(e) => setDraft(v => ({ ...v, timePart: e.target.value || null }))}
                          className="bg-white border rounded-full px-2 py-0 text-xs h-6 w-16"
                          aria-label="Incident time"
                          onClick={(e) => e.stopPropagation()}
                        />
                      </div>
                    ) : (
                      <ChipXs icon={<ClockIcon className="h-3.5 w-3.5" aria-hidden />}>
                        {timeChip}
                      </ChipXs>
                    )
                  )}

                  {/* Case Chip - short on mobile, full on desktop */}
                  {(incident.caseNumber || editing) && (
                    editing ? (
                      <div className="inline-flex items-center gap-1.5 rounded-full bg-muted px-3 py-1 text-xs">
                        <Hash className="h-3 w-3" aria-hidden />
                        <Input
                          type="text"
                          value={draft.caseNumber || ""}
                          onChange={(e) => setDraft(v => ({ ...v, caseNumber: sanitizeCase(e.target.value) }))}
                          placeholder="Case"
                          className="bg-white border rounded-full px-2 py-0 text-xs h-6 w-20"
                          aria-label="Case number"
                          onClick={(e) => e.stopPropagation()}
                        />
                      </div>
                    ) : (
                      <ChipXs icon={<Hash className="h-3.5 w-3.5" aria-hidden />}>
                        <span className="sm:hidden">{caseTxt.mobile}</span>
                        <span className="hidden sm:inline">{caseTxt.desktop}</span>
                      </ChipXs>
                    )
                  )}

                  {/* Category Pill - compact */}
                  <span className={cn(
                    getCategoryTagClass(incident.categoryOrIssue),
                    "text-white text-[10px] sm:text-[11px] font-medium h-4 sm:h-5 px-1.5 rounded-full flex items-center justify-center break-words min-w-0"
                  )}>
                    {incident.categoryOrIssue}
                  </span>
                </div>
              </div>
            </div>
          </AccordionTrigger>
          
          {/* Edit mode close button - positioned outside the accordion trigger area */}
          {editing && (
            <button
              type="button"
              className="absolute right-2 top-2 z-20 inline-flex h-7 w-7 items-center justify-center rounded-full bg-white/90 hover:bg-white border border-neutral-200 shadow-sm transition-colors"
              aria-label="Close edit"
              onClick={handleCancel}
            >
              <X className="h-3.5 w-3.5 text-neutral-600" />
            </button>
          )}
          
          <AccordionContent ref={bodyRef} className="px-3 sm:px-4 pb-3 sm:pb-4">
            <div className="space-y-2 text-[14px] sm:text-[15px] leading-relaxed font-normal text-foreground/90">
              {/* Time Only Badge */}
              {!editing && hasTimeOnly(occ) && (
                <Badge 
                  variant="secondary" 
                  className="text-xs px-2 py-1 font-normal shrink-0 h-6 flex items-center bg-orange-100 text-orange-800 rounded-full mb-3"
                >
                  Time only
                </Badge>
              )}

              {/* Main content */}
              {editing ? (
                <>
                  <Textarea
                    value={draft.what || ""}
                    onChange={(e) => setDraft(v => ({ ...v, what: e.target.value }))}
                    rows={8}
                    className="w-full mb-3 rounded-xl border px-3 py-2 text-sm font-normal"
                    placeholder="What happened…"
                  />
                  
                  {/* Incident Details Section */}
                  <div className="grid gap-3 mb-3">
                    <div className="space-y-1.5">
                      <div className="text-sm font-medium">Who</div>
                      <Input
                        className="w-full rounded-xl border px-3 py-2 font-normal"
                        placeholder="Comma-separated (e.g., Mark, Troy)"
                        value={draft.who || ""}
                        onChange={(e) => setDraft(v => ({ ...v, who: e.target.value }))}
                      />
                    </div>

                    <div className="space-y-1.5">
                      <div className="text-sm font-medium">Where</div>
                      <Input
                        className="w-full rounded-xl border px-3 py-2 font-normal"
                        placeholder="e.g., Common area at work"
                        value={draft.where || ""}
                        onChange={(e) => setDraft(v => ({ ...v, where: e.target.value }))}
                      />
                    </div>

                    <div className="space-y-1.5">
                      <div className="text-sm font-medium">Witnesses</div>
                      <Textarea
                        rows={2}
                        className="w-full rounded-xl border px-3 py-2 font-normal"
                        placeholder="Comma or line-separated"
                        value={draft.witnesses || ""}
                        onChange={(e) => setDraft(v => ({ ...v, witnesses: e.target.value }))}
                      />
                    </div>

                    <div className="space-y-1.5">
                      <div className="text-sm font-medium">Important Quotes</div>
                      <Textarea
                        rows={2}
                        className="w-full rounded-xl border px-3 py-2 font-normal"
                        placeholder='- Mark: "even the elephant hide?"'
                        value={draft.quotes || ""}
                        onChange={(e) => setDraft(v => ({ ...v, quotes: e.target.value }))}
                      />
                    </div>

                    <div className="space-y-1.5">
                      <div className="text-sm font-medium">Requests / Responses</div>
                      <Textarea
                        rows={2}
                        className="w-full rounded-xl border px-3 py-2 font-normal"
                        value={draft.requests || ""}
                        onChange={(e) => setDraft(v => ({ ...v, requests: e.target.value }))}
                      />
                    </div>

                    <div className="space-y-1.5">
                      <div className="text-sm font-medium">Notes</div>
                      <Textarea
                        rows={10}
                        className="w-full rounded-xl border px-3 py-2 font-normal"
                        value={draft.notes || ""}
                        onChange={(e) => setDraft(v => ({ ...v, notes: e.target.value }))}
                      />
                    </div>
                  </div>
                </>
              ) : (
                <div className="min-h-[2.5rem] mb-3">
                  <div className="text-sm font-normal leading-snug text-foreground line-clamp-2 break-words overflow-wrap-anywhere">
                    <span dangerouslySetInnerHTML={{ __html: makePhoneNumbersClickable(incident.what) }} />
                  </div>
                </div>
              )}

              {/* Meta information */}
              <div className="text-[11px] sm:text-[12px] text-muted-foreground mb-2 font-normal">
                {(() => {
                  return occ.type === "occurrence" 
                    ? formatSecondaryCreated(incident.createdAt) 
                    : formatRelativeUpdate(incident.updatedAt);
                })()}
                {Boolean(incident.files?.length) && (
                  <span> • {incident.files.length} attachment{incident.files.length > 1 ? 's' : ''}</span>
                )}
              </div>

              {/* Actions */}
              {editing ? (
                <div className="flex items-center gap-2">
                  <Button 
                    size="sm"
                    disabled={!dirty || saving}
                    onClick={saveFromCard}
                    className="text-[11px] sm:text-[12px] px-2.5 py-1 h-8 font-normal"
                  >
                    {saving ? "Saving…" : "Save"}
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={handleCancel}
                    className="text-[11px] sm:text-[12px] px-2.5 py-1 h-8 font-normal"
                  >
                    Cancel
                  </Button>
                  <span className="ml-2 text-xs text-muted-foreground hidden sm:inline font-normal">Esc to cancel</span>
                </div>
              ) : (
                <div className="flex gap-1.5">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="text-[11px] sm:text-[12px] px-2.5 py-1 h-8 flex-1 font-normal"
                    onClick={onView}
                  >
                    View
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="text-[11px] sm:text-[12px] px-2.5 py-1 h-8 flex-1 font-normal"
                    onClick={handleEditClick}
                  >
                    Edit
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="text-[11px] sm:text-[12px] px-2.5 py-1 h-8 flex-1 font-normal"
                    onClick={onExport}
                  >
                    Export
                  </Button>
                  <Button 
                    variant="destructive" 
                    size="sm" 
                    className="text-[11px] sm:text-[12px] px-2.5 py-1 h-8 flex-1 font-normal"
                    onClick={onDelete}
                  >
                    Delete
                  </Button>
                </div>
              )}
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
};