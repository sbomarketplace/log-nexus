import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { X, Loader2 } from 'lucide-react';
import { purchase, restore, toast } from '@/utils/iap';
import { useAIQuota } from '@/state/aiQuotaStore';
import '../styles/settings.css';

interface PaywallModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PaywallModal = ({ isOpen, onClose }: PaywallModalProps) => {
  const [loading, setLoading] = useState<string | null>(null);

  if (!isOpen) return null;

  const buy5 = async () => {
    try { 
      await purchase("cc.ai.5"); 
      useAIQuota.getState().addCredits(5); 
      toast("Purchase successful. 5 AI reports added."); 
      onClose();
    } catch { 
      toast("Purchase canceled."); 
    }
  };

  const buy60 = async () => {
    try { 
      await purchase("cc.ai.60"); 
      useAIQuota.getState().addCredits(60); 
      toast("Purchase successful. 60 AI reports added."); 
      onClose();
    } catch { 
      toast("Purchase canceled."); 
    }
  };

  const buyUnlimited = async () => {
    try { 
      await purchase("cc.ai.unlimited.month"); 
      useAIQuota.getState().setUnlimited(true); 
      toast("Unlimited AI reports activated."); 
      onClose();
    } catch { 
      toast("Purchase canceled."); 
    }
  };

  const handlePurchase = async (purchaseType: string, purchaseFunction: () => Promise<void>) => {
    setLoading(purchaseType);
    try {
      await purchaseFunction();
    } catch (error) {
      console.error('Purchase error:', error);
    } finally {
      setLoading(null);
    }
  };

  const handleRestore = async () => {
    setLoading('restore');
    try {
      const result = await restore();
      if (result?.unlimitedActive) useAIQuota.getState().setUnlimited(true);
      if (result?.credits) useAIQuota.getState().addCredits(result.credits);
      toast("Purchases restored.");
      onClose();
    } catch {
      toast("Restore failed.");
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
          <h2 className="text-xl font-semibold text-foreground">AI report limit reached</h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-8 w-8 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="space-y-3 mb-6">
          {/* Get 5 AI reports */}
          <Button
            onClick={() => handlePurchase('pack5', buy5)}
            disabled={loading !== null}
            className="w-full h-12 flex items-center justify-between text-left px-4"
            variant="outline"
          >
            <div>
              <div className="font-medium">Get 5 AI reports</div>
              <div className="text-xs text-muted-foreground">Perfect for occasional use</div>
            </div>
            <div className="flex items-center gap-2">
              {loading === 'pack5' && <Loader2 className="h-4 w-4 animate-spin" />}
              <span className="font-semibold">$1.99</span>
            </div>
          </Button>

          {/* Get 60 AI reports */}
          <Button
            onClick={() => handlePurchase('pack60', buy60)}
            disabled={loading !== null}
            className="w-full h-12 flex items-center justify-between text-left px-4"
            variant="outline"
          >
            <div>
              <div className="font-medium">Get 60 AI reports</div>
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
              <div className="text-xs text-primary-foreground/80">Unlimited AI reports for power users</div>
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