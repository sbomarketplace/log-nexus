import React from "react";

export default function AppHeader() {
  return (
    <header
      className="fixed top-0 left-0 right-0 z-50 bg-background h-[56px] flex items-center px-4"
      /* No border or divider. No after pseudo element. No shadow that renders outside. */
    >
      <div className="w-full flex items-center justify-between">
        <div className="text-xl font-semibold tracking-tight">ClearCase</div>
        {/* Right side actions stay as is or add controls here */}
      </div>
    </header>
  );
}