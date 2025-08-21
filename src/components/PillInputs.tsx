import React from "react";
import { CalendarIcon, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

type PillProps = {
  value: string | null;
  onChange: (v: string | null) => void;
  ariaLabel: string;
  icon: "date" | "time";
  className?: string;
};

export function PillInput({ value, onChange, ariaLabel, icon, className }: PillProps) {
  const Icon = icon === "date" ? CalendarIcon : Clock;
  const type = icon === "date" ? "date" : "time";

  return (
    <label
      className={cn(
        "pill flex items-center gap-1.5 rounded-full bg-muted/60 ring-1 ring-black/5",
        "px-[var(--pill-px)] py-[var(--pill-py)]",
        "shadow-[inset_0_0_0_1px_rgba(0,0,0,0.04)]",
        className
      )}
    >
      <Icon className="h-[var(--pill-icon)] w-[var(--pill-icon)] opacity-70" aria-hidden />
      <input
        type={type}
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value || null)}
        step={icon === "time" ? 60 : undefined}
        className={cn(
          "bg-transparent outline-none",
          "text-[var(--pill-text)] leading-none font-medium tracking-wide",
          "w-[var(--pill-input-w)]"
        )}
        aria-label={ariaLabel}
      />
    </label>
  );
}

/**
 * Usage notes:
 * - Controlled with string "YYYY-MM-DD" for date and "HH:mm" for time (24h).
 * - Size is controlled with CSS variables (see CSS section).
 */