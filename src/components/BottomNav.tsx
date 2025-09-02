import { NavLink } from "react-router-dom";
import { Home, PlusCircle, ListChecks, Settings } from "lucide-react";

const items = [
  { to: "/", label: "Home", icon: Home },
  { to: "/add", label: "Add", icon: PlusCircle },
  { to: "/incidents", label: "Incidents", icon: ListChecks },
  { to: "/settings", label: "Settings", icon: Settings },
];

export default function BottomNav() {
  return (
    <nav className="app-footer border-t">
      <ul className="mx-auto grid w-full max-w-screen-md grid-cols-4">
        {items.map(({ to, label, icon: Icon }) => (
          <li key={to} className="flex">
            <NavLink
              to={to}
              className={({ isActive }) =>
                [
                  "flex h-[56px] grow flex-col items-center justify-center gap-1",
                  "text-xs",
                  isActive ? "text-primary" : "text-muted-foreground",
                ].join(" ")
              }
            >
              <Icon className="h-5 w-5" />
              <span>{label}</span>
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}