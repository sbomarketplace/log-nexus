import React from "react";
import { NavLink } from "react-router-dom";
import { Home, PlusCircle, ClipboardList, Settings2 } from "lucide-react";
import { cn } from "@/lib/utils";

type Item = {
  to: string;
  label: string;
  Icon: React.ComponentType<any>;
  end?: boolean;
};

const ITEMS: Item[] = [
  { to: "/", label: "Home", Icon: Home, end: true }, // end=true so only "/" activates Home
  { to: "/add", label: "Add", Icon: PlusCircle },
  { to: "/incidents", label: "Incidents", Icon: ClipboardList },
  { to: "/settings", label: "Settings", Icon: Settings2 },
];

export default function BottomNav() {
  return (
    <nav
      role="navigation"
      aria-label="Primary"
      className="fixed bottom-0 inset-x-0 h-[64px] bg-card border-t z-40"
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
                    // shorter bar + tighter layout
                    "flex h-14 w-full flex-col items-center justify-center gap-0.5",
                    // small label, same font family + weight as header title
                    "text-xs font-semibold tracking-tight",
                    isActive ? "text-orange-500" : "text-muted-foreground"
                  )
                }
                aria-label={label}
              >
                {({ isActive }) => (
                  <>
                    {/* small icon to match small text */}
                    <Icon
                      className={cn(
                        "h-4 w-4",
                        isActive ? "stroke-orange-500" : "stroke-current"
                      )}
                    />
                    <span className="leading-none">{label}</span>
                  </>
                )}
              </NavLink>
            </li>
          ))}
        </ul>
        {/* iPhone home-indicator safe area */}
        <div className="h-[env(safe-area-inset-bottom)]" />
      </div>
    </nav>
  );
}