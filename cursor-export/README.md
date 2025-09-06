# ClearCase UI Design System Export

Complete design system extracted from your Lovable ClearCase build for pixel-perfect replication in Cursor/Capacitor.

## 🎨 What's Included

### Core Configuration
- **`tailwind.config.js`** - Complete Tailwind setup with theme extensions
- **`postcss.config.js`** - PostCSS configuration  
- **`src/styles/index.css`** - Global styles, CSS variables, utilities

### React Components
- **`AppHeader.tsx`** - 56px fixed header with blur backdrop
- **`BottomNav.tsx`** - 64px bottom navigation with orange active states  
- **`Layout.tsx`** - App shell with iOS status bar handling
- **`PageHero.tsx`** - Centered page titles
- **`IncidentCard.tsx`** - Compact incident list items with chips

### Utilities & Mappings
- **`categoryMappings.ts`** - Category definitions and gradient class mappings
- **`utils.ts`** - ClassNames utility function (cn)

### Documentation
- **`DEPENDENCIES.md`** - Exact package versions and installation guide
- **`THEME_SYSTEM.md`** - Complete theming implementation guide

## 🎯 Design System Specs

### Color Palette
- **Primary Orange**: `hsl(25, 95%, 53%)` (brand color)
- **Success Green**: `hsl(142, 76%, 36%)`  
- **Destructive Red**: `hsl(0, 84%, 60%)`
- **Accent Blue**: `hsl(214, 100%, 50%)`

### Typography Scale (Mobile-First)
- **H1**: 18px semibold
- **H2**: 16px semibold  
- **H3**: 14px medium
- **Body**: 14px regular
- **Labels**: 12px medium
- **Chips**: 8.5px bold (9.5px on desktop)

### Component Sizes
- **Header**: 56px fixed height
- **Bottom Nav**: 64px + safe area
- **Buttons**: 32px default (28px small, 36px large)
- **Icons**: 16px nav, 14px chips, 12px small
- **Border Radius**: 16px cards, 6px buttons/inputs

### Layout Constants  
```css
--header-h: 56px
--nav-h: 56px  
--safe-bottom: env(safe-area-inset-bottom, 0px)
--radius: 0.5rem
```

## 🚀 Quick Setup

1. **Install Dependencies:**
```bash
npm install tailwindcss@^3.4.17 tailwindcss-animate@^1.0.7 class-variance-authority@^0.7.1 clsx@^2.1.1 tailwind-merge@^2.6.0 lucide-react@^0.462.0 next-themes@^0.3.0
```

2. **Copy Configuration:**
- Replace your `tailwind.config.js` with the provided version
- Replace your `postcss.config.js` 
- Import `src/styles/index.css` in your main file

3. **Theme Provider Setup:**
```tsx
import { ThemeProvider } from "next-themes"

function App() {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      {/* Your app */}
    </ThemeProvider>
  )
}
```

4. **Component Usage:**
```tsx
import AppHeader from './components/AppHeader'
import BottomNav from './components/BottomNav'
import { Layout } from './components/Layout'

// Use the pre-built components for exact ClearCase styling
```

## 📱 Mobile & Capacitor

The design system includes:
- iOS safe area handling (`env(safe-area-inset-bottom)`)
- Touch-friendly 44px+ targets  
- iOS font zoom prevention (16px+ inputs)
- Status bar configuration for iOS
- Backdrop blur effects with fallbacks

## 🎨 Category System

Pre-configured gradient mappings:
```tsx
safety → red gradient       // Violations, accidents
harassment → orange gradient // Harassment, discrimination  
accusation → blue gradient  // Breaches, accusations
policy → green gradient     // Compliance, policies
default → gray gradient     // Fallback
```

## 🔧 Key Utilities

- **`cn()`** - Tailwind class merging utility
- **`getCategoryTagClass()`** - Maps categories to gradient classes
- **`.chip-xs-text`** - Ultra-compact text for mobile chips
- **`.category-*`** - Pre-built gradient classes
- **`.line-clamp-2/3`** - Text truncation utilities

This export provides everything needed to achieve pixel-perfect parity with your ClearCase design system.