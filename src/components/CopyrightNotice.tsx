import React from "react";

/**
 * Shows a small copyright line at the bottom of a page.
 * Adds safe-area padding so it doesn't sit under the bottom nav.
 */
export default function CopyrightNotice() {
  const year = new Date().getFullYear();
  return (
    <div className="mt-8 border-t pt-4 pb-[calc(env(safe-area-inset-bottom,0)+72px)] text-center text-sm text-muted-foreground">
      © SBO Marketplace {year}
    </div>
  );
}