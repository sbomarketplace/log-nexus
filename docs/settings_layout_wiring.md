# Settings Screen Layout & Wiring Documentation

## Folder & File Map

```
src/
├── pages/
│   ├── Settings.tsx                   # Main Settings route component, renders accordion layout
│   └── Resources.tsx                  # Resources page component, exports ResourcesSection
├── components/
│   ├── Layout.tsx                     # App shell wrapper with header/nav
│   ├── SupportLegalModal.tsx          # Terms/Privacy/Cookies modal (full legal text inline)
│   ├── ads/
│   │   └── InlineAd.tsx              # Ad banner component (slot="settings")
│   ├── settings/
│   │   ├── DataStorageCard.tsx        # Export/delete data controls (stateful)
│   │   ├── SecurityPrivacyCard.tsx    # Security toggles and switches (stateful)
│   │   └── PrivacyPreviewToggle.tsx   # Privacy screen toggle (stateful)
│   └── ui/
│       ├── accordion.tsx              # Radix UI Accordion primitives
│       ├── button.tsx                 # Button component with variants
│       ├── separator.tsx              # Visual divider
│       └── switch.tsx                 # Toggle switch component
├── lib/
│   └── subscription.ts                # Subscription state provider/hook
├── styles/
│   ├── settings.css                   # Settings-specific styles and classes
│   └── modal.css                      # Modal overlay and panel styles
└── content/legal/
    ├── terms.md                       # Terms of Use markdown (inline in SupportLegalModal)
    ├── privacy.md                     # Privacy Policy markdown (inline in SupportLegalModal)
    └── cookies.md                     # Cookie Policy markdown (inline in SupportLegalModal)
```

## Routing & Entry Points

### Routes
- **Primary Route**: `/settings` → `Settings.tsx`
- **Legacy Redirect**: `/resources` → `Navigate to="/settings#resources"` (line 110 in App.tsx)

### Route Registration
- **File**: `src/App.tsx`
- **Line**: 108 - `<Route path="/settings" element={<Settings />} />`
- **Navigation**: Accessible via `BottomNav` (Settings tab) and `SlideOverMenu`

### App Shell Integration
- **Layout Component**: `src/components/Layout.tsx` wraps the entire Settings page
- **Bottom Navigation**: `src/components/BottomNav.tsx` includes Settings tab (Settings2 icon)
- **Tab Order**: Home, Add, Incidents, Settings (4th tab)

## Component Composition

### Settings.tsx Structure (lines 138-296)
```
Layout
└── div.settings-page.incident-typography.pb-safe-bottom
    ├── header (title + subtitle)
    ├── h2#settings "Settings"
    ├── Accordion[type="multiple"]
    │   ├── AccordionItem[value="account"] - Remove Ads Subscription
    │   │   ├── AccordionTrigger (Shield icon + title)
    │   │   └── AccordionContent (subscription status + purchase buttons)
    │   ├── AccordionItem[value="data"] - Data & Storage  
    │   │   ├── AccordionTrigger (Database icon + title)
    │   │   └── AccordionContent → DataStorageCard component
    │   └── AccordionItem[value="support"] - Support & Legal
    │       ├── AccordionTrigger (HelpCircle icon + title)
    │       └── AccordionContent → clickable row opens SupportLegalModal
    ├── InlineAd[slot="settings"]
    ├── Separator
    ├── h2#resources "Resources"
    └── ResourcesSection (from pages/Resources.tsx)
```

### Accordion Items Detail

#### Remove Ads Subscription (lines 153-214)
- **Type**: True accordion content
- **Trigger**: Shield icon + "Remove Ads Subscription" 
- **Content**: Subscription status card + conditional purchase buttons
- **State**: Local `purchasing` state, `useSubscription()` hook

#### Data & Storage (lines 217-227)
- **Type**: True accordion content  
- **Trigger**: Database icon + "Data & Storage"
- **Content**: `<DataStorageCard />` component
- **File**: `src/components/settings/DataStorageCard.tsx`

#### Support & Legal (lines 231-253)
- **Type**: Link row (not accordion content)
- **Trigger**: HelpCircle icon + "Support & Legal"
- **Content**: Single clickable row with ChevronRight
- **Action**: Opens `SupportLegalModal` via `setSupportLegalOpen(true)`

## State Management & Behavior

### Subscription State
- **Hook**: `useSubscription()` from `src/lib/subscription.ts`
- **Properties**: `isSubscribed`, `loading`, `purchaseRemoveAds`, `restorePurchases`
- **Context Provider**: `SubscriptionProvider` (currently stub implementation)

### Local Component State (Settings.tsx lines 75-77)
- `activeModal: string | null` - Controls FloatingModal visibility
- `purchasing: string | null` - Loading states for purchase buttons
- `supportLegalOpen: boolean` - SupportLegalModal visibility

### Event Handlers
- **handlePurchase** (lines 83-92): Generic purchase wrapper with loading states
- **handleRestore** (lines 94-104): Restore purchases with loading state
- **setSupportLegalOpen** (line 242): Opens Support & Legal modal

### DataStorageCard State (separate component)
- **File**: `src/components/settings/DataStorageCard.tsx`
- **State**: `confirmDeleteAll`, `busy` (local useState)
- **Handler**: `onDeleteAll` - calls `deleteAllIncidents()` from storage lib

## UI Tokens & Classes

### Container & Layout Classes
- **Container**: `max-w-4xl mx-auto space-y-6 settings-page incident-typography pb-safe-bottom`
- **Header**: `text-center pt-3 pb-2`
- **Title**: `text-3xl font-bold tracking-tight`
- **Subtitle**: `mt-2 text-muted-foreground`

### Accordion Classes (from settings.css)
- **Section**: `.settings-section` - 1px border, 8px radius, card background
- **Header**: `.settings-section-header` - 16px padding, hover background, cursor pointer
- **Content**: `.settings-section-content cc-acc-content` - 16px padding + 12px top

### Custom CSS Classes (src/styles/settings.css)
- **settings-section**: Border, radius, card background (lines 31-36)
- **settings-section-header**: 16px padding, hover states (lines 38-52)
- **settings-section-content**: 16px padding, relative positioning (lines 54-58)
- **cc-acc-content**: Prevents overlay issues, adds divider (lines 61-96)
- **settings-row**: Flex layout for clickable rows (lines 99-105)

### Safe Areas
- **Bottom Padding**: `pb-safe-bottom` class
- **Source**: iOS safe area handling in global styles
- **Mobile Modal**: Safe area insets in modal.css (line 8)

## Icons & Libraries

### Lucide Icons Used
- **Settings.tsx**: `X`, `ChevronRight`, `Shield`, `Database`, `HelpCircle`, `Loader2`
- **BottomNav.tsx**: `Settings2` (for Settings tab)
- **DataStorageCard.tsx**: `Database`, `Trash2`
- **SecurityPrivacyCard.tsx**: `Shield`

### Radix/shadcn Primitives
- **Accordion**: `@radix-ui/react-accordion` → `src/components/ui/accordion.tsx`
- **Button**: Custom variants in `src/components/ui/button.tsx`
- **Separator**: `@radix-ui/react-separator` → `src/components/ui/separator.tsx`
- **Switch**: `@radix-ui/react-switch` → `src/components/ui/switch.tsx`

## Legal Content Sources

### SupportLegalModal Content (inline, not imported)
- **File**: `src/components/SupportLegalModal.tsx`
- **Content**: Full legal text inline in JSX (lines 58-243)
- **Sections**: Terms (lines 58-184), Privacy (lines 186-232), Cookies (lines 234-243)

### Markdown Files (not used by modal)
- **terms.md**: `src/content/legal/terms.md` - Terms of Use
- **privacy.md**: `src/content/legal/privacy.md` - Privacy Policy  
- **cookies.md**: `src/content/legal/cookies.md` - Cookie Policy
- **Note**: These exist but are NOT imported by SupportLegalModal - legal text is inline

### Modal Actions
- **Contact Support**: `mailto:SBOMarketplaceapp@gmail.com` (line 15)
- **Rate App**: Calls `openStoreReview()` from `@/lib/rateApp` (line 19)

## Path Aliases & Build Assumptions

### Path Aliases (tsconfig.json)
- **@/**: Maps to `./src` directory
- **@/components**: `./src/components`
- **@/lib**: `./src/lib`
- **@/pages**: `./src/pages`
- **@/styles**: `./src/styles`

### Environment Variables
- **VITE_SHOW_DEV_IAP**: Shows debug IAP info in development (line 205)
- **VITE_APP_VERSION**: App version shown in modal footer (line 10)
- **Import Path**: `import.meta.env.VITE_*` format

### Build Configuration
- **Tailwind Config**: `tailwind.config.ts` with content paths for src/**
- **CSS Custom Properties**: HSL color system in index.css
- **Animation Keyframes**: Accordion animations in tailwind config

## Public API (Exports)

### Settings.tsx
```typescript
const Settings: React.FC = () => { /* component */ }
export default Settings;
```

### DataStorageCard.tsx
```typescript
export default function DataStorageCard(): JSX.Element
// No props interface - component is self-contained
```

### SupportLegalModal.tsx
```typescript
interface SupportLegalModalProps {
  onClose: () => void;
}
export default function SupportLegalModal({ onClose }: SupportLegalModalProps): JSX.Element
```

### Resources.tsx (ResourcesSection)
```typescript
export function ResourcesSection(): JSX.Element
// Reusable component without page wrapper
```

### PrivacyPreviewToggle.tsx
```typescript
export default function PrivacyPreviewToggle(): JSX.Element
// No props - reads/writes security settings internally
```

## Migration Checklist

### Step 1: Create Folder Structure
```bash
mkdir -p src/pages src/components/settings src/components/ads src/lib src/styles src/content/legal
```

### Step 2: Install Dependencies
```bash
npm install @radix-ui/react-accordion @radix-ui/react-separator @radix-ui/react-switch
npm install lucide-react react-router-dom
npm install tailwindcss-animate
```

### Step 3: Copy Core Files
1. **Settings.tsx** → Primary route component
2. **Layout.tsx** → App shell wrapper
3. **DataStorageCard.tsx** → Data management controls
4. **SupportLegalModal.tsx** → Legal content modal
5. **InlineAd.tsx** → Ad banner component

### Step 4: Setup Styles & Config
1. **tailwind.config.ts** → Accordion animations, HSL color system
2. **settings.css** → Settings-specific classes
3. **modal.css** → Modal overlay styles
4. **index.css** → CSS custom properties for colors

### Step 5: Configure Routing
1. Add `/settings` route in router
2. Add redirect from `/resources` to `/settings#resources`
3. Wire BottomNav Settings tab

### Step 6: State Management
1. Implement `useSubscription()` hook
2. Add `SubscriptionProvider` context
3. Connect purchase/restore functions

### Step 7: Path Aliases
1. Configure `@/` alias in tsconfig.json and vite.config.ts
2. Ensure content paths in tailwind.config.ts include `src/**`

### Gotchas
- **Accordion Overlapping**: Use `cc-acc-content` class to prevent trigger overlay
- **Safe Areas**: Include `pb-safe-bottom` for iOS compatibility  
- **Modal Z-Index**: Ensure modal overlay has higher z-index than other components
- **Legal Content**: SupportLegalModal contains inline legal text, not imported markdown
- **Purchase Functions**: Need actual IAP implementation for production
- **Environment Variables**: Use `import.meta.env.VITE_*` format for Vite

### Dependencies & Versions
- **React**: ^18.3.1
- **@radix-ui/react-accordion**: ^1.2.11
- **@radix-ui/react-separator**: ^1.1.7
- **@radix-ui/react-switch**: ^1.2.5
- **lucide-react**: ^0.462.0
- **react-router-dom**: ^6.30.1
- **tailwindcss-animate**: ^1.0.7