// src/components/Layout.tsx
import { ReactNode, useEffect } from "react";
import AppHeader from "./common/AppHeader";
import { Capacitor } from "@capacitor/core";
import { StatusBar, Style } from "@capacitor/status-bar";

interface LayoutProps { children: ReactNode }

export const Layout = ({ children }: LayoutProps) => {
  useEffect(() => {
    if (Capacitor.getPlatform() === "ios") {
      StatusBar.setOverlaysWebView({ overlay: true }).catch(() => {});
      StatusBar.setStyle({ style: Style.Dark }).catch(() => {});
    }
  }, []);

  return (
    <div className="app-shell bg-background">
      <AppHeader />
      <main className="app-content">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-0 pb-8">
          {children}
        </div>
      </main>
    </div>
  );
};

export default Layout;