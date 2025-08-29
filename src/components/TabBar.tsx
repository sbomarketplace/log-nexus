import { Link, useLocation } from 'react-router-dom';
import { Home, Plus, Settings } from 'lucide-react';

const tabs = [
  { label: 'Home', to: '/', icon: Home },
  { label: 'Add', to: '/add', icon: Plus },
  { label: 'Settings', to: '/settings', icon: Settings },
];

export default function TabBar() {
  const location = useLocation();
  
  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  return (
    <nav className="h-full w-full border-t border-border bg-background/95 flex items-center justify-around">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const active = isActive(tab.to);
        
        return (
          <Link
            key={tab.to}
            to={tab.to}
            className="flex flex-col items-center justify-center h-full flex-1 relative group"
          >
            <Icon 
              className={`h-5 w-5 transition-colors ${
                active ? 'text-primary' : 'text-muted-foreground'
              }`} 
            />
            <span className="sr-only">{tab.label}</span>
            {active && (
              <div className="absolute top-0 inset-x-2 h-0.5 bg-primary rounded-full" />
            )}
          </Link>
        );
      })}
    </nav>
  );
}