import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { CalendarIcon, ClockIcon, Hash, Eye, Pencil, Download, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import { OrganizedIncident, organizedIncidentStorage } from '@/utils/organizedIncidentStorage';
import { deriveIncidentOccurrence, formatPrimaryChip, formatTimeChip, formatSecondaryCreated, formatRelativeUpdate, hasTimeOnly } from '@/ui/incidentDisplay';
import { makePhoneNumbersClickable } from '@/utils/phoneUtils';
import { showToast } from '@/components/SuccessToast';
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
};

interface IncidentCardProps {
  incident: OrganizedIncident;
  onView: () => void;
  onExport: () => void;
  onDelete: () => void;
  onUpdate: () => void;
  getCategoryTagClass: (category: string) => string;
}

export const IncidentCard = ({ 
  incident, 
  onView, 
  onExport, 
  onDelete, 
  onUpdate, 
  getCategoryTagClass 
}: IncidentCardProps) => {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<Draft>(buildDraft(incident));
  const [saving, setSaving] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
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

      // Build payload per rules
      const payload: any = {
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
      showToast({ 
        type: "success", 
        message: "Incident updated successfully", 
        durationMs: 2500 
      });

      // Notify parent to refresh
      onUpdate();

    } catch (e) {
      console.error('Error saving incident:', e);
      showToast({ 
        type: "error", 
        message: "Could not save", 
        durationMs: 2500 
      });
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

  return (
    <Collapsible open={!collapsed} onOpenChange={(open) => setCollapsed(!open)}>
      <Card className="rounded-xl border bg-card shadow-md hover:shadow-lg transition-shadow duration-200">
        <CardContent className="p-0">
          <div className="p-4">
            {/* Header Row - always visible */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex flex-wrap items-center gap-2 flex-1">
                {/* Date Chip */}
                <div className="inline-flex items-center gap-1.5 rounded-full bg-muted px-3 py-1.5 text-xs font-medium">
                  <CalendarIcon className="h-3.5 w-3.5 text-muted-foreground" />
                  {editing ? (
                    <Input
                      ref={firstInputRef}
                      type="date"
                      value={draft.datePart || ""}
                      onChange={(e) => setDraft(v => ({ ...v, datePart: e.target.value || null }))}
                      className="bg-card border-0 p-0 text-xs h-auto w-28 font-medium"
                      aria-label="Incident date"
                    />
                  ) : (
                    <span>{dateChip}</span>
                  )}
                </div>

                {/* Time Chip */}
                {(hasTime || editing) && (
                  <div className="inline-flex items-center gap-1.5 rounded-full bg-muted px-3 py-1.5 text-xs font-medium">
                    <ClockIcon className="h-3.5 w-3.5 text-muted-foreground" />
                    {editing ? (
                      <Input
                        type="time"
                        value={draft.timePart || ""}
                        onChange={(e) => setDraft(v => ({ ...v, timePart: e.target.value || null }))}
                        className="bg-card border-0 p-0 text-xs h-auto w-20 font-medium"
                        aria-label="Incident time"
                      />
                    ) : (
                      <span>{timeChip}</span>
                    )}
                  </div>
                )}

                {/* Time Only Badge */}
                {!editing && hasTimeOnly(occ) && (
                  <Badge className="bg-orange-100 text-orange-800 hover:bg-orange-100 text-xs px-2 py-0.5 font-medium rounded-full border-0">
                    Time Only
                  </Badge>
                )}

                {/* Case Number Chip */}
                {(caseText || editing) && (
                  <div className="inline-flex items-center gap-1.5 rounded-full bg-muted px-3 py-1.5 text-xs font-medium">
                    <Hash className="h-3.5 w-3.5 text-muted-foreground" />
                    {editing ? (
                      <Input
                        type="text"
                        value={draft.caseNumber || ""}
                        onChange={(e) => setDraft(v => ({ ...v, caseNumber: sanitizeCase(e.target.value) }))}
                        placeholder="Case #"
                        className="bg-card border-0 p-0 text-xs h-auto w-24 font-medium"
                        aria-label="Case number"
                      />
                    ) : (
                      <span>{caseText}</span>
                    )}
                  </div>
                )}
              </div>

              {/* Category Pill and Collapse Toggle */}
              <div className="flex items-center gap-2 ml-2">
                <div className={cn(
                  getCategoryTagClass(incident.categoryOrIssue),
                  "text-white text-xs font-semibold px-3 py-1.5 rounded-full whitespace-nowrap"
                )}>
                  {incident.categoryOrIssue}
                </div>
                
                {/* Collapse Toggle Button */}
                <CollapsibleTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-8 w-8 p-0 hover:bg-muted"
                    aria-label={collapsed ? "Expand incident" : "Collapse incident"}
                  >
                    {collapsed ? (
                      <ChevronDown className="h-4 w-4" />
                    ) : (
                      <ChevronUp className="h-4 w-4" />
                    )}
                  </Button>
                </CollapsibleTrigger>
              </div>
            </div>

            {/* Summary text - visible when collapsed */}
            {collapsed && !editing && (
              <div className="mb-3">
                <p className="text-sm text-foreground line-clamp-2 leading-snug">
                  <span dangerouslySetInnerHTML={{ __html: makePhoneNumbersClickable(incident.what) }} />
                </p>
              </div>
            )}
          </div>

          {/* Collapsible Content */}
          <CollapsibleContent>
            <div className="px-4 pb-4">
              {/* Main Content Area */}
              {editing ? (
                <div className="space-y-4">
                  {/* What Happened Textarea */}
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-foreground">What happened</label>
                    <Textarea
                      value={draft.what || ""}
                      onChange={(e) => setDraft(v => ({ ...v, what: e.target.value }))}
                      rows={8}
                      className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm resize-none"
                      placeholder="Describe what happened…"
                    />
                  </div>
                  
                  {/* Details Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-foreground">Who</label>
                      <Input
                        className="w-full rounded-lg border border-input bg-background px-3 py-2"
                        placeholder="People involved (comma-separated)"
                        value={draft.who || ""}
                        onChange={(e) => setDraft(v => ({ ...v, who: e.target.value }))}
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-foreground">Where</label>
                      <Input
                        className="w-full rounded-lg border border-input bg-background px-3 py-2"
                        placeholder="Location"
                        value={draft.where || ""}
                        onChange={(e) => setDraft(v => ({ ...v, where: e.target.value }))}
                      />
                    </div>
                  </div>

                  {/* Additional Details */}
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-foreground">Witnesses</label>
                      <Textarea
                        rows={2}
                        className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm resize-none"
                        placeholder="Witnesses present"
                        value={draft.witnesses || ""}
                        onChange={(e) => setDraft(v => ({ ...v, witnesses: e.target.value }))}
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-foreground">Important Quotes</label>
                      <Textarea
                        rows={2}
                        className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm resize-none"
                        placeholder="Key quotes or statements"
                        value={draft.quotes || ""}
                        onChange={(e) => setDraft(v => ({ ...v, quotes: e.target.value }))}
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-foreground">Requests/Responses</label>
                      <Textarea
                        rows={2}
                        className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm resize-none"
                        placeholder="Requests made and responses received"
                        value={draft.requests || ""}
                        onChange={(e) => setDraft(v => ({ ...v, requests: e.target.value }))}
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-foreground">Notes</label>
                      <Textarea
                        rows={10}
                        className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm resize-none"
                        placeholder="Additional notes and details"
                        value={draft.notes || ""}
                        onChange={(e) => setDraft(v => ({ ...v, notes: e.target.value }))}
                      />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Summary Text */}
                  <div>
                    <h3 className="text-sm font-medium leading-relaxed text-foreground">
                      <span dangerouslySetInnerHTML={{ __html: makePhoneNumbersClickable(incident.what) }} />
                    </h3>
                  </div>

                  {/* Meta Information */}
                  <div className="text-xs text-muted-foreground space-y-1">
                    <div>
                      {(() => {
                        return occ.type === "occurrence" 
                          ? formatSecondaryCreated(incident.createdAt) 
                          : formatRelativeUpdate(incident.updatedAt);
                      })()}
                    </div>
                    {Boolean(incident.files?.length) && (
                      <div>Attachments: {incident.files.length}</div>
                    )}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="mt-6 pt-4 border-t border-border">
                {editing ? (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Button 
                        size="sm"
                        disabled={!dirty || saving}
                        onClick={saveFromCard}
                        className="px-4 py-2 font-medium"
                      >
                        {saving ? "Saving…" : "Save"}
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={handleCancel}
                        className="px-4 py-2 font-medium"
                      >
                        Cancel
                      </Button>
                    </div>
                    <span className="text-xs text-muted-foreground hidden sm:inline">
                      Esc to cancel
                    </span>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <Button 
                      variant="default" 
                      size="sm" 
                      className="flex-1 font-medium"
                      onClick={onView}
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      View
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="flex-1 font-medium"
                      onClick={handleEditClick}
                    >
                      <Pencil className="h-4 w-4 mr-1" />
                      Edit
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="flex-1 font-medium"
                      onClick={onExport}
                    >
                      <Download className="h-4 w-4 mr-1" />
                      Export
                    </Button>
                    <Button 
                      variant="destructive" 
                      size="sm" 
                      className="flex-1 font-medium"
                      onClick={onDelete}
                    >
                      <Trash2 className="h-4 w-4 mr-1" />
                      Delete
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </CollapsibleContent>
        </CardContent>
      </Card>
    </Collapsible>
  );
};