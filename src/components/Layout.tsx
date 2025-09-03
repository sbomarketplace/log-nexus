// src/components/Layout.tsx
import React from "react";
import BottomNav from "@/components/BottomNav";

type Props = { children: React.ReactNode };

/**
 * App shell that:
 * - keeps a sticky, centered header
 * - gives the main content enough bottom padding so it never sits under the fixed BottomNav
 * - constrains content to a comfortable max width
 */
export const Layout: React.FC<Props> = ({ children }) => {
  return (
    <div className="min-h-svh bg-background">
      {/* Sticky header with perfectly centered brand */}
      <header
        data-sticky-header
        className="sticky top-0 z-50 border-b bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80"
      >
        <div className="mx-auto max-w-2xl h-14 px-4">
          <div className="grid h-full w-full grid-cols-[1fr_auto_1fr] items-center">
            {/* Left slot (optional actions) */}
            <div className="justify-self-start min-w-0 flex items-center gap-2" />

            {/* Centered logo + title */}
            <div className="justify-self-center pointer-events-none">
              <div className="flex items-center gap-2">
                {/* inline fallback logo */}
                <svg viewBox="0 0 24 24" className="h-6 w-6" aria-hidden>
                  <path d="M4 7h16v10a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V7z" fill="none" stroke="currentColor" />
                  <path d="M9 3h6l1 4H8l1-4z" fill="none" stroke="currentColor" />
                </svg>
                <span className="text-base font-semibold">ClearCase</span>
              </div>
            </div>

            {/* Right slot (optional actions) */}
            <div className="justify-self-end min-w-0 flex items-center gap-2" />
          </div>
        </div>
      </header>

      {/* Page content. Bottom padding keeps it above the fixed BottomNav */}
      <main className="mx-auto max-w-2xl px-4 pt-4 pb-[calc(72px+env(safe-area-inset-bottom))]">
        {children}
      </main>

      {/* Single, global bottom nav */}
      <BottomNav />
    </div>
  );
};

export default Layout;
