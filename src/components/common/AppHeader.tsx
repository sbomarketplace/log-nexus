import React from "react";

const AppHeader: React.FC = () => {
  return (
    <header
      data-sticky-header
      className="app-header sticky top-0 z-40 border-b bg-background/80 backdrop-blur"
      style={{ height: "56px" }}
    >
      <div className="mx-auto max-w-7xl h-full grid grid-cols-[1fr_auto_1fr] items-center px-4">
        <div />
        <div className="flex items-center gap-2 justify-center">
          <img
            src="/logo.png"
            onError={(e) => {
              const img = e.currentTarget as HTMLImageElement;
              if (!img.dataset.fallback) {
                img.dataset.fallback = "1";
                img.src = "/logo.svg";
              }
            }}
            alt="ClearCase"
            className="h-[20px] w-auto"
            decoding="async"
            loading="eager"
          />
          <span className="text-[17px] font-semibold">ClearCase</span>
        </div>
        <div />
      </div>
    </header>
  );
};

export default AppHeader;