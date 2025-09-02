import { Link } from 'react-router-dom';

export default function AppHeader() {
  return (
    <header className="app-header border-b border-border">
      <div className="row">
        <div className="nav-left">
          {/* Left side intentionally empty for centering */}
        </div>

        <Link to="/" className="nav-title">
          <img 
            src="/lovable-uploads/581b2158-980b-43c9-89b0-e73fc6de832d.png" 
            alt="ClearCase Logo" 
            className="h-5 w-5" 
          />
          <span className="text-[17px]">ClearCase</span>
        </Link>

        <div className="nav-right">
          {/* Right side intentionally empty for centering */}
        </div>
      </div>
    </header>
  );
}