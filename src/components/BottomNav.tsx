import { NavLink } from "react-router-dom";

export default function BottomNav() {
  return (
    <nav className="app-footer">
      <ul className="mx-auto grid w-full max-w-screen-md grid-cols-4">
        <li className="flex">
          <NavLink to="/" className="flex h-[56px] grow flex-col items-center justify-center gap-1 text-xs">Home</NavLink>
        </li>
        <li className="flex">
          <NavLink to="/incidents/new" className="flex h-[56px] grow flex-col items-center justify-center gap-1 text-xs">Add</NavLink>
        </li>
        <li className="flex">
          <NavLink to="/incidents" className="flex h-[56px] grow flex-col items-center justify-center gap-1 text-xs">Incidents</NavLink>
        </li>
        <li className="flex">
          <NavLink to="/settings" className="flex h-[56px] grow flex-col items-center justify-center gap-1 text-xs">Settings</NavLink>
        </li>
      </ul>
    </nav>
  );
}
