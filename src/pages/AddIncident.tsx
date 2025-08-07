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
import { ArrowLeftIcon } from '@/components/icons/CustomIcons';

const AddIncident = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [formData, setFormData] = useState({
    title: '',
    date: new Date().toISOString().split('T')[0],
    time: new Date().toTimeString().slice(0, 5),
    summary: '',
    who: '',
    what: '',
    where: '',
    why: '',
    how: '',
    witnesses: '',
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title || !formData.summary || !formData.who || !formData.what || !formData.where) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    const incident: Incident = {
      id: `incident_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      title: formData.title,
      date: formData.date,
      time: formData.time,
      summary: formData.summary,
      who: formData.who.split(',').map(person => person.trim()).filter(Boolean),
      what: formData.what,
      where: formData.where,
      why: formData.why,
      how: formData.how,
      witnesses: formData.witnesses ? formData.witnesses.split(',').map(w => w.trim()).filter(Boolean) : [],
    };

    storage.saveIncident(incident);
    
    toast({
      title: "Incident Reported",
      description: "The incident has been successfully recorded.",
    });

    navigate('/');
  };

  return (
    <Layout>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center space-x-4">
          <Button variant="ghost" size="sm" onClick={() => navigate('/')}>
            <ArrowLeftIcon size={18} />
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-foreground">Report New Incident</h1>
            <p className="text-muted-foreground">Provide detailed information about the incident</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Incident Title *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => handleInputChange('title', e.target.value)}
                    placeholder="Brief description of the incident"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="where">Location *</Label>
                  <Input
                    id="where"
                    value={formData.where}
                    onChange={(e) => handleInputChange('where', e.target.value)}
                    placeholder="Where did this occur?"
                    required
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="date">Date *</Label>
                  <Input
                    id="date"
                    type="date"
                    value={formData.date}
                    onChange={(e) => handleInputChange('date', e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="time">Time *</Label>
                  <Input
                    id="time"
                    type="time"
                    value={formData.time}
                    onChange={(e) => handleInputChange('time', e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="summary">Summary *</Label>
                <Textarea
                  id="summary"
                  value={formData.summary}
                  onChange={(e) => handleInputChange('summary', e.target.value)}
                  placeholder="Provide a detailed summary of what happened"
                  rows={4}
                  required
                />
              </div>
            </CardContent>
          </Card>

          {/* 5 W's and How */}
          <Card>
            <CardHeader>
              <CardTitle>Incident Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="who">Who was involved? *</Label>
                <Input
                  id="who"
                  value={formData.who}
                  onChange={(e) => handleInputChange('who', e.target.value)}
                  placeholder="Names of people involved (separate with commas)"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="what">What happened? *</Label>
                <Textarea
                  id="what"
                  value={formData.what}
                  onChange={(e) => handleInputChange('what', e.target.value)}
                  placeholder="Describe what occurred in detail"
                  rows={3}
                  required
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
                <Label htmlFor="witnesses">Witnesses</Label>
                <Input
                  id="witnesses"
                  value={formData.witnesses}
                  onChange={(e) => handleInputChange('witnesses', e.target.value)}
                  placeholder="Names of witnesses (separate with commas)"
                />
              </div>
            </CardContent>
          </Card>

          {/* Submit Actions */}
          <div className="flex justify-end space-x-4">
            <Button type="button" variant="outline" onClick={() => navigate('/')}>
              Cancel
            </Button>
            <Button type="submit">
              Save Incident
            </Button>
          </div>
        </form>
      </div>
    </Layout>
  );
};

export default AddIncident;