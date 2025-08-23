import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { X, Loader2 } from 'lucide-react';
import { buyPack5, buyPack60, buyUnlimited, restorePurchases } from '@/utils/purchase';
import '../styles/settings.css';

interface PaywallModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PaywallModal = ({ isOpen, onClose }: PaywallModalProps) => {
  const [loading, setLoading] = useState<string | null>(null);

  if (!isOpen) return null;

  const handlePurchase = async (purchaseType: string, purchaseFunction: () => Promise<boolean>) => {
    setLoading(purchaseType);
    try {
      const success = await purchaseFunction();
      if (success) {
        onClose();
      }
    } catch (error) {
      console.error('Purchase error:', error);
    } finally {
      setLoading(null);
    }
  };

  const handleRestore = async () => {
    setLoading('restore');
    try {
      await restorePurchases();
      onClose();
    } catch (error) {
      console.error('Restore error:', error);
    } finally {
      setLoading(null);
    }
  };

  return (
    <div 
      className="cc-float-modal-overlay" 
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="cc-float-modal">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-foreground">Parsing limit reached</h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-8 w-8 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="mb-6">
          <p className="text-sm text-muted-foreground mb-2">
            You've used your 3 free parsings. Manual logging is always free.
          </p>
          <p className="text-xs text-muted-foreground">
            Choose a plan to continue using AI-powered incident parsing:
          </p>
        </div>

        <div className="space-y-3 mb-6">
          {/* Get 5 parsings */}
          <Button
            onClick={() => handlePurchase('pack5', buyPack5)}
            disabled={loading !== null}
            className="w-full h-12 flex items-center justify-between text-left px-4"
            variant="outline"
          >
            <div>
              <div className="font-medium">Get 5 parsings</div>
              <div className="text-xs text-muted-foreground">Perfect for occasional use</div>
            </div>
            <div className="flex items-center gap-2">
              {loading === 'pack5' && <Loader2 className="h-4 w-4 animate-spin" />}
              <span className="font-semibold">$1.99</span>
            </div>
          </Button>

          {/* Get 60 parsings */}
          <Button
            onClick={() => handlePurchase('pack60', buyPack60)}
            disabled={loading !== null}
            className="w-full h-12 flex items-center justify-between text-left px-4"
            variant="outline"
          >
            <div>
              <div className="font-medium">Get 60 parsings</div>
              <div className="text-xs text-muted-foreground">Best value for regular users</div>
            </div>
            <div className="flex items-center gap-2">
              {loading === 'pack60' && <Loader2 className="h-4 w-4 animate-spin" />}
              <span className="font-semibold">$19.99</span>
            </div>
          </Button>

          {/* Go Unlimited */}
          <Button
            onClick={() => handlePurchase('unlimited', buyUnlimited)}
            disabled={loading !== null}
            className="w-full h-12 flex items-center justify-between text-left px-4"
          >
            <div>
              <div className="font-medium text-primary-foreground">Go Unlimited</div>
              <div className="text-xs text-primary-foreground/80">Unlimited parsing for power users</div>
            </div>
            <div className="flex items-center gap-2">
              {loading === 'unlimited' && <Loader2 className="h-4 w-4 animate-spin text-primary-foreground" />}
              <span className="font-semibold text-primary-foreground">$99/mo</span>
            </div>
          </Button>
        </div>

        <div className="flex flex-col gap-2 pt-4 border-t">
          <Button
            variant="ghost"
            onClick={handleRestore}
            disabled={loading !== null}
            className="text-sm"
          >
            {loading === 'restore' && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
            Restore Purchases
          </Button>
          
          <Button
            variant="ghost"
            onClick={onClose}
            disabled={loading !== null}
            className="text-sm"
          >
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );
};