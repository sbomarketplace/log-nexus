import { useEffect } from "react";
import { Link } from "react-router-dom";

const BASE_H = 56; // px (matches Tailwind h-14)

export default function Header() {
  // Publish header height so pages can pad-top correctly
  useEffect(() => {
    const r = document.documentElement;
    r.style.setProperty("--header-h", `calc(${BASE_H}px + env(safe-area-inset-top, 0px))`);
    return () => {
      r.style.setProperty("--header-h", `calc(${BASE_H}px + env(safe-area-inset-top, 0px))`);
    };
  }, []);

  return (
    <header
      className="
        fixed inset-x-0 top-0 z-[950]
        bg-background/95 backdrop-blur border-b border-border
      "
      // Total header block = toolbar (BASE_H) + safe-area inset
      style={{ height: `calc(${BASE_H}px + env(safe-area-inset-top, 0px))` }}
      aria-label="App header"
    >
      {/* Safe-area filler for notches */}
      <div style={{ height: "env(safe-area-inset-top, 0px)" }} />

      {/* Toolbar row (exactly BASE_H tall) */}
      <div className="h-14 px-4 flex items-center justify-between">
        {/* Left: brand */}
        <Link to="/" className="flex items-center gap-2">
          <img
            src="/lovable-uploads/581b2158-980b-43c9-89b0-e73fc6de832d.png"
            alt="ClearCase Logo"
            className="h-6 w-6"
          />
          <span className="font-semibold text-[17px]">ClearCase</span>
        </Link>

        {/* Right: (reserved) */}
        <span />
      </div>
    </header>
  );
}
