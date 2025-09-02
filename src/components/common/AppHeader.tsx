import { Link } from 'react-router-dom';

type Props = { left?: React.ReactNode; right?: React.ReactNode; };

export default function AppHeader({ left, right }: Props) {
  return (
    <header className="app-header h-14 bg-white/80 border-b border-[hsl(var(--border))]">
      <div className="mx-auto max-w-screen-md h-full grid grid-cols-[1fr_auto_1fr] items-center px-4">
        <div className="justify-self-start">{left}</div>
        <div className="justify-self-center pointer-events-none">
          <Link to="/" className="flex items-center gap-2 pointer-events-auto">
            <img 
              src="/lovable-uploads/581b2158-980b-43c9-89b0-e73fc6de832d.png" 
              alt="ClearCase Logo" 
              className="h-6 w-6" 
            />
            <h1 className="text-base font-semibold tracking-tight">ClearCase</h1>
          </Link>
        </div>
        <div className="justify-self-end">{right}</div>
      </div>
    </header>
  );
}