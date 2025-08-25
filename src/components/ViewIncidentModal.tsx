/*
 * REACT ERROR #310 FIX: "Rendered more hooks than during the previous render"
 * 
 * This error occurs when hooks are called conditionally or in different orders
 * between renders. All hooks must be called at the top level and in the same
 * order every time the component renders, regardless of props or state.
 * 
 * Fixed by:
 * 1. Moving all hooks to top level before any conditional logic
 * 2. Placing early returns AFTER all hook declarations
 * 3. Guarding hook effects internally instead of conditionally calling hooks
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { X, Edit3, Save, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { OrganizedIncident, organizedIncidentStorage } from '@/utils/organizedIncidentStorage';
import { formatDisplayDate, parseIncidentDate } from '@/utils/dateParser';
import { getPreferredDateTime } from '@/utils/timelineParser';
import { makePhoneNumbersClickable } from '@/utils/phoneUtils';
import { getAllCategories } from '@/utils/incidentCategories';
import { normalizeToFirstPerson } from '@/utils/voiceNormalizer';
import { showSuccessToast, showErrorToast } from '@/lib/showToast';
import { getDateSafely } from '@/utils/safeDate';
import { parseFromISO, formatHeader, formatTimeOnly, toDateInputValue, toTimeInputValue, formatDateForStorage, parseISOToLocalDate, toUTCISO, combineDateAndTime, deriveIncidentTime, formatHHMMForUI } from '@/utils/datetime';
import { getEffectiveOrganizedDateTime as getOrganizedDateTime } from '@/utils/organizedIncidentMigration';
import { formatWhoList, parseWhoFromString } from '@/helpers/people';
import { extractCaseNumberFlexible } from '@/lib/caseNumber';
import { deriveIncidentOccurrence, formatPrimaryChip, formatTimeChip } from '@/ui/incidentDisplay';

interface ViewIncidentModalProps {
  incident: OrganizedIncident | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onIncidentUpdate?: (updatedIncident: OrganizedIncident) => void;
  currentUserId?: string; // For ownership checking
}

export const ViewIncidentModal = ({ 
  incident, 
  open, 
  onOpenChange, 
  onIncidentUpdate,
  currentUserId 
}: ViewIncidentModalProps) => {
  const navigate = useNavigate();
  // HOOKS MUST BE DECLARED AT TOP LEVEL - React Rules of Hooks requirement
  // All hooks must be called in the same order every render, regardless of props or state
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

  // Ensure consistent hook ordering with mounting guard
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  // Initialize form data when incident changes - guarded internally to maintain hook order
  useEffect(() => {
    if (incident) {
      setFormData({
        ...incident
      });
      
      // Get preferred date/time from original date text and timeline
      const preferred = getPreferredDateTime(incident);
      
      // Use unified dateTime field with fallback to legacy fields, then preferred values
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
        // Use preferred values from original date text and timeline - no auto-fill with current date/time
        setDateInput(preferred.date || '');
        setTimeInput(preferred.time || '');
        
        // Create combined date object only if we have both date and time
        if (preferred.date && preferred.time) {
          const [hours, minutes] = preferred.time.split(':').map(Number);
          const dateObj = new Date(preferred.date + 'T00:00:00');
          dateObj.setHours(hours, minutes, 0, 0);
          setSelectedDateTime(dateObj);
        } else {
          setSelectedDateTime(null);
        }
      } else {
        // Leave fields empty if no existing data - don't auto-populate with current date/time
        setSelectedDateTime(null);
        setDateInput('');
        setTimeInput('');
      }
      
      setCaseNumber(incident.caseNumber || '');
      
      if (incident.canonicalEventDate) {
        setParsedDate({
          date: formatDisplayDate(incident.canonicalEventDate),
          confidence: 'high'
        });
      }
    }
  }, [incident]);

  // Check if form is dirty - guarded internally to maintain hook order  
  useEffect(() => {
    if (!incident || !isEditMode) {
      setIsDirty(false);
      return;
    }

    const hasChanges = (
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
      timeInput !== toTimeInputValue(incident.when)
    );
    
    setIsDirty(hasChanges);
  }, [formData, dateInput, timeInput, incident, isEditMode]);

  // Derived values and callbacks after hooks but before early return
  const isOwner = !currentUserId || currentUserId === 'mock-user' || true; // TODO: Implement actual ownership check
  const effectiveDateTime = getOrganizedDateTime(incident);

  // Safe who list parsing with defensive fallback
  const whoList = React.useMemo(() => {
    // Use the who field directly with safe parsing
    const raw = incident?.who ?? "";
    return parseWhoFromString(raw);
  }, [incident]);

  // Derived display values using centralized incident display logic
  const displayDate = (() => {
    if (isEditMode && selectedDateTime) {
      return selectedDateTime.toLocaleDateString();
    }
    
    // Use centralized date display logic that matches incident cards
    if (incident && !isEditMode) {
      const occ = deriveIncidentOccurrence(incident);
      return formatPrimaryChip(occ);
    }
    
    return effectiveDateTime ? formatHeader(effectiveDateTime) : 'No date';
  })();

  const displayTime = (() => {
    if (isEditMode && selectedDateTime) {
      return selectedDateTime.toTimeString().slice(0, 5);
    }
    
    // Use centralized time display logic that matches incident cards
    if (incident && !isEditMode) {
      const occ = deriveIncidentOccurrence(incident);
      const timeChip = formatTimeChip(occ);
      return timeChip || 'No time';
    }
    
    return effectiveDateTime ? formatTimeOnly(effectiveDateTime) : 'No time';
  })();

  const handleDateInputChange = useCallback((value: string) => {
    setDateInput(value);
    
    // Update selectedDateTime when date changes
    if (value.trim()) {
      const newDate = new Date(value);
      if (!isNaN(newDate.getTime())) {
        const currentTime = selectedDateTime || new Date();
        const updatedDateTime = combineDateAndTime(newDate, currentTime);
        setSelectedDateTime(updatedDateTime);
      }
    }
    
    // Clear date validation error if we have a valid date
    if (value.trim() && validationErrors.date) {
      setValidationErrors(prev => ({ ...prev, date: '' }));
    }
  }, [selectedDateTime, validationErrors.date]);

  const handleTimeInputChange = useCallback((value: string) => {
    setTimeInput(value);
    
    // Update selectedDateTime when time changes
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
  }, [selectedDateTime]);

  // Handle form field changes
  const handleFieldChange = useCallback((field: keyof OrganizedIncident, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  }, []);

  // Enter edit mode within the modal
  const handleEditClick = useCallback(() => {
    setIsEditMode(true);
    setValidationErrors({});
    // Focus first field after state update
    setTimeout(() => {
      firstEditFieldRef.current?.focus();
    }, 50);
  }, []);

  // Save changes
  const handleSave = useCallback(async () => {
    if (!incident || !isOwner) return;

    // Validate required fields
    const errors: Record<string, string> = {};
    if (!formData.categoryOrIssue?.trim()) {
      errors.categoryOrIssue = 'Category is required';
    }
    if (!formData.notes?.trim()) {
      errors.notes = 'Incident summary is required';
    }
    if (!dateInput.trim()) {
      errors.date = 'Date is required';
    }

    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      return;
    }

    setIsSaving(true);

    try {
      // Preserve dateTime properly - use selectedDateTime if changed, otherwise keep original
      const resolvedDateTimeISO = selectedDateTime 
        ? toUTCISO(selectedDateTime)
        : incident.dateTime ?? null;
      
      // Legacy field updates for backward compatibility
      const updatedDate = dateInput ? formatDateForStorage(dateInput) : getDateSafely(incident, '');
      
      // Handle time with fallback logic - if user left time empty, try to infer from timeline
      let timeToPersist = timeInput; // "HH:MM" from the input
      if (!timeToPersist) {
        const inferred = deriveIncidentTime(incident);
        if (inferred) timeToPersist = inferred;
      }
      const updatedTime = timeToPersist || incident.when;
      
      // Update canonical date info if date changed
      let canonicalEventDate = incident.canonicalEventDate;
      let originalEventDateText = incident.originalEventDateText;
      
      if (dateInput !== toDateInputValue(incident.date)) {
        originalEventDateText = dateInput;
        canonicalEventDate = updatedDate;
      }

      // Apply first-person normalization and grammar pass to text fields
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
        evidence: formData.evidence ? normalizeToFirstPerson(formData.evidence) : ''
      };

      // Normalize "who" field when saving
      if (formData.who) {
        const normalizedWho = formatWhoList(parseWhoFromString(formData.who));
        normalizedData.who = normalizedWho || formData.who;
      }

      const updatedIncident: OrganizedIncident = {
        ...incident,
        ...normalizedData,
        canonicalEventDate,
        originalEventDateText,
        date: updatedDate, // Keep for backward compatibility
        when: updatedTime, // Keep for backward compatibility - now includes inferred time
        dateTime: resolvedDateTimeISO, // Unified field - preserve existing if not changed
        caseNumber: caseNumber.trim() || undefined, // Add case number field
        updatedAt: new Date().toISOString()
      };

      // Save to storage
      organizedIncidentStorage.save(updatedIncident);
      
      // Update parent component immediately
      onIncidentUpdate?.(updatedIncident);
      
      // Update parsed date state for UI consistency
      if (dateInput !== toDateInputValue(incident.date)) {
        setParsedDate({ date: updatedDate, confidence: 'high' });
      }

      // Update local state with the saved data to ensure read view shows correct values
      setFormData(updatedIncident);
      
      // Reset input states to match saved values
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
  }, [incident, formData, dateInput, parsedDate, isOwner, onIncidentUpdate, selectedDateTime, timeInput, caseNumber]);

  // Cancel editing
  const handleCancel = useCallback(() => {
    if (isDirty) {
      // Show confirmation dialog for unsaved changes
      if (window.confirm('You have unsaved changes. Discard your changes?')) {
        // Reset form data
        if (incident) {
        setFormData({ ...incident });
          setDateInput(toDateInputValue(incident.date));
          setTimeInput(toTimeInputValue(incident.when));
          if (incident.canonicalEventDate) {
            setParsedDate({
              date: formatDisplayDate(incident.canonicalEventDate),
              confidence: 'high'
            });
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

  // Handle modal close with dirty check - X acts as cancel in edit mode
  const handleModalClose = useCallback((shouldClose: boolean) => {
    if (!shouldClose) return;
    
    if (isEditMode && isDirty) {
      if (window.confirm('You have unsaved changes. Discard your changes?')) {
        setIsEditMode(false);
        setIsDirty(false);
        setValidationErrors({});
        onOpenChange(false);
      }
    } else if (isEditMode) {
      // Cancel edit mode without closing modal if no changes
      setIsEditMode(false);
      setValidationErrors({});
    } else {
      onOpenChange(false);
    }
  }, [isEditMode, isDirty, onOpenChange]);

  // Keyboard handling effect - moved after callback declarations
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

  // Get category class for styling (ensure we get a consistent class reference)
  const getCategoryClass = useCallback((category: string) => {
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
  }, []);

  const categoryClass = getCategoryClass(formData.categoryOrIssue || incident?.categoryOrIssue || '');

  // Safe helper to render text with clickable phone numbers  
  function RenderWithPhoneLinks({ text }: { text: unknown }) {
    const html = React.useMemo(() => makePhoneNumbersClickable(text), [text]);
    return <span dangerouslySetInnerHTML={{ __html: html }} />;
  }

  // Early return AFTER all hooks are declared to maintain consistent hook order
  // Use mounting guard to prevent hydration mismatches
  if (!mounted || !incident) return null;

  return (
    <Dialog open={open} onOpenChange={handleModalClose}>
      <DialogContent 
        showClose={false}
        className="fixed left-[50%] top-[50%] z-50 w-[92%] max-w-[520px] translate-x-[-50%] translate-y-[-50%] rounded-2xl border bg-background p-0 shadow-2xl duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] sm:max-w-[600px]"
        onPointerDownOutside={(e) => {
          // Prevent closing while scrolling inside modal content
          const target = e.target as Element;
          const scrollContainer = target.closest('[data-scroll-container]');
          if (!scrollContainer) {
            handleModalClose(true);
          }
        }}
      >
        <div className="flex max-h-[85vh] flex-col incident-typography relative">
          {/* Header with edit/save controls and single close */}
          <div className="flex items-center justify-between px-5 py-3 border-b">
            <h2 className="text-base font-semibold">
              Incident Details
            </h2>
            <div className="flex items-center gap-2">
              {isEditMode ? (
                <>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleSave}
                    disabled={isSaving}
                    className="h-8 px-3 rounded-full hover:bg-secondary focus-visible:ring-2 focus-visible:ring-offset-2"
                    aria-label="Save changes"
                  >
                    {isSaving ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Save className="h-4 w-4" />
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleModalClose(true)}
                    className="h-8 w-8 p-0 rounded-full hover:bg-secondary focus-visible:ring-2 focus-visible:ring-offset-2"
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
                    className="h-8 w-8 p-0 rounded-full hover:bg-secondary focus-visible:ring-2 focus-visible:ring-offset-2"
                    aria-label="Edit incident"
                  >
                    <Edit3 className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleModalClose(true)}
                    className={`h-8 w-8 p-0 rounded-full hover:bg-secondary focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-${categoryClass.split('-')[1]}-tint`}
                    aria-label="Close incident details"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </>
              )}
            </div>
          </div>

          {/* Scrollable Content */}
          <div 
            className={`flex-1 overflow-y-auto px-5 ${isEditMode ? 'py-2 pb-28' : 'py-3'}`}
            data-scroll-container
          >
            {/* Header row with date, case number and category - editable in edit mode */}
            <div className={`flex items-start gap-3 mb-3 ${isEditMode ? 'flex-col sm:flex-row' : 'flex-wrap'}`} aria-label="Incident date, time and case">{/* badges are displayed here in view mode */}
              {isEditMode ? (
                <>
                    {/* Date Field - Native calendar picker */}
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
                      {dateInput && (
                        <div className="text-muted-foreground mt-1">
                          Selected: {new Date(dateInput).toLocaleDateString()}
                        </div>
                      )}
                      {validationErrors.date && (
                        <div className="text-destructive mt-1">{validationErrors.date}</div>
                      )}
                    </div>

                    {/* Time Field - Native time picker */}
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
                         if (value.length <= 50) {
                           setCaseNumber(value);
                         }
                       }}
                       placeholder="Case # (Optional)"
                       maxLength={50}
                       className="text-base h-9"
                       aria-label="Case number"
                     />
                   </div>

                   {/* Category Select */}
                   <div className="w-full">
                     <label htmlFor="incident-category" className="cc-field-label text-slate-600 mb-1 block">Category</label>
                     <Select
                       value={formData.categoryOrIssue || ''}
                       onValueChange={(value) => handleFieldChange('categoryOrIssue', value)}
                     >
                       <SelectTrigger 
                         id="incident-category"
                         className={`w-full text-[16px] h-9 ${validationErrors.categoryOrIssue ? 'border-destructive' : ''}`}
                       >
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
                     {validationErrors.categoryOrIssue && (
                       <div className="text-destructive mt-1">{validationErrors.categoryOrIssue}</div>
                     )}
                   </div>
                </>
              ) : (
                <>
                  <Badge 
                    variant="secondary" 
                    className="font-medium shrink-0 h-7 px-3 flex items-center bg-muted text-muted-foreground border rounded-full"
                  >
                    {displayDate}
                  </Badge>
                  {(() => {
                    // Display time from timeline fallback or explicit time
                    const timeToShow = (() => {
                      const preferred = getPreferredDateTime(incident);
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
                      if (derivedTime) {
                        return formatHHMMForUI(derivedTime);
                      }
                      
                      return effectiveDateTime ? formatTimeOnly(effectiveDateTime) : null;
                    })();
                    
                    return timeToShow ? (
                      <Badge 
                        variant="secondary" 
                        className="font-medium shrink-0 h-7 px-3 flex items-center bg-muted text-muted-foreground border rounded-full"
                      >
                        {timeToShow}
                      </Badge>
                    ) : null;
                  })()}
                  {incident.caseNumber || extractCaseNumberFlexible(incident.notes) ? (
                    <Badge 
                      variant="outline" 
                      className="font-medium shrink-0 h-7 px-3 flex items-center border-2 rounded-full"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" className="mr-2" aria-hidden="true">
                        <path d="M7 3h7l5 5v13a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1z" fill="none" stroke="currentColor"/>
                        <path d="M9 12h6" stroke="currentColor"/>
                      </svg>
                      Case #: {incident.caseNumber || extractCaseNumberFlexible(incident.notes)}
                    </Badge>
                  ) : null}
                  <div className={`${categoryClass} text-white font-medium h-7 px-3 rounded-full flex items-center justify-center break-words min-w-0`} 
                       style={{ fontSize: 'clamp(10px, 1.6vw, 12px)' }}>
                    {incident.categoryOrIssue}
                  </div>
                </>
              )}
            </div>

            <div className="border-t border-border/60 mb-3"></div>

            <div className={`${isEditMode ? 'space-y-3' : 'space-y-2'}`}>
              {/* Who Section */}
              {(isEditMode || incident.who) && (
                <div className={`${!isEditMode ? `border-l-[3px] pl-3 category-tint-${categoryClass.split('-')[1]}` : ''}`}>
                  <h4 className="cc-field-label text-slate-600 mb-1">Who</h4>
                  {isEditMode ? (
                    <Textarea
                      value={formData.who || ''}
                      onChange={(e) => handleFieldChange('who', e.target.value)}
                      placeholder="Who was involved?"
                      className="text-base min-h-[60px] resize-none"
                      rows={2}
                    />
                  ) : (
                     <p className="leading-snug break-words overflow-wrap-anywhere text-slate-900 dark:text-slate-100">
                       {whoList.length > 0 ? (
                         <RenderWithPhoneLinks text={formatWhoList(whoList)} />
                       ) : (
                         <span className="text-muted-foreground">Not specified</span>
                       )}
                     </p>
                  )}
                </div>
              )}

              {((isEditMode || incident.who) && (isEditMode || incident.what)) && <div className="border-t border-border/50 my-2"></div>}

              {/* What Section */}
              {(isEditMode || incident.what) && (
                <div className={`${!isEditMode ? `border-l-[3px] pl-3 category-tint-${categoryClass.split('-')[1]}` : ''}`}>
                  <h4 className="cc-field-label text-slate-600 mb-1">What</h4>
                  {isEditMode ? (
                    <Textarea
                      value={formData.what || ''}
                      onChange={(e) => handleFieldChange('what', e.target.value)}
                      placeholder="What happened?"
                      className="text-base min-h-[60px] resize-none"
                      rows={2}
                    />
                  ) : (
                     <p className="leading-snug break-words overflow-wrap-anywhere text-slate-900 dark:text-slate-100">
                       <RenderWithPhoneLinks text={incident.what} />
                     </p>
                  )}
                </div>
              )}

              {((isEditMode || incident.what) && (isEditMode || incident.where)) && <div className="border-t border-border/50 my-2"></div>}

              {/* Where Section */}
              {(isEditMode || incident.where) && (
                <div>
                  <h4 className="cc-field-label text-slate-600 mb-1">Where</h4>
                  {isEditMode ? (
                    <Input
                      value={formData.where || ''}
                      onChange={(e) => handleFieldChange('where', e.target.value)}
                      placeholder="Where did it happen?"
                      className="text-base"
                    />
                  ) : (
                     <p className="leading-snug break-words overflow-wrap-anywhere text-slate-900 dark:text-slate-100">
                       <RenderWithPhoneLinks text={incident.where} />
                     </p>
                  )}
                </div>
              )}

              {((isEditMode || incident.where) && (isEditMode || incident.when)) && <div className="border-t border-border/50 my-2"></div>}

                 <div>
                   <h4 className="cc-field-label text-slate-600 mb-1">Time</h4>
                   {isEditMode ? (
                     <div className="pill-field time">
                       <Input
                         id="incident-time-edit"
                         type="time"
                         step="60"
                         value={timeInput}
                         onChange={(e) => handleTimeInputChange(e.target.value)}
                           className="min-w-[80px] text-xs h-6 cc-field-label border-0 bg-white rounded-full px-2"
                           aria-label="Incident time"
                           style={{ fontSize: '13px' }}
                       />
                     </div>
                   ) : (
                      <div className="flex items-center gap-2">
                        <div className="break-words">
                          {(() => {
                            // Use derived time with timeline fallback for display
                            const derivedTime = deriveIncidentTime(incident);
                            if (derivedTime) {
                              return formatHHMMForUI(derivedTime);
                            }
                            if (effectiveDateTime) {
                              return formatTimeOnly(effectiveDateTime);
                            }
                            return <span className="text-muted-foreground italic">No time specified</span>;
                          })()}
                        </div>
                      </div>
                   )}
                 </div>

              {((isEditMode || incident.when) && (isEditMode || incident.witnesses)) && <div className="border-t border-border/50 my-2"></div>}

              {/* Witnesses Section */}
              {(isEditMode || incident.witnesses) && (
                <div>
                  <h4 className="cc-field-label text-slate-600 mb-1">Witnesses</h4>
                  {isEditMode ? (
                    <Textarea
                      value={formData.witnesses || ''}
                      onChange={(e) => handleFieldChange('witnesses', e.target.value)}
                      placeholder="Any witnesses?"
                      className="text-base min-h-[60px] resize-none"
                      rows={2}
                    />
                  ) : (
                     <p className="leading-snug break-words overflow-wrap-anywhere text-slate-900 dark:text-slate-100">
                       <RenderWithPhoneLinks text={incident.witnesses} />
                     </p>
                  )}
                </div>
              )}

              {/* Timeline Section */}
              {(isEditMode || incident.timeline) && (
                <>
                  {((isEditMode || incident.who || incident.what || incident.where || incident.when || incident.witnesses) && (isEditMode || incident.timeline)) && <div className="border-t border-border/50 my-2"></div>}
                  <div>
                    <h4 className="cc-field-label text-slate-600 mb-1">Timeline</h4>
                    {isEditMode ? (
                      <Textarea
                        value={formData.timeline || ''}
                        onChange={(e) => handleFieldChange('timeline', e.target.value)}
                        placeholder="Detailed timeline of events"
                        className="text-base min-h-[80px] resize-none"
                        rows={3}
                      />
                    ) : (
                       <p className="leading-snug whitespace-pre-wrap break-words overflow-wrap-anywhere text-slate-900 dark:text-slate-100">
                         <RenderWithPhoneLinks text={incident.timeline} />
                       </p>
                    )}
                  </div>
                </>
              )}

              {/* Requests Section */}
              {(isEditMode || incident.requests) && (
                <>
                  {((isEditMode || incident.timeline || incident.who || incident.what || incident.where || incident.when || incident.witnesses) && (isEditMode || incident.requests)) && <div className="border-t border-border/50 my-2"></div>}
                  <div>
                    <h4 className="cc-field-label text-slate-600 mb-1">Requests</h4>
                    {isEditMode ? (
                      <Textarea
                        value={formData.requests || ''}
                        onChange={(e) => handleFieldChange('requests', e.target.value)}
                        placeholder="Any specific requests or actions needed?"
                        className="text-base min-h-[60px] resize-none"
                        rows={2}
                      />
                    ) : (
                       <p className="leading-snug whitespace-pre-wrap break-words overflow-wrap-anywhere text-slate-900 dark:text-slate-100">
                         <RenderWithPhoneLinks text={incident.requests} />
                       </p>
                    )}
                  </div>
                </>
              )}

              {/* Policy Section */}
              {(isEditMode || incident.policy) && (
                <>
                  {((isEditMode || incident.requests || incident.timeline || incident.who || incident.what || incident.where || incident.when || incident.witnesses) && (isEditMode || incident.policy)) && <div className="border-t border-border/50 my-2"></div>}
                  <div>
                    <h4 className="cc-field-label text-slate-600 mb-1">Policy</h4>
                    {isEditMode ? (
                      <Textarea
                        value={formData.policy || ''}
                        onChange={(e) => handleFieldChange('policy', e.target.value)}
                        placeholder="Relevant policies or procedures"
                        className="text-base min-h-[60px] resize-none"
                        rows={2}
                      />
                    ) : (
                       <p className="leading-snug whitespace-pre-wrap break-words overflow-wrap-anywhere text-slate-900 dark:text-slate-100">
                         <RenderWithPhoneLinks text={incident.policy} />
                       </p>
                    )}
                  </div>
                </>
              )}

              {/* Evidence Section */}
              {(isEditMode || incident.evidence) && (
                <>
                  {((isEditMode || incident.policy || incident.requests || incident.timeline || incident.who || incident.what || incident.where || incident.when || incident.witnesses) && (isEditMode || incident.evidence)) && <div className="border-t border-border/50 my-2"></div>}
                  <div>
                    <h4 className="cc-field-label text-slate-600 mb-1">Evidence</h4>
                    {isEditMode ? (
                      <Textarea
                        value={formData.evidence || ''}
                        onChange={(e) => handleFieldChange('evidence', e.target.value)}
                        placeholder="Evidence or documentation"
                        className="text-base min-h-[60px] resize-none"
                        rows={2}
                      />
                    ) : (
                       <p className="leading-snug whitespace-pre-wrap break-words overflow-wrap-anywhere text-slate-900 dark:text-slate-100">
                         <RenderWithPhoneLinks text={incident.evidence} />
                       </p>
                    )}
                  </div>
                </>
              )}

              {/* Always show summary with separator if other content exists */}
              {(isEditMode || incident.evidence || incident.policy || incident.requests || incident.timeline || incident.who || incident.what || incident.where || incident.when || incident.witnesses) && <div className="border-t border-border/50 my-2"></div>}

              {/* Incident Summary */}
              <div>
                <h4 className="cc-field-label text-slate-600 mb-1">
                  Incident Summary {isEditMode && <span className="text-destructive">*</span>}
                </h4>
                {isEditMode ? (
                  <>
                    <Textarea
                      value={formData.notes || ''}
                      onChange={(e) => handleFieldChange('notes', e.target.value)}
                      placeholder="Summarize the incident"
                      className={`text-base min-h-[200px] resize-none ${validationErrors.notes ? 'border-destructive' : ''}`}
                      rows={8}
                    />
                    {validationErrors.notes && (
                      <div className="text-destructive mt-1">{validationErrors.notes}</div>
                    )}
                  </>
                ) : (
                   <p className="leading-snug whitespace-pre-wrap break-words overflow-wrap-anywhere text-slate-900 dark:text-slate-100">
                     <RenderWithPhoneLinks text={incident.notes} />
                   </p>
                )}
              </div>
            </div>

            {/* Timestamps */}
            {!isEditMode && (
              <div className="border-t border-border/50 pt-2 mt-3 text-slate-500">
                <div className="space-y-1">
                  <div>Created: {new Date(incident.createdAt).toLocaleString()}</div>
                  <div>Last Updated: {new Date(incident.updatedAt).toLocaleString()}</div>
                  {incident.originalEventDateText && (
                    <div>Original Date Text: "{displayDate}"</div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
        
        {/* Sticky Bottom Bar for Save Button - Only in Edit Mode */}
        {isEditMode && (
          <div className="absolute bottom-0 left-0 right-0 bg-background border-t border-border px-6 py-4">
            <Button
              onClick={handleSave}
              disabled={isSaving}
              className="w-full h-12 text-base font-medium bg-orange-500 hover:bg-orange-600 text-white"
              aria-label="Save changes"
            >
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
        )}
      </DialogContent>
    </Dialog>
  );
};