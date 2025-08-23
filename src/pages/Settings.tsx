import { useState } from 'react';
import { Layout } from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { X, ChevronRight, Shield, Database, FileText, Bell, Link, HelpCircle } from 'lucide-react';
import { useSettingsStore } from '@/state/settingsStore';
import '../styles/settings.css';

const Settings = () => {
  const {
    hidePreviews,
    appLock,
    parsing,
    setHidePreviews,
    setAppLock,
  } = useSettingsStore();

  const [activeModal, setActiveModal] = useState<string | null>(null);

  const closeModal = () => setActiveModal(null);

  const getPlanDisplayName = (plan: string) => {
    switch (plan) {
      case 'free': return 'Free';
      case 'pack5': return '5-Pack';
      case 'pack60': return '60-Pack';
      case 'unlimited': return 'Unlimited';
      default: return 'Free';
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
            <AccordionContent className="settings-section-content">
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
              <div className="settings-row">
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
                    Parsing Credits: {parsing.remaining}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    Free: 3 per account
                  </span>
                </div>
                <div className="credits-meter-bar">
                  <div 
                    className="credits-meter-fill"
                    style={{ width: `${(parsing.remaining / 3) * 100}%` }}
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Manual logging is always free.
                </p>
              </div>

              {/* Purchase Options */}
              <div className="purchase-buttons">
                <div className="purchase-button">
                  <span className="purchase-button-price">$1.99</span>
                  <span className="purchase-button-description">5 parsings</span>
                </div>
                <div className="purchase-button">
                  <span className="purchase-button-price">$19.99</span>
                  <span className="purchase-button-description">60 parsings</span>
                </div>
                <div className="purchase-button">
                  <span className="purchase-button-price">$99/mo</span>
                  <span className="purchase-button-description">Unlimited</span>
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
            <AccordionContent className="settings-section-content">
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
            <AccordionContent className="settings-section-content">
              <div className="text-sm text-muted-foreground">
                Data & Storage settings coming soon...
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
            <AccordionContent className="settings-section-content">
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
            <AccordionContent className="settings-section-content">
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
            <AccordionContent className="settings-section-content">
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
            <AccordionContent className="settings-section-content">
              <div className="text-sm text-muted-foreground">
                Support options coming soon...
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>

        {/* Floating Modals */}
        <FloatingModal
          isOpen={activeModal === 'example'}
          onClose={closeModal}
          title="Example Modal"
        >
          <div className="text-sm text-muted-foreground">
            This is an example of the floating modal design.
          </div>
        </FloatingModal>
      </div>
    </Layout>
  );
};

export default Settings;