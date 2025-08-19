import React from "react";
import { create } from "zustand";
import { Toast } from "@/components/Toast";

type ToastState = { 
  node: React.ReactNode | null; 
  show: (n: React.ReactNode) => void; 
  hide: () => void; 
};

export const useToastStore = create<ToastState>(set => ({ 
  node: null, 
  show: node => set({ node }), 
  hide: () => set({ node: null }) 
}));

export function showSuccessToast(title = "Incident updated successfully", description?: string) {
  const { show, hide } = useToastStore.getState();
  show(React.createElement(Toast, { 
    type: "success", 
    title, 
    description, 
    onClose: hide 
  }));
}

export function showErrorToast(title = "An error occurred", description?: string) {
  const { show, hide } = useToastStore.getState();
  show(React.createElement(Toast, { 
    type: "error", 
    title, 
    description, 
    onClose: hide 
  }));
}

export function showInfoToast(title: string, description?: string) {
  const { show, hide } = useToastStore.getState();
  show(React.createElement(Toast, { 
    type: "info", 
    title, 
    description, 
    onClose: hide 
  }));
}