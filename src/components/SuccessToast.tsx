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

  return (
    <div
      className={cn(
        "fixed top-4 left-1/2 transform -translate-x-1/2 z-50",
        "flex items-center gap-3 px-4 py-3 rounded-2xl shadow-md",
        "transition-all duration-300 ease-in-out",
        isVisible ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-2",
        type === 'success' && "bg-green-50 text-green-800 border border-green-200",
        type === 'error' && "bg-red-50 text-red-800 border border-red-200",
        type === 'info' && "bg-blue-50 text-blue-800 border border-blue-200"
      )}
      role="status"
      aria-live="polite"
    >
      <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0" />
      <span className="text-sm font-medium">{message}</span>
      <button
        onClick={handleClose}
        className="ml-2 text-gray-400 hover:text-gray-600 transition-colors"
        aria-label="Close notification"
      >
        <X className="h-4 w-4" />
      </button>
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