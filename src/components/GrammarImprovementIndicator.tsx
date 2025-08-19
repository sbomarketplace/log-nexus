import { CheckCircle2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface GrammarImprovementIndicatorProps {
  hasChanges: boolean;
  className?: string;
}

export const GrammarImprovementIndicator = ({ hasChanges, className }: GrammarImprovementIndicatorProps) => {
  if (!hasChanges) return null;
  
  return (
    <Badge variant="outline" className={`text-xs text-green-600 border-green-200 bg-green-50 ${className}`}>
      <CheckCircle2 className="h-3 w-3 mr-1" />
      Grammar improved
    </Badge>
  );
};