import * as React from "react";

export default function ScreenPrivacyOverlay() {
  const [hidden, setHidden] = React.useState(document.visibilityState !== "visible");

  React.useEffect(() => {
    const onVis = () => setHidden(document.visibilityState !== "visible");
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, []);

  if (!hidden) return null;
  if (!document.documentElement.classList.contains("cc-sensitive-previews")) return null;

  return (
    <div className="fixed inset-0 z-[60] pointer-events-none bg-white/70 backdrop-blur-md" />
  );
}