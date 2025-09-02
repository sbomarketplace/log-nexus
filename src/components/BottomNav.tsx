import { NavLink } from "react-router-dom";
import { Home, PlusCircle, ClipboardList, Settings } from "lucide-react";

export default function BottomNav() {
  const items = [
    { to: "/", label: "Home", Icon: Home },
    { to: "/incidents/new", label: "Add", Icon: PlusCircle },
    { to: "/incidents", label: "Incidents", Icon: ClipboardList },
    { to: "/settings", label: "Settings", Icon: Settings },
  ];

  return (
    <nav className="app-footer">
      <ul className="mx-auto grid w-full max-w-screen-md grid-cols-4">
        {items.map(({ to, label, Icon }) => (
          <li key={to} className="flex">
            <NavLink
              to={to}
              className={({ isActive }) =>
                [
                  "flex h-[56px] grow flex-col items-center justify-center gap-1",
                  "text-xs transition-colors",
                  isActive ? "text-primary" : "text-muted-foreground",
                ].join(" ")
              }
            >
              <Icon className="h-5 w-5" aria-hidden="true" />
              <span>{label}</span>
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}
