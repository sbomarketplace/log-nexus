import { useState } from 'react';
import { Menu } from 'lucide-react';
import { Link } from 'react-router-dom';
import SlideOverMenu from '@/components/SlideOverMenu';

export default function AppHeader() {
  const [open, setOpen] = useState(false);
  
  return (
    <header className="app-header flex items-center justify-between px-4 bg-background/80 border-b">
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
        aria-label="Open menu"
        className="h-10 w-10 -mr-2 grid place-items-center rounded-xl active:scale-[0.98]"
        onClick={() => setOpen(true)}
      >
        <Menu className="h-6 w-6" />
      </button>

      <SlideOverMenu open={open} onClose={() => setOpen(false)} />
    </header>
  );
}