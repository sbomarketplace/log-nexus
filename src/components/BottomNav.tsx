// src/components/BottomNav.tsx
import React from "react";
import { NavLink } from "react-router-dom";
import { Home, PlusCircle, ClipboardList, Settings2 } from "lucide-react";
import { cn } from "@/lib/utils";

type Item = { to: string; label: string; Icon: React.ComponentType<any>; exact?: boolean };

const items: Item[] = [
  { to: "/", label: "Home", Icon: Home, exact: true },        // `end` match so only "/" activates this
  { to: "/add", label: "Add", Icon: PlusCircle },
  { to: "/incidents", label: "Incidents", Icon: ClipboardList },
  { to: "/settings", label: "Settings", Icon: Settings2 },
];

export default function BottomNav() {
  return (
    <nav className="app-footer safe-bottom sticky bottom-0 z-40 border-t bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80">
      <ul className="mx-auto grid max-w-2xl grid-cols-4 items-center gap-x-2 px-4 py-2">
        {items.map(({ to, label, Icon, exact }) => (
          <li key={to} className="flex justify-center">
            <NavLink
              to={to}
              end={Boolean(exact)}
              className={({ isActive }) =>
                cn(
                  "flex w-full flex-col items-center justify-center gap-1 py-1.5",
                  "text-sm font-medium transition-colors",
                  isActive ? "text-orange-500" : "text-muted-foreground"
                )
              }
              aria-label={label}
            >
              {({ isActive }) => (
                <>
                  <Icon className={cn("h-6 w-6", isActive ? "stroke-orange-500" : "stroke-current")} />
                  <span className="text-base">{label}</span>
                </>
              )}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}
