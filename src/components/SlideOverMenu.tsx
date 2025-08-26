import React, { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";

type Props = {
  open: boolean;
  onClose: () => void;
  anchorRef?: React.RefObject<HTMLElement>;   // hamburger button
};

const LINKS = [
  { label: "Home", to: "/", icon: "home", tid: "nav-home" },
  { label: "Add Incident", to: "/add", icon: "add", tid: "nav-add" },
  { label: "Settings & Resources", to: "/settings", icon: "gear", tid: "nav-settings-resources" },
] as const;

function Icon({ name }: { name: typeof LINKS[number]["icon"] }) {
  const common = { stroke: "currentColor", strokeWidth: 2, fill: "none", strokeLinecap: "round", strokeLinejoin: "round" } as any;
  switch (name) {
    case "home":
      return <svg width="20" height="20" viewBox="0 0 24 24" {...common}><path d="M3 10.5 12 3l9 7.5" /><path d="M5 10v10h14V10" /></svg>;
    case "add":
      return <svg width="20" height="20" viewBox="0 0 24 24" {...common}><circle cx="12" cy="12" r="9" /><path d="M12 8v8M8 12h8" /></svg>;
    case "gear":
      return <svg width="20" height="20" viewBox="0 0 24 24" {...common}><path d="M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z" /><path d="M19.4 15a1 1 0 0 0 .2 1.1l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1 1 0 0 0-1.1-.2 7.6 7.6 0 0 1-1.8.7 1 1 0 0 0-.8 1v.2a2 2 0 1 1-4 0V20a1 1 0 0 0-.8-1 7.6 7.6 0 0 1-1.8-.7 1 1 0 0 0-1.1.2l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1 1 0 0 0 .2-1.1 7.6 7.6 0 0 1-.7-1.8 1 1 0 0 0-1-.8H3a2 2 0 1 1 0-4h.2a1 1 0 0 0 1-.8 7.6 7.6 0 0 1 .7-1.8 1 1 0 0 0-.2-1.1l-.1-.1A2 2 0 1 1 5.6 3.2l.1.1a1 1 0 0 0 1.1.2 7.6 7.6 0 0 1 1.8-.7 1 1 0 0 0 .8-1V1a2 2 0 1 1 4 0v.2a1 1 0 0 0 .8 1 7.6 7.6 0 0 1 1.8.7 1 1 0 0 0 1.1-.2l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1 1 0 0 0-.2 1.1 7.6 7.6 0 0 1 .7 1.8 1 1 0 0 0 1 .8H23a2 2 0 1 1 0 4h-.2a1 1 0 0 0-1 .8 7.6 7.6 0 0 1-.7 1.8Z" /></svg>;
    default:
      return null;
  }
}

export default function SlideOverMenu({ open, onClose, anchorRef }: Props) {
  const navigate = useNavigate();
  const firstRef = useRef<HTMLButtonElement | null>(null);
  const panelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const t = setTimeout(() => firstRef.current?.focus(), 0);
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
      clearTimeout(t);
    };
  }, [open, onClose]);

  // Handle outside clicks - close menu when clicking anywhere except the hamburger button or menu panel
  useEffect(() => {
    if (!open) return;

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      
      // Don't close if clicking on the hamburger button (let it handle the toggle)
      if (anchorRef?.current && anchorRef.current.contains(target)) {
        return;
      }
      
      // Don't close if clicking within the slide-over panel
      if (panelRef.current && panelRef.current.contains(target)) {
        return;
      }
      
      // Close the menu for any other outside click
      onClose();
    };

    // Use capture phase to ensure we catch the event before other handlers
    document.addEventListener('mousedown', handleClickOutside, true);
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside, true);
    };
  }, [open, onClose, anchorRef]);

  if (!open) return null;

  const go = (to: string) => {
    navigate(to);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[1000]" aria-modal="true" role="dialog" aria-label="Main menu">
      {/* dimmed backdrop that starts below the header so the header remains visible */}
      <div
        className="absolute left-0 right-0 bottom-0 top-[var(--header-h,56px)] bg-black/30"
        aria-hidden="true"
      />
      {/* slide-over panel */}
      <div
        ref={panelRef}
        className="
          absolute right-0 top-[var(--header-h,56px)]
          h-[calc(100dvh-var(--header-h,56px))]
          w-[84%] max-w-[380px]
          translate-x-0
          rounded-l-2xl border-l border-border bg-card shadow-2xl
          px-3 pt-4
          transition-transform duration-200 ease-out
          overflow-y-auto
          flex flex-col
        "
        style={{
          WebkitOverflowScrolling: "touch",
          paddingBottom: "var(--menu-footer-offset)",
        }}
      >
        <div className="mb-2 px-1">
          <h2 className="text-lg font-semibold">Menu</h2>
        </div>
        <nav className="flex flex-col gap-2">
          {LINKS.map((item, idx) => (
            <button
              key={item.to}
              ref={idx === 0 ? firstRef : undefined}
              data-testid={item.tid}
              onClick={() => go(item.to)}
              className="
                group flex w-full items-center gap-3 rounded-xl
                border bg-background px-4 py-3
                text-[16px] font-medium
                hover:bg-muted active:bg-muted/80
                focus:outline-none focus:ring-2 focus:ring-ring
              "
            >
              <span className="shrink-0 text-muted-foreground group-hover:text-foreground">
                <Icon name={item.icon} />
              </span>
              <span>{item.label}</span>
            </button>
          ))}
        </nav>
        {/* Spacer so footer hugs the bottom while links stay top aligned */}
        <div className="flex-1" />
        {/* Footer sits above the ad banner and safe-area because of panel padding */}
        <div
          className="mt-4 text-center text-xs text-muted-foreground select-none"
          style={{ 
            marginBottom: "var(--menu-footer-gap)",
            paddingBottom: "60px"
          }}
        >
          (C) SBO Marketplace LLC 2025
        </div>
      </div>
    </div>
  );
}