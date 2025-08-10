import { ReactNode, useEffect } from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface CompactModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  children: ReactNode;
  footer?: ReactNode;
  className?: string;
}

export const CompactModal = ({ 
  open, 
  onOpenChange, 
  title, 
  children, 
  footer,
  className 
}: CompactModalProps) => {
  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && open) {
        onOpenChange(false);
      }
    };

    if (open) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [open, onOpenChange]);

  if (!open) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
        onClick={() => onOpenChange(false)}
      />
      
      {/* Modal Container */}
      <div className="fixed inset-0 z-50 grid place-items-center p-3 sm:p-4">
        <div 
          className={cn(
            "w-full max-w-[360px] sm:max-w-[400px] max-h-[62vh] sm:max-h-[70vh]",
            "bg-background/95 backdrop-blur-sm rounded-2xl shadow-2xl",
            "transform transition-all duration-200 scale-100",
            "border border-border",
            className
          )}
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-title"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Sticky Header */}
          <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b border-border px-3 sm:px-4 py-3 rounded-t-2xl">
            <div className="flex items-center justify-between h-5">
              <h2 
                id="modal-title" 
                className="text-lg font-semibold text-foreground truncate"
              >
                {title}
              </h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onOpenChange(false)}
                className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground"
                aria-label="Close modal"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Scrollable Body */}
          <div className="overflow-y-auto px-3 sm:px-4 py-2 space-y-2">
            {children}
          </div>

          {/* Sticky Footer */}
          {footer && (
            <div className="sticky bottom-0 z-10 bg-background/95 backdrop-blur-sm border-t border-border px-3 sm:px-4 py-3 rounded-b-2xl">
              {footer}
            </div>
          )}
        </div>
      </div>
    </>
  );
};