import { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { X, Calendar as CalendarIcon, Clock, Save } from 'lucide-react';
import { OrganizedIncident, organizedIncidentStorage } from '@/utils/organizedIncidentStorage';
import { getAllCategories } from '@/utils/incidentCategories';
import { 
  parseISOToLocal, 
  formatYYYYMMDD, 
  formatHHmm, 
  combineLocalDateAndTime, 
  toUTCISO, 
  parseDateTimeFromNotes,
  validateCaseNumber,
  formatRelativeTime
} from '@/utils/incidentFormatting';
import { getPreferredDateTime } from '@/utils/timelineParser';
import { showToast } from '@/components/SuccessToast';
import { processIncident } from '@/services/incidentProcessor';
import { prefillIncidentFromNotes, shouldRunOneTimePrefill } from '@/lib/notesPrefill';
import { deriveIncidentOccurrence, formatPrimaryChip, formatTimeChip, formatSecondaryCreated, hasTimeOnly } from '@/ui/incidentDisplay';
import { cn } from '@/lib/utils';
import { formatWhoList, parseWhoFromString } from '@/helpers/people';
import { extractFirstTimeFromNotes } from '@/lib/notesTime';

interface IncidentModalProps {
  incidentId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onIncidentUpdate?: () => void;
}

export const IncidentModal = ({ incidentId, open, onOpenChange, onIncidentUpdate }: IncidentModalProps) => {
  const [incident, setIncident] = useState<OrganizedIncident | null>(null);
  
  // Check if we should start in edit mode based on URL params
  const urlParams = new URLSearchParams(window.location.search);
  const initialEditMode = urlParams.get('mode') === 'edit';
  const [isEditMode, setIsEditMode] = useState(initialEditMode);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState<Partial<OrganizedIncident>>({});
  const [dateInput, setDateInput] = useState('');
  const [timeInput, setTimeInput] = useState('');
  const [caseNumber, setCaseNumber] = useState('');
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [isDirty, setIsDirty] = useState(false);
  const [hasRunOneTimePrefill, setHasRunOneTimePrefill] = useState(false);
  const firstEditFieldRef = useRef<HTMLInputElement>(null);

  // Load incident data when ID changes
  useEffect(() => {
    if (incidentId) {
      const foundIncident = organizedIncidentStorage.getById(incidentId);
      setIncident(foundIncident);
      
      // Check if we should start in edit mode based on URL params
      const urlParams = new URLSearchParams(window.location.search);
      const shouldEditMode = urlParams.get('mode') === 'edit';
      setIsEditMode(shouldEditMode);
      
      if (foundIncident) {
        setFormData(foundIncident);
        setCaseNumber(foundIncident.caseNumber || '');
        
        // Initialize date/time inputs following prefill rules
        initializeDateTimeInputs(foundIncident);
        
        // Run one-time prefill if incident has no date/time data
        if (!hasRunOneTimePrefill && shouldRunOneTimePrefill(foundIncident)) {
          runOneTimePrefill(foundIncident);
        }
      }
    } else {
      setIncident(null);
      resetForm();
    }
  }, [incidentId, hasRunOneTimePrefill]);

  const initializeDateTimeInputs = (incident: OrganizedIncident) => {
    let initialDate = '';
    let initialTime = '';

    // 1. If dateTime exists, prefill both
    if (incident.dateTime) {
      const d = parseISOToLocal(incident.dateTime);
      if (d) {
        initialDate = formatYYYYMMDD(d);
        initialTime = formatHHmm(d);
      }
    } 
    // 2. Else if datePart or timePart exist, prefill whichever exists
    else if (incident.datePart || incident.timePart) {
      if (incident.datePart) {
        const d = parseISOToLocal(incident.datePart);
        if (d) {
          initialDate = formatYYYYMMDD(d);
        }
      }
      if (incident.timePart) {
        initialTime = incident.timePart;
      }
    }
    // 3. Else check for preferred date/time from original text and timeline
    else {
      const preferred = getPreferredDateTime(incident);
      if (preferred.date) {
        initialDate = preferred.date;
      }
      if (preferred.time) {
        initialTime = preferred.time;
      }
      
      // 4. Fallback to one-time parse from notes fields if preferred didn't work
      if (!initialDate && !initialTime) {
        const notesToParse = incident.notes || incident.what || '';
        const parsed = parseDateTimeFromNotes(notesToParse);
        if (parsed) {
          if (parsed.date) initialDate = parsed.date;
          if (parsed.time) initialTime = parsed.time;
        }
      }
    }
    // 5. If nothing found, leave blank (never default to current time)

    setDateInput(initialDate);
    setTimeInput(initialTime);
  };

  const resetForm = () => {
    setFormData({});
    setDateInput('');
    setTimeInput('');
    setCaseNumber('');
    setIsEditMode(false);
    setIsDirty(false);
    setValidationErrors({});
    setHasRunOneTimePrefill(false);
  };

  // One-time prefill from parsed notes
  const runOneTimePrefill = (incident: OrganizedIncident) => {
    try {
      const prefillData = prefillIncidentFromNotes(incident);
      
      if (Object.keys(prefillData).length > 0) {
        // Apply prefill data to form
        setFormData(prev => ({ ...prev, ...prefillData }));
        
        // Update date/time inputs if they were prefilled
        if (prefillData.dateTime) {
          const d = parseISOToLocal(prefillData.dateTime);
          if (d) {
            setDateInput(formatYYYYMMDD(d));
            setTimeInput(formatHHmm(d));
          }
        } else {
          if (prefillData.datePart) {
            const d = parseISOToLocal(prefillData.datePart);
            if (d) setDateInput(formatYYYYMMDD(d));
          }
          if (prefillData.timePart) {
            setTimeInput(prefillData.timePart);
          }
        }
      }
      
      setHasRunOneTimePrefill(true);
    } catch (error) {
      console.error('Error in one-time prefill:', error);
      setHasRunOneTimePrefill(true); // Prevent retry loops
    }
  };

  // Track if form is dirty
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
      formData.notes !== incident.notes ||
      formData.witnesses !== incident.witnesses ||
      caseNumber !== (incident.caseNumber || '') ||
      dateInput !== getInitialDateInput(incident) ||
      timeInput !== getInitialTimeInput(incident)
    );
    
    setIsDirty(hasChanges);
  }, [formData, dateInput, timeInput, caseNumber, incident, isEditMode]);

  const getInitialDateInput = (incident: OrganizedIncident): string => {
    if (incident.dateTime) {
      const d = parseISOToLocal(incident.dateTime);
      return d ? formatYYYYMMDD(d) : '';
    }
    if (incident.datePart) {
      const d = parseISOToLocal(incident.datePart);
      return d ? formatYYYYMMDD(d) : '';
    }
    return '';
  };

  const getInitialTimeInput = (incident: OrganizedIncident): string => {
    if (incident.dateTime) {
      const d = parseISOToLocal(incident.dateTime);
      return d ? formatHHmm(d) : '';
    }
    return incident.timePart || '';
  };

  const handleFieldChange = (field: keyof OrganizedIncident, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear validation error for this field
    if (validationErrors[field]) {
      setValidationErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleDateChange = (date: Date | undefined) => {
    if (date) {
      setDateInput(formatYYYYMMDD(date));
    }
  };

  const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTimeInput(e.target.value);
  };

  const handleSave = async () => {
    if (!incident) return;

    // Validate required fields
    const errors: Record<string, string> = {};
    if (!formData.categoryOrIssue?.trim()) {
      errors.categoryOrIssue = 'Category is required';
    }
    if (!formData.notes?.trim()) {
      errors.notes = 'Notes are required';
    }
    if (caseNumber && !validateCaseNumber(caseNumber)) {
      errors.caseNumber = 'Invalid case number format';
    }

    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      return;
    }

    setIsSaving(true);

    try {
      let updatedIncident = { ...incident, ...formData };

      // Normalize "who" field when saving
      if (formData.who) {
        const normalizedWho = formatWhoList(parseWhoFromString(formData.who));
        updatedIncident.who = normalizedWho;
      }

      // Handle date/time saving rules
      if (dateInput && timeInput) {
        // Both set: write dateTime and clear parts
        const combinedDate = combineLocalDateAndTime(dateInput, timeInput);
        updatedIncident.dateTime = toUTCISO(combinedDate);
        updatedIncident.datePart = undefined;
        updatedIncident.timePart = undefined;
      } else if (dateInput) {
        // Only date: write datePart and clear others
        updatedIncident.datePart = dateInput;
        updatedIncident.dateTime = undefined;
        updatedIncident.timePart = undefined;
      } else if (timeInput) {
        // Only time: write timePart and clear others
        updatedIncident.timePart = timeInput;
        updatedIncident.dateTime = undefined;
        updatedIncident.datePart = undefined;
      } else {
        // Neither set: clear all
        updatedIncident.dateTime = undefined;
        updatedIncident.datePart = undefined;
        updatedIncident.timePart = undefined;
      }

      // Set case number
      updatedIncident.caseNumber = caseNumber.trim() || undefined;
      updatedIncident.updatedAt = new Date().toISOString();

      // Save to storage
      organizedIncidentStorage.save(updatedIncident);
      
      // Update local state
      setIncident(updatedIncident);
      setFormData(updatedIncident);
      setIsEditMode(false);
      setIsDirty(false);
      setValidationErrors({});

      // Show success toast
      showToast({ message: 'Incident updated successfully', type: 'success' });

      // Notify parent of update
      onIncidentUpdate?.();

    } catch (error) {
      console.error('Error saving incident:', error);
      setValidationErrors({ general: 'Failed to save incident. Please try again.' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    if (isDirty) {
      if (window.confirm('You have unsaved changes. Discard changes?')) {
        resetToViewMode();
      }
    } else {
      resetToViewMode();
    }
  };

  const resetToViewMode = () => {
    if (incident) {
      setFormData(incident);
      setCaseNumber(incident.caseNumber || '');
      initializeDateTimeInputs(incident);
    }
    setIsEditMode(false);
    setIsDirty(false);
    setValidationErrors({});
  };

  const handleClose = () => {
    if (isEditMode && isDirty) {
      if (window.confirm('You have unsaved changes. Discard changes?')) {
        onOpenChange(false);
        resetForm();
      }
    } else {
      onOpenChange(false);
      resetForm();
    }
  };

  const handleEditClick = () => {
    setIsEditMode(true);
    setTimeout(() => {
      firstEditFieldRef.current?.focus();
    }, 50);
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!open) return;
      
      if (isEditMode) {
        if (e.key === 'Escape') {
          e.preventDefault();
          handleCancel();
        } else if ((e.metaKey || e.ctrlKey) && e.key === 's') {
          e.preventDefault();
          handleSave();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open, isEditMode, handleCancel, handleSave]);

  if (!incident) return null;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent 
        showClose={false}
        className="fixed left-[50%] top-[50%] z-50 w-[95%] max-w-[700px] translate-x-[-50%] translate-y-[-50%] rounded-2xl border bg-background p-0 shadow-2xl duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 max-h-[90vh] overflow-hidden flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b px-6 py-4">
          <h1 className="text-lg font-semibold">Incident Details</h1>
          <div className="flex items-center gap-2">
            {isEditMode ? (
              <>
                <Button variant="outline" onClick={handleCancel} disabled={isSaving}>
                  Cancel
                </Button>
                <Button onClick={handleSave} disabled={isSaving} className="min-w-[80px]">
                  {isSaving ? 'Saving...' : 'Save'}
                </Button>
              </>
            ) : (
              <Button variant="outline" onClick={handleEditClick}>
                Edit
              </Button>
            )}
            <Button variant="ghost" size="sm" onClick={handleClose} className="h-8 w-8 p-0 rounded-full">
              <X className="h-4 w-4" />
              <span className="sr-only">Close</span>
            </Button>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-6">
          {/* Header Content Rows */}
          <div className="space-y-4">
            {/* Row 1: Date, Time, Category */}
            <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
              {/* Date Input */}
              <div className="flex-none">
                {isEditMode ? (
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className={cn("h-8 px-3 rounded-full text-xs font-medium", dateInput && "bg-muted")}>
                        <CalendarIcon className="h-3 w-3 mr-1" />
                        {dateInput ? (() => {
                          const [year, month, day] = dateInput.split('-').map(Number);
                          const date = new Date(year, month - 1, day);
                          return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
                        })() : 'Choose date'}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={dateInput ? new Date(dateInput) : undefined}
                        onSelect={handleDateChange}
                        initialFocus
                        className="p-3 pointer-events-auto"
                      />
                    </PopoverContent>
                  </Popover>
                ) : (
                  <Badge variant="secondary" className="h-8 px-3 rounded-full text-xs font-medium">
                    <CalendarIcon className="h-3 w-3 mr-1" />
                    {(() => {
                      const occ = deriveIncidentOccurrence(incident);
                      return formatPrimaryChip(occ);
                    })()}
                  </Badge>
                )}
              </div>

              {/* Time Input */}
              <div className="flex-none">
                {isEditMode ? (
                  <div className="relative">
                    <Clock className="absolute left-2 top-1/2 transform -translate-y-1/2 h-3 w-3 text-muted-foreground" />
                    <Input
                      type="time"
                      value={timeInput}
                      onChange={handleTimeChange}
                      className="h-8 pl-7 pr-3 w-28 rounded-full text-xs"
                      aria-label="Choose time"
                    />
                  </div>
                ) : (
                  (() => {
                    // Prefer time from raw notes; else fall back to stored time
                    const notesTime = extractFirstTimeFromNotes(incident.notes);
                    const occ = deriveIncidentOccurrence(incident);
                    const fallbackTime = formatTimeChip(occ);
                    const timeText = notesTime?.text || fallbackTime;
                    
                    return (
                      <>
                        {timeText && (
                          <Badge variant="outline" className="h-8 px-3 rounded-full text-xs font-medium">
                            <Clock className="h-3 w-3 mr-1" />
                            {timeText}
                          </Badge>
                        )}
                      </>
                    );
                  })()
                )}
              </div>

              {/* Category */}
              <div className="flex-1 sm:flex sm:justify-end">
                {isEditMode ? (
                  <Select 
                    value={formData.categoryOrIssue || ''} 
                    onValueChange={(value) => handleFieldChange('categoryOrIssue', value)}
                  >
                    <SelectTrigger className="h-8 max-w-xs rounded-full text-xs">
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {getAllCategories().map((category) => (
                        <SelectItem key={category} value={category}>
                          {category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <Badge className="rounded-full text-xs font-medium max-w-fit">
                    {formData.categoryOrIssue || incident.categoryOrIssue}
                  </Badge>
                )}
              </div>
            </div>

            {/* Row 2: Case Number */}
            <div>
              {isEditMode ? (
                <div className="space-y-1">
                  <Input
                    ref={firstEditFieldRef}
                    placeholder="Case Number (Optional)"
                    value={caseNumber}
                    onChange={(e) => setCaseNumber(e.target.value)}
                    maxLength={50}
                    className="max-w-xs rounded-lg text-sm"
                    aria-label="Case number"
                  />
                  {validationErrors.caseNumber && (
                    <p className="text-xs text-destructive">{validationErrors.caseNumber}</p>
                  )}
                </div>
              ) : (
                caseNumber && (
                  <div className="text-sm text-muted-foreground">
                    Case #: {caseNumber}
                  </div>
                )
              )}
            </div>

            {/* Row 3: Metadata */}
            {!isEditMode && (
              <div className="text-xs text-muted-foreground">
                {(() => {
                  const occ = deriveIncidentOccurrence(incident);
                  return occ.type === "occurrence" 
                    ? formatSecondaryCreated(incident.createdAt)
                    : `Last edited ${formatRelativeTime(incident.updatedAt)}`;
                })()}
              </div>
            )}
          </div>

          {/* Form Sections */}
          <div className="space-y-6">
            {/* Who */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Who</label>
              {isEditMode ? (
                <Textarea
                  value={formData.who || ''}
                  onChange={(e) => handleFieldChange('who', e.target.value)}
                  placeholder="People involved..."
                  className="rounded-lg"
                />
              ) : (
                <div className="w-full rounded-xl bg-muted px-4 py-3 text-foreground/90 leading-snug whitespace-pre-wrap min-h-0">
                  {(() => {
                    const whoText = formatWhoList(parseWhoFromString(formData.who || incident.who || ''));
                    return whoText || <span className="text-muted-foreground">Not specified</span>;
                  })()}
                </div>
              )}
            </div>

            {/* What */}
            <div className="space-y-2">
              <label className="text-sm font-medium">What</label>
              {isEditMode ? (
                <Textarea
                  value={formData.what || ''}
                  onChange={(e) => handleFieldChange('what', e.target.value)}
                  placeholder="What happened..."
                  className="rounded-lg"
                />
              ) : (
                <div className="w-full rounded-xl bg-muted px-4 py-3 text-foreground/90 leading-snug whitespace-pre-wrap min-h-0">
                  {formData.what || incident.what || 'No information provided'}
                </div>
              )}
            </div>

            {/* Where */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Where</label>
              {isEditMode ? (
                <Input
                  value={formData.where || ''}
                  onChange={(e) => handleFieldChange('where', e.target.value)}
                  placeholder="Location..."
                  className="rounded-lg"
                />
              ) : (
                <div className="w-full rounded-xl bg-muted px-4 py-3 text-foreground/90 leading-snug whitespace-pre-wrap min-h-0">
                  {formData.where || incident.where || 'No location provided'}
                </div>
              )}
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Notes</label>
              {isEditMode ? (
                <div className="space-y-1">
                  <Textarea
                    value={formData.notes || ''}
                    onChange={(e) => handleFieldChange('notes', e.target.value)}
                    placeholder="Detailed notes..."
                    className="rounded-lg"
                  />
                  {validationErrors.notes && (
                    <p className="text-xs text-destructive">{validationErrors.notes}</p>
                  )}
                </div>
              ) : (
                <div className="w-full rounded-xl bg-muted px-4 py-3 text-foreground/90 leading-snug whitespace-pre-wrap min-h-0">
                  {formData.notes || incident.notes || 'No notes provided'}
                </div>
              )}
            </div>

            {/* Witnesses */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Witnesses</label>
              {isEditMode ? (
                <Textarea
                  value={formData.witnesses || ''}
                  onChange={(e) => handleFieldChange('witnesses', e.target.value)}
                  placeholder="Witness names..."
                  className="rounded-lg"
                />
              ) : (
                <div className="w-full rounded-xl bg-muted px-4 py-3 text-foreground/90 leading-snug whitespace-pre-wrap min-h-0">
                  {formData.witnesses || incident.witnesses || 'No witnesses listed'}
                </div>
              )}
            </div>

            {/* Important Quotes */}
            {(formData.quotes || incident.quotes) && (
              <div className="space-y-2">
                <label className="text-sm font-medium">Important Quotes</label>
                {isEditMode ? (
                  <Textarea
                    value={formData.quotes || ''}
                    onChange={(e) => handleFieldChange('quotes', e.target.value)}
                    placeholder="Important quotes..."
                    className="rounded-lg"
                  />
                ) : (
                  <div className="w-full rounded-xl bg-muted px-4 py-3 text-foreground/90 leading-snug whitespace-pre-wrap min-h-0">
                    {formData.quotes || incident.quotes}
                  </div>
                )}
              </div>
            )}

            {/* Requests or Responses */}
            {(formData.requests || incident.requests) && (
              <div className="space-y-2">
                <label className="text-sm font-medium">Requests or Responses</label>
                {isEditMode ? (
                  <Textarea
                    value={formData.requests || ''}
                    onChange={(e) => handleFieldChange('requests', e.target.value)}
                    placeholder="Requests or responses..."
                    className="rounded-lg"
                  />
                ) : (
                  <div className="w-full rounded-xl bg-muted px-4 py-3 text-foreground/90 leading-snug whitespace-pre-wrap min-h-0">
                    {formData.requests || incident.requests}
                  </div>
                )}
              </div>
            )}


            {/* Additional sections can be added here as needed */}

            {/* Attachments placeholder */}
            {incident.files && incident.files.length > 0 && (
              <div className="space-y-2">
                <label className="text-sm font-medium">Attachments</label>
                <div className="text-sm text-muted-foreground p-3 border border-dashed border-border rounded-lg">
                  {incident.files.length} file(s) attached
                </div>
              </div>
            )}
          </div>

          {/* Validation Errors */}
          {validationErrors.general && (
            <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-lg">
              {validationErrors.general}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};