import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { ExternalLink, Phone, Globe } from 'lucide-react';

interface ResourceModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  resource: {
    title: string;
    description: string;
    fullDescription: string;
    purpose: string;
    website?: string;
    phone?: string;
    type: string;
  } | null;
}

export const ResourceModal: React.FC<ResourceModalProps> = ({
  open,
  onOpenChange,
  resource
}) => {
  if (!resource) return null;

  const handleWebsiteClick = () => {
    if (resource.website) {
      window.open(resource.website, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md w-full max-h-[80vh] rounded-xl shadow-2xl border-2 mx-auto left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 fixed">
        <DialogHeader className="pb-4">
          <DialogTitle className="text-center text-lg font-semibold">
            {resource.title}
          </DialogTitle>
          <div className="text-center">
            <span className="text-xs bg-secondary text-secondary-foreground px-2 py-1 rounded">
              {resource.type}
            </span>
          </div>
        </DialogHeader>
        
        <div className="space-y-4 overflow-y-auto max-h-[50vh] px-1">
          <div>
            <h4 className="font-medium text-sm mb-2">Description</h4>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {resource.fullDescription}
            </p>
          </div>
          
          <Separator />
          
          <div>
            <h4 className="font-medium text-sm mb-2">Purpose</h4>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {resource.purpose}
            </p>
          </div>
          
          {(resource.website || resource.phone) && (
            <>
              <Separator />
              <div className="space-y-3">
                <h4 className="font-medium text-sm">Contact Information</h4>
                {resource.website && (
                  <div className="flex items-center gap-2">
                    <Globe className="h-4 w-4 text-primary" />
                    <span className="text-xs text-muted-foreground">Website:</span>
                    <Button
                      variant="link"
                      className="p-0 h-auto text-xs text-primary hover:underline"
                      onClick={handleWebsiteClick}
                    >
                      {resource.website.replace(/^https?:\/\//, '')}
                      <ExternalLink className="h-3 w-3 ml-1" />
                    </Button>
                  </div>
                )}
                {resource.phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-primary" />
                    <span className="text-xs text-muted-foreground">Phone:</span>
                    <span className="text-xs font-medium">{resource.phone}</span>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
        
        <div className="pt-4 border-t">
          <Button 
            variant="outline" 
            onClick={() => onOpenChange(false)}
            className="w-full"
            size="sm"
          >
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};