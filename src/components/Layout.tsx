import { ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { HomeIcon, PlusIcon, FileIcon, SettingsIcon, AlertIcon } from './icons/CustomIcons';
import { Footer } from './Footer';

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
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <AlertIcon className="text-primary-foreground" size={20} />
              </div>
              <div className="flex flex-col">
                <h1 className="text-lg font-bold text-foreground">ClearCase</h1>
                <p className="text-sm text-muted-foreground leading-none">Workplace Incident Manager</p>
              </div>
            </div>
            
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

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-32 md:pb-8">
        {children}
      </main>

      {/* Mobile navigation */}
      <div className="md:hidden fixed bottom-8 left-0 right-0 bg-card border-t border-border z-40">
        <div className="flex justify-around py-2">
          {navItems.map(({ path, icon: Icon, label }) => (
            <Link
              key={path}
              to={path}
              className={`flex flex-col items-center px-3 py-2 rounded-md text-xs transition-colors ${
                location.pathname === path
                  ? 'text-primary'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Icon size={20} />
              <span className="mt-1">{label}</span>
            </Link>
          ))}
        </div>
      </div>

      <Footer />
    </div>
  );
};