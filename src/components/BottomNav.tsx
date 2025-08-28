import React, { useEffect, useRef } from "react";
import { Link, useLocation } from "react-router-dom";
import { Home, Plus, Settings } from "lucide-react";

type Tab = {
  to: string;
  aria: string;
  icon: (active: boolean) => JSX.Element;
  tid: string;
};

const IconHome = (active: boolean) => (
  <Home size={24} className={active ? "text-orange-600" : "text-muted-foreground"} />
);
const IconPlus = (active: boolean) => (
  <Plus size={24} className={active ? "text-orange-600" : "text-muted-foreground"} />
);
const IconGear = (active: boolean) => (
  <Settings size={24} className={active ? "text-orange-600" : "text-muted-foreground"} />
);

const TABS: Tab[] = [
  { to: "/", aria: "Home", icon: IconHome, tid: "tab-home" },
  { to: "/add", aria: "Add Incident", icon: IconPlus, tid: "tab-add" },
  { to: "/settings", aria: "Settings & Resources", icon: IconGear, tid: "tab-settings" },
];

// Compact base height for the bar (excluding the safe-area filler)
const BASE_H = 56; // px

export default function TabBar() {
  const { pathname } = useLocation();
  const rootRef = useRef<HTMLElement | null>(null);

  // Publish the base height so content padding matches the bar
  useEffect(() => {
    const r = document.documentElement;
    r.style.setProperty("--tabbar-h", `${BASE_H}px`);
    return () => {
      // don’t leave stale values around on hot reloads
      r.style.setProperty("--tabbar-h", `${BASE_H}px`);
    };
  }, []);

  const isActive = (to: string) => (to === "/" ? pathname === "/" : pathname.startsWith(to));

  return (
    <nav
      ref={rootRef}
      aria-label="Primary"
      className="
        fixed inset-x-0 bottom-0 z-[950]
        bg-background/95 backdrop-blur border-t border-border
        pointer-events-auto
      "
      // Height = bar (BASE_H) + safe area; content gap is handled in App.tsx
      style={{ height: `calc(${BASE_H}px + env(safe-area-inset-bottom, 0px))` }}
    >
      {/* The bar itself (BASE_H tall). Safe-area filler is added below. */}
      <div
        data-role="bar"
        className="mx-auto max-w-screen-md h-14 flex items-stretch justify-around px-2"
        // h-14 = 56px (tailwind); matches BASE_H
      >
        {TABS.map((tab) => {
          const active = isActive(tab.to);
          return (
            <Link
              key={tab.to}
              to={tab.to}
              data-testid={tab.tid}
              aria-label={tab.aria}
              className="
                relative flex flex-1 items-center justify-center
                mx-1 rounded-lg focus:outline-none focus-visible:ring
                transition-colors
              "
            >
              {tab.icon(active)}
              {/* thin active indicator line */}
              <span
                aria-hidden="true"
                className={`absolute top-0 h-0.5 w-8 rounded-full transition-opacity ${
                  active ? "bg-orange-600 opacity-100" : "opacity-0"
                }`}
              />
              {/* keep an accessible text label for screen readers */}
              <span className="sr-only">{tab.aria}</span>
            </Link>
          );
        })}
      </div>

      {/* Safe-area filler so taps don’t collide with the home indicator */}
      <div style={{ height: "env(safe-area-inset-bottom, 0px)" }} />
    </nav>
  );
}
