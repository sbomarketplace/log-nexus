import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '@/components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { organizedIncidentStorage, OrganizedIncident } from '@/utils/organizedIncidentStorage';
import { ArrowLeftIcon, PlusIcon, XIcon, FileIcon } from '@/components/icons/CustomIcons';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { getCategoryOptions } from '@/utils/incidentCategories';
import { supabase } from '@/integrations/supabase/client';
import { validateCaseNumber, toUTCISO, combineDateAndTime } from '@/utils/datetime';
import { Wand2, Loader2 } from 'lucide-react';
import { prefillIncidentFromNotes } from '@/lib/notesPrefill';
import { ensureAIAllowed } from '@/lib/ai-quota';
import { PaywallWrapper } from '@/components/paywall/PaywallWrapper';
import { cn } from '@/lib/utils';


interface Person {
  name: string;
  role: string;
}

interface UnionInvolvement {
  name: string;
  union: string;
  role: string;
  notes: string;
}

const AddIncident = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [formData, setFormData] = useState({
    title: '',
    category: '',
    what: '',
    where: '',
    why: '',
    how: '',
  });
  
  const [titleError, setTitleError] = useState('');
  
  // Unified date/time state
  const [selectedDateTime, setSelectedDateTime] = useState(new Date());
  const [caseNumber, setCaseNumber] = useState('');
  const [caseNumberAutoFilled, setCaseNumberAutoFilled] = useState(false);

  const [whoInvolved, setWhoInvolved] = useState<Person[]>([{ name: '', role: '' }]);
  const [witnesses, setWitnesses] = useState<Person[]>([{ name: '', role: '' }]);
  const [unionInvolvement, setUnionInvolvement] = useState<UnionInvolvement[]>([]);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  const [tags, setTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState('');
  const [isRewriting, setIsRewriting] = useState(false);
  const [rewriteError, setRewriteError] = useState<string>('');
  const [showPaywall, setShowPaywall] = useState(false);
  
  // AI is unlimited - no paywall needed
  const handleAIRewrite = async () => {
    await ensureAIAllowed(); // AI is unlimited
    
    if (!formData.what.trim()) {
      toast({
        title: "Nothing to Rewrite",
        description: "Please enter some content in the 'What happened?' field first.",
        variant: "destructive",
      });
      return;
    }

    setIsRewriting(true);
    setRewriteError('');

    try {
      const { data, error } = await supabase.functions.invoke('rewrite-incident', {
        body: { text: formData.what }
      });

      if (error) {
        throw error;
      }

      if (data.error) {
        throw new Error(data.error);
      }

      if (data.rewritten) {
        handleInputChange('what', data.rewritten);
        toast({
          title: "Content Rewritten",
          description: "The incident description has been improved by AI.",
        });
      }
    } catch (error) {
      console.error('Error rewriting content:', error);
      const errorMessage = error instanceof Error ? error.message : 'Could not rewrite at this time. Please try again.';
      setRewriteError(errorMessage);
      toast({
        title: "Rewrite Failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsRewriting(false);
    }
  };

  const validateAndSubmit = () => {
    const t = (formData.title || "").trim();
    if (!t) {
      setTitleError("Title is required");
      // Focus + shake
      requestAnimationFrame(() => {
        document.getElementById("incident-title")?.focus();
      });
      toast({
        title: "Add a title",
        description: "A title is required before you can save this incident.",
        variant: "destructive",
      });
      // remove the shake class after it runs once
      setTimeout(() => setTitleError((e) => e && "Title is required"), 350);
      return false;
    }
    if (t.length > 80) {
      setTitleError("Title must be 80 characters or fewer");
      toast({
        title: "Title too long",
        description: "Keep it under 80 characters.",
        variant: "destructive",
      });
      return false;
    }
    setTitleError('');
    return validateForm();
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.category.trim()) newErrors.category = 'Category is required';
    if (!formData.what.trim()) newErrors.what = 'What happened is required';
    if (!formData.where.trim()) newErrors.where = 'Location is required';
    if (!selectedDateTime) newErrors.dateTime = 'Please select a date and time';
    if (caseNumber && !validateCaseNumber(caseNumber)) {
      newErrors.caseNumber = 'Case number can only contain letters, numbers, spaces, dashes, and slashes (max 50 characters)';
    }
    if (whoInvolved.filter(person => person.name.trim()).length === 0) {
      newErrors.who = 'At least one person involved is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Date and time picker handlers
  const handleDateChange = (date: Date) => {
    const merged = combineDateAndTime(date, selectedDateTime);
    setSelectedDateTime(merged);
    if (errors.dateTime) {
      setErrors(prev => ({ ...prev, dateTime: '' }));
    }
  };

  const handleTimeChange = (time: Date) => {
    const merged = combineDateAndTime(selectedDateTime, time);
    setSelectedDateTime(merged);
    if (errors.dateTime) {
      setErrors(prev => ({ ...prev, dateTime: '' }));
    }
  };

  const handleCaseNumberChange = (value: string) => {
    setCaseNumber(value);
    if (caseNumberAutoFilled) {
      setCaseNumberAutoFilled(false);
    }
    if (errors.caseNumber) {
      setErrors(prev => ({ ...prev, caseNumber: '' }));
    }
  };

  const handleInputChange = (field: string, value: string) => {
    if (field === 'title') {
      // Limit to 80 characters and clear error on change
      const trimmedValue = value.slice(0, 80);
      setFormData(prev => ({ ...prev, [field]: trimmedValue }));
      if (titleError) {
        setTitleError('');
      }
    } else {
      setFormData(prev => ({ ...prev, [field]: value }));
    }
    
    // Auto-prefill from notes when "what" field changes and other fields are empty
    if (field === 'what' && value.trim()) {
      const mockIncident = { 
        what: value, 
        notes: value,
        caseNumber: caseNumber,
        where: formData.where,
        dateTime: undefined,
        datePart: undefined,
        timePart: undefined 
      };
      
      const prefillData = prefillIncidentFromNotes(mockIncident as any);
      
      if (prefillData.caseNumber && !caseNumber) {
        setCaseNumber(prefillData.caseNumber);
        setCaseNumberAutoFilled(true);
      }
    }
    
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const updatePerson = (persons: Person[], setPersons: React.Dispatch<React.SetStateAction<Person[]>>, index: number, field: 'name' | 'role', value: string) => {
    setPersons(prev => 
      prev.map((person, i) => i === index ? { ...person, [field]: value } : person)
    );
    if (errors.who && setPersons === setWhoInvolved) {
      setErrors(prev => ({ ...prev, who: '' }));
    }
  };

  const addPerson = (setPersons: React.Dispatch<React.SetStateAction<Person[]>>) => {
    setPersons(prev => [...prev, { name: '', role: '' }]);
  };

  const removePerson = (setPersons: React.Dispatch<React.SetStateAction<Person[]>>, index: number) => {
    setPersons(prev => prev.filter((_, i) => i !== index));
  };

  const addUnionInvolvement = () => {
    setUnionInvolvement(prev => [...prev, { name: '', union: '', role: '', notes: '' }]);
  };

  const updateUnionInvolvement = (index: number, field: keyof UnionInvolvement, value: string) => {
    setUnionInvolvement(prev => 
      prev.map((item, i) => i === index ? { ...item, [field]: value } : item)
    );
  };

  const removeUnionInvolvement = (index: number) => {
    setUnionInvolvement(prev => prev.filter((_, i) => i !== index));
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setUploadedFiles(prev => [...prev, ...files]);
  };

  const removeFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const addTag = () => {
    const tag = newTag.trim();
    if (tag && !tags.includes(tag)) {
      setTags(prev => [...prev, tag]);
      setNewTag('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(prev => prev.filter(tag => tag !== tagToRemove));
  };

  const handleTagKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addTag();
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateAndSubmit()) {
      return;
    }

    // Create the incident in OrganizedIncident format
    const organizedIncident: OrganizedIncident = {
      id: `incident_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      title: formData.title,
      date: selectedDateTime.toISOString().split('T')[0], // YYYY-MM-DD format
      dateTime: toUTCISO(selectedDateTime), // ISO string
      datePart: selectedDateTime.toISOString().split('T')[0],
      timePart: selectedDateTime.toTimeString().slice(0, 5), // HH:mm format
      caseNumber: caseNumber.trim() || undefined,
      categoryOrIssue: formData.category,
      who: whoInvolved.filter(person => person.name.trim()).map(p => `${p.name}${p.role ? ` (${p.role})` : ''}`).join(', '),
      what: formData.what,
      where: formData.where,
      when: selectedDateTime.toTimeString().slice(0, 5), // Time in HH:mm format
      witnesses: witnesses.filter(w => w.name.trim()).map(w => `${w.name}${w.role ? ` (${w.role})` : ''}`).join(', '),
      notes: [
        formData.how && `How: ${formData.how}`,
        formData.why && `Why: ${formData.why}`,
        unionInvolvement.filter(ui => ui.name.trim() || ui.union.trim()).length > 0 && 
          `Union: ${unionInvolvement.filter(ui => ui.name.trim() || ui.union.trim()).map(ui => 
            `${ui.name}${ui.union ? ` (${ui.union})` : ''}${ui.role ? ` - ${ui.role}` : ''}${ui.notes ? `: ${ui.notes}` : ''}`
          ).join('; ')}`,
        tags.length > 0 && `Tags: ${tags.join(', ')}`
      ].filter(Boolean).join('\n\n'),
      quotes: '',
      requests: '',
      timeline: '',
      policy: '',
      evidence: '',
      files: uploadedFiles.map(file => file.name),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      canonicalEventDate: toUTCISO(selectedDateTime),
      originalEventDateText: selectedDateTime.toISOString().split('T')[0],
      incidentKey: `${formData.category}_${formData.where}_${selectedDateTime.toISOString().split('T')[0]}`.toLowerCase().replace(/[^a-z0-9_]/g, '_')
    };

    organizedIncidentStorage.save(organizedIncident);
    
    toast({
      title: "Incident Reported",
      description: "The incident has been successfully recorded.",
    });

    // Navigate to home page with the new incident opened
    navigate(`/?incidentId=${organizedIncident.id}`);
  };


  const renderPersonSection = (
    title: string,
    persons: Person[],
    setPersons: React.Dispatch<React.SetStateAction<Person[]>>,
    isRequired = false,
    roleExamples = ""
  ) => (
    <Card>
      <CardHeader>
        <CardTitle>{title} {isRequired && '*'}</CardTitle>
      </CardHeader>
            <CardContent className="space-y-3">
        {persons.map((person, index) => (
          <div key={index} className="grid grid-cols-1 md:grid-cols-3 gap-2">
            <div className="md:col-span-2">
              <Input
                value={person.name}
                onChange={(e) => updatePerson(persons, setPersons, index, 'name', e.target.value)}
                placeholder="Name"
                className={errors.who && setPersons === setWhoInvolved ? 'border-destructive' : ''}
              />
            </div>
            <div className="flex gap-2">
              <Input
                value={person.role}
                onChange={(e) => updatePerson(persons, setPersons, index, 'role', e.target.value)}
                placeholder={roleExamples || "Role (optional)"}
              />
              {persons.length > 1 && (
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => removePerson(setPersons, index)}
                >
                  <XIcon size={16} />
                </Button>
              )}
            </div>
          </div>
        ))}
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => addPerson(setPersons)}
          className="w-full"
        >
          <PlusIcon size={16} className="mr-2" />
          Add Another Person
        </Button>
        {errors.who && setPersons === setWhoInvolved && (
          <p className="text-sm text-destructive">{errors.who}</p>
        )}
      </CardContent>
    </Card>
  );

  return (
    <Layout>
      <div className="add-incident-content max-w-4xl mx-auto space-y-6 -mt-4 -mb-1">
        {/* Header */}
        <div className="flex items-center space-x-3">
          <Button variant="ghost" size="sm" onClick={() => navigate('/')}>
            <ArrowLeftIcon size={16} />
          </Button>
          <div>
            <h1 className="text-lg font-medium text-foreground">Report New Incident</h1>
            <p className="text-xs text-muted-foreground">Provide detailed information about the incident</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">

          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="incident-title" className="block text-sm font-medium">
                  Title <span className="text-red-600">*</span>
                </Label>
                <Input
                  id="incident-title"
                  type="text"
                  value={formData.title}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  onBlur={() => setFormData(prev => ({ ...prev, title: prev.title.trim() }))}
                  required
                  maxLength={80}
                  placeholder="Short, clear title (max 80)"
                  className={cn(
                    "mt-1 w-full rounded-lg border px-3 py-2",
                    titleError ? "border-red-500 animate-shake" : ""
                  )}
                  aria-invalid={Boolean(titleError)}
                  aria-describedby={titleError ? "title-error" : undefined}
                />
                <div className="mt-1 text-xs text-muted-foreground">{80 - formData.title.length} characters left</div>
                {titleError && (
                  <p id="title-error" className="mt-1 text-xs text-red-600">{titleError}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3 w-full items-end">
                <div className="min-w-0">
                  <Label htmlFor="date">Date *</Label>
                  <Input
                    id="date"
                    type="date"
                    value={selectedDateTime.toISOString().split('T')[0]}
                    onChange={(e) => {
                      const newDate = new Date(e.target.value);
                      if (!isNaN(newDate.getTime())) {
                        handleDateChange(newDate);
                      }
                    }}
                    required
                    aria-label="Choose date"
                    className="w-full"
                  />
                </div>
                <div className="min-w-0">
                  <Label htmlFor="time">Time *</Label>
                  <Input
                    id="time"
                    type="time"
                    step="60"
                    value={selectedDateTime.toTimeString().slice(0, 5)}
                    onChange={(e) => {
                      const [hours, minutes] = e.target.value.split(':').map(Number);
                      const newTime = new Date();
                      newTime.setHours(hours, minutes, 0, 0);
                      handleTimeChange(newTime);
                    }}
                    required
                    aria-label="Choose time"
                    className="w-full"
                  />
                </div>
              </div>
              {errors.dateTime && <p className="text-sm text-destructive">{errors.dateTime}</p>}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="caseNumber">Case #</Label>
                  <div className="space-y-1">
                    <Input
                      id="caseNumber"
                      value={caseNumber}
                      onChange={(e) => handleCaseNumberChange(e.target.value)}
                      placeholder="Optional"
                      maxLength={50}
                      aria-label="Case number"
                    />
                    {caseNumberAutoFilled && (
                      <p className="text-xs text-muted-foreground">Parsed from notes • You can edit this</p>
                    )}
                    {errors.caseNumber && <p className="text-sm text-destructive">{errors.caseNumber}</p>}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="where">Location *</Label>
                  <Input
                    id="where"
                    value={formData.where}
                    onChange={(e) => handleInputChange('where', e.target.value)}
                    placeholder="Where did this occur?"
                    className={errors.where ? 'border-destructive' : ''}
                  />
                  {errors.where && <p className="text-xs text-destructive">{errors.where}</p>}
                </div>
              </div>

               <div className="space-y-2">
                 <Label htmlFor="category">Category/Issue *</Label>
                 <Select value={formData.category} onValueChange={(value) => handleInputChange('category', value)}>
                   <SelectTrigger className={errors.category ? 'border-destructive' : ''}>
                     <SelectValue placeholder="Select incident category" />
                   </SelectTrigger>
                   <SelectContent className="max-h-[200px]">
                     {getCategoryOptions().map((group) => (
                       <div key={group.group}>
                          <div className="px-2 py-1.5 text-sm font-bold text-primary">
                            {group.group}
                          </div>
                         {group.items.map((item) => (
                           <SelectItem key={item} value={item} className="pl-4">
                             {item}
                           </SelectItem>
                         ))}
                       </div>
                     ))}
                   </SelectContent>
                 </Select>
                 {errors.category && <p className="text-sm text-destructive">{errors.category}</p>}
               </div>
             </CardContent>
           </Card>

          {/* Who was involved */}
          {renderPersonSection(
            "Who was involved?",
            whoInvolved,
            setWhoInvolved,
            true,
            "Manager, Coworker, etc."
          )}

          {/* Incident Details */}
          <Card>
            <CardHeader>
              <CardTitle>Incident Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="what">What happened? *</Label>
                 <Textarea
                   id="what"
                   value={formData.what}
                   onChange={(e) => handleInputChange('what', e.target.value)}
                   placeholder="Describe what occurred in detail"
                   rows={8}
                   className={errors.what ? 'border-destructive' : ''}
                />
                 {errors.what && <p className="text-sm text-destructive">{errors.what}</p>}
                 {/* AI Rewrite button */}
                 <div className="flex justify-end space-y-1">
                   <div className="flex flex-col items-end">
                     <Button 
                       type="button" 
                       variant="outline" 
                       size="sm" 
                       onClick={handleAIRewrite}
                       disabled={isRewriting || !formData.what.trim()}
                     >
                       {isRewriting ? (
                         <>
                           <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                           Rewriting...
                         </>
                       ) : (
                         <>
                           <Wand2 className="h-4 w-4 mr-2" />
                           AI Rewrite
                         </>
                       )}
                     </Button>
                     {rewriteError && (
                       <p className="text-xs text-destructive mt-1 max-w-xs text-right">
                         {rewriteError}
                       </p>
                     )}
                   </div>
                 </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="how">How did it happen?</Label>
                <Textarea
                  id="how"
                  value={formData.how}
                  onChange={(e) => handleInputChange('how', e.target.value)}
                  placeholder="Sequence of events leading to the incident"
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="why">Why did it happen?</Label>
                <Textarea
                  id="why"
                  value={formData.why}
                  onChange={(e) => handleInputChange('why', e.target.value)}
                  placeholder="Potential causes or contributing factors"
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          {/* Witnesses */}
          {renderPersonSection(
            "Witnesses (Optional)",
            witnesses,
            setWitnesses,
            false,
            "Bystander, Lead Mechanic, etc."
          )}

          {/* Union Involvement */}
          <Card>
            <CardHeader>
              <CardTitle>Union Involvement (Optional)</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {unionInvolvement.map((ui, index) => (
                <div key={index} className="p-4 border border-border rounded-lg space-y-3">
                  <div className="flex justify-between items-center">
                    <h4 className="font-medium">Union Representative {index + 1}</h4>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => removeUnionInvolvement(index)}
                    >
                      <XIcon size={16} />
                    </Button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div className="space-y-2">
                      <Label>Name</Label>
                      <Input
                        value={ui.name}
                        onChange={(e) => updateUnionInvolvement(index, 'name', e.target.value)}
                        placeholder="Representative's name"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Union</Label>
                      <Input
                        value={ui.union}
                        onChange={(e) => updateUnionInvolvement(index, 'union', e.target.value)}
                        placeholder="Union name"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Role</Label>
                      <Input
                        value={ui.role}
                        onChange={(e) => updateUnionInvolvement(index, 'role', e.target.value)}
                        placeholder="Steward, Representative, etc."
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Notes</Label>
                    <Textarea
                      value={ui.notes}
                      onChange={(e) => updateUnionInvolvement(index, 'notes', e.target.value)}
                      placeholder="Additional notes about union involvement"
                      rows={2}
                    />
                  </div>
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addUnionInvolvement}
                className="w-full"
              >
                <PlusIcon size={16} className="mr-2" />
                Add Union Representative
              </Button>
            </CardContent>
          </Card>

          {/* File Upload */}
          <Card>
            <CardHeader>
              <CardTitle>Supporting Files (Optional)</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="files">Upload screenshots, PDFs, audio files</Label>
                <Input
                  id="files"
                  type="file"
                  multiple
                  accept=".pdf,.jpg,.jpeg,.png,.gif,.mp3,.wav,.m4a"
                  onChange={handleFileUpload}
                  className="cursor-pointer"
                />
              </div>
              
              {uploadedFiles.length > 0 && (
                <div className="space-y-2">
                  <Label>Uploaded Files</Label>
                  <div className="space-y-2">
                    {uploadedFiles.map((file, index) => (
                      <div key={index} className="flex items-center justify-between p-2 border border-border rounded">
                        <div className="flex items-center space-x-2">
                          <FileIcon size={16} />
                          <span className="text-sm">{file.name}</span>
                          <span className="text-xs text-muted-foreground">
                            ({Math.round(file.size / 1024)}KB)
                          </span>
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => removeFile(index)}
                        >
                          <XIcon size={16} />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Submit Actions */}
          <div className="add-incident-actions pb-[calc(var(--bottom-inset,58px)+8px)]">
            <Button 
              type="submit" 
              className="w-full bg-primary text-primary-foreground rounded p-3 text-sm font-medium hover:bg-primary/90 transition-colors"
              disabled={Object.keys(errors).length > 0}
            >
              Save Incident
            </Button>
            
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => navigate('/')}
              className="w-full"
            >
              Cancel
            </Button>
          </div>
        </form>

        {/* Paywall Modal */}
        <PaywallWrapper
          isOpen={showPaywall}
          onClose={() => setShowPaywall(false)}
        />
      </div>
    </Layout>
  );
};

export default AddIncident;