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
  let host = document.getElementById("toast-root");
  if (!host) {
    host = document.createElement("div");
    host.id = "toast-root";
    host.className = "toast-portal";
    document.body.appendChild(host);
  }
  const node = document.createElement("div");
  node.className = "toast-card";
  host.appendChild(node);
  
  const { show, hide } = useToastStore.getState();
  show(React.createElement(Toast, { 
    type: "success", 
    title, 
    description, 
    onClose: () => {
      hide();
      node.remove();
    }
  }));
}

export function showErrorToast(title = "An error occurred", description?: string) {
  let host = document.getElementById("toast-root");
  if (!host) {
    host = document.createElement("div");
    host.id = "toast-root";
    host.className = "toast-portal";
    document.body.appendChild(host);
  }
  const node = document.createElement("div");
  node.className = "toast-card";
  host.appendChild(node);
  
  const { show, hide } = useToastStore.getState();
  show(React.createElement(Toast, { 
    type: "error", 
    title, 
    description, 
    onClose: () => {
      hide();
      node.remove();
    }
  }));
}

export function showInfoToast(title: string, description?: string) {
  let host = document.getElementById("toast-root");
  if (!host) {
    host = document.createElement("div");
    host.id = "toast-root";
    host.className = "toast-portal";
    document.body.appendChild(host);
  }
  const node = document.createElement("div");
  node.className = "toast-card";
  host.appendChild(node);
  
  const { show, hide } = useToastStore.getState();
  show(React.createElement(Toast, { 
    type: "info", 
    title, 
    description, 
    onClose: () => {
      hide();
      node.remove();
    }
  }));
}