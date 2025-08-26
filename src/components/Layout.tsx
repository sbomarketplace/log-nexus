import { ReactNode } from 'react';
import { Footer } from './Footer';
import AppHeader from './common/AppHeader';
import BottomAdBar from './ads/BottomAdBar';
import { isRemoveAdsActive } from '@/lib/iap';

interface LayoutProps {
  children: ReactNode;
}

export const Layout = ({ children }: LayoutProps) => {
  const showAds = !isRemoveAdsActive();

  return (
    <div className="min-h-[100dvh] flex flex-col bg-background">
      <AppHeader />

      <main id="app-scroll" className="cc-page flex-1 pt-[56px]">
        <div 
          className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 ${
            showAds 
              ? 'pb-[calc(1rem+50px+env(safe-area-inset-bottom)+8px)]' 
              : 'pb-[calc(1rem+env(safe-area-inset-bottom))]'
          }`}
        >
          {children}
        </div>
      </main>

      <BottomAdBar />
      <Footer />
    </div>
  );
};