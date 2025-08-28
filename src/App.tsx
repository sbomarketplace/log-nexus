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
import Settings from "./pages/Settings";
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
import Header from "@/components/Header";
import TabBar from "@/components/TabBar";
import SafeAreaDebug from "@/dev/SafeAreaDebug";
import "@/styles/sensitive.css";

const queryClient = new QueryClient();

const App = () => {
  const [hasConsent, setHasConsent] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [rateModalOpen, setRateModalOpen] = useState(false);
  const { node } = useToastStore();

  useEffect(() => {
    const hasValidConsent = consentStorage.hasValidConsent();
    setHasConsent(hasValidConsent);
    setIsLoading(false);
    initIAP().catch(console.error);
  }, []);

  useEffect(() => {
    registerRateModalController({ open: () => setRateModalOpen(true) });
    bumpSessionCounter();
  }, []);

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
        <Toaster />
        <Sonner />
        {node}
        {/* toast portal root */}
        <div id="toast-root" className="toast-portal" />
        <ScreenPrivacyOverlay />
        <SafeAreaDebug />
        <RateAppModal open={rateModalOpen} onClose={() => setRateModalOpen(false)} />

        <BrowserRouter>
          {/* Fixed header */}
          <Header />

          {/* Ensure route changes scroll to top inside our dedicated container */}
          <ScrollToTop />

          {/* Single dedicated scroll container.
              We’ll finalize the CSS in the global stylesheet next. */}
          <main
            id="app-scroll"
            className="app-scroll"
            style={{
              // lock the viewport height and scroll only this container
              height: "100dvh",
              overflowY: "auto",
              WebkitOverflowScrolling: "touch",
              overscrollBehaviorY: "contain",

              // respect sticky bars and safe area (CSS vars finalized in global CSS)
              paddingTop: "var(--header-h,56px)",
              paddingBottom:
                "calc(var(--tabbar-h,64px) + env(safe-area-inset-bottom,0px) + 8px)",
            }}
          >
            <div className="page-container">
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/add" element={<AddIncident />} />
                <Route path="/settings" element={<Settings />} />
                <Route path="/resources" element={<Navigate to="/settings#resources" replace />} />
                <Route path="/incident/:id" element={<IncidentRedirect />} />
                <Route path="/incident/:id/edit" element={<IncidentRedirect />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </div>
          </main>

          {/* Fixed bottom tab bar */}
          <TabBar />
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
