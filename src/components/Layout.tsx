// src/components/Layout.tsx
import React, { ReactNode, useEffect } from "react";
import { Capacitor } from "@capacitor/core";
import { StatusBar, Style } from "@capacitor/status-bar";
import { Footer } from "./Footer";

interface LayoutProps {
  children: ReactNode;
}

/**
 * App shell with centered brand header (logo + title),
 * scrollable content area, and fixed bottom Footer (BottomNav).
 */
export const Layout = ({ children }: LayoutProps) => {
  // iOS status bar: allow CSS safe-areas + dark text on light header
  useEffect(() => {
    if (Capacitor.getPlatform() === "ios") {
      StatusBar.setOverlaysWebView({ overlay: true }).catch(() => {});
      StatusBar.setStyle({ style: Style.Dark }).catch(() => {});
    }
  }, []);

  return (
    <div className="min-h-svh bg-background">
      {/* Sticky, centered header */}
      <header
        data-sticky-header
        className="sticky top-0 z-50 border-b bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80"
        role="banner"
      >
        <div className="mx-auto max-w-2xl h-14 px-4">
          <div className="grid h-full w-full grid-cols-[1fr_auto_1fr] items-center">
            <div /> {/* left slot (keeps center truly centered) */}
            <div className="justify-self-center pointer-events-none">
              <div className="flex items-center gap-2">
                {/* Brand logo: put your file in /public as /logo.svg or /logo.png */}
                <picture className="h-5 w-5">
                  <source srcSet="/logo.svg" type="image/svg+xml" />
                  <img
                    src="/logo.png"
                    onError={(e) => {
                      // last-resort fallback if your logo path is different
                      (e.currentTarget as HTMLImageElement).src = "/icon.png";
                    }}
                    alt="ClearCase logo"
                    className="h-5 w-5 object-contain"
                  />
                </picture>
                <span className="text-[17px] font-semibold tracking-tight">
                  ClearCase
                </span>
              </div>
            </div>
            <div /> {/* right slot */}
          </div>
        </div>
      </header>

      {/* Scrollable content.
         pb uses your bottom-bar height var if present, else 72px,
         plus iOS safe-area inset. */}
      <main
        role="main"
        className="mx-auto max-w-2xl px-4 pt-4 pb-[calc(var(--cc-bottom-bar-h,72px)+env(safe-area-inset-bottom))]"
      >
        {children}
      </main>

      {/* Footer renders the BottomNav */}
      <Footer />
    </div>
  );
};

export default Layout;
