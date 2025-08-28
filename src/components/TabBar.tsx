import { NavLink } from "react-router-dom";
import { Home, Plus, Settings } from "lucide-react";

export default function TabBar() {
  return (
    <nav className="tabbar">
      <ul className="h-full flex items-center justify-around">
        <li>
          <NavLink to="/" aria-label="Home" className={({isActive}) => isActive ? "text-primary" : "text-muted-foreground"}>
            <Home size={24} />
          </NavLink>
        </li>
        <li>
          <NavLink to="/add" aria-label="Add Incident" className={({isActive}) => isActive ? "text-primary" : "text-muted-foreground"}>
            <Plus size={24} />
          </NavLink>
        </li>
        <li>
          <NavLink to="/settings" aria-label="Settings" className={({isActive}) => isActive ? "text-primary" : "text-muted-foreground"}>
            <Settings size={24} />
          </NavLink>
        </li>
      </ul>
    </nav>
  );
}