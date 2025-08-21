interface BrandLogoProps {
  className?: string;
  showText?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export function BrandLogo({ 
  className = "", 
  showText = true, 
  size = 'md' 
}: BrandLogoProps) {
  const sizeClasses = {
    sm: 'h-6',
    md: 'h-8', 
    lg: 'h-12'
  };

  const textSizeClasses = {
    sm: 'text-lg',
    md: 'text-xl',
    lg: 'text-2xl'
  };

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <img
        src="/brand/clearcase-mark.png?v=3"
        alt="ClearCase"
        className={`${sizeClasses[size]} w-auto select-none relative z-10`}
        loading="eager"
        decoding="async"
        onError={(e) => {
          console.error('Logo failed to load:', e);
          e.currentTarget.style.border = '2px solid red';
        }}
      />
      {showText && (
        <span className={`${textSizeClasses[size]} font-semibold tracking-tight text-foreground`}>
          ClearCase
        </span>
      )}
    </div>
  );
}