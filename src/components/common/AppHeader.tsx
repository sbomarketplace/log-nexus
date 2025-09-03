import React from "react";

const AppHeader: React.FC = () => {
  return (
    <header className="app-header bg-background border-b h-[56px] sticky top-0 z-40">
      <div className="h-full grid place-items-center">
        <div className="flex items-center gap-2">
          <img
            src="/logo.png"
            onError={(e) => { (e.currentTarget as HTMLImageElement).src = "/logo.svg"; }}
            alt="ClearCase logo"
            className="h-6 w-6 rounded"
            draggable={false}
          />
          <span className="text-[15px] font-semibold tracking-tight">ClearCase</span>
        </div>
      </div>
    </header>
  );
};

export default AppHeader;
