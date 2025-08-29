import React from "react";
import { Link, useLocation } from "react-router-dom";
import { Home, Plus, Settings } from "lucide-react";

type Tab = { label: string; to: string; icon: (active: boolean) => JSX.Element; tid: string; aria: string };

const IconHome = (active: boolean) => (
  <Home 
    size={24} 
    className={active ? "text-orange-600" : "text-muted-foreground"}
  />
);

const IconPlus = (active: boolean) => (
  <Plus 
    size={24} 
    className={active ? "text-orange-600" : "text-muted-foreground"}
  />
);

const IconGear = (active: boolean) => (
  <Settings 
    size={24} 
    className={active ? "text-orange-600" : "text-muted-foreground"}
  />
);

const TABS: Tab[] = [
  { label: "Home",      to: "/",         icon: IconHome, tid: "tab-home",      aria: "Home" },
  { label: "Add",       to: "/add",      icon: IconPlus, tid: "tab-add",       aria: "Add Incident" },
  { label: "Settings",  to: "/settings", icon: IconGear, tid: "tab-settings",  aria: "Settings & Resources" },
];

export default function BottomNav() {
  const { pathname } = useLocation();
  const isActive = (to: string) => (to === "/" ? pathname === "/" : pathname.startsWith(to));

  return (
    <nav
      className="
        fixed inset-x-0 bottom-0 z-[950]
        border-t border-border bg-background/95 backdrop-blur
      "
      style={{ height: `calc(var(--nav-h) + var(--safe-bottom))` }}
      aria-label="Primary"
    >
      <div className="mx-auto flex h-[var(--nav-h)] max-w-screen-md items-stretch justify-around px-2">
        {TABS.map((t) => {
          const active = isActive(t.to);
          return (
            <Link
              key={t.to}
              to={t.to}
              data-testid={t.tid}
              aria-label={t.aria}
              className="
                relative flex flex-1 items-center justify-center
                focus:outline-none focus:ring rounded-lg mx-1
              "
            >
              {t.icon(active)}
              {/* subtle active indicator line (optional but nice) */}
              <span
                aria-hidden="true"
                className={`absolute top-0 h-0.5 w-8 rounded-full transition-opacity ${active ? "bg-orange-600 opacity-100" : "opacity-0"}`}
              />
              {/* screen-reader only label to keep accessibility with icon-only UI */}
              <span className="sr-only">{t.label}</span>
            </Link>
          );
        })}
      </div>
      {/* safe-area filler so taps don't collide with the home indicator */}
      <div style={{ height: "var(--safe-bottom)" }} />
    </nav>
  );
}