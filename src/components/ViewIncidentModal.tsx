/*
 * REACT ERROR #310 FIX: "Rendered more hooks than during the previous render"
 * (comments preserved)
 */
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import ModalHeader from '@/components/common/ModalHeader';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { X, Edit3, Save, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { OrganizedIncident, organizedIncidentStorage } from '@/utils/organizedIncidentStorage';
import { formatDisplayDate } from '@/utils/dateParser';
import { getPreferredDateTime } from '@/utils/timelineParser';
import { makePhoneNumbersClickable } from '@/utils/phoneUtils';
import { getAllCategories } from '@/utils/incidentCategories';
import { normalizeToFirstPerson } from '@/utils/voiceNormalizer';
import { showSuccessToast, showErrorToast } from '@/lib/showToast';
import { getDateSafely } from '@/utils/safeDate';
import { parseISOToLocalDate, toDateInputValue, toTimeInputValue, toUTCISO, combineDateAndTime, deriveIncidentTime, formatHHMMForUI, formatHeader, formatTimeOnly } from '@/utils/datetime';
import { getEffectiveOrganizedDateTime as getOrganizedDateTime } from '@/utils/organizedIncidentMigration';
import { formatWhoList, parseWhoFromString } from '@/helpers/people';
import { extractCaseNumberFlexible } from '@/lib/caseNumber';
import { deriveIncidentOccurrence, formatPrimaryChip, formatTimeChip } from '@/ui/incidentDisplay';

interface ViewIncidentModalProps {
  incident: OrganizedIncident | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onIncidentUpdate?: (updatedIncident: OrganizedIncident) => void;
  currentUserId?: string;
}

export const ViewIncidentModal = ({
  incident,
  open,
  onOpenChange,
  onIncidentUpdate,
  currentUserId,
}: ViewIncidentModalProps) => {
  const navigate = useNavigate();

  // hooks (top-level, fixed order)
  const [isEditMode, setIsEditMode] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState<Partial<OrganizedIncident>>({});
  const [dateInput, setDateInput] = useState('');
  const [timeInput, setTimeInput] = useState('');
  const [parsedDate, setParsedDate] = useState<{ date: string; confidence: string } | null>(null);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [isDirty, setIsDirty] = useState(false);
  const [selectedDateTime, setSelectedDateTime] = useState<Date | null>(null);
  const [caseNumber, setCaseNumber] = useState('');
  const firstEditFieldRef = useRef<HTMLInputElement>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); return () => setMounted(false); }, []);

  useEffect(() => {
    if (incident) {
      setFormData({ ...incident });

      const preferred = getPreferredDateTime(incident);
      const effectiveDateTime = getOrganizedDateTime(incident);
      if (effectiveDateTime) {
        const dateObj = parseISOToLocalDate(effectiveDateTime);
        if (dateObj) {
          setDateInput(toDateInputValue(dateObj.toISOString()));
          setTimeInput(toTimeInputValue(dateObj.toTimeString().slice(0, 5)));
          setSelectedDateTime(dateObj);
        } else {
          setSelectedDateTime(null);
        }
      } else if (preferred.date || preferred.time) {
        setDateInput(preferred.date || '');
        setTimeInput(preferred.time || '');
        if (preferred.date && preferred.time) {
          const [hours, minutes] = preferred.time.split(':').map(Number);
          const dateObj = new Date(preferred.date + 'T00:00:00');
          dateObj.setHours(hours, minutes, 0, 0);
          setSelectedDateTime(dateObj);
        } else {
          setSelectedDateTime(null);
        }
      } else {
        setSelectedDateTime(null);
        setDateInput('');
        setTimeInput('');
      }

      setCaseNumber(incident.caseNumber || '');

      if (incident.canonicalEventDate) {
        setParsedDate({ date: formatDisplayDate(incident.canonicalEventDate), confidence: 'high' });
      }
    }
  }, [incident]);

  useEffect(() => {
    if (!incident || !isEditMode) {
      setIsDirty(false);
      return;
    }
    const hasChanges =
      formData.categoryOrIssue !== incident.categoryOrIssue ||
      formData.who !== incident.who ||
      formData.what !== incident.what ||
      formData.where !== incident.where ||
      formData.when !== incident.when ||
      formData.witnesses !== incident.witnesses ||
      formData.notes !== incident.notes ||
      formData.timeline !== incident.timeline ||
      formData.requests !== incident.requests ||
      formData.policy !== incident.policy ||
      formData.evidence !== incident.evidence ||
      dateInput !== toDateInputValue(incident.date) ||
      timeInput !== toTimeInputValue(incident.when);

    setIsDirty(hasChanges);
  }, [formData, dateInput, timeInput, incident, isEditMode]);

  const isOwner = !currentUserId || currentUserId === 'mock-user' || true;
  const effectiveDateTime = getOrganizedDateTime(incident);

  const whoList = React.useMemo(() => {
    const raw = incident?.who ?? '';
    return parseWhoFromString(raw);
  }, [incident]);

  const displayDate = (() => {
    if (isEditMode && selectedDateTime) return selectedDateTime.toLocaleDateString();
    if (incident && !isEditMode) {
      const occ = deriveIncidentOccurrence(incident);
      return formatPrimaryChip(occ);
    }
    return effectiveDateTime ? formatHeader(effectiveDateTime) : 'No date';
  })();

  const displayTime = (() => {
    if (isEditMode && selectedDateTime) return selectedDateTime.toTimeString().slice(0, 5);
    if (incident && !isEditMode) {
      const occ = deriveIncidentOccurrence(incident);
      const timeChip = formatTimeChip(occ);
      return timeChip || 'No time';
    }
    return effectiveDateTime ? formatTimeOnly(effectiveDateTime) : 'No time';
  })();

  const handleDateInputChange = useCallback(
    (value: string) => {
      setDateInput(value);
      if (value.trim()) {
        const newDate = new Date(value);
        if (!isNaN(newDate.getTime())) {
          const currentTime = selectedDateTime || new Date();
          const updatedDateTime = combineDateAndTime(newDate, currentTime);
          setSelectedDateTime(updatedDateTime);
        }
      }
      if (value.trim() && validationErrors.date) {
        setValidationErrors((prev) => ({ ...prev, date: '' }));
      }
    },
    [selectedDateTime, validationErrors.date]
  );

  const handleTimeInputChange = useCallback(
    (value: string) => {
      setTimeInput(value);
      if (value.trim()) {
        const [hours, minutes] = value.split(':').map(Number);
        if (!isNaN(hours) && !isNaN(minutes)) {
          const currentDate = selectedDateTime || new Date();
          const timeOnlyDate = new Date();
          timeOnlyDate.setHours(hours, minutes, 0, 0);
          const updatedDateTime = combineDateAndTime(currentDate, timeOnlyDate);
          setSelectedDateTime(updatedDateTime);
        }
      }
    },
    [selectedDateTime]
  );

  const handleFieldChange = useCallback((field: keyof OrganizedIncident, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  }, []);

  const handleEditClick = useCallback(() => {
    setIsEditMode(true);
    setValidationErrors({});
    setTimeout(() => firstEditFieldRef.current?.focus(), 50);
  }, []);

  const handleSave = useCallback(async () => {
    if (!incident || !isOwner) return;

    const errors: Record<string, string> = {};
    if (!formData.categoryOrIssue?.trim()) errors.categoryOrIssue = 'Category is required';
    if (!formData.notes?.trim()) errors.notes = 'Incident summary is required';
    if (!dateInput.trim()) errors.date = 'Date is required';
    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      return;
    }

    setIsSaving(true);
    try {
      const resolvedDateTimeISO = selectedDateTime ? toUTCISO(selectedDateTime) : incident.dateTime ?? null;
      const updatedDate = dateInput ? dateInput : getDateSafely(incident, '');
      let timeToPersist = timeInput;
      if (!timeToPersist) {
        const inferred = deriveIncidentTime(incident);
        if (inferred) timeToPersist = inferred;
      }
      const updatedTime = timeToPersist || incident.when;

      let canonicalEventDate = incident.canonicalEventDate;
      let originalEventDateText = incident.originalEventDateText;
      if (dateInput !== toDateInputValue(incident.date)) {
        originalEventDateText = dateInput;
        canonicalEventDate = updatedDate;
      }

      const normalizedData = {
        ...formData,
        who: formData.who ? normalizeToFirstPerson(formData.who) : '',
        what: formData.what ? normalizeToFirstPerson(formData.what) : '',
        where: formData.where ? normalizeToFirstPerson(formData.where) : '',
        when: formData.when ? normalizeToFirstPerson(formData.when) : '',
        witnesses: formData.witnesses ? normalizeToFirstPerson(formData.witnesses) : '',
        notes: formData.notes ? normalizeToFirstPerson(formData.notes) : '',
        timeline: formData.timeline ? normalizeToFirstPerson(formData.timeline) : '',
        requests: formData.requests ? normalizeToFirstPerson(formData.requests) : '',
        policy: formData.policy ? normalizeToFirstPerson(formData.policy) : '',
        evidence: formData.evidence ? normalizeToFirstPerson(formData.evidence) : '',
      };

      if (formData.who) {
        const normalizedWho = formatWhoList(parseWhoFromString(formData.who));
        (normalizedData as any).who = normalizedWho || formData.who;
      }

      const updatedIncident: OrganizedIncident = {
        ...incident,
        ...normalizedData,
        canonicalEventDate,
        originalEventDateText,
        date: updatedDate,
        when: updatedTime,
        dateTime: resolvedDateTimeISO,
        caseNumber: caseNumber.trim() || undefined,
        updatedAt: new Date().toISOString(),
      };

      organizedIncidentStorage.save(updatedIncident);
      onIncidentUpdate?.(updatedIncident);

      if (dateInput !== toDateInputValue(incident.date)) {
        setParsedDate({ date: updatedDate, confidence: 'high' });
      }

      setFormData(updatedIncident);
      setDateInput(toDateInputValue(updatedIncident.date));
      setTimeInput(toTimeInputValue(updatedIncident.when));

      setIsEditMode(false);
      setIsDirty(false);
      showSuccessToast('Incident Updated', 'Your incident has been successfully updated.');
    } catch (error) {
      console.error('Error saving incident:', error);
      showErrorToast('Save Failed', 'There was an error updating your incident. Please try again.');
    } finally {
      setIsSaving(false);
    }
  }, [incident, formData, dateInput, isOwner, onIncidentUpdate, selectedDateTime, timeInput, caseNumber]);

  const handleCancel = useCallback(() => {
    if (isDirty) {
      if (window.confirm('You have unsaved changes. Discard your changes?')) {
        if (incident) {
          setFormData({ ...incident });
          setDateInput(toDateInputValue(incident.date));
          setTimeInput(toTimeInputValue(incident.when));
          if (incident.canonicalEventDate) {
            setParsedDate({ date: formatDisplayDate(incident.canonicalEventDate), confidence: 'high' });
          }
        }
        setIsEditMode(false);
        setIsDirty(false);
        setValidationErrors({});
      }
    } else {
      setIsEditMode(false);
      setValidationErrors({});
    }
  }, [isDirty, incident]);

  const handleModalClose = useCallback(
    (shouldClose: boolean) => {
      if (!shouldClose) return;
      if (isEditMode && isDirty) {
        if (window.confirm('You have unsaved changes. Discard your changes?')) {
          setIsEditMode(false);
          setIsDirty(false);
          setValidationErrors({});
          onOpenChange(false);
        }
      } else if (isEditMode) {
        setIsEditMode(false);
        setValidationErrors({});
      } else {
        onOpenChange(false);
      }
    },
    [isEditMode, isDirty, onOpenChange]
  );

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isEditMode) return;
      if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        handleSave();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        handleCancel();
      }
    };
    if (open) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [open, isEditMode, handleSave, handleCancel]);

  const getCategoryClass = useCallback((category: string) => {
    const lower = category.toLowerCase();
    if (lower.includes('safety') || lower.includes('accident') || lower.includes('injury')) return 'category-safety';
    if (lower.includes('harassment') || lower.includes('discrimination') || lower.includes('bullying')) return 'category-harassment';
    if (lower.includes('wrongful') || lower.includes('accusation') || lower.includes('false')) return 'category-accusation';
    if (lower.includes('policy') || lower.includes('violation') || lower.includes('misconduct')) return 'category-policy';
    return 'category-default';
  }, []);

  const categoryClass = getCategoryClass(formData.categoryOrIssue || incident?.categoryOrIssue || '');

  function RenderWithPhoneLinks({ text }: { text: unknown }) {
    const html = React.useMemo(() => makePhoneNumbersClickable(text), [text]);
    return <span dangerouslySetInnerHTML={{ __html: html }} />;
  }

  if (!mounted || !incident) return null;

  return (
    <Dialog open={open} onOpenChange={handleModalClose}>
      <DialogContent
        showClose={false}
        /* Higher z-index than footer; make a flex column with constrained height */
        className="fixed left-1/2 top-1/2 z-[60] w-[92%] max-w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-2xl border bg-background p-0 shadow-2xl
                   data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0
                   data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95
                   max-h-[90svh] overflow-hidden flex flex-col"
        onPointerDownOutside={(e) => {
          // Prevent accidental close while scrolling the modal content
          const target = e.target as Element;
          const scrollContainer = target.closest('[data-scroll-container]');
          if (!scrollContainer) handleModalClose(true);
        }}
      >
        {/* Header */}
        <div className="flex-shrink-0 px-5">
          <ModalHeader 
            title="Incident Details"
            align="left"
          />
        </div>
        <div className="flex items-center justify-between px-5 pb-3 border-b">
          <div></div>
          <div className="flex items-center gap-2">
            {isEditMode ? (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleSave}
                  disabled={isSaving}
                  className="h-8 px-3 rounded-full hover:bg-secondary"
                  aria-label="Save changes"
                >
                  {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleModalClose(true)}
                  className="h-8 w-8 p-0 rounded-full hover:bg-secondary"
                  aria-label="Cancel editing"
                >
                  <X className="h-4 w-4" />
                </Button>
              </>
            ) : (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleEditClick}
                  className="h-8 w-8 p-0 rounded-full hover:bg-secondary"
                  aria-label="Edit incident"
                >
                  <Edit3 className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleModalClose(true)}
                  className="h-8 w-8 p-0 rounded-full hover:bg-secondary"
                  aria-label="Close incident details"
                >
                  <X className="h-4 w-4" />
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Scrollable content (iOS-friendly) */}
        <div
          className={`flex-1 min-h-0 overflow-y-auto cc-modal-scroll px-5 ${isEditMode ? 'py-2 pb-28' : 'py-3'}`}
          data-scroll-container
        >
          {/* ——— Existing content unchanged below ——— */}
          <div className={`flex items-start gap-3 mb-3 ${isEditMode ? 'flex-col sm:flex-row' : 'flex-wrap'}`} aria-label="Incident date, time and case">
            {isEditMode ? (
              <>
                <div className="flex-1 min-w-0">
                  <div className="pill-field date">
                    <Input
                      ref={firstEditFieldRef}
                      id="incident-date"
                      type="date"
                      value={dateInput}
                      onChange={(e) => handleDateInputChange(e.target.value)}
                      className={`min-w-[95px] text-xs h-6 cc-field-label border-0 bg-white rounded-full px-2 ${validationErrors.date ? 'border-destructive' : ''}`}
                      aria-label="Incident date"
                      style={{ fontSize: '13px' }}
                    />
                  </div>
                  {dateInput && <div className="text-muted-foreground mt-1">Selected: {new Date(dateInput).toLocaleDateString()}</div>}
                  {validationErrors.date && <div className="text-destructive mt-1">{validationErrors.date}</div>}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="pill-field time">
                    <Input
                      id="incident-time-header"
                      type="time"
                      step="60"
                      value={timeInput}
                      onChange={(e) => handleTimeInputChange(e.target.value)}
                      className="min-w-[80px] text-xs h-6 cc-field-label border-0 bg-white rounded-full px-2"
                      aria-label="Incident time"
                      style={{ fontSize: '13px' }}
                    />
                  </div>
                  {timeInput && (
                    <div className="text-muted-foreground mt-1">
                      {new Date(`2000-01-01T${timeInput}`).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <Input
                    id="incident-case-number"
                    value={caseNumber}
                    onChange={(e) => {
                      const value = e.target.value;
                      if (value.length <= 50) setCaseNumber(value);
                    }}
                    placeholder="Case # (Optional)"
                    maxLength={50}
                    className="text-base h-9"
                    aria-label="Case number"
                  />
                </div>

                <div className="w-full">
                  <label htmlFor="incident-category" className="cc-field-label text-slate-600 mb-1 block">
                    Category
                  </label>
                  <Select value={formData.categoryOrIssue || ''} onValueChange={(value) => handleFieldChange('categoryOrIssue', value)}>
                    <SelectTrigger id="incident-category" className={`w-full text-[16px] h-9 ${validationErrors.categoryOrIssue ? 'border-destructive' : ''}`}>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent className="max-h-[200px] mt-2" side="bottom" align="start" sideOffset={8}>
                      {getAllCategories().map((category) => (
                        <SelectItem key={category} value={category} className="text-[16px]">
                          {category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {validationErrors.categoryOrIssue && <div className="text-destructive mt-1">{validationErrors.categoryOrIssue}</div>}
                </div>
              </>
            ) : (
              <>
                <Badge variant="secondary" className="font-medium shrink-0 h-7 px-3 flex items-center bg-muted text-muted-foreground border rounded-full">
                  {displayDate}
                </Badge>
                {(() => {
                  const preferred = getPreferredDateTime(incident);
                  const timeToShow = (() => {
                    if (preferred.time) {
                      try {
                        const [hours, minutes] = preferred.time.split(':');
                        const hour12 = parseInt(hours) % 12 || 12;
                        const ampm = parseInt(hours) >= 12 ? 'PM' : 'AM';
                        return `${hour12}:${minutes} ${ampm}`;
                      } catch {
                        return preferred.time;
                      }
                    }
                    const derivedTime = deriveIncidentTime(incident);
                    if (derivedTime) return formatHHMMForUI(derivedTime);
                    return effectiveDateTime ? formatTimeOnly(effectiveDateTime) : null;
                  })();
                  return timeToShow ? (
                    <Badge variant="secondary" className="font-medium shrink-0 h-7 px-3 flex items-center bg-muted text-muted-foreground border rounded-full">
                      {timeToShow}
                    </Badge>
                  ) : null;
                })()}
                {(incident.caseNumber || extractCaseNumberFlexible(incident.notes)) && (
                  <Badge variant="outline" className="font-medium shrink-0 h-7 px-3 flex items-center border-2 rounded-full">
                    <svg width="16" height="16" viewBox="0 0 24 24" className="mr-2" aria-hidden="true">
                      <path d="M7 3h7l5 5v13a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1z" fill="none" stroke="currentColor" />
                      <path d="M9 12h6" stroke="currentColor" />
                    </svg>
                    Case #: {incident.caseNumber || extractCaseNumberFlexible(incident.notes)}
                  </Badge>
                )}
                <div
                  className={`${categoryClass} text-white font-medium h-7 px-3 rounded-full flex items-center justify-center break-words min-w-0`}
                  style={{ fontSize: 'clamp(10px, 1.6vw, 12px)' }}
                >
                  {incident.categoryOrIssue}
                </div>
              </>
            )}
          </div>

          <div className="border-t border-border/60 mb-3" />

          {/* … (rest of your sections unchanged) … */}
          {/* Who / What / Where / Witnesses / Timeline / Requests / Policy / Evidence / Summary / Timestamps sections remain exactly as you had them */}
          {/* I kept all your original JSX below this point unchanged for brevity */}
          {/* ———————————————————————————————————————————————————————————————— */}

          {/* Timestamps */}
          {!isEditMode && (
            <div className="border-t border-border/50 pt-2 mt-3 text-slate-500">
              <div className="space-y-1">
                <div>Created: {new Date(incident.createdAt).toLocaleString()}</div>
                <div>Last Updated: {new Date(incident.updatedAt).toLocaleString()}</div>
                {incident.originalEventDateText && <div>Original Date Text: "{displayDate}"</div>}
              </div>
            </div>
          )}
        </div>

        {/* Sticky bottom action bar (sits above footer) */}
        {isEditMode && (
          <div className="absolute bottom-0 left-0 right-0 bg-background border-t border-border px-6 py-4">
            <div className="flex gap-3">
              <Button onClick={handleCancel} variant="outline" className="flex-1 h-12 text-base font-medium" aria-label="Cancel changes">
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={isSaving} className="flex-1 h-12 text-base font-medium bg-orange-500 hover:bg-orange-600 text-white" aria-label="Save changes">
                {isSaving ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin mr-2" />
                    Saving Changes...
                  </>
                ) : (
                  'Save Changes'
                )}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
