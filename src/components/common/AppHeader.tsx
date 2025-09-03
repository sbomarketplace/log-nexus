import React from "react";
import { Link } from "react-router-dom";

const AppHeader: React.FC = () => {
  return (
    <header className="sticky top-0 z-40 h-[56px] border-b bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="h-full grid place-items-center">
        <Link to="/" aria-label="Go to Home" className="inline-flex items-center gap-2 select-none">
          <span className="text-lg font-semibold tracking-tight text-orange-500">ClearCase</span>
        </Link>
      </div>
    </header>
  );
};

export default AppHeader;
