import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { consentStorage, POLICIES_VERSION } from '@/utils/consentStorage';

interface ConsentModalProps {
  onConsentGiven: () => void;
}

export const ConsentModal = ({ onConsentGiven }: ConsentModalProps) => {
  const [showLearnMore, setShowLearnMore] = useState(false);

  // Prevent body scroll when modal is open
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  const handleAcceptAndContinue = () => {
    const consent = {
      consentAccepted: true,
      consentAcceptedAt: new Date().toISOString(),
      policiesVersion: POLICIES_VERSION,
      source: 'initial_modal'
    };
    consentStorage.setConsent(consent);
    onConsentGiven();
  };

  const handleLearnMore = () => {
    setShowLearnMore(true);
  };

  const handleBackToConsent = () => {
    setShowLearnMore(false);
  };

  if (showLearnMore) {
    return (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50">
        <div className="fixed inset-0 z-50 grid place-items-center p-4">
          <div className="w-full max-w-4xl max-h-[90vh] bg-background rounded-2xl shadow-2xl transform transition-all">
            {/* Sticky Header */}
            <div className="sticky top-0 bg-background border-b rounded-t-2xl p-6 z-10">
              <h2 className="text-xl font-semibold text-foreground">
                ClearCase Terms, Privacy, and Cookie Policy
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                Effective Date: 2025-08-09
              </p>
            </div>

            {/* Scrollable Content */}
            <ScrollArea className="h-[calc(90vh-200px)]">
              <div className="p-6 space-y-8">
                {/* Terms & Conditions */}
                <section>
                  <h3 className="text-lg font-semibold mb-4 text-primary">Terms & Conditions</h3>
                  <div className="space-y-4 text-sm leading-relaxed">
                    <div>
                      <h4 className="font-semibold mb-2">1. Introduction</h4>
                      <p>Welcome to ClearCase ("we," "us," "our"). By downloading, installing, or using the ClearCase mobile or web application ("App"), you agree to these Terms & Conditions ("Terms"). If you do not agree, do not use the App.</p>
                      <p className="mt-2">ClearCase helps individuals document, organize, and export workplace incident reports for personal, legal, or compliance purposes.</p>
                    </div>

                    <div>
                      <h4 className="font-semibold mb-2">2. Eligibility</h4>
                      <p>You must be at least 18 years old to use the App, or have the consent of a parent or guardian.</p>
                    </div>

                    <div>
                      <h4 className="font-semibold mb-2">3. Services Provided</h4>
                      <p>ClearCase allows you to:</p>
                      <ul className="list-disc list-inside mt-2 space-y-1 ml-4">
                        <li>Log and store workplace incident notes in structured formats.</li>
                        <li>Upload and parse raw notes (including text documents).</li>
                        <li>Generate AI-assisted summaries and rewrites.</li>
                        <li>Export incident timelines.</li>
                        <li>Access optional legal resources by ZIP code.</li>
                        <li>Purchase additional AI summary credits via in-app purchases.</li>
                      </ul>
                    </div>

                    <div>
                      <h4 className="font-semibold mb-2">4. No Legal Advice</h4>
                      <p>ClearCase does not provide legal advice. All content generated or suggested by the App is for informational purposes only. For legal advice, consult a licensed attorney.</p>
                    </div>

                    <div>
                      <h4 className="font-semibold mb-2">5. User Responsibilities</h4>
                      <p>You agree to:</p>
                      <ul className="list-disc list-inside mt-2 space-y-1 ml-4">
                        <li>Provide accurate and truthful information in reports.</li>
                        <li>Not upload illegal, harmful, or defamatory content.</li>
                        <li>Comply with all laws in your jurisdiction.</li>
                      </ul>
                    </div>

                    <div>
                      <h4 className="font-semibold mb-2">6. Data Collection & Use</h4>
                      <div className="space-y-3">
                        <div>
                          <h5 className="font-medium">6.1 Types of Data Collected</h5>
                          <p>With your consent, we may collect:</p>
                          <ul className="list-disc list-inside mt-2 space-y-1 ml-4">
                            <li>Incident metadata (type, date, category, ZIP code, industry, employer type).</li>
                            <li>Anonymized incident summaries and patterns.</li>
                            <li>Device information (OS, crash reports).</li>
                            <li>App usage data (features used, time spent).</li>
                          </ul>
                          <p className="mt-2">We do not collect personally identifiable information unless you voluntarily include it in your incident notes.</p>
                        </div>

                        <div>
                          <h5 className="font-medium">6.2 How We Use Data</h5>
                          <p>We use anonymized and aggregated data to:</p>
                          <ul className="list-disc list-inside mt-2 space-y-1 ml-4">
                            <li>Improve app features and performance.</li>
                            <li>Develop statistical insights for workplace research.</li>
                            <li>Create aggregated, non-identifiable reports for sale to vetted third parties.</li>
                          </ul>
                        </div>

                        <div>
                          <h5 className="font-medium">6.3 Data Sales</h5>
                          <p>By using the App, you agree that anonymized, aggregated versions of your incident data may be sold to third parties (e.g., law firms, unions, advocacy groups, researchers). This data cannot be used to identify you.</p>
                        </div>

                        <div>
                          <h5 className="font-medium">6.4 Data Storage</h5>
                          <ul className="list-disc list-inside space-y-1 ml-4">
                            <li>All personal data is stored locally on your device.</li>
                            <li>We do not offer a cloud backup service.</li>
                            <li>Anonymized metadata is stored on secure servers.</li>
                          </ul>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-semibold mb-2">7. Payment & Subscriptions</h4>
                      <ul className="list-disc list-inside space-y-1 ml-4">
                        <li>ClearCase offers a free tier with limited AI summaries.</li>
                        <li>Additional summaries can be purchased via in-app purchases, Stripe, or other approved payment processors.</li>
                        <li>Payments may be processed through the Apple App Store, Google Play Store, Stripe, or a combination of these.</li>
                        <li>Purchases are non-refundable unless required by law.</li>
                      </ul>
                    </div>

                    <div>
                      <h4 className="font-semibold mb-2">8. AI-Generated Content</h4>
                      <p>You acknowledge that:</p>
                      <ul className="list-disc list-inside mt-2 space-y-1 ml-4">
                        <li>AI-generated content may contain errors.</li>
                        <li>You are responsible for verifying AI outputs before use.</li>
                        <li>We are not liable for consequences from AI-generated content.</li>
                      </ul>
                    </div>

                    <div>
                      <h4 className="font-semibold mb-2">9. Intellectual Property</h4>
                      <p>All branding, design, and proprietary algorithms belong to us. You may not copy, reverse-engineer, or redistribute the App without written consent.</p>
                    </div>

                    <div>
                      <h4 className="font-semibold mb-2">10. Termination</h4>
                      <p>We may suspend or terminate your access if you violate these Terms or misuse the App.</p>
                    </div>

                    <div>
                      <h4 className="font-semibold mb-2">11. Limitation of Liability</h4>
                      <p>To the fullest extent permitted by law: We are not liable for indirect, incidental, or consequential damages from your use of the App.</p>
                    </div>

                    <div>
                      <h4 className="font-semibold mb-2">12. Governing Law</h4>
                      <p>These Terms are governed by the laws of [Your State/Country].</p>
                    </div>

                    <div>
                      <h4 className="font-semibold mb-2">13. Changes to Terms</h4>
                      <p>We may update these Terms at any time. Continued use means you accept the changes.</p>
                    </div>

                    <div>
                      <h4 className="font-semibold mb-2">14. Contact</h4>
                      <p>For questions, email us at: SBOMarketplaceapp@gmail.com</p>
                    </div>
                  </div>
                </section>

                {/* Privacy Policy */}
                <section>
                  <h3 className="text-lg font-semibold mb-4 text-primary">Privacy Policy</h3>
                  <div className="space-y-4 text-sm leading-relaxed">
                    <div>
                      <h4 className="font-semibold mb-2">1. Introduction</h4>
                      <p>ClearCase respects your privacy. This Privacy Policy explains how we handle your data.</p>
                    </div>

                    <div>
                      <h4 className="font-semibold mb-2">2. Data We Collect</h4>
                      <p>We may collect anonymized data such as:</p>
                      <ul className="list-disc list-inside mt-2 space-y-1 ml-4">
                        <li>Incident metadata (type, date, category, ZIP code).</li>
                        <li>Device information (OS, crash logs).</li>
                        <li>Usage data (features used, frequency).</li>
                      </ul>
                    </div>

                    <div>
                      <h4 className="font-semibold mb-2">3. How We Use Data</h4>
                      <ul className="list-disc list-inside space-y-1 ml-4">
                        <li>To improve app features and reliability.</li>
                        <li>To create anonymized reports for research or sale to vetted third parties.</li>
                      </ul>
                    </div>

                    <div>
                      <h4 className="font-semibold mb-2">4. Data Storage</h4>
                      <ul className="list-disc list-inside space-y-1 ml-4">
                        <li>Personal data is stored locally on your device.</li>
                        <li>No cloud storage is provided.</li>
                        <li>Anonymized data is stored securely on our servers.</li>
                      </ul>
                    </div>

                    <div>
                      <h4 className="font-semibold mb-2">5. Data Sales</h4>
                      <p>We may sell anonymized and aggregated data for workplace research purposes. This data cannot identify you.</p>
                    </div>

                    <div>
                      <h4 className="font-semibold mb-2">6. Cookies and Required Technologies</h4>
                      <p>ClearCase uses cookies and similar technologies to:</p>
                      <ul className="list-disc list-inside mt-2 space-y-1 ml-4">
                        <li>Maintain session security.</li>
                        <li>Store preferences.</li>
                        <li>Support essential app operations.</li>
                      </ul>
                      <p className="mt-2">These technologies are required for the app to function and cannot be disabled.</p>
                    </div>

                    <div>
                      <h4 className="font-semibold mb-2">7. Consent</h4>
                      <p>Use of the App requires full acceptance of this Privacy Policy, Terms & Conditions, and Cookie Policy. If you do not consent, do not use the App.</p>
                    </div>
                  </div>
                </section>

                {/* Cookie Policy */}
                <section>
                  <h3 className="text-lg font-semibold mb-4 text-primary">Cookie Policy</h3>
                  <div className="space-y-4 text-sm leading-relaxed">
                    <p>ClearCase uses cookies and similar technologies for essential functionality.</p>
                    
                    <div>
                      <h4 className="font-semibold mb-2">Purpose</h4>
                      <p>Maintain session security, store preferences, operate core features.</p>
                    </div>

                    <div>
                      <h4 className="font-semibold mb-2">No Tracking</h4>
                      <p>We do not collect personally identifiable data via cookies.</p>
                    </div>

                    <div>
                      <h4 className="font-semibold mb-2">Mandatory</h4>
                      <p>Disabling cookies will prevent the app from functioning.</p>
                    </div>
                  </div>
                </section>
              </div>
            </ScrollArea>

            {/* Footer Actions */}
            <div className="p-6 border-t">
              <Button 
                variant="outline" 
                onClick={handleBackToConsent}
                className="w-full rounded-xl py-3 font-medium"
              >
                Back to Consent
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50">
      <div className="fixed inset-0 z-50 grid place-items-center p-4">
        <div className="w-full max-w-md bg-background rounded-2xl shadow-2xl p-6 transform transition-all">
          {/* Header */}
          <div className="text-center mb-6">
            <h1 className="text-xl font-semibold text-[hsl(25,95%,53%)] mb-4">
              Welcome to ClearCase
            </h1>
            <p className="text-muted-foreground text-sm leading-relaxed mb-4">
              By continuing to use this app, you agree to share your app activity and crash data with ClearCase to help improve our apps and personalize your experience, as described in our Privacy Policy.
            </p>
            <a 
              href="#"
              onClick={(e) => {
                e.preventDefault();
                handleLearnMore();
              }}
              className="text-xs text-gray-500 underline underline-offset-2 hover:text-gray-400"
              aria-label="View full Terms, Privacy, and Cookie Policy"
            >
              Learn More (View Full Policies)
            </a>
          </div>

          {/* Actions */}
          <div className="space-y-4">
            <Button 
              onClick={handleAcceptAndContinue}
              className="w-full bg-[hsl(25,95%,53%)] text-white hover:bg-[hsl(25,95%,53%)]/90 rounded-full py-3 font-medium"
              role="button"
            >
              Accept and Continue
            </Button>
          </div>

          {/* Footer Note */}
          <p className="text-xs text-gray-500 text-center mt-4">
            You must accept to use ClearCase.
          </p>
        </div>
      </div>
    </div>
  );
};