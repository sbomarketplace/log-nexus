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

      <main className="page-container">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {children}
        </div>
      </main>

      <Footer />
    </div>
  );
};