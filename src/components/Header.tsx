import { Link } from 'react-router-dom';

export default function Header() {
  return (
    <div className="h-[56px] w-full border-b border-border bg-background/95 backdrop-blur flex items-center justify-between px-4">
      {/* Left: brand */}
      <Link to="/" className="flex items-center gap-2">
        <img 
          src="/lovable-uploads/581b2158-980b-43c9-89b0-e73fc6de832d.png" 
          alt="ClearCase Logo" 
          className="h-6 w-6" 
        />
        <span className="font-semibold text-[17px]">ClearCase</span>
      </Link>

      {/* Right side intentionally empty now that we use bottom navigation */}
      <span />
    </div>
  );
}