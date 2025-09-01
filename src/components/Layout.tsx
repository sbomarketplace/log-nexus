import { ReactNode, useEffect } from 'react';
import { Footer } from './Footer';
import AppHeader from './common/AppHeader';
import { Capacitor } from '@capacitor/core';
import { StatusBar, Style } from '@capacitor/status-bar';
import '../styles/safe-area.css';

interface LayoutProps {
  children: ReactNode;
}

export const Layout = ({ children }: LayoutProps) => {
  // Configure status bar for iOS safe areas
  useEffect(() => {
    if (Capacitor.getPlatform() === "ios") {
      // Allow us to manage safe area space with CSS
      StatusBar.setOverlaysWebView({ overlay: true }).catch(() => {});
      // Dark text for light headers
      StatusBar.setStyle({ style: Style.Dark }).catch(() => {});
    }
  }, []);

  return (
    <div id="app-shell" className="bg-background">
      <AppHeader />

      <main className="app-content">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {children}
        </div>
      </main>

      <Footer />
    </div>
  );
};