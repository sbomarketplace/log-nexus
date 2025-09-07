import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { 
  X, 
  ChevronRight, 
  Shield, 
  Database, 
  HelpCircle, 
  Loader2
} from 'lucide-react';
import { useSubscription } from '@/lib/subscription';
import { Layout } from '@/components/Layout';
import SupportLegalModal from '@/components/SupportLegalModal';
import DataStorageCard from '@/components/settings/DataStorageCard';
import { ResourcesSection } from '@/pages/Resources';
import { Separator } from '@/components/ui/separator';
import InlineAd from '@/components/ads/InlineAd';
import '../styles/settings.css';
import '../styles/modal.css';

type PricingButtonProps = {
  price: string;
  caption: string;
  selected?: boolean;
  disabled?: boolean;
  loading?: boolean;
  className?: string;
  onClick?: () => void;
};

const PricingButton = ({
  price,
  caption,
  selected = false,
  disabled = false,
  loading = false,
  className = '',
  onClick,
}: PricingButtonProps) => {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-pressed={selected}
      className={`
        w-full min-h-12 px-4 py-3 rounded-lg border
        flex flex-col items-center justify-center gap-1
        text-center whitespace-nowrap overflow-hidden text-ellipsis
        focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 
        transition-all duration-200
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        ${selected
          ? 'bg-primary text-primary-foreground border-transparent shadow-sm'
          : 'bg-background text-foreground border-border hover:bg-accent hover:text-accent-foreground'
        }
        ${className}
      `.trim()}
    >
      {loading && <Loader2 className="h-4 w-4 animate-spin mb-1" />}
      <span className={`font-semibold text-base overflow-hidden text-ellipsis ${selected ? 'text-primary-foreground' : 'text-foreground'}`}>
        {price}
      </span>
      <span className={`text-base overflow-hidden text-ellipsis ${selected ? 'text-primary-foreground/90' : 'text-muted-foreground'}`}>
        {caption}
      </span>
    </button>
  );
};

const Settings = () => {
  const { isSubscribed, purchaseRemoveAds, restorePurchases } = useSubscription();
  
  const [activeModal, setActiveModal] = useState<string | null>(null);
  const [purchasing, setPurchasing] = useState<string | null>(null);
  const [supportLegalOpen, setSupportLegalOpen] = useState(false);

  const closeModal = () => {
    setActiveModal(null);
  };

  const handlePurchase = async (purchaseType: string, purchaseFunction: () => Promise<void>) => {
    setPurchasing(purchaseType);
    try {
      await purchaseFunction();
    } catch (error) {
      console.error('Purchase error:', error);
    } finally {
      setPurchasing(null);
    }
  };

  const handleRestore = async () => {
    setPurchasing('restore');
    try {
      await restorePurchases();
      console.log("Purchases restored.");
    } catch (error) {
      console.error("Restore failed:", error);
    } finally {
      setPurchasing(null);
    }
  };

  const FloatingModal = ({ isOpen, onClose, title, children }: {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    children: React.ReactNode;
  }) => {
    if (!isOpen) return null;

    return (
      <div 
        className="cc-float-modal-overlay" 
        onClick={(e) => e.target === e.currentTarget && onClose()}
      >
        <div className="cc-float-modal">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-medium text-foreground">{title}</h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-8 w-8 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          {children}
        </div>
      </div>
    );
  };

  return (
    <Layout>
      <div className="max-w-4xl mx-auto space-y-6 settings-page incident-typography pb-safe-bottom">
        <header className="text-center pt-3 pb-2">
          <h1 className="text-3xl font-bold tracking-tight">Settings & Resources</h1>
          <p className="mt-2 text-muted-foreground">
            Manage your preferences and access helpful guides
          </p>
        </header>

        {/* Settings title (visible, matching Resources style) */}
        <h2 id="settings" className="mb-2 text-lg font-medium text-foreground">Settings</h2>

        {/* Settings Accordion */}
        <Accordion type="multiple" className="space-y-4">
          {/* Remove Ads Subscription */}
          <AccordionItem value="account" className="settings-section">
            <AccordionTrigger className="min-h-12 px-4 py-3 flex items-center gap-3 settings-section-header">
              <div className="flex items-center gap-3">
                <Shield className="h-4 w-4 text-muted-foreground" />
                <span className="truncate">Remove Ads Subscription</span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="settings-section-content cc-acc-content overflow-hidden">
              {/* Subscription Status */}
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex-1 min-w-0">
                    <div className="block text-base font-semibold leading-tight truncate">Subscription Status</div>
                    <div className="block text-sm text-muted-foreground leading-snug long-copy">
                      {isSubscribed ? "Your ad-free subscription is active." : "Current plan and billing"}
                    </div>
                  </div>
                  <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                    isSubscribed
                      ? 'bg-green-100 text-green-700' 
                      : 'bg-muted text-muted-foreground'
                  }`}>
                    {isSubscribed ? 'PAID' : 'FREE'}
                  </div>
                </div>

                {/* Purchase Buttons (hidden when subscribed) */}
                {!isSubscribed && (
                  <div className="grid gap-3 sm:grid-cols-2">
                    <PricingButton
                      price="Remove Ads — $4.99/mo"
                      caption="Hide banner ads permanently"
                      loading={purchasing === 'removeAds'}
                      onClick={() => handlePurchase('removeAds', async () => {
                        await purchaseRemoveAds();
                      })}
                      className="w-full min-h-12 whitespace-nowrap overflow-hidden text-ellipsis"
                    />
                    <PricingButton
                      price="Restore Purchases"
                      caption="Restore previous purchases"
                      loading={purchasing === 'restore'}
                      onClick={() => handlePurchase('restore', async () => {
                        await restorePurchases();
                      })}
                      className="w-full min-h-12 whitespace-nowrap overflow-hidden text-ellipsis"
                    />
                  </div>
                )}
              </div>

              {/* Dev Debug Info (hidden unless explicitly enabled) */}
              {(import.meta.env.DEV && import.meta.env.VITE_SHOW_DEV_IAP === "true") && (
                <div className="mt-4 p-3 bg-muted/30 rounded-lg border">
                  <p className="text-xs font-mono text-muted-foreground mb-2">DEV: IAP Product IDs</p>
                  <div className="space-y-1 text-xs font-mono">
                    <div>Remove Ads: {import.meta.env.VITE_IAP_REMOVE_ADS_MONTHLY || 'cc.remove.ads.monthly'}</div>
                  </div>
                </div>
              )}
            </AccordionContent>
          </AccordionItem>

          {/* Data & Storage */}
          <AccordionItem value="data" className="settings-section">
            <AccordionTrigger className="min-h-12 px-4 py-3 flex items-center gap-3 settings-section-header">
              <div className="flex items-center gap-3">
                <Database className="h-4 w-4 text-muted-foreground" />
                <span className="truncate">Data & Storage</span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="settings-section-content cc-acc-content overflow-hidden">
              <DataStorageCard />
            </AccordionContent>
          </AccordionItem>


          {/* Support & Legal */}
          <AccordionItem value="support" className="settings-section">
            <AccordionTrigger className="min-h-12 px-4 py-3 flex items-center gap-3 settings-section-header">
              <div className="flex items-center gap-3">
                <HelpCircle className="h-4 w-4 text-muted-foreground" />
                <span className="truncate">Support & Legal</span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="settings-section-content cc-acc-content overflow-hidden">
              {/* Support & Legal */}
              <div 
                className="settings-row min-h-12 px-4 py-3 rounded-xl flex items-center justify-between overflow-hidden cursor-pointer hover:bg-muted/20"
                onClick={() => setSupportLegalOpen(true)}
              >
                <div className="flex-1 min-w-0">
                  <span className="block text-base font-semibold leading-tight truncate">Support & Legal</span>
                  <span className="block text-sm text-muted-foreground leading-snug truncate">
                    Terms, Privacy, Contact Support, Rate App
                  </span>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>

        {/* Inline Banner Ad */}
        <div className="w-full overflow-hidden rounded-xl">
          <InlineAd slot="settings" />
        </div>

        {/* Balanced divider – equal spacing above and below the line */}
        <Separator className="mt-4 mb-4" />

        {/* Resources title (matching Settings style) */}
        <h2 id="resources" className="mb-2 text-lg font-medium text-foreground scroll-mt-16">Resources</h2>
        <div className="scroll-mt-16">
          <ResourcesSection />
        </div>

        {/* Floating Modals */}
        <FloatingModal
          isOpen={activeModal === 'subscription'}
          onClose={closeModal}
          title="Manage Subscription"
        >
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Manage your subscription and restore purchases.
            </p>
            <Button
              variant="outline"
              onClick={handleRestore}
              disabled={purchasing !== null}
              className="w-full"
            >
              {purchasing === 'restore' && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Restore Purchases
            </Button>
          </div>
        </FloatingModal>

        {/* Support & Legal Modal */}
        {supportLegalOpen && (
          <SupportLegalModal onClose={() => setSupportLegalOpen(false)} />
        )}
      </div>
    </Layout>
  );
};

export default Settings;