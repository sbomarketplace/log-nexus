import { useState, useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ConsentModal } from "@/components/ConsentModal";
import { consentStorage } from "@/utils/consentStorage";
import Home from "./pages/Home";
import AddIncident from "./pages/AddIncident";
import Resources from "./pages/Resources";
import Settings from "./pages/Settings";
import NotFound from "./pages/NotFound";
import { IncidentRedirect } from "./components/IncidentRedirect";

const queryClient = new QueryClient();

const App = () => {
  const [hasConsent, setHasConsent] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if user has given consent
    const hasValidConsent = consentStorage.hasValidConsent();
    setHasConsent(hasValidConsent);
    setIsLoading(false);
  }, []);

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
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/add" element={<AddIncident />} />
            <Route path="/resources" element={<Resources />} />
            <Route path="/settings" element={<Settings />} />
            {/* Legacy route redirects */}
            <Route path="/incident/:id" element={<IncidentRedirect />} />
            <Route path="/incident/:id/edit" element={<IncidentRedirect />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
