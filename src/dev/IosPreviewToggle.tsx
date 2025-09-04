import React, { useEffect, useState } from "react";

function isNative() {
  return typeof window !== "undefined" && (window as any).Capacitor?.isNativePlatform?.() === true;
}

export default function IosPreviewToggle() {
  const [on, setOn] = useState(() => {
    if (typeof localStorage === "undefined") return false;
    return localStorage.getItem("iosPreview:on") === "1";
  });

  useEffect(() => {
    if (isNative()) return; // never show in native app
    document.body.dataset.iosPreview = on ? "true" : "false";
    if (typeof localStorage !== "undefined") {
      localStorage.setItem("iosPreview:on", on ? "1" : "0");
    }
  }, [on]);

  if (isNative()) return null;

  return (
    <button
      aria-label="Toggle iOS Preview"
      onClick={() => setOn(v => !v)}
      className="fixed bottom-4 right-4 z-[100] rounded-full px-3 py-2 text-xs font-medium shadow bg-black/80 text-white"
    >
      {on ? "iOS Preview: On" : "iOS Preview: Off"}
    </button>
  );
}