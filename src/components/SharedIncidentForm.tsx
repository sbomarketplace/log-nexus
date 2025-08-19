import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Upload, FileText, X, Calendar, Clock } from 'lucide-react';
import { getCategoryOptions, getAllCategories } from '@/utils/incidentCategories';
import { 
  parseISOToLocal, 
  formatYYYYMMDD, 
  formatHHmm, 
  combineLocalDateAndTime, 
  toUTCISO,
  validateCaseNumber 
} from '@/utils/datetime';
import { getPreferredDateTime } from '@/utils/timelineParser';
import { OrganizedIncident } from '@/utils/organizedIncidentStorage';
import { supabase } from '@/integrations/supabase/client';

export interface FormData {
  dateValue: string | null;
  timeValue: string | null; 
  caseNumber: string;
  categoryOrIssue: string;
  who: string;
  what: string;
  where: string;
  when: string;
  witnesses: string;
  notes: string;
  timeline: string;
  requests: string;
  policy: string;
  evidence: string;
}

interface SharedIncidentFormProps {
  incident: OrganizedIncident;
  onSave: (payload: Partial<OrganizedIncident>) => Promise<void>;
  uploadedFiles?: File[];
  existingFiles?: string[];
  onFileUpload?: (files: File[]) => void;
  onRemoveUploadedFile?: (index: number) => void;
  onRemoveExistingFile?: (index: number) => void;
  isLoading?: boolean;
}

export const SharedIncidentForm = ({ 
  incident, 
  onSave, 
  uploadedFiles = [],
  existingFiles = [],
  onFileUpload,
  onRemoveUploadedFile,
  onRemoveExistingFile,
  isLoading = false
}: SharedIncidentFormProps) => {
  // Initialize form state based on incident data precedence
  const initializeFormData = (): FormData => {
    // Get preferred date and time from original date text and timeline
    const preferred = getPreferredDateTime(incident);
    
    // Build initial values with preference for original date text and timeline time
    const hasDateTime = Boolean(incident.dateTime);
    const dtLocal = hasDateTime ? parseISOToLocal(incident.dateTime!) : null;
    
    return {
      dateValue: preferred.date || 
                 (dtLocal ? formatYYYYMMDD(dtLocal) : incident.datePart) || null,
      timeValue: preferred.time || 
                 (dtLocal ? formatHHmm(dtLocal) : incident.timePart) || null,
      caseNumber: incident.caseNumber ?? "",
      categoryOrIssue: incident.categoryOrIssue || "",
      who: incident.who || "",
      what: incident.what || "",
      where: incident.where || "",
      when: incident.when || "",
      witnesses: incident.witnesses || "",
      notes: incident.notes || "",
      timeline: incident.timeline || "",
      requests: incident.requests || "",
      policy: incident.policy || "",
      evidence: incident.evidence || ""
    };
  };

  const [formData, setFormData] = useState<FormData>(initializeFormData);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  // Re-initialize when incident changes
  useEffect(() => {
    setFormData(initializeFormData());
    setValidationErrors({});
  }, [incident]);

  const handleFieldChange = (field: keyof FormData, value: string | null) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear validation error for this field
    if (validationErrors[field]) {
      setValidationErrors(prev => ({
        ...prev,
        [field]: ""
      }));
    }
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};
    
    if (!formData.categoryOrIssue) {
      errors.categoryOrIssue = "Category is required";
    }
    
    if (formData.caseNumber && !validateCaseNumber(formData.caseNumber)) {
      errors.caseNumber = "Case number can only contain letters, numbers, spaces, hyphens, and slashes";
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (onFileUpload) {
      onFileUpload(files);
    }
  };

  const uploadFilesToStorage = async (files: File[]): Promise<string[]> => {
    const uploadPromises = files.map(async (file) => {
      const fileName = `${Date.now()}_${file.name}`;
      const { data, error } = await supabase.storage
        .from('incident-files')
        .upload(fileName, file);
      
      if (error) {
        console.error('Error uploading file:', error);
        throw new Error(`Failed to upload ${file.name}`);
      }
      
      return fileName;
    });
    
    return Promise.all(uploadPromises);
  };

  const handleSave = async () => {
    if (!validateForm()) return;
    
    try {
      // Upload new files if any
      const newFileNames = uploadedFiles.length > 0 
        ? await uploadFilesToStorage(uploadedFiles)
        : [];
      
      // Normalize outgoing payload based on current inputs
      const hasDate = Boolean(formData.dateValue && formData.dateValue.length === 10); // YYYY-MM-DD
      const hasTime = Boolean(formData.timeValue && formData.timeValue.length >= 4); // HH:mm
      
      let payload: Partial<OrganizedIncident> = {
        categoryOrIssue: formData.categoryOrIssue,
        who: formData.who || null,
        what: formData.what || null,
        where: formData.where || null,
        when: formData.when || null,
        witnesses: formData.witnesses || null,
        notes: formData.notes || null,
        timeline: formData.timeline || null,
        requests: formData.requests || null,
        policy: formData.policy || null,
        evidence: formData.evidence || null,
        caseNumber: formData.caseNumber.trim() || null,
        files: [...existingFiles, ...newFileNames]
      };

      // Handle date/time logic
      if (hasDate && hasTime) {
        const combinedLocal = combineLocalDateAndTime(formData.dateValue!, formData.timeValue!);
        payload.dateTime = toUTCISO(combinedLocal);
        payload.datePart = null;
        payload.timePart = null;
      } else if (hasDate && !hasTime) {
        payload.dateTime = null;
        payload.datePart = formData.dateValue!;
        payload.timePart = null;
      } else if (!hasDate && hasTime) {
        payload.dateTime = null;
        payload.datePart = null;
        payload.timePart = formData.timeValue!;
      } else {
        payload.dateTime = null;
        payload.datePart = null;
        payload.timePart = null;
      }
      
      await onSave(payload);
    } catch (error) {
      console.error('Error saving incident:', error);
      throw error; // Let parent handle the error toast
    }
  };

  const categoryOptions = getAllCategories().map(category => ({
    value: category,
    label: category
  }));

  return (
    <div className="space-y-4">
      {/* Date Section */}
      <div className="space-y-2">
        <Label htmlFor="date-input" className="text-sm font-medium">
          Date
        </Label>
        <div className="relative">
          <Input
            id="date-input"
            type="date"
            value={formData.dateValue || ""}
            onChange={(e) => handleFieldChange('dateValue', e.target.value || null)}
            className="w-full"
            aria-label="Choose date"
          />
          <Calendar className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
        </div>
      </div>

      {/* Time Section - directly under Date */}
      <div className="space-y-2">
        <Label htmlFor="time-input" className="text-sm font-medium">
          Time
        </Label>
        <div className="relative">
          <Input
            id="time-input"
            type="time"
            value={formData.timeValue || ""}
            onChange={(e) => handleFieldChange('timeValue', e.target.value || null)}
            className="w-full"
            aria-label="Choose time"
          />
          <Clock className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
        </div>
      </div>

      {/* Case Number Section */}
      <div className="space-y-2">
        <Label htmlFor="case-number" className="text-sm font-medium">
          Case # (Optional)
        </Label>
        <Input
          id="case-number"
          type="text"
          value={formData.caseNumber}
          onChange={(e) => handleFieldChange('caseNumber', e.target.value)}
          placeholder="Enter case number"
          className="w-full"
          aria-label="Case number"
          maxLength={50}
        />
        {validationErrors.caseNumber && (
          <p className="text-sm text-red-600">{validationErrors.caseNumber}</p>
        )}
      </div>

      {/* Category Section */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">Category/Issue *</Label>
        <Select 
          value={formData.categoryOrIssue} 
          onValueChange={(value) => handleFieldChange('categoryOrIssue', value)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select category" />
          </SelectTrigger>
          <SelectContent>
            {categoryOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {validationErrors.categoryOrIssue && (
          <p className="text-sm text-red-600">{validationErrors.categoryOrIssue}</p>
        )}
      </div>

      {/* Who Section */}
      <div className="space-y-2">
        <Label htmlFor="who" className="text-sm font-medium">Who</Label>
        <Textarea
          id="who"
          value={formData.who}
          onChange={(e) => handleFieldChange('who', e.target.value)}
          placeholder="Who was involved?"
          className="text-base min-h-[60px] resize-none"
          rows={2}
        />
      </div>

      {/* What Section */}
      <div className="space-y-2">
        <Label htmlFor="what" className="text-sm font-medium">What</Label>
        <Textarea
          id="what"
          value={formData.what}
          onChange={(e) => handleFieldChange('what', e.target.value)}
          placeholder="What happened?"
          className="text-base min-h-[80px] resize-none"
          rows={3}
        />
      </div>

      {/* Where Section */}
      <div className="space-y-2">
        <Label htmlFor="where" className="text-sm font-medium">Where</Label>
        <Textarea
          id="where"
          value={formData.where}
          onChange={(e) => handleFieldChange('where', e.target.value)}
          placeholder="Where did this occur?"
          className="text-base min-h-[60px] resize-none"
          rows={2}
        />
      </div>

      {/* When Section */}
      <div className="space-y-2">
        <Label htmlFor="when" className="text-sm font-medium">When</Label>
        <Textarea
          id="when"
          value={formData.when}
          onChange={(e) => handleFieldChange('when', e.target.value)}
          placeholder="When did this occur? (Additional timing details)"
          className="text-base min-h-[60px] resize-none"
          rows={2}
        />
      </div>

      {/* Witnesses Section */}
      <div className="space-y-2">
        <Label htmlFor="witnesses" className="text-sm font-medium">Witnesses</Label>
        <Textarea
          id="witnesses"
          value={formData.witnesses}
          onChange={(e) => handleFieldChange('witnesses', e.target.value)}
          placeholder="Who witnessed this incident?"
          className="text-base min-h-[60px] resize-none"
          rows={2}
        />
      </div>

      {/* Timeline Section */}
      <div className="space-y-2">
        <Label htmlFor="timeline" className="text-sm font-medium">Timeline</Label>
        <Textarea
          id="timeline"
          value={formData.timeline}
          onChange={(e) => handleFieldChange('timeline', e.target.value)}
          placeholder="Detailed timeline of events"
          className="text-base min-h-[80px] resize-none"
          rows={3}
        />
      </div>

      {/* Requests Section */}
      <div className="space-y-2">
        <Label htmlFor="requests" className="text-sm font-medium">Requests</Label>
        <Textarea
          id="requests"
          value={formData.requests}
          onChange={(e) => handleFieldChange('requests', e.target.value)}
          placeholder="What action or resolution are you seeking?"
          className="text-base min-h-[60px] resize-none"
          rows={2}
        />
      </div>

      {/* Policy Section */}
      <div className="space-y-2">
        <Label htmlFor="policy" className="text-sm font-medium">Policy Reference</Label>
        <Textarea
          id="policy"
          value={formData.policy}
          onChange={(e) => handleFieldChange('policy', e.target.value)}
          placeholder="Reference to relevant policies or procedures"
          className="text-base min-h-[60px] resize-none"
          rows={2}
        />
      </div>

      {/* Evidence Section */}
      <div className="space-y-2">
        <Label htmlFor="evidence" className="text-sm font-medium">Evidence</Label>
        <Textarea
          id="evidence"
          value={formData.evidence}
          onChange={(e) => handleFieldChange('evidence', e.target.value)}
          placeholder="Describe any evidence related to this incident"
          className="text-base min-h-[60px] resize-none"
          rows={2}
        />
      </div>

      {/* Notes Section */}
      <div className="space-y-2">
        <Label htmlFor="notes" className="text-sm font-medium">Additional Notes</Label>
        <Textarea
          id="notes"
          value={formData.notes}
          onChange={(e) => handleFieldChange('notes', e.target.value)}
          placeholder="Any additional information"
          className="text-base min-h-[240px] resize-none"
          rows={10}
        />
      </div>

      {/* File Upload Section */}
      {onFileUpload && (
        <div className="space-y-2">
          <Label className="text-sm font-medium">Supporting Files</Label>
          
          {/* Existing Files */}
          {existingFiles.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-xs font-medium text-slate-600">Existing Files</h4>
              {existingFiles.map((fileName, index) => (
                <div key={index} className="flex items-center justify-between p-2 bg-slate-50 rounded border">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-slate-500" />
                    <span className="text-sm">{fileName}</span>
                  </div>
                  {onRemoveExistingFile && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onRemoveExistingFile(index)}
                      className="h-6 w-6 p-0"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Uploaded Files */}
          {uploadedFiles.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-xs font-medium text-slate-600">New Files</h4>
              {uploadedFiles.map((file, index) => (
                <div key={index} className="flex items-center justify-between p-2 bg-blue-50 rounded border border-blue-200">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-blue-500" />
                    <span className="text-sm">{file.name}</span>
                  </div>
                  {onRemoveUploadedFile && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onRemoveUploadedFile(index)}
                      className="h-6 w-6 p-0"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Upload Button */}
          <div className="flex items-center gap-2">
            <input
              type="file"
              multiple
              onChange={handleFileUpload}
              className="hidden"
              id="file-upload"
            />
            <label htmlFor="file-upload" className="cursor-pointer">
              <Button variant="outline" size="sm" type="button" asChild>
                <span className="flex items-center gap-2">
                  <Upload className="h-4 w-4" />
                  Upload Files
                </span>
              </Button>
            </label>
          </div>
        </div>
      )}

      {/* Save Button */}
      <Button 
        onClick={handleSave} 
        className="w-full" 
        disabled={isLoading}
      >
        {isLoading ? "Saving..." : "Save Changes"}
      </Button>
    </div>
  );
};
