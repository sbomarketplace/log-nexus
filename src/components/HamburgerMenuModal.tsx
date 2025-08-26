import React, { useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";

type Props = {
  open: boolean;
  onClose: () => void;
};

const MENU: Array<{ label: string; to: string; testId: string }> = [
  { label: "Home", to: "/", testId: "menu-home" },
  { label: "Add Incident", to: "/add", testId: "menu-add" },
  { label: "Resources", to: "/resources", testId: "menu-resources" },
  { label: "Settings", to: "/settings", testId: "menu-settings" },
];

export default function HamburgerMenuModal({ open, onClose }: Props) {
  const navigate = useNavigate();
  const location = useLocation();
  const firstBtnRef = useRef<HTMLButtonElement | null>(null);

  // Lock body scroll while open
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    // focus first actionable item for accessibility
    const t = setTimeout(() => firstBtnRef.current?.focus(), 0);

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
      clearTimeout(t);
    };
  }, [open, onClose]);

  // Auto close on route change
  useEffect(() => {
    if (!open) return;
    onClose();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);

  if (!open) return null;

  const go = (to: string) => {
    navigate(to);
  };

  return (
    <div
      className="fixed inset-0 z-[1000]"
      role="dialog"
      aria-modal="true"
      aria-label="Main menu"
    >
      {/* Backdrop */}
      <button
        aria-label="Close menu"
        data-testid="menu-backdrop"
        onClick={onClose}
        className="absolute inset-0 bg-black/40"
      />
      {/* Card - single layer with rounded edges */}
      <div
        className="
          pointer-events-auto
          absolute left-1/2 -translate-x-1/2
          w-[92%] max-w-[520px]
          mt-[calc(var(--header-height,56px)+12px)]
          mb-[calc(env(safe-area-inset-bottom,0px)+12px)]
          rounded-2xl bg-card shadow-2xl ring-1 ring-border/20
        "
        style={{
          WebkitOverflowScrolling: "touch",
        }}
      >
        <div className="px-4 pt-[env(safe-area-inset-top,0px)] pb-2">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Menu</h2>
            <button
              onClick={onClose}
              className="rounded-lg px-2 py-1 text-sm text-muted-foreground hover:bg-muted focus:outline-none focus:ring"
            >
              Close
            </button>
          </div>
        </div>
        <nav className="px-2 pb-3 drawer-content">
          <ul className="space-y-2">
            {MENU.map((item, idx) => (
              <li key={item.to}>
                <button
                  ref={idx === 0 ? firstBtnRef : undefined}
                  data-testid={item.testId}
                  onClick={() => go(item.to)}
                  className="
                    w-full text-left rounded-xl border
                    bg-background px-4 py-3
                    font-medium
                    hover:bg-muted active:bg-muted/80
                    focus:outline-none focus:ring
                  "
                >
                  {item.label}
                </button>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </div>
  );
}