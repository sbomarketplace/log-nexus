// src/components/Layout.tsx
import React from "react";
import AppHeader from "./common/AppHeader";
import BottomNav from "./BottomNav";
import IosPreviewToggle from "@/dev/IosPreviewToggle";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background text-foreground relative">
      <IosPreviewToggle />
      {/* The preview-shell width styles only apply when body[data-ios-preview=true] */}
      <div className="preview-shell mx-auto">
        <AppHeader />
        <main className="app-main">
          <div className="page">{children}</div>
        </main>
        <BottomNav />
      </div>
    </div>
  );
}