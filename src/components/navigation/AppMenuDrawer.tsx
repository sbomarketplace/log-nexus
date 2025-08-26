import { useNavigate, useLocation } from 'react-router-dom';
import { X, Home, PlusSquare, FileText, Settings, Crown, RotateCcw } from 'lucide-react';
import { isRemoveAdsActive, purchaseRemoveAds, restorePurchases, toast } from '@/lib/iap';
import React, { useMemo } from 'react';

export default function AppMenuDrawer({
  open, 
  onClose,
}: { 
  open: boolean; 
  onClose: () => void; 
}) {
  const nav = useNavigate();
  const loc = useLocation();
  const active = isRemoveAdsActive(); // boolean (sync getter or from store)

  const items = useMemo(() => ([
    { icon: <Home className="h-5 w-5" />, label: 'Home', to: '/' },
    { icon: <PlusSquare className="h-5 w-5" />, label: 'Add Incident', to: '/add' },
    { icon: <FileText className="h-5 w-5" />, label: 'Resources', to: '/resources' },
    { icon: <Settings className="h-5 w-5" />, label: 'Settings', to: '/settings' },
  ]), []);

  function go(to: string) {
    if (loc.pathname !== to) nav(to);
    onClose();
    // Ensure pages start at top
    requestAnimationFrame(() => window.scrollTo({ top: 0, behavior: 'instant' as any }));
  }

  async function buyRemoveAds() {
    const { ok, error } = await purchaseRemoveAds();
    if (ok) {
      toast('Ads removed on this device');
      onClose();
    } else if (error && error !== 'cancelled') {
      toast(`Purchase failed: ${error}`);
    }
  }

  async function handleRestore() {
    try {
      await restorePurchases();
      toast('Purchases restored');
    } catch (e: any) {
      toast(`Restore failed: ${e?.message || e}`);
    }
  }

  if (!open) return null;
  
  return (
    <div className="fixed inset-0 z-[100] bg-black/50" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="fixed top-0 right-0 h-full max-w-sm w-[min(92vw,360px)] bg-card border-l shadow-lg overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <h2 className="text-[17px] font-semibold">Menu</h2>
          <button 
            aria-label="Close" 
            onClick={onClose} 
            className="h-8 w-8 grid place-items-center rounded-lg hover:bg-muted/40"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="py-2">
          {items.map(it => (
            <button
              key={it.to}
              onClick={() => go(it.to)}
              className={`w-full text-left px-4 py-3 flex items-center gap-3 hover:bg-muted/40 ${
                loc.pathname === it.to ? 'bg-muted text-primary font-medium' : ''
              }`}
              aria-current={loc.pathname === it.to ? 'page' : undefined}
            >
              {it.icon}
              <span className="text-[16px]">{it.label}</span>
            </button>
          ))}
        </nav>

        <div className="px-4 pt-2 pb-3 border-t grid gap-2">
          {!active ? (
            <button
              onClick={buyRemoveAds}
              className="w-full px-4 py-3 rounded-xl bg-primary text-primary-foreground font-semibold flex items-center justify-center gap-2"
            >
              <Crown className="h-5 w-5" />
              Remove Ads — $4.99/mo
            </button>
          ) : (
            <div className="text-center text-[14px] text-success font-medium">Ads removed (active)</div>
          )}
          <button
            onClick={handleRestore}
            className="w-full px-4 py-3 rounded-xl border flex items-center justify-center gap-2 hover:bg-muted/40"
          >
            <RotateCcw className="h-5 w-5" />
            Restore Purchases
          </button>
        </div>
      </div>
    </div>
  );
}