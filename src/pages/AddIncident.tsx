import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '@/components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { storage } from '@/utils/storage';
import { Incident } from '@/types/incident';
import { ArrowLeftIcon, PlusIcon, XIcon, FileIcon } from '@/components/icons/CustomIcons';


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
    date: new Date().toISOString().split('T')[0],
    time: new Date().toTimeString().slice(0, 5),
    what: '',
    where: '',
    why: '',
    how: '',
  });

  const [whoInvolved, setWhoInvolved] = useState<Person[]>([{ name: '', role: '' }]);
  const [witnesses, setWitnesses] = useState<Person[]>([{ name: '', role: '' }]);
  const [unionInvolvement, setUnionInvolvement] = useState<UnionInvolvement[]>([]);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  const [tags, setTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState('');

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.title.trim()) newErrors.title = 'Title is required';
    if (!formData.what.trim()) newErrors.what = 'What happened is required';
    if (!formData.where.trim()) newErrors.where = 'Location is required';
    if (whoInvolved.filter(person => person.name.trim()).length === 0) {
      newErrors.who = 'At least one person involved is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
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
    
    if (!validateForm()) {
      toast({
        title: "Validation Error",
        description: "Please fix the errors below and try again.",
        variant: "destructive",
      });
      return;
    }

    const incident: Incident = {
      id: `incident_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      title: formData.title,
      date: formData.date,
      time: formData.time,
      summary: formData.what, // Using 'what' as the main summary
      location: formData.where, // Enhanced: populate location field
      category: undefined, // Enhanced: could be set later via categorization
      peopleInvolved: whoInvolved.filter(person => person.name.trim()).map(person => person.name), // Enhanced: extract names for quick display
      who: whoInvolved.filter(person => person.name.trim()),
      what: formData.what,
      where: formData.where,
      why: formData.why,
      how: formData.how,
      witnesses: witnesses.filter(w => w.name.trim()),
      unionInvolvement: unionInvolvement.filter(ui => ui.name.trim() || ui.union.trim()),
      files: uploadedFiles.map(file => file.name), // In real app, store file references
      tags: tags,
    };

    storage.saveIncident(incident);
    
    toast({
      title: "Incident Reported",
      description: "The incident has been successfully recorded.",
    });

    navigate('/');
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
      <div className="max-w-4xl mx-auto space-y-6">
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
                <Label htmlFor="title">Incident Title *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  placeholder="Brief description of the incident"
                  className={errors.title ? 'border-destructive' : ''}
                />
                {errors.title && <p className="text-sm text-destructive">{errors.title}</p>}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <Label htmlFor="date">Date *</Label>
                  <Input
                    id="date"
                    type="date"
                    value={formData.date}
                    onChange={(e) => handleInputChange('date', e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="time">Time *</Label>
                  <Input
                    id="time"
                    type="time"
                    value={formData.time}
                    onChange={(e) => handleInputChange('time', e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-1">
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
                  rows={4}
                  className={errors.what ? 'border-destructive' : ''}
                />
                {errors.what && <p className="text-sm text-destructive">{errors.what}</p>}
                {/* AI Rewrite button hook-in point */}
                <div className="flex justify-end">
                  <Button type="button" variant="outline" size="sm" disabled>
                    🤖 AI Rewrite (Coming Soon)
                  </Button>
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
          <div className="space-y-3">
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
      </div>
    </Layout>
  );
};

export default AddIncident;