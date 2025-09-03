import { useState, useEffect } from "react";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import ScrollToTop from "@/components/ScrollToTop";
import { ConsentModal } from "@/components/ConsentModal";
import { consentStorage } from "@/utils/consentStorage";
import Home from "./pages/Home";
import AddIncident from "./pages/AddIncident";
import Settings from "./pages/Settings";
import IncidentsPage from "./pages/Incidents";
import NotFound from "./pages/NotFound";
import { IncidentRedirect } from "./components/IncidentRedirect";
import { useToastStore } from "@/lib/showToast";
import ScreenPrivacyOverlay from "@/components/common/ScreenPrivacyOverlay";
import RateAppModal from "@/components/feedback/RateAppModal";
import {
  registerRateModalController,
  shouldShowRatePrompt,
  triggerRatePromptNow,
  bumpSessionCounter,
} from "@/lib/rateApp";
import BottomNav from "@/components/BottomNav";
import { useStatusBar } from "@/hooks/useStatusBar";
import { applyPrivacyFromStorage, initPrivacyScreen } from "@/lib/privacyScreen";
import "@/styles/sensitive.css";

const queryClient = new QueryClient();

const App = () => {
  const [hasConsent, setHasConsent] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [rateModalOpen, setRateModalOpen] = useState(false);
  const { node } = useToastStore();

  // Configure status bar for iOS or Android
  useStatusBar();

  // Initialize privacy screen system
  useEffect(() => {
    const initPrivacy = async () => {
      await applyPrivacyFromStorage();
      await initPrivacyScreen();
    };
    initPrivacy();
  }, []);

  // Check consent once on load
  useEffect(() => {
    const hasValidConsent = consentStorage.hasValidConsent();
    setHasConsent(hasValidConsent);
    setIsLoading(false);
  }, []);

  // Register rate modal controller and bump session counter
  useEffect(() => {
    registerRateModalController({ open: () => setRateModalOpen(true) });
    bumpSessionCounter();
  }, []);

  // Show rate prompt if conditions are met
  useEffect(() => {
    if (!hasConsent) return;
    const checkDelay = setTimeout(() => {
      if (shouldShowRatePrompt({ minSessions: 3, minDaysSinceLast: 7 })) {
        const id = setTimeout(() => triggerRatePromptNow(), 2000);
        return () => clearTimeout(id);
      }
    }, 100);
    return () => clearTimeout(checkDelay);
  }, [hasConsent]);

  const handleConsentGiven = () => setHasConsent(true);

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
        <Toaster richColors position="bottom-center" closeButton />
        {node}
        <ScreenPrivacyOverlay />
        <RateAppModal open={rateModalOpen} onClose={() => setRateModalOpen(false)} />
        <BrowserRouter>
          <ScrollToTop />
          <Routes>
            <Route path="/" element={<Home />} />
            {/* Support both /add and /incidents/new for Add Incident */}
            <Route path="/add" element={<AddIncident />} />
            <Route path="/incidents/new" element={<AddIncident />} />
            {/* Incidents list page */}
            <Route path="/incidents" element={<IncidentsPage />} />
            {/* Settings */}
            <Route path="/settings" element={<Settings />} />
            {/* Legacy resources path redirects into Settings resources anchor */}
            <Route path="/resources" element={<Navigate to="/settings#resources" replace />} />
            {/* Legacy incident routes redirect to the new modal logic */}
            <Route path="/incident/:id" element={<IncidentRedirect />} />
            <Route path="/incident/:id/edit" element={<IncidentRedirect />} />
            {/* Catch all */}
            <Route path="*" element={<NotFound />} />
          </Routes>
          <BottomNav />
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
