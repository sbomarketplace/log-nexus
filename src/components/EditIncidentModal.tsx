import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { OrganizedIncident, organizedIncidentStorage } from '@/utils/organizedIncidentStorage';
import { supabase } from '@/integrations/supabase/client';
import { processIncident, updateIncidentCategory } from '@/services/incidentProcessor';
import { SharedIncidentForm } from '@/components/SharedIncidentForm';
import { showToast } from '@/components/SuccessToast';

interface EditIncidentModalProps {
  incident: OrganizedIncident | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaveAndView: (savedIncident: OrganizedIncident) => void;
}

export const EditIncidentModal = ({ incident, open, onOpenChange, onSaveAndView }: EditIncidentModalProps) => {
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [existingFiles, setExistingFiles] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (incident) {
      setExistingFiles(incident.files || []);
      setUploadedFiles([]);
    }
  }, [incident]);

  const handleFileUpload = (files: File[]) => {
    setUploadedFiles(files);
  };

  const removeUploadedFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const removeExistingFile = (index: number) => {
    setExistingFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleSaveIncident = async (payload: Partial<OrganizedIncident>) => {
    if (!incident) return;
    
    setIsLoading(true);
    
    try {
      const processedIncident = await processIncident({
        id: incident.id,
        ...payload,
        createdAt: incident.createdAt,
        updatedAt: new Date().toISOString(),
      } as OrganizedIncident, {
        authorPerspective: 'first_person',
        rawNotes: payload.notes || ''
      });

      // Check if category mapping exists and add if missing
      if (payload.categoryOrIssue && processedIncident.incidentKey) {
        await updateIncidentCategory(processedIncident.incidentKey, payload.categoryOrIssue);
      }

      organizedIncidentStorage.save(processedIncident);

      showToast({
        message: "Incident updated successfully",
        type: "success",
        durationMs: 2500
      });

      onSaveAndView(processedIncident);
    } catch (error) {
      console.error('Error saving incident:', error);
      toast({
        title: "Error",
        description: "Failed to save the incident. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    setUploadedFiles([]);
    setExistingFiles(incident?.files || []);
    onOpenChange(false);
  };

  if (!incident) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent 
        showClose={false}
        className="fixed left-[50%] top-[50%] z-50 w-[92%] max-w-[600px] translate-x-[-50%] translate-y-[-50%] rounded-2xl border bg-background p-0 shadow-2xl duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] sm:max-w-[600px]"
        onPointerDownOutside={(e) => {
          // Allow closing on outside click unless user is scrolling content
          const target = e.target as Element;
          const scrollContainer = target.closest('[data-scroll-container]');
          if (!scrollContainer) {
            handleCancel();
          }
        }}
      >
        <div className="flex max-h-[85vh] flex-col incident-typography">
          {/* Header */}
          <div className="flex items-center justify-between border-b px-6 py-4 sm:px-8">
            <DialogTitle className="text-lg font-semibold text-center flex-1">
              Edit Incident
            </DialogTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCancel}
              className="h-8 w-8 p-0 rounded-full"
            >
              <X className="h-4 w-4" />
              <span className="sr-only">Close</span>
            </Button>
          </div>

          {/* Scrollable Content */}
          <div 
            className="flex-1 overflow-y-auto px-6 py-4 sm:px-8" 
            data-scroll-container
          >
            <SharedIncidentForm
              incident={incident}
              onSave={handleSaveIncident}
              uploadedFiles={uploadedFiles}
              existingFiles={existingFiles}
              onFileUpload={handleFileUpload}
              onRemoveUploadedFile={removeUploadedFile}
              onRemoveExistingFile={removeExistingFile}
              isLoading={isLoading}
            />
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-3 border-t px-6 py-4 sm:px-8">
            <Button 
              variant="outline" 
              onClick={handleCancel}
              disabled={isLoading}
            >
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};