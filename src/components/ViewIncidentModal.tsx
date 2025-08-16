import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { X } from 'lucide-react';
import { OrganizedIncident } from '@/utils/organizedIncidentStorage';
import { formatDisplayDate } from '@/utils/dateParser';
import { makePhoneNumbersClickable } from '@/utils/phoneUtils';

interface ViewIncidentModalProps {
  incident: OrganizedIncident | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const ViewIncidentModal = ({ incident, open, onOpenChange }: ViewIncidentModalProps) => {
  if (!incident) return null;

  const displayDate = incident.canonicalEventDate 
    ? formatDisplayDate(incident.canonicalEventDate)
    : incident.date !== 'No date' 
      ? incident.date 
      : 'No date';

  // Get category class for subtle tinting
  const getCategoryClass = (category: string) => {
    const lowerCategory = category.toLowerCase();
    if (lowerCategory.includes('safety') || lowerCategory.includes('accident') || lowerCategory.includes('injury')) {
      return 'category-safety';
    } else if (lowerCategory.includes('harassment') || lowerCategory.includes('discrimination') || lowerCategory.includes('bullying')) {
      return 'category-harassment';
    } else if (lowerCategory.includes('wrongful') || lowerCategory.includes('accusation') || lowerCategory.includes('false')) {
      return 'category-accusation';
    } else if (lowerCategory.includes('policy') || lowerCategory.includes('violation') || lowerCategory.includes('misconduct')) {
      return 'category-policy';
    } else {
      return 'category-default';
    }
  };

  const categoryClass = getCategoryClass(incident.categoryOrIssue);

  // Function to render text with clickable phone numbers
  const renderTextWithPhoneLinks = (text: string) => {
    const htmlWithPhoneLinks = makePhoneNumbersClickable(text);
    return <span dangerouslySetInnerHTML={{ __html: htmlWithPhoneLinks }} />;
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
          {/* Header with single close control */}
          <div className="flex items-center justify-between px-5 py-4 border-b">
            <h2 className="text-base font-semibold text-center flex-1">
              Incident Details
            </h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onOpenChange(false)}
              className="h-8 w-8 p-0 rounded-full hover:bg-secondary focus-visible:ring-2 focus-visible:ring-offset-2"
              aria-label="Close incident details"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Scrollable Content */}
          <div 
            className="flex-1 overflow-y-auto px-5 py-4" 
            data-scroll-container
          >
            {/* Header row with date chip and category pill */}
            <div className="flex items-start gap-2 mb-4 flex-wrap">
              <Badge 
                variant="secondary" 
                className="text-xs font-medium shrink-0 h-8 px-3 flex items-center bg-muted text-muted-foreground border"
              >
                {displayDate}
              </Badge>
              <div className={`${categoryClass} text-white text-xs font-medium h-8 px-3 rounded-full flex items-center justify-center break-words min-w-0 flex-1`} 
                   style={{ fontSize: 'clamp(10px, 1.6vw, 12px)' }}>
                {incident.categoryOrIssue}
              </div>
            </div>

            <div className="border-t border-border mb-4"></div>

            <div className="space-y-3">{/* Reduced from space-y-5 to space-y-3 for compact spacing */}

              <div className="space-y-3">{/* Compact spacing */}
                <div className="border-l-[3px] pl-3" style={{ borderColor: `var(--${categoryClass.split('-')[1]}-tint, hsl(var(--muted)))` }}>
                  <h4 className="text-xs font-medium text-muted-foreground mb-1">Who</h4>
                  <p className="text-sm leading-relaxed break-words overflow-wrap-anywhere text-foreground">{renderTextWithPhoneLinks(incident.who)}</p>
                </div>

                <div className="border-t border-border my-2"></div>

                <div className="border-l-[3px] pl-3" style={{ borderColor: `var(--${categoryClass.split('-')[1]}-tint, hsl(var(--muted)))` }}>
                  <h4 className="text-xs font-medium text-muted-foreground mb-1">What</h4>
                  <p className="text-sm leading-relaxed break-words overflow-wrap-anywhere text-foreground">{renderTextWithPhoneLinks(incident.what)}</p>
                </div>

                <div className="border-t border-border my-2"></div>

                <div>
                  <h4 className="text-xs font-medium text-muted-foreground mb-1">Where</h4>
                  <p className="text-sm leading-relaxed break-words overflow-wrap-anywhere text-foreground">{renderTextWithPhoneLinks(incident.where)}</p>
                </div>

                <div className="border-t border-border my-2"></div>

                <div>
                  <h4 className="text-xs font-medium text-muted-foreground mb-1">When</h4>
                  <p className="text-sm leading-relaxed break-words overflow-wrap-anywhere text-foreground">{renderTextWithPhoneLinks(incident.when)}</p>
                </div>

                <div className="border-t border-border my-2"></div>

                <div>
                  <h4 className="text-xs font-medium text-muted-foreground mb-1">Witnesses</h4>
                  <p className="text-sm leading-relaxed break-words overflow-wrap-anywhere text-foreground">{renderTextWithPhoneLinks(incident.witnesses)}</p>
                </div>

                {incident.timeline && (
                  <>
                    <div className="border-t border-border my-2"></div>
                    <div>
                      <h4 className="text-xs font-medium text-muted-foreground mb-1">Timeline</h4>
                      <p className="text-sm leading-relaxed whitespace-pre-wrap break-words overflow-wrap-anywhere text-foreground">{renderTextWithPhoneLinks(incident.timeline)}</p>
                    </div>
                  </>
                )}

                {incident.requests && (
                  <>
                    <div className="border-t border-border my-2"></div>
                    <div>
                      <h4 className="text-xs font-medium text-muted-foreground mb-1">Requests</h4>
                      <p className="text-sm leading-relaxed whitespace-pre-wrap break-words overflow-wrap-anywhere text-foreground">{renderTextWithPhoneLinks(incident.requests)}</p>
                    </div>
                  </>
                )}

                {incident.policy && (
                  <>
                    <div className="border-t border-border my-2"></div>
                    <div>
                      <h4 className="text-xs font-medium text-muted-foreground mb-1">Policy</h4>
                      <p className="text-sm leading-relaxed whitespace-pre-wrap break-words overflow-wrap-anywhere text-foreground">{renderTextWithPhoneLinks(incident.policy)}</p>
                    </div>
                  </>
                )}

                {incident.evidence && (
                  <>
                    <div className="border-t border-border my-2"></div>
                    <div>
                      <h4 className="text-xs font-medium text-muted-foreground mb-1">Evidence</h4>
                      <p className="text-sm leading-relaxed whitespace-pre-wrap break-words overflow-wrap-anywhere text-foreground">{renderTextWithPhoneLinks(incident.evidence)}</p>
                    </div>
                  </>
                )}

                <div className="border-t border-border my-2"></div>

                <div>
                  <h4 className="text-xs font-medium text-muted-foreground mb-1">Incident Summary</h4>
                  <p className="text-sm leading-relaxed whitespace-pre-wrap break-words overflow-wrap-anywhere text-foreground">{renderTextWithPhoneLinks(incident.notes)}</p>
                </div>
              </div>

              {/* Timestamps */}
              <div className="border-t pt-3 mt-4 text-xs text-muted-foreground">
                <div className="space-y-1">
                  <div>Created: {new Date(incident.createdAt).toLocaleString()}</div>
                  <div>Last Updated: {new Date(incident.updatedAt).toLocaleString()}</div>
                  {incident.originalEventDateText && (
                    <div>Original Date Text: "{incident.originalEventDateText}"</div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};