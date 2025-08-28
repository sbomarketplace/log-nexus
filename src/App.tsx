import { useState, useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import ScrollToTop from "@/components/ScrollToTop";
import { ConsentModal } from "@/components/ConsentModal";
import { consentStorage } from "@/utils/consentStorage";
import { initIAP } from "@/lib/iap";
import Home from "./pages/Home";
import AddIncident from "./pages/AddIncident";
import Resources from "./pages/Resources";
import Settings from "./pages/Settings";
import NotFound from "./pages/NotFound";
import { IncidentRedirect } from "./components/IncidentRedirect";
import { useToastStore } from "@/lib/showToast";
import ScreenPrivacyOverlay from "@/components/common/ScreenPrivacyOverlay";
import RateAppModal from "@/components/feedback/RateAppModal";
import { registerRateModalController, shouldShowRatePrompt, triggerRatePromptNow, bumpSessionCounter } from "@/lib/rateApp";
import BottomNav from "@/components/BottomNav";
import "@/styles/sensitive.css";

const queryClient = new QueryClient();

const App = () => {
  const [hasConsent, setHasConsent] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [rateModalOpen, setRateModalOpen] = useState(false);
  const { node } = useToastStore();

  useEffect(() => {
    // Check if user has given consent
    const hasValidConsent = consentStorage.hasValidConsent();
    setHasConsent(hasValidConsent);
    setIsLoading(false);
    
    // Initialize IAP on app start
    initIAP().catch(console.error);
  }, []);

  // Register rate modal controller and bump session counter
  useEffect(() => {
    registerRateModalController({ open: () => setRateModalOpen(true) });
    bumpSessionCounter();
  }, []);

  // Show rate prompt after a delay if conditions are met
  useEffect(() => {
    if (hasConsent) {
      // Small delay to ensure session counter has been updated
      const checkDelay = setTimeout(() => {
        if (shouldShowRatePrompt({ minSessions: 3, minDaysSinceLast: 7 })) {
          const id = setTimeout(() => triggerRatePromptNow(), 2000);
          return () => clearTimeout(id);
        }
      }, 100);
      return () => clearTimeout(checkDelay);
    }
  }, [hasConsent]);

  const handleConsentGiven = () => {
    setHasConsent(true);
  };

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-xl font-semibold mb-2">ClearCase</h1>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!hasConsent) {
    return <ConsentModal onConsentGiven={handleConsentGiven} />;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        {node}
        <ScreenPrivacyOverlay />
        <RateAppModal open={rateModalOpen} onClose={() => setRateModalOpen(false)} />
        <BrowserRouter>
          <ScrollToTop />
          <div id="app-scroll">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/add" element={<AddIncident />} />
              {/* Main combined page */}
              <Route path="/settings" element={<Settings />} />
              {/* Legacy resources link - redirect into the resources anchor */}
              <Route path="/resources" element={<Navigate to="/settings#resources" replace />} />
              {/* Legacy route redirects */}
              <Route path="/incident/:id" element={<IncidentRedirect />} />
              <Route path="/incident/:id/edit" element={<IncidentRedirect />} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </div>
          <BottomNav />
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
