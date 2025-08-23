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
import { buyPack5, buyPack60, buyUnlimited, restorePurchases } from '@/utils/purchase';
import { getPlanDisplayInfo } from '@/utils/parsingGate';
import { exportBackup, importBackup } from '@/utils/backup';
import { getCacheSize, clearCache, formatCacheSize, scheduleDataRetentionCheck } from '@/utils/storage';
import { 
  openSystemSettings, 
  rateApp, 
  shareDiagnostics, 
  requestPermission, 
  checkPermission,
  isNative,
  nativeToast,
  nativeEmail
} from '@/utils/native';
import { Layout } from '@/components/Layout';
import '../styles/settings.css';

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
    parsing,
    dataStorage,
    incidentDefaults,
    notifications,
    integrations,
    setHidePreviews,
    setAppLock,
    setParsing,
    setDataStorage,
    setIncidentDefaults,
    setNotifications,
    setIntegrations,
  } = useSettingsStore();

  const [activeModal, setActiveModal] = useState<string | null>(null);
  const [purchasing, setPurchasing] = useState<string | null>(null);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [cacheInfo, setCacheInfo] = useState({ size: 0, itemCount: 0 });

  const planInfo = getPlanDisplayInfo();

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

  const handlePurchase = async (purchaseType: string, purchaseFunction: () => Promise<boolean>) => {
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
    } catch (error) {
      console.error('Restore error:', error);
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
                <div className={`plan-chip ${parsing.plan}`}>
                  {getPlanDisplayName(parsing.plan)}
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
                    {planInfo.displayText}
                  </span>
                  {!planInfo.isUnlimited && (
                    <span className="text-xs text-muted-foreground">
                      {parsing.plan === 'free' ? 'Free: 3 per account' : 'Credits available'}
                    </span>
                  )}
                </div>
                {!planInfo.isUnlimited && (
                  <div className="credits-meter-bar">
                    <div 
                      className="credits-meter-fill"
                      style={{ 
                        width: parsing.plan === 'free' 
                          ? `${Math.max(0, (3 - parsing.lifetimeUsed) / 3) * 100}%`
                          : `${Math.min(100, (parsing.remaining / 60) * 100)}%`
                      }}
                    />
                  </div>
                )}
                <p className="text-xs text-muted-foreground mt-2">
                  Manual logging is always free.
                </p>
              </div>

              {/* Purchase Options */}
              <div className="mt-3 mb-1">
                <div className="grid grid-cols-2 gap-3">
                  <PricingButton
                    price="$1.99"
                    caption="5 parsings"
                    selected={parsing.plan === 'pack'}
                    disabled={purchasing !== null}
                    loading={purchasing === 'pack5'}
                    onClick={() => handlePurchase('pack5', buyPack5)}
                  />
                  <PricingButton
                    price="$19.99"
                    caption="60 parsings"
                    selected={parsing.plan === 'pack'}
                    disabled={purchasing !== null}
                    loading={purchasing === 'pack60'}
                    onClick={() => handlePurchase('pack60', buyPack60)}
                  />
                  <PricingButton
                    price="$99/mo"
                    caption="Unlimited"
                    selected={parsing.plan === 'unlimited'}
                    disabled={purchasing !== null}
                    loading={purchasing === 'unlimited'}
                    onClick={() => handlePurchase('unlimited', buyUnlimited)}
                    className="col-span-2"
                  />
                </div>
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
              {/* Hide Sensitive Previews */}
              <div className="settings-row">
                <div className="settings-row-label">
                  <span className="settings-row-title">Hide Sensitive Previews</span>
                  <span className="settings-row-description">
                    Blur app switcher/screenshot overlay
                  </span>
                </div>
                <Switch
                  checked={hidePreviews}
                  onCheckedChange={setHidePreviews}
                />
              </div>

              {/* App Lock */}
              <div className="settings-row">
                <div className="settings-row-label">
                  <span className="settings-row-title">App Lock</span>
                  <span className="settings-row-description">
                    Face ID / Touch ID / Passcode
                  </span>
                </div>
                <Switch
                  checked={appLock.enabled}
                  onCheckedChange={(enabled) => setAppLock({ enabled })}
                />
              </div>

              {/* Auto-lock (only when App Lock is ON) */}
              {appLock.enabled && (
                <div className="settings-row">
                  <div className="settings-row-label">
                    <span className="settings-row-title">Auto-lock</span>
                    <span className="settings-row-description">
                      Automatically lock the app after inactivity
                    </span>
                  </div>
                  <Select
                    value={appLock.autoLockMins.toString()}
                    onValueChange={(value) => setAppLock({ autoLockMins: parseInt(value) })}
                  >
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0">Immediately</SelectItem>
                      <SelectItem value="1">1 minute</SelectItem>
                      <SelectItem value="5">5 minutes</SelectItem>
                      <SelectItem value="15">15 minutes</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Require unlock for export (only when App Lock is ON) */}
              {appLock.enabled && (
                <div className="settings-row">
                  <div className="settings-row-label">
                    <span className="settings-row-title">Require unlock to export/share</span>
                    <span className="settings-row-description">
                      Additional security for sensitive data
                    </span>
                  </div>
                  <Switch
                    checked={appLock.requireUnlockForExport}
                    onCheckedChange={(requireUnlockForExport) => 
                      setAppLock({ requireUnlockForExport })
                    }
                  />
                </div>
              )}
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
              {/* Clear cached files */}
              <div className="settings-row">
                <div className="settings-row-label">
                  <span className="settings-row-title">Cached files</span>
                  <span className="settings-row-description">
                    {cacheInfo.itemCount} items • {formatCacheSize(cacheInfo.size)}
                  </span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleClearCache}
                  className="text-xs"
                >
                  <Trash2 className="h-3 w-3 mr-1" />
                  Clear cache
                </Button>
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* Incident Defaults & Templates */}
          <AccordionItem value="templates" className="settings-section">
            <AccordionTrigger className="settings-section-header">
              <div className="flex items-center gap-3">
                <FileText className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">Incident Defaults & Templates</span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="settings-section-content cc-acc-content">
              <div className="text-sm text-muted-foreground">
                Incident templates coming soon...
              </div>
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
              <div className="text-sm text-muted-foreground">
                Notification settings coming soon...
              </div>
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
              <div className="text-sm text-muted-foreground">
                Integrations coming soon...
              </div>
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
              <div className="text-sm text-muted-foreground">
                Support options coming soon...
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
      </div>
    </Layout>
  );
};

export default Settings;