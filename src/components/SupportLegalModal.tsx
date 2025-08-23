import React, { useState, useEffect } from "react";
import { X } from "lucide-react";

// Dynamic imports for markdown files
const docs = import.meta.glob("../content/legal/**/*.md", { as: "raw" });

type Tab = "terms" | "privacy" | "cookies";

interface SupportLegalModalProps {
  onClose: () => void;
}

// Simple markdown to HTML converter for basic formatting
const parseMarkdown = (md: string): string => {
  return md
    // Headers
    .replace(/^# (.*$)/gim, '<h1>$1</h1>')
    .replace(/^## (.*$)/gim, '<h2>$1</h2>')
    .replace(/^### (.*$)/gim, '<h3>$1</h3>')
    // Bold text
    .replace(/\*\*(.*)\*\*/gim, '<strong>$1</strong>')
    // Line breaks
    .replace(/\n\n/gim, '</p><p>')
    // Wrap in paragraphs
    .replace(/^(.*)$/gim, '<p>$1</p>')
    // Clean up empty paragraphs
    .replace(/<p><\/p>/gim, '')
    // Handle headers that got wrapped in p tags
    .replace(/<p><h([1-6])>(.*)<\/h([1-6])><\/p>/gim, '<h$1>$2</h$1>')
    // Lists
    .replace(/^- (.*$)/gim, '<li>$1</li>')
    .replace(/(<li>.*<\/li>)/gims, '<ul>$1</ul>');
};

export default function SupportLegalModal({ onClose }: SupportLegalModalProps) {
  const [tab, setTab] = useState<Tab>("terms");
  const [md, setMd] = useState<string>("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadContent = async () => {
      setLoading(true);
      try {
        const path =
          tab === "terms"   ? "../content/legal/terms.md" :
          tab === "privacy" ? "../content/legal/privacy.md" :
                              "../content/legal/cookies.md";
        
        const loader = docs[path] as (() => Promise<string>);
        if (loader) {
          const content = await loader();
          setMd(content);
        } else {
          setMd("Content not found.");
        }
      } catch (error) {
        console.error("Error loading content:", error);
        setMd("Error loading content.");
      } finally {
        setLoading(false);
      }
    };

    loadContent();
  }, [tab]);

  const mail = "SBOMarkteplace@gmail.com";
  const appVersion = import.meta.env.VITE_APP_VERSION || "1.0.0";

  const handleContactSupport = () => {
    const subject = encodeURIComponent("ClearCase Support");
    const mailtoUrl = `mailto:${mail}?subject=${subject}`;
    window.location.href = mailtoUrl;
  };

  const handleRateApp = () => {
    if ((window as any).__NATIVE__?.rateApp) {
      (window as any).__NATIVE__.rateApp();
    } else {
      // Fallback to App Store
      window.open("https://apps.apple.com/account/subscriptions", "_blank");
    }
  };

  // Handle backdrop click
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div 
      className="cc-float-modal" 
      role="dialog" 
      aria-modal="true" 
      aria-label="Support and Legal"
      onClick={handleBackdropClick}
    >
      <div className="panel">
        <header>
          <h2 className="text-[18px] font-semibold">Support & Legal</h2>
          <button 
            aria-label="Close" 
            onClick={onClose}
            className="h-8 w-8 flex items-center justify-center rounded-full hover:bg-gray-100"
          >
            <X className="h-4 w-4" />
          </button>
        </header>

        <nav className="tabs">
          <button 
            className="cc-tab" 
            aria-selected={tab === "terms"} 
            onClick={() => setTab("terms")}
          >
            Terms
          </button>
          <button 
            className="cc-tab" 
            aria-selected={tab === "privacy"} 
            onClick={() => setTab("privacy")}
          >
            Privacy
          </button>
          <button 
            className="cc-tab" 
            aria-selected={tab === "cookies"} 
            onClick={() => setTab("cookies")}
          >
            Cookies
          </button>
        </nav>

        <div className="body">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-gray-500">Loading...</div>
            </div>
          ) : (
            <article 
              dangerouslySetInnerHTML={{ 
                __html: parseMarkdown(md)
              }} 
            />
          )}
        </div>

        <div className="footer">
          <div className="version">
            Version <span id="app-version">{appVersion}</span>
          </div>
          <div className="footer-actions">
            <button onClick={handleContactSupport}>
              Contact Support
            </button>
            <button onClick={handleRateApp}>
              Rate the App
            </button>
            <button onClick={onClose}>
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}