import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { ExternalLink, Phone, Globe, X } from 'lucide-react';
import { PhoneLink } from '@/components/PhoneLink';

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
      <DialogContent 
        className="fixed left-[50%] top-[50%] z-50 w-[92%] max-w-[520px] translate-x-[-50%] translate-y-[-50%] rounded-2xl border bg-background p-0 shadow-2xl duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] sm:max-w-[600px]"
        onPointerDownOutside={(e) => {
          // Allow closing on outside click unless user is scrolling content
          const target = e.target as Element;
          const scrollContainer = target.closest('[data-scroll-container]');
          if (!scrollContainer) {
            onOpenChange(false);
          }
        }}
      >
        <div className="flex max-h-[85vh] flex-col">
          {/* Header */}
          <div className="flex items-center justify-between border-b px-6 py-4 sm:px-8">
            <DialogTitle className="text-lg font-semibold text-center flex-1">
              {resource.title}
            </DialogTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onOpenChange(false)}
              className="h-8 w-8 p-0 rounded-full"
            >
              <X className="h-4 w-4" />
              <span className="sr-only">Close</span>
            </Button>
          </div>
          
          <div className="text-center px-6 py-2 border-b">
            <span className="text-xs bg-secondary text-secondary-foreground px-2 py-1 rounded">
              {resource.type}
            </span>
          </div>
        
          {/* Scrollable Content */}
          <div 
            className="flex-1 overflow-y-auto px-6 py-4 sm:px-8 space-y-4" 
            data-scroll-container
          >
            <div>
              <h4 className="font-medium text-sm mb-2">Description</h4>
              <p className="text-sm text-muted-foreground leading-relaxed break-words">
                {resource.fullDescription}
              </p>
            </div>
            
            <Separator />
            
            <div>
              <h4 className="font-medium text-sm mb-2">Purpose</h4>
              <p className="text-sm text-muted-foreground leading-relaxed break-words">
                {resource.purpose}
              </p>
            </div>
            
            {(resource.website || resource.phone) && (
              <>
                <Separator />
                <div className="space-y-3">
                  <h4 className="font-medium text-sm">Contact Information</h4>
                  {resource.website && (
                    <div className="flex items-center gap-2 min-w-0">
                      <Globe className="h-4 w-4 text-primary flex-shrink-0" />
                      <span className="text-sm text-muted-foreground flex-shrink-0">Website:</span>
                      <Button
                        variant="link"
                        className="p-0 h-auto text-sm text-primary hover:underline min-w-0 truncate"
                        onClick={handleWebsiteClick}
                      >
                        <span className="truncate">
                          {resource.website.replace(/^https?:\/\//, '')}
                        </span>
                        <ExternalLink className="h-3 w-3 ml-1 flex-shrink-0" />
                      </Button>
                    </div>
                  )}
                  {resource.phone && (
                    <div className="flex items-center gap-2 min-w-0">
                      <Phone className="h-4 w-4 text-primary flex-shrink-0" />
                      <span className="text-sm text-muted-foreground flex-shrink-0">Phone:</span>
                      <PhoneLink 
                        phone={resource.phone} 
                        className="text-sm font-medium text-primary hover:underline transition-colors break-all"
                      />
                    </div>
                  )}
                </div>
              </>
            )}
          </div>

           {/* Close button handled in header - no footer needed */}
        </div>
      </DialogContent>
    </Dialog>
  );
};