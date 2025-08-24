import * as React from "react";
import { X } from "lucide-react";
import { triggerRatePromptNow } from "@/lib/rateApp";

interface SupportLegalModalProps {
  onClose: () => void;
}

export default function SupportLegalModal({ onClose }: SupportLegalModalProps) {
  const appVersion = import.meta.env.VITE_APP_VERSION || "1.0.0";
  const effectiveDate = "Aug 23, 2025";

  const handleContactSupport = () => {
    const subject = encodeURIComponent("ClearCase Support");
    const mailtoUrl = `mailto:SBOMarketplaceapp@gmail.com?subject=${subject}`;
    window.location.href = mailtoUrl;
  };

  const handleRateApp = () => {
    triggerRatePromptNow();
  };

  // Handle backdrop click
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div 
      role="dialog" 
      aria-modal="true" 
      aria-label="ClearCase Terms, Privacy, and Cookie Policy"
      className="fixed inset-0 z-50 flex items-center justify-center"
      onClick={handleBackdropClick}
    >
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/40" />

      {/* Container */}
      <div className="relative mx-4 w-full max-w-2xl rounded-2xl bg-white shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b">
          <h2 className="text-lg font-semibold">
            ClearCase Terms, Privacy, and Cookie Policy
          </h2>
          <button
            onClick={onClose}
            aria-label="Close"
            className="inline-flex h-8 w-8 items-center justify-center rounded-full hover:bg-gray-100"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="max-h-[70vh] overflow-y-auto px-5 py-4 space-y-6">
          <p className="text-sm text-gray-500">Effective: {effectiveDate}</p>

          {/* TERMS */}
          <section id="terms">
            <h3 className="text-xl font-bold mb-2">Terms and Conditions</h3>

            <h4 className="font-semibold mt-4">1. Introduction</h4>
            <p>
              Welcome to ClearCase ("we", "us", "our"). By downloading, installing, or using
              the ClearCase mobile or web application ("App"), you agree to these Terms and
              Conditions ("Terms"). If you do not agree, do not use the App. ClearCase helps
              individuals document, organize, and export workplace incident reports for
              personal, legal, or compliance purposes.
            </p>

            <h4 className="font-semibold mt-4">2. Eligibility</h4>
            <p>
              You must be at least 18 years old to use the App, or have the consent of a
              parent or guardian.
            </p>

            <h4 className="font-semibold mt-4">3. Services Provided</h4>
            <ul className="list-disc pl-5 space-y-1">
              <li>Log and store workplace incident notes in structured formats.</li>
              <li>Upload and parse raw notes including text documents.</li>
              <li>Generate AI assisted summaries and rewrites.</li>
              <li>Export incident timelines.</li>
              <li>Access optional legal resources by ZIP code.</li>
              <li>Purchase additional AI summary credits via in app purchases.</li>
            </ul>

            <h4 className="font-semibold mt-4">4. No Legal Advice</h4>
            <p>
              ClearCase does not provide legal advice. All content generated or suggested by
              the App is for informational purposes only. For legal advice, consult a licensed
              attorney.
            </p>

            <h4 className="font-semibold mt-4">5. User Responsibilities</h4>
            <ul className="list-disc pl-5 space-y-1">
              <li>Provide accurate and truthful information in reports.</li>
              <li>Do not upload illegal, harmful, or defamatory content.</li>
              <li>Comply with all laws in your jurisdiction.</li>
            </ul>

            <h4 className="font-semibold mt-4">6. Data Collection and Use</h4>
            <p className="italic">6.1 Types of Data Collected</p>
            <p>With your consent, we may collect:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Incident metadata such as type, date, category, ZIP code, industry, employer type.</li>
              <li>Anonymized incident summaries and patterns.</li>
              <li>Device information such as OS and crash reports.</li>
              <li>App usage data such as features used and time spent.</li>
            </ul>
            <p>
              We do not collect personally identifiable information unless you voluntarily
              include it in your incident notes.
            </p>

            <p className="italic mt-2">6.2 How We Use Data</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Improve app features and performance.</li>
              <li>Develop statistical insights for workplace research.</li>
              <li>Create aggregated, non identifiable reports for sale to vetted third parties.</li>
            </ul>

            <p className="italic mt-2">6.3 Data Sales</p>
            <p>
              By using the App, you agree that anonymized, aggregated versions of your incident
              data may be sold to third parties including law firms, unions, advocacy groups,
              and researchers. This data cannot be used to identify you.
            </p>

            <p className="italic mt-2">6.4 Data Storage</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>All personal data is stored locally on your device.</li>
              <li>We do not offer a cloud backup service.</li>
              <li>Anonymized metadata is stored on secure servers.</li>
            </ul>

            <h4 className="font-semibold mt-4">7. Payment and Subscriptions</h4>
            <ul className="list-disc pl-5 space-y-1">
              <li>ClearCase offers a free tier with limited AI summaries.</li>
              <li>Additional summaries can be purchased via in app purchases, Stripe, or other approved processors.</li>
              <li>Payments may be processed through the Apple App Store, Google Play Store, Stripe, or a combination of these.</li>
              <li>Purchases are non refundable unless required by law.</li>
            </ul>

            <h4 className="font-semibold mt-4">8. AI Generated Content</h4>
            <ul className="list-disc pl-5 space-y-1">
              <li>AI generated content may contain errors.</li>
              <li>You are responsible for verifying AI outputs before use.</li>
              <li>We are not liable for consequences from AI generated content.</li>
            </ul>

            <h4 className="font-semibold mt-4">9. Intellectual Property</h4>
            <p>
              All branding, design, and proprietary algorithms belong to us. You may not copy,
              reverse engineer, or redistribute the App without written consent.
            </p>

            <h4 className="font-semibold mt-4">10. Termination</h4>
            <p>
              We may suspend or terminate your access if you violate these Terms or misuse the App.
            </p>

            <h4 className="font-semibold mt-4">11. Limitation of Liability</h4>
            <p>
              To the fullest extent permitted by law, we are not liable for indirect, incidental,
              or consequential damages from your use of the App.
            </p>

            <h4 className="font-semibold mt-4">12. Governing Law</h4>
            <p>These Terms are governed by the laws of your jurisdiction listed in app settings.</p>

            <h4 className="font-semibold mt-4">13. Changes to Terms</h4>
            <p>We may update these Terms at any time. Continued use means you accept the changes.</p>

            <h4 className="font-semibold mt-4">14. Contact</h4>
            <p>
              For questions, email{" "}
              <a
                href="mailto:SBOMarketplaceapp@gmail.com"
                className="text-primary underline"
              >
                SBOMarketplaceapp@gmail.com
              </a>.
            </p>
          </section>

          {/* PRIVACY */}
          <section id="privacy">
            <h3 className="text-xl font-bold mt-8 mb-2">Privacy Policy</h3>

            <h4 className="font-semibold mt-2">1. Introduction</h4>
            <p>ClearCase respects your privacy. This policy explains how we handle your data.</p>

            <h4 className="font-semibold mt-2">2. Data We Collect</h4>
            <ul className="list-disc pl-5 space-y-1">
              <li>Incident metadata such as type, date, category, ZIP code.</li>
              <li>Device information such as OS and crash logs.</li>
              <li>Usage data such as features used and frequency.</li>
            </ul>

            <h4 className="font-semibold mt-2">3. How We Use Data</h4>
            <ul className="list-disc pl-5 space-y-1">
              <li>Improve app features and reliability.</li>
              <li>Create anonymized reports for research or sale to vetted third parties.</li>
            </ul>

            <h4 className="font-semibold mt-2">4. Data Storage</h4>
            <ul className="list-disc pl-5 space-y-1">
              <li>Personal data is stored locally on your device.</li>
              <li>No cloud storage is provided.</li>
              <li>Anonymized data is stored securely on our servers.</li>
            </ul>

            <h4 className="font-semibold mt-2">5. Data Sales</h4>
            <p>
              We may sell anonymized and aggregated data for workplace research purposes.
              This data cannot identify you.
            </p>

            <h4 className="font-semibold mt-2">6. Cookies and Required Technologies</h4>
            <ul className="list-disc pl-5 space-y-1">
              <li>Maintain session security.</li>
              <li>Store preferences.</li>
              <li>Support essential app operations.</li>
            </ul>
            <p>These technologies are required for the app to function and cannot be disabled.</p>

            <h4 className="font-semibold mt-2">7. Consent</h4>
            <p>
              Use of the App requires full acceptance of this Privacy Policy, the Terms and Conditions,
              and the Cookie Policy. If you do not consent, do not use the App.
            </p>
          </section>

          {/* COOKIES */}
          <section id="cookies">
            <h3 className="text-xl font-bold mt-8 mb-2">Cookie Policy</h3>
            <h4 className="font-semibold mt-2">Purpose</h4>
            <p>Maintain session security, store preferences, and operate core features.</p>
            <h4 className="font-semibold mt-2">No Tracking</h4>
            <p>We do not collect personally identifiable data via cookies.</p>
            <h4 className="font-semibold mt-2">Mandatory</h4>
            <p>Disabling cookies will prevent the app from functioning.</p>
          </section>
        </div>

        {/* Footer */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-t px-5 py-3">
          <span className="text-xs text-gray-500">Version {appVersion}</span>
          <div className="flex items-center gap-4">
            <button
              onClick={handleContactSupport}
              className="text-primary font-semibold"
            >
              Contact Support
            </button>
            <button
              className="text-primary font-semibold"
              onClick={handleRateApp}
            >
              Rate the App
            </button>
            <button onClick={onClose} className="text-red-600 font-semibold">
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}