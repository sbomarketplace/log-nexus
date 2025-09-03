import React from "react";
import { NavLink } from "react-router-dom";

export default function BottomNav() {
  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 bg-card shadow
                 h-[var(--app-tabbar-height)] pt-2 pb-[calc(env(safe-area-inset-bottom,0px)/2)]"
      aria-label="Bottom navigation"
    >
      <div className="mx-auto max-w-screen-md px-6 grid grid-cols-4 gap-4 text-center">
        <NavLink to="/" className="text-sm">Home</NavLink>
        <NavLink to="/add" className="text-sm">Add</NavLink>
        <NavLink to="/incidents" className="text-sm">Incidents</NavLink>
        <NavLink to="/settings" className="text-sm">Settings</NavLink>
      </div>
    </nav>
  );
}
