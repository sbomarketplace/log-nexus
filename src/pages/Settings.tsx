import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  X, 
  ChevronRight, 
  Shield, 
  Database, 
  FileText, 
  HelpCircle, 
  Loader2,
  Upload,
  Download,
  Trash2,
  Settings as SettingsIcon,
  Mail,
  Star,
  Share,
  ExternalLink,
  Clock,
  Globe
} from 'lucide-react';
import { useSettingsStore } from '@/state/settingsStore';
import { isRemoveAdsActive, purchaseRemoveAds, restorePurchases, toast, isNative } from '@/lib/iap';
import { AiCreditsPanel } from '@/components/AiCreditsPanel';
import { addPack, setSubscription } from '@/lib/credits';
import { getPlanDisplayInfo } from '@/utils/parsingGate';
import { exportBackup, importBackup } from '@/utils/backup';
import { getCacheSize, clearCache, formatCacheSize, scheduleDataRetentionCheck } from '@/utils/storage';
import { 
  openSystemSettings, 
  rateApp, 
  shareDiagnostics, 
  requestPermission, 
  checkPermission,
  nativeToast,
  nativeEmail
} from '@/utils/native';
import { Layout } from '@/components/Layout';
import SupportLegalModal from '@/components/SupportLegalModal';
import SecurityPrivacyCard from '@/components/settings/SecurityPrivacyCard';
import DataStorageCard from '@/components/settings/DataStorageCard';
import { ResourcesSection } from '@/pages/Resources';
import { Separator } from '@/components/ui/separator';
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
        w-full min-h-[64px] px-4 py-3 rounded-lg border
        flex flex-col items-center justify-center gap-1
        text-center whitespace-normal leading-tight
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
      <span className={`font-semibold text-[17px] md:text-[18px] ${selected ? 'text-primary-foreground' : 'text-foreground'}`}>
        {price}
      </span>
      <span className={`text-[14px] ${selected ? 'text-primary-foreground/90' : 'text-muted-foreground'}`}>
        {caption}
      </span>
    </button>
  );
};

const Settings = () => {
  const {
    hidePreviews,
    appLock,
    dataStorage,
    incidentDefaults,
    setHidePreviews,
    setAppLock,
    setDataStorage,
    setIncidentDefaults,
  } = useSettingsStore();
  
  const [activeModal, setActiveModal] = useState<string | null>(null);
  const [purchasing, setPurchasing] = useState<string | null>(null);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [cacheInfo, setCacheInfo] = useState({ size: 0, itemCount: 0 });
  const [supportLegalOpen, setSupportLegalOpen] = useState(false);

  // Helper function for AI report unit labels
  const unitLabel = (n: number) => n === 1 ? "AI report" : "AI reports";

  // Load cache info on mount
  useEffect(() => {
    const loadCacheInfo = async () => {
      try {
        const info = getCacheSize();
        setCacheInfo(info);
      } catch (error) {
        console.warn('Failed to load cache info:', error);
        setCacheInfo({ size: 0, itemCount: 0 });
      }
    };
    loadCacheInfo();
  }, []);

  const handleClearCache = async () => {
    try {
      await clearCache();
      const info = getCacheSize();
      setCacheInfo(info);
      if (isNative) {
        nativeToast('Cache cleared.');
      } else {
        console.log('Cache cleared.');
      }
    } catch (error) {
      console.error('Failed to clear cache:', error);
      if (isNative) {
        nativeToast('Failed to clear cache.');
      }
    }
  };

  const closeModal = () => {
    setActiveModal(null);
    setImportFile(null);
  };

  const getPlanDisplayName = (plan: string) => {
    switch (plan) {
      case 'free': return 'Free';
      case 'pack': return 'Pack';
      case 'unlimited': return 'Unlimited';
      default: return 'Free';
    }
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

  const openSubscriptionManagement = () => {
    if (isNative && (window as any).Capacitor?.Plugins?.App) {
      // Native app - open App Store subscription management
      (window as any).Capacitor.Plugins.App.openUrl({ url: 'itms-apps://apps.apple.com/account/subscriptions' });
    } else {
      // Web fallback
      setActiveModal('subscription');
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
      <div className="max-w-4xl mx-auto space-y-6 settings-page incident-typography">
        {/* Header */}
        <div>
          <h1 className="text-lg font-medium text-foreground">Settings & Resources</h1>
          <p className="text-xs text-muted-foreground mt-1">
            Manage your preferences and access helpful guides
          </p>
        </div>

        {/* Settings section */}
        <h2 id="settings" className="sr-only">Settings</h2>

        {/* Settings Accordion */}
        <Accordion type="multiple" className="space-y-4">
          {/* Remove Ads Subscription */}
          <AccordionItem value="account" className="settings-section">
            <AccordionTrigger className="settings-section-header">
              <div className="flex items-center gap-3">
                <Shield className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">Remove Ads Subscription</span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="settings-section-content cc-acc-content">
              {/* Subscription Status */}
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <h3 className="font-medium">Subscription Status</h3>
                    <p className="text-sm text-muted-foreground">Current plan and billing</p>
                  </div>
                  <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                    isRemoveAdsActive() 
                      ? 'bg-success/10 text-success' 
                      : 'bg-muted text-muted-foreground'
                  }`}>
                    {isRemoveAdsActive() ? 'ACTIVE' : 'FREE'}
                  </div>
                </div>

                {/* Purchase Buttons */}
                {!isRemoveAdsActive() && (
                  <PricingButton
                    price="Remove Ads — $4.99/mo"
                    caption="Hide banner ads permanently"
                    loading={purchasing === 'removeAds'}
                    onClick={() => handlePurchase('removeAds', async () => {
                      const result = await purchaseRemoveAds();
                      if (!result.ok && result.error && result.error !== 'cancelled') {
                        console.error('Purchase failed:', result.error);
                      }
                    })}
                    className="w-full"
                  />
                )}

                <PricingButton
                  price="Restore Purchases"
                  caption="Restore previous purchases"
                  loading={purchasing === 'restore'}
                  onClick={handleRestore}
                  className="w-full"
                />
              </div>

              {/* Dev Debug Info */}
              {import.meta.env.DEV && (
                <div className="mt-4 p-3 bg-muted/30 rounded-lg border">
                  <p className="text-xs font-mono text-muted-foreground mb-2">DEV: IAP Product IDs</p>
                  <div className="space-y-1 text-xs font-mono">
                    <div>Remove Ads: {import.meta.env.VITE_IAP_REMOVE_ADS_MONTHLY || 'missing'}</div>
                  </div>
                </div>
              )}
            </AccordionContent>
          </AccordionItem>

          {/* Security & Privacy */}
          <AccordionItem value="security" className="settings-section">
            <AccordionTrigger className="settings-section-header">
              <div className="flex items-center gap-3">
                <Shield className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">Security & Privacy</span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="settings-section-content cc-acc-content">
              <SecurityPrivacyCard />
            </AccordionContent>
          </AccordionItem>

          {/* Data & Storage */}
          <AccordionItem value="data" className="settings-section">
            <AccordionTrigger className="settings-section-header">
              <div className="flex items-center gap-3">
                <Database className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">Data & Storage</span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="settings-section-content cc-acc-content">
              <DataStorageCard />
            </AccordionContent>
          </AccordionItem>


          {/* Support & Legal */}
          <AccordionItem value="support" className="settings-section">
            <AccordionTrigger className="settings-section-header">
              <div className="flex items-center gap-3">
                <HelpCircle className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">Support & Legal</span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="settings-section-content cc-acc-content">
              {/* Support & Legal */}
              <div 
                className="settings-row cursor-pointer hover:bg-muted/20"
                onClick={() => setSupportLegalOpen(true)}
              >
                <div className="settings-row-label">
                  <span className="settings-row-title">Support & Legal</span>
                  <span className="settings-row-description">
                    Terms, Privacy, Contact Support, Rate App
                  </span>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>

        {/* Divider into Resources (reduced spacing) */}
        <div id="resources" className="pt-2 scroll-mt-16" />
        <Separator className="my-2" />
        <h2 className="mb-2 text-lg font-medium text-foreground">Resources</h2>
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