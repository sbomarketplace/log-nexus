import React, { useEffect, useRef } from "react";

type Plan = "PACK_5" | "PACK_60" | "UNLIMITED";

interface Product {
  id: string;
  title: string;
  priceString: string;
  type: 'consumable' | 'subscription';
}

export default function PaywallModal() {
  // Deprecated: AI bundles removed
  return null;
}