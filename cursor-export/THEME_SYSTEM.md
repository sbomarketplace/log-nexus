# ClearCase Theme System

## Theme Implementation

ClearCase uses CSS variables for theming with class-based dark mode switching.

### Theme Provider Setup

```tsx
import { ThemeProvider } from "next-themes"

function App() {
  return (
    <ThemeProvider 
      attribute="class" 
      defaultTheme="system" 
      enableSystem 
      disableTransitionOnChange
    >
      {/* Your app */}
    </ThemeProvider>
  )
}
```

### Theme Toggler Component

```tsx
import { useTheme } from "next-themes"
import { Button } from "@/components/ui/button"
import { Moon, Sun } from "lucide-react"

export function ThemeToggle() {
  const { setTheme, theme } = useTheme()

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => setTheme(theme === "light" ? "dark" : "light")}
    >
      <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
      <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
      <span className="sr-only">Toggle theme</span>
    </Button>
  )
}
```

## Color System

### Primary Colors (Orange brand)
- **Primary**: `hsl(25, 95%, 53%)` - Orange brand color
- **Primary Foreground**: `hsl(0, 0%, 100%)` - White text on orange

### Semantic Colors
- **Success**: `hsl(142, 76%, 36%)` - Green for success states
- **Destructive**: `hsl(0, 84%, 60%)` - Red for errors/danger
- **Accent**: `hsl(214, 100%, 50%)` - Blue accent color

### Neutral Colors (Light Mode)
- **Background**: `hsl(0, 0%, 98%)` - Near white
- **Foreground**: `hsl(220, 9%, 15%)` - Near black text
- **Muted**: `hsl(220, 13%, 95%)` - Light gray backgrounds
- **Border**: `hsl(220, 13%, 91%)` - Subtle borders

### Neutral Colors (Dark Mode)
- **Background**: `hsl(220, 9%, 9%)` - Near black
- **Foreground**: `hsl(220, 13%, 95%)` - Near white text
- **Muted**: `hsl(220, 9%, 15%)` - Dark gray backgrounds
- **Border**: `hsl(220, 9%, 20%)` - Subtle dark borders

## Category Color Mapping

```tsx
export const getCategoryTagClass = (category: string): string => {
  const lower = category.toLowerCase();
  
  if (lower.includes("safety") || lower.includes("violation")) {
    return "category-safety"; // Red gradient
  }
  if (lower.includes("harassment") || lower.includes("discrimination")) {
    return "category-harassment"; // Orange gradient
  }
  if (lower.includes("accusation") || lower.includes("breach")) {
    return "category-accusation"; // Blue gradient
  }
  if (lower.includes("policy") || lower.includes("compliance")) {
    return "category-policy"; // Green gradient
  }
  
  return "category-default"; // Gray gradient
};
```

## Typography Scale

```css
/* Compact mobile-first typography */
h1 { @apply text-lg font-semibold; }     /* 18px */
h2 { @apply text-base font-semibold; }   /* 16px */
h3 { @apply text-sm font-medium; }       /* 14px */

p, div, span { @apply text-sm; }         /* 14px */
label { @apply text-xs font-medium; }    /* 12px */

/* Chips get even smaller */
.chip-xs-text {
  font-size: 8.5px !important;          /* 8.5px mobile */
  font-weight: bold !important;
}

@media (min-width: 640px) {
  .chip-xs-text {
    font-size: 9.5px !important;        /* 9.5px desktop */
  }
}
```

## Layout Variables

```css
:root {
  --header-h: 56px;                     /* Fixed header height */
  --nav-h: 56px;                       /* Bottom nav height */
  --safe-bottom: env(safe-area-inset-bottom, 0px);
  --content-bottom-inset: calc(var(--nav-h) + var(--safe-bottom) + (-4px));
  --radius: 0.5rem;                    /* Default border radius */
}
```

## Component Sizing Standards

### Buttons
- **Default**: `h-8` (32px height)
- **Small**: `h-7` (28px height)  
- **Large**: `h-9` (36px height)
- **Icon**: `h-8 w-8` (32x32px)

### Icons
- **Navigation**: 16x16px (`h-4 w-4`)
- **Chips**: 14x14px (`h-3.5 w-3.5`)
- **Small**: 12x12px (`h-3 w-3`)

### Border Radius
- **Cards**: `rounded-2xl` (16px)
- **Buttons**: `rounded-md` (6px) 
- **Pills**: `rounded-full`
- **Inputs**: `rounded-md` (6px)

### Shadows
- **Cards**: `shadow-sm` + `ring-1 ring-black/5`
- **Modals**: Custom shadow with blur

## Safe Area Handling

```css
/* iOS safe areas */
.pb-safe-bottom {
  padding-bottom: calc(env(safe-area-inset-bottom) + var(--nav-h) + 8px);
}

/* Bottom nav with safe area */
.h-[env(safe-area-inset-bottom)] {
  /* Accounts for iPhone home indicator */
}
```

This system ensures pixel-perfect consistency across light/dark modes and all device types.