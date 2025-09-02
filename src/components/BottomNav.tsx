import { NavLink } from "react-router-dom";
import { Home, PlusCircle, BookOpen, Settings } from "lucide-react";

export default function BottomNav() {
  return (
    <nav className="app-footer">
      <ul className="mx-auto grid w-full max-w-screen-md grid-cols-4">
        <li className="flex">
          <NavLink 
            to="/" 
            className={({ isActive }) =>
              [
                "flex h-[56px] grow flex-col items-center justify-center gap-1 text-xs",
                isActive ? "text-primary" : "text-muted-foreground",
              ].join(" ")
            }
          >
            <Home className="h-5 w-5" />
            <span>Home</span>
          </NavLink>
        </li>
        <li className="flex">
          <NavLink 
            to="/add" 
            className={({ isActive }) =>
              [
                "flex h-[56px] grow flex-col items-center justify-center gap-1 text-xs",
                isActive ? "text-primary" : "text-muted-foreground",
              ].join(" ")
            }
          >
            <PlusCircle className="h-5 w-5" />
            <span>Add</span>
          </NavLink>
        </li>
        <li className="flex">
          <NavLink 
            to="/resources" 
            className={({ isActive }) =>
              [
                "flex h-[56px] grow flex-col items-center justify-center gap-1 text-xs",
                isActive ? "text-primary" : "text-muted-foreground",
              ].join(" ")
            }
          >
            <BookOpen className="h-5 w-5" />
            <span>Resources</span>
          </NavLink>
        </li>
        <li className="flex">
          <NavLink 
            to="/settings" 
            className={({ isActive }) =>
              [
                "flex h-[56px] grow flex-col items-center justify-center gap-1 text-xs",
                isActive ? "text-primary" : "text-muted-foreground",
              ].join(" ")
            }
          >
            <Settings className="h-5 w-5" />
            <span>Settings</span>
          </NavLink>
        </li>
      </ul>
    </nav>
  );
}