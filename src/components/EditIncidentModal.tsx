import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
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
      setFormData(incident);
    }
  }, [incident]);

  const handleSave = async () => {
    if (!incident || !formData.date || !formData.categoryOrIssue || !formData.what) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields (Date, Category, and What).",
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
        description: "Failed to save the incident. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    if (incident) {
      setFormData(incident);
    }
    onOpenChange(false);
  };

  if (!incident) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Incident</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="date">Date *</Label>
              <Input
                id="date"
                value={formData.date || ''}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                placeholder="e.g., 7/22 or Unknown"
              />
            </div>
            <div>
              <Label htmlFor="category">Category/Issue *</Label>
              <Input
                id="category"
                value={formData.categoryOrIssue || ''}
                onChange={(e) => setFormData({ ...formData, categoryOrIssue: e.target.value })}
                placeholder="e.g., Harassment, Discrimination"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="who">Who</Label>
            <Input
              id="who"
              value={formData.who || ''}
              onChange={(e) => setFormData({ ...formData, who: e.target.value })}
              placeholder="Comma-separated names"
            />
          </div>

          <div>
            <Label htmlFor="what">What *</Label>
            <Textarea
              id="what"
              value={formData.what || ''}
              onChange={(e) => setFormData({ ...formData, what: e.target.value })}
              placeholder="1-2 sentence neutral summary"
              className="min-h-[80px]"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="where">Where</Label>
              <Input
                id="where"
                value={formData.where || ''}
                onChange={(e) => setFormData({ ...formData, where: e.target.value })}
                placeholder="Location"
              />
            </div>
            <div>
              <Label htmlFor="when">When</Label>
              <Input
                id="when"
                value={formData.when || ''}
                onChange={(e) => setFormData({ ...formData, when: e.target.value })}
                placeholder="Time of day"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="witnesses">Witnesses</Label>
            <Input
              id="witnesses"
              value={formData.witnesses || ''}
              onChange={(e) => setFormData({ ...formData, witnesses: e.target.value })}
              placeholder="Comma-separated witness names"
            />
          </div>

          <div>
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes || ''}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Additional details"
              className="min-h-[100px]"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 pt-4 border-t">
            <Button 
              onClick={handleSave}
              disabled={isLoading}
              className="bg-primary text-primary-foreground hover:bg-primary/90"
            >
              {isLoading ? 'Saving...' : 'Save Changes'}
            </Button>
            <Button variant="outline" onClick={handleCancel}>
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};