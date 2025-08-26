import { useState, useRef } from 'react';
import { Menu } from 'lucide-react';
import { Link } from 'react-router-dom';
import SlideOverMenu from '@/components/SlideOverMenu';

export default function AppHeader() {
  const [open, setOpen] = useState(false);
  const btnRef = useRef<HTMLButtonElement | null>(null);
  
  return (
    <header 
      className="
        app-header
        sticky top-0 z-[900] h-[56px] w-full
        border-b border-border bg-background/95 backdrop-blur
        flex items-center justify-between px-4
      "
      style={{ ["--header-h" as any]: "56px" }}
    >
      {/* Left: brand */}
      <Link to="/" className="flex items-center gap-2">
        <img 
          src="/lovable-uploads/581b2158-980b-43c9-89b0-e73fc6de832d.png" 
          alt="ClearCase Logo" 
          className="h-6 w-6" 
        />
        <span className="font-semibold text-[17px]">ClearCase</span>
      </Link>

      {/* Right: hamburger */}
      <button
        ref={btnRef}
        aria-label="Menu"
        data-testid="hamburger-button"
        onClick={() => setOpen(v => !v)}
        className="h-10 w-10 -mr-2 grid place-items-center rounded-xl hover:bg-muted focus:outline-none focus:ring-2 focus:ring-ring active:scale-[0.98]"
      >
        <Menu className="h-6 w-6" />
      </button>

      <SlideOverMenu open={open} onClose={() => setOpen(false)} anchorRef={btnRef} />
    </header>
  );
}