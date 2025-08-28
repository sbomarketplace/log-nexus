export default function SafeAreaDebug() {
  if (import.meta.env.VITE_DEBUG_SAFE_AREAS !== "true") return null;
  return <div className="safe-area-debug" />;
}