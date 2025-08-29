import { Link, useLocation } from "react-router-dom";
import { Home, Plus, Settings } from "lucide-react";

interface Tab {
  label: string;
  to: string;
  icon: React.ComponentType<{ isActive: boolean }>;
  tid: string;
  aria: string;
}

const IconHome = ({ isActive }: { isActive: boolean }) => (
  <Home className={`w-5 h-5 ${isActive ? "text-primary" : "text-muted-foreground"}`} />
);

const IconPlus = ({ isActive }: { isActive: boolean }) => (
  <Plus className={`w-5 h-5 ${isActive ? "text-primary" : "text-muted-foreground"}`} />
);

const IconGear = ({ isActive }: { isActive: boolean }) => (
  <Settings className={`w-5 h-5 ${isActive ? "text-primary" : "text-muted-foreground"}`} />
);

const TABS: Tab[] = [
  {
    label: "Home",
    to: "/",
    icon: IconHome,
    tid: "home",
    aria: "Navigate to Home"
  },
  {
    label: "Add",
    to: "/add",
    icon: IconPlus,
    tid: "add",
    aria: "Add new incident"
  },
  {
    label: "Settings",
    to: "/settings",
    icon: IconGear,
    tid: "settings",
    aria: "Navigate to Settings"
  }
];

export default function TabBar() {
  const location = useLocation();
  
  const isActive = (tab: Tab): boolean => {
    if (tab.to === "/") {
      return location.pathname === "/";
    }
    return location.pathname.startsWith(tab.to);
  };

  return (
    <nav className="h-[56px] w-full bg-background/95 backdrop-blur border-t border-border">
      <div className="h-full flex items-center justify-around px-4">
        {TABS.map((tab) => {
          const active = isActive(tab);
          return (
            <Link
              key={tab.tid}
              to={tab.to}
              className="flex flex-col items-center justify-center gap-1 p-2 rounded-lg transition-colors hover:bg-accent/50"
              aria-label={tab.aria}
            >
              <tab.icon isActive={active} />
              <span className="sr-only">{tab.label}</span>
              {active && (
                <div className="w-1 h-1 rounded-full bg-primary" />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}