import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { CalendarIcon, ClockIcon, Hash, Pin, FileDown, Trash2 } from 'lucide-react';
import { OrganizedIncident, organizedIncidentStorage } from '@/utils/organizedIncidentStorage';
import { deriveIncidentOccurrence, formatPrimaryChip, formatTimeChip, formatSecondaryCreated, formatRelativeUpdate, hasTimeOnly } from '@/ui/incidentDisplay';
import { makePhoneNumbersClickable } from '@/utils/phoneUtils';
import { showSuccessToast, showErrorToast } from '@/lib/showToast';
import { cn } from '@/lib/utils';

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
  isPinned?: boolean;
  onTogglePin?: () => void;
}

export const IncidentCard = ({ 
  incident, 
  onView, 
  onExport, 
  onDelete, 
  onUpdate, 
  getCategoryTagClass,
  isPinned = false,
  onTogglePin 
}: IncidentCardProps) => {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<Draft>(buildDraft(incident));
  const [saving, setSaving] = useState(false);
  const firstInputRef = useRef<HTMLInputElement>(null);

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

  // Derived display values
  console.log('IncidentCard debug:', { incident, draft, editing });
  const occ = deriveIncidentOccurrence(incident);
  console.log('Occurrence debug:', occ);
  const dateChip = formatPrimaryChip(occ);
  const timeChip = formatTimeChip(occ);
  const hasTime = Boolean(timeChip);
  const caseText = incident.caseNumber ? `Case ${incident.caseNumber}` : null;
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

  return (
    <Accordion type="single" collapsible className="w-full">
      <AccordionItem value={incident.id} data-pinned={isPinned}>
        <AccordionTrigger className="hover:no-underline">
          <div className="flex w-full items-center gap-2 pr-4">
            {/* Title - editable in edit mode */}
            {editing ? (
              <Input
                className={cn(
                  "truncate bg-white/80 border rounded-md px-2 py-1 text-base font-semibold flex-1",
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
              <h3 className="truncate text-base font-semibold flex-1 text-left">
                {getDisplayTitle()}
              </h3>
            )}
            
            {/* Header chips and actions */}
            <div className="ml-auto flex flex-wrap items-center gap-2">
              {/* Date Chip */}
              <div className="inline-flex items-center gap-1.5 rounded-full bg-muted px-3 py-1 text-xs">
                <CalendarIcon className="h-3 w-3" aria-hidden />
                <span>{dateChip}</span>
              </div>

              {/* Time Chip */}
              {hasTime && (
                <div className="inline-flex items-center gap-1.5 rounded-full bg-muted px-3 py-1 text-xs">
                  <ClockIcon className="h-3 w-3" aria-hidden />
                  <span>{timeChip}</span>
                </div>
              )}

              {/* Case Chip */}
              {caseText && (
                <div className="inline-flex items-center gap-1.5 rounded-full bg-muted px-3 py-1 text-xs">
                  <Hash className="h-3 w-3" aria-hidden />
                  <span>{caseText}</span>
                </div>
              )}

              {/* Category Pill */}
              <div className={cn(
                getCategoryTagClass(incident.categoryOrIssue),
                "text-white text-[10px] font-medium h-5 px-1.5 rounded-full flex items-center justify-center break-words min-w-0"
              )}>
                {incident.categoryOrIssue}
              </div>

              {/* Pin button */}
              {onTogglePin && (
                <button
                  type="button"
                  className="ml-1 rounded p-1 hover:bg-muted"
                  onClick={(e) => {
                    e.stopPropagation();
                    onTogglePin();
                  }}
                  aria-pressed={isPinned}
                  title={isPinned ? "Unpin" : "Pin open"}
                >
                  <Pin className={cn("h-3 w-3", isPinned ? "rotate-45" : "")} />
                </button>
              )}
            </div>
          </div>
        </AccordionTrigger>
        
        <AccordionContent>
          <div className="px-4 pb-4">
            {/* Time Only Badge */}
            {!editing && hasTimeOnly(occ) && (
              <Badge 
                variant="secondary" 
                className="text-xs px-2 py-1 font-medium shrink-0 h-6 flex items-center bg-orange-100 text-orange-800 rounded-full mb-3"
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
                  className="w-full mb-3 rounded-xl border px-3 py-2 text-xs"
                  placeholder="What happened…"
                />
                
                {/* Incident Details Section */}
                <div className="grid gap-3 mb-3">
                  <div className="space-y-1.5">
                    <div className="text-sm font-semibold">Who</div>
                    <Input
                      className="w-full rounded-xl border px-3 py-2"
                      placeholder="Comma-separated (e.g., Mark, Troy)"
                      value={draft.who || ""}
                      onChange={(e) => setDraft(v => ({ ...v, who: e.target.value }))}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <div className="text-sm font-semibold">Where</div>
                    <Input
                      className="w-full rounded-xl border px-3 py-2"
                      placeholder="e.g., Common area at work"
                      value={draft.where || ""}
                      onChange={(e) => setDraft(v => ({ ...v, where: e.target.value }))}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <div className="text-sm font-semibold">Witnesses</div>
                    <Textarea
                      rows={2}
                      className="w-full rounded-xl border px-3 py-2"
                      placeholder="Comma or line-separated"
                      value={draft.witnesses || ""}
                      onChange={(e) => setDraft(v => ({ ...v, witnesses: e.target.value }))}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <div className="text-sm font-semibold">Important Quotes</div>
                    <Textarea
                      rows={2}
                      className="w-full rounded-xl border px-3 py-2"
                      placeholder='- Mark: "even the elephant hide?"'
                      value={draft.quotes || ""}
                      onChange={(e) => setDraft(v => ({ ...v, quotes: e.target.value }))}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <div className="text-sm font-semibold">Requests / Responses</div>
                    <Textarea
                      rows={2}
                      className="w-full rounded-xl border px-3 py-2"
                      value={draft.requests || ""}
                      onChange={(e) => setDraft(v => ({ ...v, requests: e.target.value }))}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <div className="text-sm font-semibold">Notes</div>
                    <Textarea
                      rows={10}
                      className="w-full rounded-xl border px-3 py-2"
                      value={draft.notes || ""}
                      onChange={(e) => setDraft(v => ({ ...v, notes: e.target.value }))}
                    />
                  </div>
                </div>
              </>
            ) : (
              <div className="min-h-[2.5rem] mb-3">
                <div className="text-xs font-medium leading-snug text-foreground line-clamp-2 break-words overflow-wrap-anywhere">
                  <span dangerouslySetInnerHTML={{ __html: makePhoneNumbersClickable(incident.what) }} />
                </div>
              </div>
            )}

            {/* Meta information */}
            <div className="text-[10px] text-muted-foreground mb-2">
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
                  className="text-[10px] px-2.5 py-1 h-7"
                >
                  {saving ? "Saving…" : "Save"}
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={handleCancel}
                  className="text-[10px] px-2.5 py-1 h-7"
                >
                  Cancel
                </Button>
                <span className="ml-2 text-xs text-muted-foreground hidden sm:inline">Esc to cancel</span>
              </div>
            ) : (
              <div className="flex gap-1.5">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="text-[10px] px-2.5 py-1 h-7 flex-1"
                  onClick={onView}
                >
                  View
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="text-[10px] px-2.5 py-1 h-7 flex-1"
                  onClick={handleEditClick}
                >
                  Edit
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="text-[10px] px-2.5 py-1 h-7 flex-1"
                  onClick={onExport}
                >
                  Export
                </Button>
                <Button 
                  variant="destructive" 
                  size="sm" 
                  className="text-[10px] px-2.5 py-1 h-7 flex-1"
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
  );
};