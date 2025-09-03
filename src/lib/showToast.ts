import React from "react";
import { create } from "zustand";
import { toast } from "sonner";
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
  toast.success(title, {
    description,
    duration: 2500,
    closeButton: true
  });
}

export function showErrorToast(title = "An error occurred", description?: string) {
  toast.error(title, {
    description,
    duration: 3500,
    closeButton: true
  });
}

export function showInfoToast(title: string, description?: string) {
  toast.info(title, {
    description,
    closeButton: true
  });
}