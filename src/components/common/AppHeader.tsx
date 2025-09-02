import { Link } from 'react-router-dom';

export default function AppHeader() {
  
  return (
    <header 
      className="
        app-header
        border-b border-border bg-background/95 backdrop-blur
        justify-center px-4
      "
      style={{ ["--header-h" as any]: "56px" }}
    >
      {/* Centered brand */}
      <Link to="/" className="flex items-center gap-2">
        <img 
          src="/lovable-uploads/581b2158-980b-43c9-89b0-e73fc6de832d.png" 
          alt="ClearCase Logo" 
          className="h-6 w-6" 
        />
        <span className="font-semibold text-[17px]">ClearCase</span>
      </Link>
    </header>
  );
}