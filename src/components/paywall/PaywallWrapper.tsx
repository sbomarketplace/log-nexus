import { useState, useEffect } from 'react';
import { purchase, restore, toast } from '@/utils/iap';
import { useAIQuota } from '@/state/aiQuotaStore';
import PaywallModal from './PaywallModal';

type Plan = "PACK_5" | "PACK_60" | "UNLIMITED";

interface PaywallWrapperProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PaywallWrapper = ({ isOpen, onClose }: PaywallWrapperProps) => {
  const [loading, setLoading] = useState<string | null>(null);

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

  const handleSelect = async (plan: Plan) => {
    switch (plan) {
      case "PACK_5":
        await handlePurchase('pack5', buy5);
        break;
      case "PACK_60":
        await handlePurchase('pack60', buy60);
        break;
      case "UNLIMITED":
        await handlePurchase('unlimited', buyUnlimited);
        break;
    }
  };

  useEffect(() => {
    const handleRestorePurchases = () => {
      handleRestore();
    };

    window.addEventListener('restore-purchases', handleRestorePurchases);
    return () => window.removeEventListener('restore-purchases', handleRestorePurchases);
  }, []);

  return (
    <PaywallModal
      open={isOpen}
      onClose={onClose}
      onSelect={handleSelect}
    />
  );
};