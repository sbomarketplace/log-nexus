import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { X, Edit3, Save, Loader2 } from 'lucide-react';
import { OrganizedIncident, organizedIncidentStorage } from '@/utils/organizedIncidentStorage';
import { formatDisplayDate, parseIncidentDate } from '@/utils/dateParser';
import { makePhoneNumbersClickable } from '@/utils/phoneUtils';
import { getAllCategories } from '@/utils/incidentCategories';
import { normalizeToFirstPerson } from '@/utils/voiceNormalizer';
import { useToast } from '@/hooks/use-toast';

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
  // HOOKS MUST BE DECLARED AT TOP LEVEL - React Rules of Hooks requirement
  // All hooks must be called in the same order every render, regardless of props or state
  const { toast } = useToast();
  const [isEditMode, setIsEditMode] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState<Partial<OrganizedIncident>>({});
  const [dateInput, setDateInput] = useState('');
  const [parsedDate, setParsedDate] = useState<{ date: string; confidence: string } | null>(null);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [isDirty, setIsDirty] = useState(false);
  const firstEditFieldRef = useRef<HTMLInputElement>(null);

  const isOwner = !currentUserId || currentUserId === 'mock-user' || true; // TODO: Implement actual ownership check

  // Initialize form data when incident changes
  useEffect(() => {
    if (incident) {
      setFormData({
        ...incident
      });
      setDateInput(incident.originalEventDateText || incident.date || '');
      if (incident.canonicalEventDate) {
        setParsedDate({
          date: formatDisplayDate(incident.canonicalEventDate),
          confidence: 'high'
        });
      }
    }
  }, [incident]);

  // Check if form is dirty
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
      dateInput !== (incident.originalEventDateText || incident.date || '')
    );
    
    setIsDirty(hasChanges);
  }, [formData, dateInput, incident, isEditMode]);

  const displayDate = incident.canonicalEventDate 
    ? formatDisplayDate(incident.canonicalEventDate)
    : incident.date !== 'No date' 
      ? incident.date 
      : 'No date';

  // Handle date input changes with live parsing
  const handleDateInputChange = useCallback((value: string) => {
    setDateInput(value);
    
    if (!value.trim()) {
      setParsedDate(null);
      setValidationErrors(prev => ({ ...prev, date: '' }));
      return;
    }

    try {
      const parsed = parseIncidentDate(value);
      if (parsed) {
        setParsedDate({
          date: formatDisplayDate(parsed.canonicalEventDate),
          confidence: parsed.confidence
        });
        setValidationErrors(prev => ({ ...prev, date: '' }));
      } else {
        setParsedDate(null);
        setValidationErrors(prev => ({ ...prev, date: 'Unable to parse date. Try formats like "yesterday", "07/23", or "last Friday".' }));
      }
    } catch (error) {
      setParsedDate(null);
      setValidationErrors(prev => ({ ...prev, date: 'Invalid date format' }));
    }
  }, []);

  // Handle form field changes
  const handleFieldChange = useCallback((field: keyof OrganizedIncident, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  }, []);

  // Enter edit mode
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
      // Parse the date
      let canonicalEventDate = incident.canonicalEventDate;
      let originalEventDateText = incident.originalEventDateText;
      
      if (dateInput !== (incident.originalEventDateText || incident.date || '')) {
        const parsed = parseIncidentDate(dateInput);
        if (parsed) {
          canonicalEventDate = parsed.canonicalEventDate;
          originalEventDateText = parsed.originalEventDateText;
        }
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

      const updatedIncident: OrganizedIncident = {
        ...incident,
        ...normalizedData,
        canonicalEventDate,
        originalEventDateText,
        date: parsedDate?.date || incident.date,
        updatedAt: new Date().toISOString()
      };

      // Save to storage
      organizedIncidentStorage.save(updatedIncident);
      
      // Update parent component
      onIncidentUpdate?.(updatedIncident);
      
      // Update local state
      setFormData(updatedIncident);
      setIsEditMode(false);
      setIsDirty(false);
      
      toast({
        title: 'Incident Updated',
        description: 'Your incident has been successfully updated.',
      });

    } catch (error) {
      console.error('Error saving incident:', error);
      toast({
        title: 'Save Failed',
        description: 'There was an error updating your incident. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setIsSaving(false);
    }
  }, [incident, formData, dateInput, parsedDate, isOwner, onIncidentUpdate, toast]);

  // Cancel editing
  const handleCancel = useCallback(() => {
    if (isDirty) {
      // Show confirmation dialog for unsaved changes
      if (window.confirm('You have unsaved changes. Discard your changes?')) {
        // Reset form data
        setFormData({ ...incident });
        setDateInput(incident.originalEventDateText || incident.date || '');
        if (incident.canonicalEventDate) {
          setParsedDate({
            date: formatDisplayDate(incident.canonicalEventDate),
            confidence: 'high'
          });
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

  // Handle modal close with dirty check
  const handleModalClose = useCallback((shouldClose: boolean) => {
    if (!shouldClose) return;
    
    if (isEditMode && isDirty) {
      if (window.confirm('You have unsaved changes. Discard your changes?')) {
        setIsEditMode(false);
        setIsDirty(false);
        setValidationErrors({});
        onOpenChange(false);
      }
    } else {
      onOpenChange(false);
    }
  }, [isEditMode, isDirty, onOpenChange]);

  // Keyboard handling
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

  // Early return AFTER all hooks are declared to maintain consistent hook order
  if (!incident) return null;

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

  const categoryClass = getCategoryClass(formData.categoryOrIssue || incident.categoryOrIssue);

  // Function to render text with clickable phone numbers
  const renderTextWithPhoneLinks = (text: string) => {
    const htmlWithPhoneLinks = makePhoneNumbersClickable(text);
    return <span dangerouslySetInnerHTML={{ __html: htmlWithPhoneLinks }} />;
  };

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
        <div className="flex max-h-[85vh] flex-col">
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
                    onClick={handleCancel}
                    disabled={isSaving}
                    className="text-xs h-8 px-3"
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleSave}
                    disabled={isSaving}
                    className="text-xs h-8 px-3 hover:underline focus:ring-2 focus:ring-offset-2"
                    aria-label="Save changes"
                  >
                    {isSaving ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin mr-1" />
                        Saving
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4 mr-1" />
                        Save
                      </>
                    )}
                  </Button>
                </>
              ) : (
                isOwner && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleEditClick}
                    className="text-xs h-8 px-3 hover:underline focus:ring-2 focus:ring-offset-2"
                    aria-label="Edit incident"
                  >
                    <Edit3 className="h-4 w-4 mr-1" />
                    Edit
                  </Button>
                )
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleModalClose(true)}
                className={`h-8 w-8 p-0 rounded-full hover:bg-secondary focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-${categoryClass.split('-')[1]}-tint`}
                aria-label="Close incident details"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Scrollable Content */}
          <div 
            className={`flex-1 overflow-y-auto px-5 ${isEditMode ? 'py-2' : 'py-3'}`}
            data-scroll-container
          >
            {/* Header row with date and category - editable in edit mode */}
            <div className={`flex items-start gap-3 mb-3 ${isEditMode ? 'flex-col sm:flex-row' : 'flex-wrap'}`}>
              {isEditMode ? (
                <>
                  {/* Date Input */}
                  <div className="flex-1 min-w-0">
                    <Input
                      ref={firstEditFieldRef}
                      value={dateInput}
                      onChange={(e) => handleDateInputChange(e.target.value)}
                      placeholder="e.g., yesterday, 07/23, last Friday"
                      className={`text-base h-9 ${validationErrors.date ? 'border-destructive' : ''}`}
                      aria-label="Event date"
                    />
                    {parsedDate && (
                      <div className="text-xs text-muted-foreground mt-1">
                        Parsed as: {parsedDate.date}
                      </div>
                    )}
                    {validationErrors.date && (
                      <div className="text-xs text-destructive mt-1">{validationErrors.date}</div>
                    )}
                  </div>
                  
                  {/* Category Select */}
                  <div className="flex-1 min-w-0">
                    <Select
                      value={formData.categoryOrIssue || ''}
                      onValueChange={(value) => handleFieldChange('categoryOrIssue', value)}
                    >
                      <SelectTrigger className={`text-base h-9 ${validationErrors.categoryOrIssue ? 'border-destructive' : ''}`}>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        {getAllCategories().map((category) => (
                          <SelectItem key={category} value={category} className="text-base">
                            {category}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {validationErrors.categoryOrIssue && (
                      <div className="text-xs text-destructive mt-1">{validationErrors.categoryOrIssue}</div>
                    )}
                  </div>
                </>
              ) : (
                <>
                  <Badge 
                    variant="secondary" 
                    className="text-xs font-medium shrink-0 h-7 px-3 flex items-center bg-muted text-muted-foreground border rounded-full"
                  >
                    {displayDate}
                  </Badge>
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
                  <h4 className="text-xs font-medium text-slate-600 mb-1">Who</h4>
                  {isEditMode ? (
                    <Textarea
                      value={formData.who || ''}
                      onChange={(e) => handleFieldChange('who', e.target.value)}
                      placeholder="Who was involved?"
                      className="text-base min-h-[60px] resize-none"
                      rows={2}
                    />
                  ) : (
                    <p className="text-sm leading-snug break-words overflow-wrap-anywhere text-slate-900 dark:text-slate-100">
                      {renderTextWithPhoneLinks(incident.who)}
                    </p>
                  )}
                </div>
              )}

              {((isEditMode || incident.who) && (isEditMode || incident.what)) && <div className="border-t border-border/50 my-2"></div>}

              {/* What Section */}
              {(isEditMode || incident.what) && (
                <div className={`${!isEditMode ? `border-l-[3px] pl-3 category-tint-${categoryClass.split('-')[1]}` : ''}`}>
                  <h4 className="text-xs font-medium text-slate-600 mb-1">What</h4>
                  {isEditMode ? (
                    <Textarea
                      value={formData.what || ''}
                      onChange={(e) => handleFieldChange('what', e.target.value)}
                      placeholder="What happened?"
                      className="text-base min-h-[60px] resize-none"
                      rows={2}
                    />
                  ) : (
                    <p className="text-sm leading-snug break-words overflow-wrap-anywhere text-slate-900 dark:text-slate-100">
                      {renderTextWithPhoneLinks(incident.what)}
                    </p>
                  )}
                </div>
              )}

              {((isEditMode || incident.what) && (isEditMode || incident.where)) && <div className="border-t border-border/50 my-2"></div>}

              {/* Where Section */}
              {(isEditMode || incident.where) && (
                <div>
                  <h4 className="text-xs font-medium text-slate-600 mb-1">Where</h4>
                  {isEditMode ? (
                    <Input
                      value={formData.where || ''}
                      onChange={(e) => handleFieldChange('where', e.target.value)}
                      placeholder="Where did it happen?"
                      className="text-base"
                    />
                  ) : (
                    <p className="text-sm leading-snug break-words overflow-wrap-anywhere text-slate-900 dark:text-slate-100">
                      {renderTextWithPhoneLinks(incident.where)}
                    </p>
                  )}
                </div>
              )}

              {((isEditMode || incident.where) && (isEditMode || incident.when)) && <div className="border-t border-border/50 my-2"></div>}

              {/* When Section */}
              {(isEditMode || incident.when) && (
                <div>
                  <h4 className="text-xs font-medium text-slate-600 mb-1">When</h4>
                  {isEditMode ? (
                    <Input
                      value={formData.when || ''}
                      onChange={(e) => handleFieldChange('when', e.target.value)}
                      placeholder="When did it happen?"
                      className="text-base"
                    />
                  ) : (
                    <p className="text-sm leading-snug break-words overflow-wrap-anywhere text-slate-900 dark:text-slate-100">
                      {renderTextWithPhoneLinks(incident.when)}
                    </p>
                  )}
                </div>
              )}

              {((isEditMode || incident.when) && (isEditMode || incident.witnesses)) && <div className="border-t border-border/50 my-2"></div>}

              {/* Witnesses Section */}
              {(isEditMode || incident.witnesses) && (
                <div>
                  <h4 className="text-xs font-medium text-slate-600 mb-1">Witnesses</h4>
                  {isEditMode ? (
                    <Textarea
                      value={formData.witnesses || ''}
                      onChange={(e) => handleFieldChange('witnesses', e.target.value)}
                      placeholder="Any witnesses?"
                      className="text-base min-h-[60px] resize-none"
                      rows={2}
                    />
                  ) : (
                    <p className="text-sm leading-snug break-words overflow-wrap-anywhere text-slate-900 dark:text-slate-100">
                      {renderTextWithPhoneLinks(incident.witnesses)}
                    </p>
                  )}
                </div>
              )}

              {/* Timeline Section */}
              {(isEditMode || incident.timeline) && (
                <>
                  {((isEditMode || incident.who || incident.what || incident.where || incident.when || incident.witnesses) && (isEditMode || incident.timeline)) && <div className="border-t border-border/50 my-2"></div>}
                  <div>
                    <h4 className="text-xs font-medium text-slate-600 mb-1">Timeline</h4>
                    {isEditMode ? (
                      <Textarea
                        value={formData.timeline || ''}
                        onChange={(e) => handleFieldChange('timeline', e.target.value)}
                        placeholder="Detailed timeline of events"
                        className="text-base min-h-[80px] resize-none"
                        rows={3}
                      />
                    ) : (
                      <p className="text-sm leading-snug whitespace-pre-wrap break-words overflow-wrap-anywhere text-slate-900 dark:text-slate-100">
                        {renderTextWithPhoneLinks(incident.timeline)}
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
                    <h4 className="text-xs font-medium text-slate-600 mb-1">Requests</h4>
                    {isEditMode ? (
                      <Textarea
                        value={formData.requests || ''}
                        onChange={(e) => handleFieldChange('requests', e.target.value)}
                        placeholder="Any specific requests or actions needed?"
                        className="text-base min-h-[60px] resize-none"
                        rows={2}
                      />
                    ) : (
                      <p className="text-sm leading-snug whitespace-pre-wrap break-words overflow-wrap-anywhere text-slate-900 dark:text-slate-100">
                        {renderTextWithPhoneLinks(incident.requests)}
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
                    <h4 className="text-xs font-medium text-slate-600 mb-1">Policy</h4>
                    {isEditMode ? (
                      <Textarea
                        value={formData.policy || ''}
                        onChange={(e) => handleFieldChange('policy', e.target.value)}
                        placeholder="Relevant policies or procedures"
                        className="text-base min-h-[60px] resize-none"
                        rows={2}
                      />
                    ) : (
                      <p className="text-sm leading-snug whitespace-pre-wrap break-words overflow-wrap-anywhere text-slate-900 dark:text-slate-100">
                        {renderTextWithPhoneLinks(incident.policy)}
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
                    <h4 className="text-xs font-medium text-slate-600 mb-1">Evidence</h4>
                    {isEditMode ? (
                      <Textarea
                        value={formData.evidence || ''}
                        onChange={(e) => handleFieldChange('evidence', e.target.value)}
                        placeholder="Evidence or documentation"
                        className="text-base min-h-[60px] resize-none"
                        rows={2}
                      />
                    ) : (
                      <p className="text-sm leading-snug whitespace-pre-wrap break-words overflow-wrap-anywhere text-slate-900 dark:text-slate-100">
                        {renderTextWithPhoneLinks(incident.evidence)}
                      </p>
                    )}
                  </div>
                </>
              )}

              {/* Always show summary with separator if other content exists */}
              {(isEditMode || incident.evidence || incident.policy || incident.requests || incident.timeline || incident.who || incident.what || incident.where || incident.when || incident.witnesses) && <div className="border-t border-border/50 my-2"></div>}

              {/* Incident Summary */}
              <div>
                <h4 className="text-xs font-medium text-slate-600 mb-1">
                  Incident Summary {isEditMode && <span className="text-destructive">*</span>}
                </h4>
                {isEditMode ? (
                  <>
                    <Textarea
                      value={formData.notes || ''}
                      onChange={(e) => handleFieldChange('notes', e.target.value)}
                      placeholder="Summarize the incident"
                      className={`text-base min-h-[100px] resize-none ${validationErrors.notes ? 'border-destructive' : ''}`}
                      rows={4}
                    />
                    {validationErrors.notes && (
                      <div className="text-xs text-destructive mt-1">{validationErrors.notes}</div>
                    )}
                  </>
                ) : (
                  <p className="text-sm leading-snug whitespace-pre-wrap break-words overflow-wrap-anywhere text-slate-900 dark:text-slate-100">
                    {renderTextWithPhoneLinks(incident.notes)}
                  </p>
                )}
              </div>
            </div>

            {/* Timestamps */}
            {!isEditMode && (
              <div className="border-t border-border/50 pt-2 mt-3 text-xs text-slate-500">
                <div className="space-y-1">
                  <div>Created: {new Date(incident.createdAt).toLocaleString()}</div>
                  <div>Last Updated: {new Date(incident.updatedAt).toLocaleString()}</div>
                  {incident.originalEventDateText && (
                    <div>Original Date Text: "{incident.originalEventDateText}"</div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};