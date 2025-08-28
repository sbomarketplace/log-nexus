import { ReactNode } from 'react';
import { Footer } from './Footer';
import AppHeader from './common/AppHeader';

interface LayoutProps {
  children: ReactNode;
}

export const Layout = ({ children }: LayoutProps) => {
  return (
    <div className="min-h-[100dvh] flex flex-col bg-background">
      <AppHeader />

      <main className="app-main">
        {children}
      </main>

      <Footer />
    </div>
  );
};