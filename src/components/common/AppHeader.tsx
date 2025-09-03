// src/components/common/AppHeader.tsx
import React from "react";

export default function AppHeader() {
  return (
    <header
      className="app-header sticky top-0 z-40 h-14 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80"
      data-sticky-header
      role="banner"
    >
      <div className="mx-auto h-full max-w-7xl px-4 sm:px-6 lg:px-8 grid grid-cols-[1fr_auto_1fr] items-center">
        {/* left slot (for future actions) */}
        <div className="justify-self-start" />

        {/* centered logo + title */}
        <div className="justify-self-center flex items-center gap-2 select-none">
          <picture>
            <source srcSet="/logo.svg" type="image/svg+xml" />
            <img
              src="/logo.png"
              alt="ClearCase logo"
              className="h-[20px] w-auto"
              decoding="async"
              loading="eager"
            />
          </picture>
          <span className="text-base font-semibold leading-none">ClearCase</span>
        </div>

        {/* right slot (for future actions) */}
        <div className="justify-self-end" />
      </div>
    </header>
  );
}