import React, { useEffect, useState } from 'react';
import { CheckCircle, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SuccessToastProps {
  message: string;
  type?: 'success' | 'error' | 'info';
  onClose?: () => void;
  durationMs?: number;
}

export const SuccessToast: React.FC<SuccessToastProps> = ({
  message,
  type = 'success',
  onClose,
  durationMs = 2500
}) => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(() => onClose?.(), 150); // Allow fade out animation
    }, durationMs);

    return () => clearTimeout(timer);
  }, [durationMs, onClose]);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(() => onClose?.(), 150);
  };

  if (!isVisible) return null;

  const colors = {
    success: "bg-emerald-50 text-emerald-900 ring-emerald-400/30 border-emerald-200",
    error: "bg-red-50 text-red-900 ring-red-400/30 border-red-200", 
    info: "bg-slate-50 text-slate-900 ring-slate-400/30 border-slate-200"
  };

  return (
    <div
      className={cn(
        "fixed inset-x-0 top-3 z-[1000] pointer-events-none px-3 sm:px-4 md:px-6 lg:px-8",
        "transition-all duration-300 ease-in-out",
        isVisible ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-2"
      )}
      style={{
        paddingLeft: "max(env(safe-area-inset-left), 12px)",
        paddingRight: "max(env(safe-area-inset-right), 12px)",
      }}
      role="status"
      aria-live="polite"
    >
      <div
        className={cn(
          "pointer-events-auto w-full rounded-2xl shadow-lg border ring-1 px-4 py-3",
          "flex items-start gap-3",
          colors[type]
        )}
      >
        <CheckCircle className="h-5 w-5 shrink-0 mt-0.5" aria-hidden />
        <div className="flex-1 font-medium leading-snug text-sm">{message}</div>
        <button
          type="button"
          onClick={handleClose}
          aria-label="Close notification"
          className="ml-2 inline-flex items-center justify-center rounded-md opacity-80 hover:opacity-100 transition-opacity"
        >
          <X className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
};

// Simple toast manager for programmatic usage
let toastContainer: HTMLDivElement | null = null;
let currentToastRoot: any = null;

export const showToast = (props: Omit<SuccessToastProps, 'onClose'>) => {
  // Clean up existing toast
  if (currentToastRoot && toastContainer) {
    currentToastRoot.unmount();
    document.body.removeChild(toastContainer);
  }

  // Create new container
  toastContainer = document.createElement('div');
  toastContainer.id = 'toast-container';
  document.body.appendChild(toastContainer);

  const cleanup = () => {
    if (currentToastRoot && toastContainer) {
      setTimeout(() => {
        if (toastContainer && document.body.contains(toastContainer)) {
          currentToastRoot.unmount();
          document.body.removeChild(toastContainer);
        }
        currentToastRoot = null;
        toastContainer = null;
      }, 200);
    }
  };

  // Use dynamic import for React DOM to avoid SSR issues
  import('react-dom/client').then((ReactDOM) => {
    if (!toastContainer) return;
    
    currentToastRoot = ReactDOM.createRoot(toastContainer);
    currentToastRoot.render(
      React.createElement(SuccessToast, {
        ...props,
        onClose: cleanup
      })
    );
  });
};