import React from "react";

export default function AppHeader() {
  return (
    <header
      className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/75
                 h-[var(--app-header-height)] flex items-center px-4"
      /* Remove any bottom borders or pseudo elements that created a white strip */
    >
      <div className="w-full flex items-center justify-between">
        <div className="text-xl font-semibold tracking-tight text-orange-500">ClearCase</div>
        {/* Right side actions remain as they are, or keep empty */}
      </div>
    </header>
  );
}
