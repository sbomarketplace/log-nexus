import React from 'react';
import { Layout } from '@/components/Layout';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Shield, Database, HelpCircle, ChevronRight } from 'lucide-react';

const Settings = () => {
  return (
    <Layout>
      <div className="max-w-4xl mx-auto space-y-6 settings-page incident-typography pb-safe-bottom">
        <header className="text-center pt-3 pb-2">
          <h1 className="text-3xl font-bold tracking-tight">Settings & Resources</h1>
          <p className="mt-2 text-muted-foreground">
            Manage your preferences and access helpful guides
          </p>
        </header>

        {/* Settings title */}
        <h2 id="settings" className="mb-2 text-lg font-medium text-foreground">Settings</h2>

        {/* Settings Accordion */}
        <Accordion type="multiple" className="space-y-4">
          {/* Remove Ads Subscription */}
          <AccordionItem value="account" className="settings-section">
            <AccordionTrigger className="settings-section-header">
              <div className="flex items-center gap-3">
                <Shield className="h-4 w-4 text-muted-foreground" />
                <span>Remove Ads Subscription</span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="settings-section-content cc-acc-content">
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <div className="text-base font-semibold">Subscription Status</div>
                    <div className="text-base text-muted-foreground">
                      Current plan and billing
                    </div>
                  </div>
                  <div className="px-3 py-1 rounded-full text-xs font-medium bg-muted text-muted-foreground">
                    FREE
                  </div>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* Data & Storage */}
          <AccordionItem value="data" className="settings-section">
            <AccordionTrigger className="settings-section-header">
              <div className="flex items-center gap-3">
                <Database className="h-4 w-4 text-muted-foreground" />
                <span>Data & Storage</span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="settings-section-content cc-acc-content">
              {/* Data storage content */}
              <div className="space-y-4">
                <div className="settings-row">
                  <div className="settings-row-label">
                    <span className="settings-row-title">Export Data</span>
                    <span className="settings-row-description">
                      Download your incidents as PDF, DOCX, or TXT
                    </span>
                  </div>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* Support & Legal */}
          <AccordionItem value="support" className="settings-section">
            <AccordionTrigger className="settings-section-header">
              <div className="flex items-center gap-3">
                <HelpCircle className="h-4 w-4 text-muted-foreground" />
                <span>Support & Legal</span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="settings-section-content cc-acc-content">
              <div className="settings-row cursor-pointer hover:bg-muted/20">
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
      </div>
    </Layout>
  );
};

export default Settings;