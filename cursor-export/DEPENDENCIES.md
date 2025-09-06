# ClearCase UI Dependencies

## Core Framework & Build
```json
{
  "react": "^18.3.1",
  "react-dom": "^18.3.1",
  "react-router-dom": "^6.30.1",
  "vite": "^5.4.19",
  "typescript": "^5.8.3"
}
```

## Styling & UI
```json
{
  "tailwindcss": "^3.4.17",
  "tailwindcss-animate": "^1.0.7",
  "autoprefixer": "^10.4.21",
  "postcss": "^8.5.6",
  "class-variance-authority": "^0.7.1",
  "clsx": "^2.1.1",
  "tailwind-merge": "^2.6.0"
}
```

## Icons & Components
```json
{
  "lucide-react": "^0.462.0",
  "@radix-ui/react-accordion": "^1.2.11",
  "@radix-ui/react-alert-dialog": "^1.1.14",
  "@radix-ui/react-checkbox": "^1.3.2",
  "@radix-ui/react-dialog": "^1.1.14",
  "@radix-ui/react-label": "^2.1.7",
  "@radix-ui/react-popover": "^1.1.14",
  "@radix-ui/react-separator": "^1.1.7",
  "@radix-ui/react-slot": "^1.2.3",
  "@radix-ui/react-tabs": "^1.1.12",
  "@radix-ui/react-toast": "^1.2.14",
  "@radix-ui/react-tooltip": "^1.2.7"
}
```

## Capacitor (for mobile)
```json
{
  "@capacitor/core": "^7.4.3",
  "@capacitor/cli": "^7.4.3",
  "@capacitor/ios": "^7.4.3",
  "@capacitor/android": "^7.4.3",
  "@capacitor/status-bar": "^7.0.2",
  "@capacitor/app": "^7.0.2"
}
```

## Forms & Validation
```json
{
  "react-hook-form": "^7.61.1",
  "@hookform/resolvers": "^3.10.0",
  "zod": "^3.25.76"
}
```

## Theme & Toasts
```json
{
  "next-themes": "^0.3.0",
  "sonner": "^1.7.4"
}
```

## Package Manager Commands

### Install all dependencies:
```bash
npm install
# or
pnpm install
# or 
yarn install
```

### Dev server:
```bash
npm run dev
```

### Build:
```bash
npm run build
```

### Capacitor sync (after changes):
```bash
npx cap sync
```

## Icon Library Usage

The app uses `lucide-react` for all icons. Key icons:
- **Home**: `Home` (16x16px)
- **Add**: `PlusCircle` (16x16px) 
- **Incidents**: `ClipboardList` (16x16px)
- **Settings**: `Settings2` (16x16px)
- **Calendar**: `CalendarIcon` (14x14px in chips)
- **Clock**: `ClockIcon` (14x14px in chips)
- **Hash**: `Hash` (14x14px for case numbers)

## Font Configuration

The app uses system fonts (SF Pro on iOS, Roboto on Android, system fonts on web).
No custom fonts are imported.