export default function SafeAreaDebug() {
  // Only show in development mode
  if (process.env.NODE_ENV === 'production') {
    return null;
  }

  return (
    <div className="fixed inset-0 pointer-events-none z-[9999]">
      {/* Top safe area */}
      <div 
        className="absolute top-0 left-0 right-0 bg-red-500/20 border-b border-red-500/50"
        style={{ height: 'env(safe-area-inset-top)' }}
      />
      
      {/* Bottom safe area */}
      <div 
        className="absolute bottom-0 left-0 right-0 bg-red-500/20 border-t border-red-500/50"
        style={{ height: 'env(safe-area-inset-bottom)' }}
      />
      
      {/* Left safe area */}
      <div 
        className="absolute top-0 bottom-0 left-0 bg-red-500/20 border-r border-red-500/50"
        style={{ width: 'env(safe-area-inset-left)' }}
      />
      
      {/* Right safe area */}
      <div 
        className="absolute top-0 bottom-0 right-0 bg-red-500/20 border-l border-red-500/50"
        style={{ width: 'env(safe-area-inset-right)' }}
      />
    </div>
  );
}