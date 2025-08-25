import React, { useEffect, useRef } from "react";

type Plan = "PACK_5" | "PACK_60" | "UNLIMITED";

export default function PaywallModal({
  open,
  onClose,
  onSelect,
}: {
  open: boolean;
  onClose?: () => void;                 // optional (we might disallow dismiss)
  onSelect: (plan: Plan) => void;       // wiring to IAP handler elsewhere
}) {
  const firstBtnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const prev = document.activeElement as HTMLElement | null;
    firstBtnRef.current?.focus();
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape" && onClose) onClose(); };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => { document.removeEventListener("keydown", onKey); document.body.style.overflow = ""; prev?.focus?.(); };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div id="cc-paywall" className="cc-paywall" role="dialog" aria-modal="true" aria-label="AI Reports Paywall">
      <div className="cc-paywall__scrim" />
      <section className="cc-paywall__sheet">
        <header className="cc-paywall__header">
          <p className="cc-paywall__lead">
            You've used your 3 free AI reports. Manual logging is always free.
          </p>
          <p className="cc-paywall__sub">
            Choose a plan to continue using AI-powered incident reports:
          </p>
        </header>

        <div className="cc-paywall__plans">
          <button
            ref={firstBtnRef}
            className="cc-paywall__plan"
            onClick={() => onSelect("PACK_5")}
          >
            <span className="cc-paywall__plan-title">Get 5 AI reports</span>
            <span className="cc-paywall__price">$1.99</span>
            <span className="cc-paywall__hint">Perfect for occasional use</span>
          </button>

          <button
            className="cc-paywall__plan"
            onClick={() => onSelect("PACK_60")}
          >
            <span className="cc-paywall__plan-title">Get 60 AI reports</span>
            <span className="cc-paywall__price">$19.99</span>
            <span className="cc-paywall__hint">Best value for regular users</span>
          </button>

          <button
            className="cc-paywall__plan cc-paywall__plan--primary"
            onClick={() => onSelect("UNLIMITED")}
          >
            <span className="cc-paywall__plan-title">Go Unlimited</span>
            <span className="cc-paywall__price">$99/mo</span>
            <span className="cc-paywall__hint">Unlimited AI reports for power users</span>
          </button>
        </div>

        <footer className="cc-paywall__footer">
          <button className="cc-paywall__link" onClick={() => window.dispatchEvent(new CustomEvent("restore-purchases"))}>
            Restore Purchases
          </button>
          {onClose && (
            <button className="cc-paywall__link" onClick={onClose} aria-label="Close paywall">Close</button>
          )}
        </footer>
      </section>
    </div>
  );
}