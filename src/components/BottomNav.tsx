// src/components/BottomNav.tsx
import React from "react";
import { NavLink } from "react-router-dom";
import { Home, PlusCircle, ClipboardList, Settings2 } from "lucide-react";
import { cn } from "@/lib/utils";

type Item = { to: string; label: string; Icon: React.ComponentType<any>; end?: boolean };

const ITEMS: Item[] = [
  { to: "/", label: "Home", Icon: Home, end: true },           // end=true so ONLY "/" activates Home
  { to: "/add", label: "Add", Icon: PlusCircle },
  { to: "/incidents", label: "Incidents", Icon: ClipboardList },
  { to: "/settings", label: "Settings", Icon: Settings2 },
];

export default function BottomNav() {
  return (
    <nav
      className={cn(
        "fixed inset-x-0 bottom-0 z-50 border-t",
        "bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80"
      )}
      role="navigation"
      aria-label="Primary"
    >
      <div className="mx-auto max-w-2xl">
        <ul className="grid grid-cols-4">
          {ITEMS.map(({ to, label, Icon, end }) => (
            <li key={to} className="flex justify-center">
              <NavLink
                to={to}
                end={Boolean(end)}
                className={({ isActive }) =>
                  cn(
                    "flex h-[64px] w-full flex-col items-center justify-center gap-1",
                    "text-sm font-medium transition-colors",
                    isActive ? "text-orange-500" : "text-muted-foreground"
                  )
                }
                aria-label={label}
              >
                {({ isActive }) => (
                  <>
                    <Icon
                      className={cn(
                        "h-6 w-6",
                        isActive ? "stroke-orange-500" : "stroke-current"
                      )}
                    />
                    <span className="text-base leading-none">{label}</span>
                  </>
                )}
              </NavLink>
            </li>
          ))}
        </ul>

        {/* safe area padding for iPhone home indicator */}
        <div className="h-[env(safe-area-inset-bottom)]" />
      </div>
    </nav>
  );
}
