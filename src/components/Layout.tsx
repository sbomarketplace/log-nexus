import { ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { HomeIcon, PlusIcon, FileIcon, SettingsIcon } from './icons/CustomIcons';
import { Footer } from './Footer';
import { BrandLogo } from './BrandLogo';

interface LayoutProps {
  children: ReactNode;
}

export const Layout = ({ children }: LayoutProps) => {
  const location = useLocation();

  const navItems = [
    { path: '/', icon: HomeIcon, label: 'Home' },
    { path: '/add', icon: PlusIcon, label: 'Add Incident' },
    { path: '/resources', icon: FileIcon, label: 'Resources' },
    { path: '/settings', icon: SettingsIcon, label: 'Settings' },
  ];

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 bg-card border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo and Brand Text */}
            <Link to="/" aria-label="Go to Home" className="flex items-center gap-2 flex-shrink-0">
              <img 
                src="/lovable-uploads/581b2158-980b-43c9-89b0-e73fc6de832d.png" 
                alt="ClearCase Logo" 
                className="h-8 w-auto"
              />
              <span className="text-xl font-semibold tracking-tight text-foreground">
                ClearCase
              </span>
            </Link>
            
            {/* Spacer for mobile layout */}
            <div className="flex-1 md:hidden"></div>
            
            <nav className="hidden md:flex space-x-8">
              {navItems.map(({ path, icon: Icon, label }) => (
                <Link
                  key={path}
                  to={path}
                  className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    location.pathname === path
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                  }`}
                >
                  <Icon size={18} />
                  <span>{label}</span>
                </Link>
              ))}
            </nav>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-4 md:pb-8">
        {children}
      </main>

      {/* Mobile navigation */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-sm border-t border-border/50 z-40 rounded-t-lg shadow-lg">
        <div className="flex justify-around items-center px-4 py-3">
          {navItems.map(({ path, icon: Icon, label }) => (
            <Link
              key={path}
              to={path}
              className={`flex flex-col items-center justify-center min-h-[44px] px-2 transition-colors ${
                location.pathname === path
                  ? 'text-primary'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Icon size={24} className="flex-shrink-0" />
              <span className="text-xs font-medium mt-1.5 leading-none text-center">
                {label}
              </span>
              {/* Active indicator dot */}
              {location.pathname === path && (
                <div className="w-1 h-1 bg-primary rounded-full mt-1.5"></div>
              )}
            </Link>
          ))}
        </div>
      </div>

      <Footer />
    </div>
  );
};