import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { OrganizedIncident, organizedIncidentStorage } from '@/utils/organizedIncidentStorage';

interface EditIncidentModalProps {
  incident: OrganizedIncident | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: () => void;
}

export const EditIncidentModal = ({ incident, open, onOpenChange, onSave }: EditIncidentModalProps) => {
  const [formData, setFormData] = useState<Partial<OrganizedIncident>>({});
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (incident) {
      setFormData({
        date: incident.date,
        categoryOrIssue: incident.categoryOrIssue,
        who: incident.who,
        what: incident.what,
        where: incident.where,
        when: incident.when,
        witnesses: incident.witnesses,
        notes: incident.notes,
        timeline: incident.timeline || '',
        requests: incident.requests || '',
        policy: incident.policy || '',
        evidence: incident.evidence || '',
      });
    }
  }, [incident]);

  const handleSave = async () => {
    if (!incident || !formData.date || !formData.categoryOrIssue || !formData.what) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const updatedIncident: OrganizedIncident = {
        ...incident,
        ...formData,
        updatedAt: new Date().toISOString(),
      } as OrganizedIncident;

      organizedIncidentStorage.save(updatedIncident);
      
      toast({
        title: "Incident Updated",
        description: "The incident has been successfully updated.",
      });

      onSave();
      onOpenChange(false);
    } catch (error) {
      console.error('Error saving incident:', error);
      toast({
        title: "Save Failed",
        description: "Failed to save changes. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    if (incident) {
      setFormData({
        date: incident.date,
        categoryOrIssue: incident.categoryOrIssue,
        who: incident.who,
        what: incident.what,
        where: incident.where,
        when: incident.when,
        witnesses: incident.witnesses,
        notes: incident.notes,
        timeline: incident.timeline || '',
        requests: incident.requests || '',
        policy: incident.policy || '',
        evidence: incident.evidence || '',
      });
    }
    onOpenChange(false);
  };

  if (!incident) return null;

  return (
    <>
      {/* Backdrop */}
      {open && (
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
          onClick={() => handleCancel()}
        />
      )}
      
      {/* Modal Container */}
      {open && (
        <div className="fixed inset-0 z-50 grid place-items-center p-4">
          <div className="w-full max-w-2xl bg-background rounded-2xl shadow-2xl max-h-[90vh] overflow-y-auto transform transition-all">
            {/* Header */}
            <div className="p-6 border-b">
              <h2 className="text-xl font-semibold text-foreground">Edit Incident</h2>
            </div>

            <div className="p-6 space-y-4">
              {/* Date Field */}
              <div className="space-y-2">
                <Label htmlFor="date">Date</Label>
                <Input
                  id="date"
                  type="date"
                  value={formData.date || ''}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                />
              </div>

              {/* Category Field */}
              <div className="space-y-2">
                <Label htmlFor="category">Category/Issue</Label>
                <Input
                  id="category"
                  value={formData.categoryOrIssue || ''}
                  onChange={(e) => setFormData({ ...formData, categoryOrIssue: e.target.value })}
                  placeholder="Incident category"
                />
              </div>

              {/* Who Field */}
              <div className="space-y-2">
                <Label htmlFor="who">Who</Label>
                <Input
                  id="who"
                  value={formData.who || ''}
                  onChange={(e) => setFormData({ ...formData, who: e.target.value })}
                  placeholder="People involved"
                />
              </div>

              {/* What Field */}
              <div className="space-y-2">
                <Label htmlFor="what">What</Label>
                <Textarea
                  id="what"
                  value={formData.what || ''}
                  onChange={(e) => setFormData({ ...formData, what: e.target.value })}
                  placeholder="What happened"
                  className="min-h-[100px]"
                />
              </div>

              {/* Where Field */}
              <div className="space-y-2">
                <Label htmlFor="where">Where</Label>
                <Input
                  id="where"
                  value={formData.where || ''}
                  onChange={(e) => setFormData({ ...formData, where: e.target.value })}
                  placeholder="Location"
                />
              </div>

              {/* When Field */}
              <div className="space-y-2">
                <Label htmlFor="when">When</Label>
                <Input
                  id="when"
                  value={formData.when || ''}
                  onChange={(e) => setFormData({ ...formData, when: e.target.value })}
                  placeholder="Time or timing details"
                />
              </div>

              {/* Witnesses Field */}
              <div className="space-y-2">
                <Label htmlFor="witnesses">Witnesses</Label>
                <Input
                  id="witnesses"
                  value={formData.witnesses || ''}
                  onChange={(e) => setFormData({ ...formData, witnesses: e.target.value })}
                  placeholder="Witnesses"
                />
              </div>

              {/* Timeline Field */}
              <div className="space-y-2">
                <Label htmlFor="timeline">Timeline</Label>
                <Textarea
                  id="timeline"
                  value={formData.timeline || ''}
                  onChange={(e) => setFormData({ ...formData, timeline: e.target.value })}
                  placeholder="Timeline details"
                  className="min-h-[80px]"
                />
              </div>

              {/* Requests Field */}
              <div className="space-y-2">
                <Label htmlFor="requests">Requests</Label>
                <Textarea
                  id="requests"
                  value={formData.requests || ''}
                  onChange={(e) => setFormData({ ...formData, requests: e.target.value })}
                  placeholder="Requests made or received"
                  className="min-h-[80px]"
                />
              </div>

              {/* Policy Field */}
              <div className="space-y-2">
                <Label htmlFor="policy">Policy</Label>
                <Textarea
                  id="policy"
                  value={formData.policy || ''}
                  onChange={(e) => setFormData({ ...formData, policy: e.target.value })}
                  placeholder="Policy violations or references"
                  className="min-h-[80px]"
                />
              </div>

              {/* Evidence Field */}
              <div className="space-y-2">
                <Label htmlFor="evidence">Evidence</Label>
                <Textarea
                  id="evidence"
                  value={formData.evidence || ''}
                  onChange={(e) => setFormData({ ...formData, evidence: e.target.value })}
                  placeholder="Evidence or testing information"
                  className="min-h-[80px]"
                />
              </div>

              {/* Notes Field */}
              <div className="space-y-2">
                <Label htmlFor="notes">Incident Summary</Label>
                <Textarea
                  id="notes"
                  value={formData.notes || ''}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Additional details"
                  className="min-h-[100px]"
                />
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-2 pt-4 border-t">
                <Button 
                  variant="outline" 
                  onClick={handleCancel}
                  disabled={isLoading}
                  className="rounded-lg"
                >
                  Cancel
                </Button>
                <Button 
                  onClick={handleSave}
                  disabled={isLoading}
                  className="rounded-lg"
                >
                  {isLoading ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};