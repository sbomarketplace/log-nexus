import { useState, useEffect } from 'react';
import { initIAP, purchase, restore, getProducts } from '@/lib/iap';
import { addPack, setSubscription } from '@/lib/credits';
import PaywallModal from './PaywallModal';

type Plan = "PACK_5" | "PACK_60" | "UNLIMITED";

interface PaywallWrapperProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PaywallWrapper = ({ isOpen, onClose }: PaywallWrapperProps) => {
  const [loading, setLoading] = useState<string | null>(null);
  const [products, setProducts] = useState(getProducts());

  useEffect(() => {
    if (isOpen) {
      initIAP().then(() => {
        setProducts(getProducts());
      });
    }
  }, [isOpen]);

  const buy5 = async () => {
    const result = await purchase(import.meta.env.VITE_IAP_CREDIT_PACK_5);
    if (result.ok) {
      await addPack(5);
      console.log("Purchase successful. 5 AI reports added.");
      onClose();
    } else if (result.error !== 'cancelled') {
      console.error("Purchase failed:", result.error);
    }
  };

  const buy60 = async () => {
    const result = await purchase(import.meta.env.VITE_IAP_CREDIT_PACK_60);
    if (result.ok) {
      await addPack(60);
      console.log("Purchase successful. 60 AI reports added.");
      onClose();
    } else if (result.error !== 'cancelled') {
      console.error("Purchase failed:", result.error);
    }
  };

  const buyUnlimited = async () => {
    const result = await purchase(import.meta.env.VITE_IAP_SUB_MONTHLY);
    if (result.ok) {
      await setSubscription(true);
      console.log("Unlimited AI reports activated.");
      onClose();
    } else if (result.error !== 'cancelled') {
      console.error("Purchase failed:", result.error);
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
      await restore();
      console.log("Purchases restored.");
      onClose();
    } catch {
      console.error("Restore failed.");
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
      products={products}
    />
  );
};