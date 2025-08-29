import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import ScrollToTop from '@/components/ScrollToTop';
import Home from '@/pages/Home';
import AddIncident from '@/pages/AddIncident';
import Settings from '@/pages/Settings';
import NotFound from '@/pages/NotFound';
import { IncidentRedirect } from '@/components/IncidentRedirect';
import AppHeader from '@/components/common/AppHeader';
import BottomNav from '@/components/BottomNav';

interface AppShellProps {
  children?: React.ReactNode;
}

export const AppShell: React.FC<AppShellProps> = ({ children }) => {
  return (
    <BrowserRouter>
      <div className="app-shell">
        {/* Fixed Header */}
        <header className="app-header">
          <AppHeader />
        </header>

        {/* Scrollable Content */}
        <main className="app-scroll">
          <ScrollToTop />
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

        {/* Fixed Footer */}
        <footer className="app-footer">
          <BottomNav />
        </footer>
      </div>

      {/* Modal Portal */}
      <div id="modal-root" className="modal-layer" />
      
      {/* Additional content (modals, toasts, etc.) */}
      {children}
    </BrowserRouter>
  );
};