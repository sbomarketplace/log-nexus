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

  // Get category class for styling
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
        showClose={false}
        className="fixed left-[50%] top-[50%] z-50 w-[92%] max-w-[520px] translate-x-[-50%] translate-y-[-50%] rounded-2xl border bg-background p-0 shadow-2xl duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] sm:max-w-[600px]"
        onPointerDownOutside={(e) => {
          // Prevent closing while scrolling inside modal content
          const target = e.target as Element;
          const scrollContainer = target.closest('[data-scroll-container]');
          if (!scrollContainer) {
            onOpenChange(false);
          }
        }}
      >
        <div className="flex max-h-[85vh] flex-col">
          {/* Header with single close control */}
          <div className="flex items-center justify-between px-5 py-3 border-b">
            <h2 className="text-base font-semibold text-center flex-1">
              Incident Details
            </h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onOpenChange(false)}
              className={`h-8 w-8 p-0 rounded-full hover:bg-secondary focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-${categoryClass.split('-')[1]}-tint`}
              aria-label="Close incident details"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Scrollable Content */}
          <div 
            className="flex-1 overflow-y-auto px-5 py-3" 
            data-scroll-container
          >
            {/* Header row with date chip and category pill */}
            <div className="flex items-center gap-2 mb-3 flex-wrap">
              <Badge 
                variant="secondary" 
                className="text-xs font-medium shrink-0 h-7 px-3 flex items-center bg-muted text-muted-foreground border rounded-full"
              >
                {displayDate}
              </Badge>
              <div className={`${categoryClass} text-white font-medium h-7 px-3 rounded-full flex items-center justify-center break-words min-w-0`} 
                   style={{ fontSize: 'clamp(10px, 1.6vw, 12px)' }}>
                {incident.categoryOrIssue}
              </div>
            </div>

            <div className="border-t border-border/60 mb-3"></div>

            <div className="space-y-2">
              {/* Who Section */}
              {incident.who && (
                <div className={`border-l-[3px] pl-3 category-tint-${categoryClass.split('-')[1]}`}>
                  <h4 className="text-xs font-medium text-slate-600 mb-1">Who</h4>
                  <p className="text-sm leading-snug break-words overflow-wrap-anywhere text-slate-900 dark:text-slate-100">{renderTextWithPhoneLinks(incident.who)}</p>
                </div>
              )}

              {incident.who && incident.what && <div className="border-t border-border/50 my-2"></div>}

              {/* What Section */}
              {incident.what && (
                <div className={`border-l-[3px] pl-3 category-tint-${categoryClass.split('-')[1]}`}>
                  <h4 className="text-xs font-medium text-slate-600 mb-1">What</h4>
                  <p className="text-sm leading-snug break-words overflow-wrap-anywhere text-slate-900 dark:text-slate-100">{renderTextWithPhoneLinks(incident.what)}</p>
                </div>
              )}

              {incident.what && incident.where && <div className="border-t border-border/50 my-2"></div>}

              {/* Where Section */}
              {incident.where && (
                <div>
                  <h4 className="text-xs font-medium text-slate-600 mb-1">Where</h4>
                  <p className="text-sm leading-snug break-words overflow-wrap-anywhere text-slate-900 dark:text-slate-100">{renderTextWithPhoneLinks(incident.where)}</p>
                </div>
              )}

              {incident.where && incident.when && <div className="border-t border-border/50 my-2"></div>}

              {/* When Section */}
              {incident.when && (
                <div>
                  <h4 className="text-xs font-medium text-slate-600 mb-1">When</h4>
                  <p className="text-sm leading-snug break-words overflow-wrap-anywhere text-slate-900 dark:text-slate-100">{renderTextWithPhoneLinks(incident.when)}</p>
                </div>
              )}

              {incident.when && incident.witnesses && <div className="border-t border-border/50 my-2"></div>}

              {/* Witnesses Section */}
              {incident.witnesses && (
                <div>
                  <h4 className="text-xs font-medium text-slate-600 mb-1">Witnesses</h4>
                  <p className="text-sm leading-snug break-words overflow-wrap-anywhere text-slate-900 dark:text-slate-100">{renderTextWithPhoneLinks(incident.witnesses)}</p>
                </div>
              )}

              {/* Timeline Section */}
              {incident.timeline && (
                <>
                  {(incident.who || incident.what || incident.where || incident.when || incident.witnesses) && <div className="border-t border-border/50 my-2"></div>}
                  <div>
                    <h4 className="text-xs font-medium text-slate-600 mb-1">Timeline</h4>
                    <p className="text-sm leading-snug whitespace-pre-wrap break-words overflow-wrap-anywhere text-slate-900 dark:text-slate-100">{renderTextWithPhoneLinks(incident.timeline)}</p>
                  </div>
                </>
              )}

              {/* Requests Section */}
              {incident.requests && (
                <>
                  {(incident.timeline || incident.who || incident.what || incident.where || incident.when || incident.witnesses) && <div className="border-t border-border/50 my-2"></div>}
                  <div>
                    <h4 className="text-xs font-medium text-slate-600 mb-1">Requests</h4>
                    <p className="text-sm leading-snug whitespace-pre-wrap break-words overflow-wrap-anywhere text-slate-900 dark:text-slate-100">{renderTextWithPhoneLinks(incident.requests)}</p>
                  </div>
                </>
              )}

              {/* Policy Section */}
              {incident.policy && (
                <>
                  {(incident.requests || incident.timeline || incident.who || incident.what || incident.where || incident.when || incident.witnesses) && <div className="border-t border-border/50 my-2"></div>}
                  <div>
                    <h4 className="text-xs font-medium text-slate-600 mb-1">Policy</h4>
                    <p className="text-sm leading-snug whitespace-pre-wrap break-words overflow-wrap-anywhere text-slate-900 dark:text-slate-100">{renderTextWithPhoneLinks(incident.policy)}</p>
                  </div>
                </>
              )}

              {/* Evidence Section */}
              {incident.evidence && (
                <>
                  {(incident.policy || incident.requests || incident.timeline || incident.who || incident.what || incident.where || incident.when || incident.witnesses) && <div className="border-t border-border/50 my-2"></div>}
                  <div>
                    <h4 className="text-xs font-medium text-slate-600 mb-1">Evidence</h4>
                    <p className="text-sm leading-snug whitespace-pre-wrap break-words overflow-wrap-anywhere text-slate-900 dark:text-slate-100">{renderTextWithPhoneLinks(incident.evidence)}</p>
                  </div>
                </>
              )}

              {/* Always show summary with separator if other content exists */}
              {(incident.evidence || incident.policy || incident.requests || incident.timeline || incident.who || incident.what || incident.where || incident.when || incident.witnesses) && <div className="border-t border-border/50 my-2"></div>}

              {/* Incident Summary */}
              <div>
                <h4 className="text-xs font-medium text-slate-600 mb-1">Incident Summary</h4>
                <p className="text-sm leading-snug whitespace-pre-wrap break-words overflow-wrap-anywhere text-slate-900 dark:text-slate-100">{renderTextWithPhoneLinks(incident.notes)}</p>
              </div>
            </div>

            {/* Timestamps */}
            <div className="border-t border-border/50 pt-2 mt-3 text-xs text-slate-500">
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
      </DialogContent>
    </Dialog>
  );
};