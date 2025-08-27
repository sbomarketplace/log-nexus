import React from "react";
import { Link, useLocation } from "react-router-dom";

type Tab = { label: string; to: string; icon: (active: boolean) => JSX.Element; tid: string; aria: string };

const IconHome = (active: boolean) => (
  <svg width="24" height="24" viewBox="0 0 24 24" aria-hidden="true"
       className={active ? "text-orange-600" : "text-muted-foreground"}>
    <path d="M3 10.5 12 3l9 7.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    <path d="M5 10v10h14V10" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
  </svg>
);

const IconPlus = (active: boolean) => (
  <svg width="24" height="24" viewBox="0 0 24 24" aria-hidden="true"
       className={active ? "text-orange-600" : "text-muted-foreground"}>
    <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeWidth="2" />
    <path d="M12 8v8M8 12h8" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

const IconGear = (active: boolean) => (
  <svg width="24" height="24" viewBox="0 0 24 24" aria-hidden="true"
       className={active ? "text-orange-600" : "text-muted-foreground"}>
    <path d="M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z" fill="none" stroke="currentColor" strokeWidth="2"/>
    <path d="M19.4 15a1 1 0 0 0 .2 1.1l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1 1 0 0 0-1.1-.2 7.6 7.6 0 0 1-1.8.7 1 1 0 0 0-.8 1V21a2 2 0 1 1-4 0v-.2a1 1 0 0 0-.8-1 7.6 7.6 0 0 1-1.8-.7 1 1 0 0 0-1.1.2l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1 1 0 0 0 .2-1.1 7.6 7.6 0 0 1-.7-1.8 1 1 0 0 0-1-.8H3a2 2 0 1 1 0-4h.2a1 1 0 0 0 1-.8 7.6 7.6 0 0 1 .7-1.8 1 1 0 0 0-.2-1.1l-.1-.1A2 2 0 1 1 5.6 3.2l.1.1a1 1 0 0 0 1.1.2 7.6 7.6 0 0 1 1.8-.7 1 1 0 0 0 .8-1V1a2 2 0 1 1 4 0v.2a1 1 0 0 0 .8 1 7.6 7.6 0 0 1 1.8.7 1 1 0 0 0 1.1-.2l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1 1 0 0 0-.2 1.1 7.6 7.6 0 0 1 .7 1.8Z" fill="none" stroke="currentColor" strokeWidth="2"/>
  </svg>
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