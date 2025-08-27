import { useState, useEffect } from 'react';
import { initIAP, purchase, restore, getProducts } from '@/lib/iap';
import { addPack, setSubscription } from '@/lib/credits';
import PaywallModal from './PaywallModal';

type Plan = "PACK_5" | "PACK_60" | "UNLIMITED";

interface PaywallWrapperProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PaywallWrapper = ({ isOpen, onClose }: PaywallWrapperProps) => {
  // AI paywall is disabled - return null
  return null;
};