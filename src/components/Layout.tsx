import React from "react";
import AppHeader from "./common/AppHeader";
import BottomNav from "./BottomNav";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background text-foreground relative">
      <AppHeader />
      <main className="app-main">
        {children}
      </main>
      <BottomNav />
    </div>
  );
}