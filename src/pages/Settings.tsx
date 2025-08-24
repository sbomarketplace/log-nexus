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
  Bell, 
  Link, 
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
import { purchase, restore, toast, isNative } from '@/utils/iap';
import { useAIQuota, FREE_TOTAL } from '@/state/aiQuotaStore';
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
import IntegrationsCard from '@/components/settings/IntegrationsCard';
import DataStorageCard from '@/components/settings/DataStorageCard';
import NotificationsCard from '@/components/settings/NotificationsCard';
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
    notifications,
    integrations,
    setHidePreviews,
    setAppLock,
    setDataStorage,
    setIncidentDefaults,
    setNotifications,
    setIntegrations,
  } = useSettingsStore();
  
  const { freeUsed, credits, subscriptionActive, plan, lastPackAdded } = useAIQuota();

  const [activeModal, setActiveModal] = useState<string | null>(null);
  const [purchasing, setPurchasing] = useState<string | null>(null);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [cacheInfo, setCacheInfo] = useState({ size: 0, itemCount: 0 });
  const [supportLegalOpen, setSupportLegalOpen] = useState(false);

  // Helper function for AI report unit labels
  const unitLabel = (n: number) => n === 1 ? "AI report" : "AI reports";

  const buy5 = async () => {
    try { 
      await purchase("cc.ai.5"); 
      useAIQuota.getState().addCredits(5); 
      toast("Purchase successful. 5 AI reports added."); 
    } catch { 
      toast("Purchase canceled."); 
    }
  };

  const buy60 = async () => {
    try { 
      await purchase("cc.ai.60"); 
      useAIQuota.getState().addCredits(60); 
      toast("Purchase successful. 60 AI reports added."); 
    } catch { 
      toast("Purchase canceled."); 
    }
  };

  const buyUnlimited = async () => {
    try { 
      await purchase("cc.ai.unlimited.month"); 
      useAIQuota.getState().setUnlimited(true); 
      toast("Unlimited AI reports activated."); 
    } catch { 
      toast("Purchase canceled."); 
    }
  };

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
      const result = await restore();
      if (result?.unlimitedActive) useAIQuota.getState().setUnlimited(true);
      if (result?.credits) useAIQuota.getState().addCredits(result.credits);
      toast("Purchases restored.");
    } catch {
      toast("Restore failed.");
    } finally {
      setPurchasing(null);
    }
  };

  const openSubscriptionManagement = () => {
    if (window.__NATIVE__) {
      // Native app - open App Store subscription management
      window.open('itms-apps://apps.apple.com/account/subscriptions', '_system');
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
          <h1 className="text-lg font-medium text-foreground">Settings</h1>
          <p className="text-xs text-muted-foreground mt-1">
            Manage your incident reporting preferences and data
          </p>
        </div>

        {/* Settings Accordion */}
        <Accordion type="multiple" className="space-y-4">
          {/* Account & Subscription */}
          <AccordionItem value="account" className="settings-section">
            <AccordionTrigger className="settings-section-header">
              <div className="flex items-center gap-3">
                <Shield className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">Account & Subscription</span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="settings-section-content cc-acc-content">
              {/* Current Plan */}
              <div className="settings-row">
                <div className="settings-row-label">
                  <span className="settings-row-title">Current Plan</span>
                </div>
                <div className={`plan-chip ${plan}`}>
                  {plan === 'free' ? 'Free' : plan === 'pack' ? 'Pack' : 'Unlimited'}
                </div>
              </div>

              {/* Manage Subscription */}
              <div 
                className="settings-row cursor-pointer hover:bg-muted/20"
                onClick={openSubscriptionManagement}
              >
                <div className="settings-row-label">
                  <span className="settings-row-title">Manage Subscription</span>
                  <span className="settings-row-description">Restore purchases (App Store)</span>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </div>

              {/* Credits Meter */}
              <div className="credits-meter">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-foreground">
                    {FREE_TOTAL - freeUsed} free {unitLabel(FREE_TOTAL - freeUsed)} remaining
                  </span>
                  <span className="text-xs text-muted-foreground">
                    Free: {FREE_TOTAL} per account
                  </span>
                </div>
                {!subscriptionActive && (
                  <div className="credits-meter-bar">
                    <div 
                      className="credits-meter-fill"
                      style={{ width: `${Math.round((freeUsed / FREE_TOTAL) * 100)}%` }}
                      aria-label={`Free AI reports used: ${freeUsed} of ${FREE_TOTAL}`}
                      role="progressbar"
                      aria-valuemin={0}
                      aria-valuemax={FREE_TOTAL}
                      aria-valuenow={freeUsed}
                    />
                  </div>
                )}
                <div className="mt-1 text-xs text-gray-500">Used {freeUsed}/{FREE_TOTAL}</div>
                <p className="text-xs text-muted-foreground mt-2">
                  Manual logging is always free.
                </p>
              </div>

              {/* Purchase Options */}
              <div className="mt-3 mb-1">
                <div className="grid grid-cols-2 gap-3">
                  <PricingButton
                    price="$1.99"
                    caption={`5 ${unitLabel(5)}`}
                    selected={plan === 'pack' && lastPackAdded === 5}
                    disabled={purchasing !== null}
                    loading={purchasing === 'pack5'}
                    onClick={() => handlePurchase('pack5', buy5)}
                  />
                  <PricingButton
                    price="$19.99"
                    caption={`60 ${unitLabel(60)}`}
                    selected={plan === 'pack' && lastPackAdded === 60}
                    disabled={purchasing !== null}
                    loading={purchasing === 'pack60'}
                    onClick={() => handlePurchase('pack60', buy60)}
                  />
                  <PricingButton
                    price="$99/mo"
                    caption="Unlimited"
                    selected={plan === 'unlimited'}
                    disabled={purchasing !== null}
                    loading={purchasing === 'unlimited'}
                    onClick={() => handlePurchase('unlimited', buyUnlimited)}
                    className="col-span-2"
                  />
                </div>
                
                {/* Restore purchases button */}
                {isNative && (
                  <button
                    onClick={handleRestore}
                    disabled={purchasing !== null}
                    className="w-full text-sm text-gray-600 hover:text-gray-800 py-2 disabled:opacity-50 mt-3"
                  >
                    {purchasing === 'restore' ? (
                      <span className="flex items-center justify-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Restoring...
                      </span>
                    ) : (
                      'Restore Purchases'
                    )}
                  </button>
                )}
              </div>
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

          {/* Notifications */}
          <AccordionItem value="notifications" className="settings-section">
            <AccordionTrigger className="settings-section-header">
              <div className="flex items-center gap-3">
                <Bell className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">Notifications</span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="settings-section-content cc-acc-content">
              <NotificationsCard />
            </AccordionContent>
          </AccordionItem>

          {/* Integrations */}
          <AccordionItem value="integrations" className="settings-section">
            <AccordionTrigger className="settings-section-header">
              <div className="flex items-center gap-3">
                <Link className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">Integrations</span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="settings-section-content cc-acc-content">
              <IntegrationsCard />
            </AccordionContent>
          </AccordionItem>

          {/* Support & About */}
          <AccordionItem value="support" className="settings-section">
            <AccordionTrigger className="settings-section-header">
              <div className="flex items-center gap-3">
                <HelpCircle className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">Support & About</span>
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