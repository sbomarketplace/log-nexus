import { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import ModalHeader from '@/components/common/ModalHeader';
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
  formatRelativeTime,
} from '@/utils/incidentFormatting';
import { getPreferredDateTime } from '@/utils/timelineParser';
import { showToast } from '@/components/SuccessToast';
import { prefillIncidentFromNotes, shouldRunOneTimePrefill } from '@/lib/notesPrefill';
import { deriveIncidentOccurrence, formatPrimaryChip, formatTimeChip, formatSecondaryCreated } from '@/ui/incidentDisplay';
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

  const urlParams = new URLSearchParams(window.location.search);
  const initialEditMode = urlParams.get('mode') === 'edit';
  const [isEditMode, setIsEditMode] = useState(initialEditMode);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState<Partial<OrganizedIncident>>({});
  const [dateInput, setDateInput] = useState('');
  const [timeInput, setTimeInput] = useState('');
  const [caseNumber, setCaseNumber] = useState('');
  const [caseNumberAutoFilled, setCaseNumberAutoFilled] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [isDirty, setIsDirty] = useState(false);
  const [hasRunOneTimePrefill, setHasRunOneTimePrefill] = useState(false);
  const firstEditFieldRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (incidentId) {
      const foundIncident = organizedIncidentStorage.getById(incidentId);
      setIncident(foundIncident);

      const urlParams = new URLSearchParams(window.location.search);
      const shouldEditMode = urlParams.get('mode') === 'edit';
      setIsEditMode(shouldEditMode);

      if (foundIncident) {
        setFormData(foundIncident);
        setCaseNumber(foundIncident.caseNumber || '');
        initializeDateTimeInputs(foundIncident);

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

    if (incident.dateTime) {
      const d = parseISOToLocal(incident.dateTime);
      if (d) {
        initialDate = formatYYYYMMDD(d);
        initialTime = formatHHmm(d);
      }
    } else if (incident.datePart || incident.timePart) {
      if (incident.datePart) {
        const d = parseISOToLocal(incident.datePart);
        if (d) initialDate = formatYYYYMMDD(d);
      }
      if (incident.timePart) initialTime = incident.timePart;
    } else {
      const preferred = getPreferredDateTime(incident);
      if (preferred.date) initialDate = preferred.date;
      if (preferred.time) initialTime = preferred.time;

      if (!initialDate && !initialTime) {
        const notesToParse = incident.notes || incident.what || '';
        const parsed = parseDateTimeFromNotes(notesToParse);
        if (parsed) {
          if (parsed.date) initialDate = parsed.date;
          if (parsed.time) initialTime = parsed.time;
        }
      }
    }

    if (!initialTime) {
      const notesTime = extractFirstTimeFromNotes(incident.notes);
      if (notesTime?.text) {
        const match = notesTime.text.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
        if (match) {
          let hour = parseInt(match[1], 10);
          const minute = match[2];
          const ampm = match[3].toUpperCase();
          if (ampm === 'AM' && hour === 12) hour = 0;
          if (ampm === 'PM' && hour !== 12) hour = hour + 12;
          initialTime = `${hour.toString().padStart(2, '0')}:${minute}`;
        }
      }
    }

    setDateInput(initialDate);
    setTimeInput(initialTime);
  };

  const runOneTimePrefill = (incident: OrganizedIncident) => {
    const prefillData = prefillIncidentFromNotes(incident);
    if (Object.keys(prefillData).length > 0) {
      setFormData((prev) => ({ ...prev, ...prefillData }));
      if (prefillData.dateTime) {
        const d = parseISOToLocal(prefillData.dateTime);
        if (d) {
          setDateInput(formatYYYYMMDD(d));
          setTimeInput(formatHHmm(d));
        }
      } else {
        if (prefillData.datePart) setDateInput(prefillData.datePart);
        if (prefillData.timePart) setTimeInput(prefillData.timePart);
      }
      if (prefillData.caseNumber && !caseNumber) {
        setCaseNumber(prefillData.caseNumber);
        setCaseNumberAutoFilled(true);
      }
      setHasRunOneTimePrefill(true);
    }
  };

  const resetForm = () => {
    setFormData({});
    setDateInput('');
    setTimeInput('');
    setCaseNumber('');
    setCaseNumberAutoFilled(false);
    setValidationErrors({});
    setIsDirty(false);
    setIsEditMode(false);
    setHasRunOneTimePrefill(false);

    const url = new URL(window.location.href);
    url.searchParams.delete('mode');
    window.history.replaceState({}, '', url.toString());
  };

  useEffect(() => {
    if (!incident) {
      setIsDirty(false);
      return;
    }
    const hasChanges =
      formData.categoryOrIssue !== incident.categoryOrIssue ||
      formData.who !== incident.who ||
      formData.what !== incident.what ||
      formData.where !== incident.where ||
      formData.notes !== incident.notes ||
      formData.witnesses !== incident.witnesses ||
      caseNumber !== (incident.caseNumber || '') ||
      dateInput !== getInitialDateInput(incident) ||
      timeInput !== getInitialTimeInput(incident);

    setIsDirty(hasChanges);
  }, [formData, dateInput, timeInput, caseNumber, incident]);

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
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (validationErrors[field]) setValidationErrors((prev) => ({ ...prev, [field]: '' }));
  };

  const handleDateChange = (date: Date | undefined) => {
    if (date) setDateInput(formatYYYYMMDD(date));
  };

  const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTimeInput(e.target.value);
  };

  const handleSave = async () => {
    if (!incident) return;

    const errors: Record<string, string> = {};
    if (!formData.categoryOrIssue?.trim()) errors.categoryOrIssue = 'Category is required';
    if (!formData.notes?.trim()) errors.notes = 'Notes are required';
    if (caseNumber && !validateCaseNumber(caseNumber)) errors.caseNumber = 'Invalid case number format';

    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      return;
    }

    setIsSaving(true);
    try {
      let updatedIncident = { ...incident, ...formData };

      if (formData.who) {
        const normalizedWho = formatWhoList(parseWhoFromString(formData.who));
        updatedIncident.who = normalizedWho;
      }

      if (dateInput && timeInput) {
        const combinedDate = combineLocalDateAndTime(dateInput, timeInput);
        updatedIncident.dateTime = toUTCISO(combinedDate);
        updatedIncident.datePart = undefined;
        updatedIncident.timePart = undefined;
      } else if (dateInput) {
        updatedIncident.datePart = dateInput;
        updatedIncident.dateTime = undefined;
        updatedIncident.timePart = undefined;
      } else if (timeInput) {
        updatedIncident.timePart = timeInput;
        updatedIncident.dateTime = undefined;
        updatedIncident.datePart = undefined;
      } else {
        updatedIncident.dateTime = undefined;
        updatedIncident.datePart = undefined;
        updatedIncident.timePart = undefined;
      }

      updatedIncident.caseNumber = caseNumber.trim() || undefined;
      updatedIncident.updatedAt = new Date().toISOString();

      organizedIncidentStorage.save(updatedIncident);

      setIncident(updatedIncident);
      setFormData(updatedIncident);
      setIsEditMode(false);
      setIsDirty(false);
      setValidationErrors({});
      showToast({ message: 'Incident updated successfully', type: 'success' });

      onIncidentUpdate?.();
      onOpenChange(false);
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

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!open) return;
      if (isEditMode) {
        if (e.key === 'Escape') {
          e.preventDefault();
          handleCancel();
        } else if ((e.metaKey || e.ctrlKey) && e.key === 's') {
          e.preventDefault();
          handleSave();
        }
      } else if (!isEditMode && isDirty) {
        if ((e.metaKey || e.ctrlKey) && e.key === 's') {
          e.preventDefault();
          handleSave();
        }
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, isEditMode, isDirty]);

  if (!incident) return null;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent
        showClose={false}
        className="fixed left-1/2 top-1/2 z-[60] w-[95%] max-w-[700px] -translate-x-1/2 -translate-y-1/2 rounded-2xl border bg-background p-0 shadow-2xl
                   max-h-[90svh] overflow-hidden flex flex-col"
        aria-busy={isSaving}
      >
        {/* Header */}
        <div className="flex-shrink-0 px-6">
          <ModalHeader 
            title="Incident Details"
            align="left"
          />
        </div>
        <div className="flex items-center justify-between border-b px-6 pb-4">
          <div className="flex items-center gap-2">
            {isEditMode && (
              <Button onClick={handleSave} disabled={isSaving} className="min-w-[80px]">
                {isSaving ? 'Saving...' : 'Save'}
              </Button>
            )}
            <Button variant="ghost" size="sm" onClick={handleClose} className="h-8 w-8 p-0 rounded-full">
              <X className="h-4 w-4" />
              <span className="sr-only">Close</span>
            </Button>
          </div>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 min-h-0 overflow-y-auto cc-modal-scroll px-6 py-4 space-y-6">
          {/* (Your existing content/fields remain unchanged) */}
          {/* ... */}
          {/* Validation Errors */}
          {validationErrors.general && (
            <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-lg">
              {validationErrors.general}
            </div>
          )}
        </div>

        {/* Sticky view-mode save bar */}
        {!isEditMode && isDirty && (
          <div className="sticky bottom-0 left-0 right-0 bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-t px-6 py-3">
            <div className="flex items-center justify-end gap-2">
              <Button onClick={handleSave} disabled={isSaving} className="min-w-[80px]" aria-label="Save and close">
                <Save className="h-4 w-4 mr-1" />
                {isSaving ? 'Saving...' : 'Save'}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
