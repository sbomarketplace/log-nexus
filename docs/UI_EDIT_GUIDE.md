# ClearCase - UI Edit Guide

## Quick Edit Locations for Common UI Tasks

### 🔧 Top Navigation (Header)

**Edit title, logo, and navigation styles**

**File**: `src/components/common/AppHeader.tsx`  
**Component**: `AppHeader` (default export)
**JSX Anchor**: 
```jsx
<span className="font-semibold text-[17px]">ClearCase</span>
```
**Logo Path**: Line 17-23 (image src and BrandLogo)
**Styling**: Header container classes on lines 6-14

---

### 📱 Bottom Navigation

**Edit navigation items, icons, and visibility**

**File**: `src/components/BottomNav.tsx`  
**Component**: `BottomNav` (default export)
**JSX Anchor**:
```jsx
const TABS: Tab[] = [
  { label: "Home", to: "/", icon: IconHome, tid: "nav-home" },
  { label: "Add", to: "/add", icon: IconPlus, tid: "nav-add" },
  { label: "Settings", to: "/settings", icon: IconGear, tid: "nav-settings" }
];
```
**Navigation Items**: Lines 26-30
**Visibility Logic**: Entire component renders conditionally
**Styling**: Lines 47-77 (nav container and item styles)

---

### 🎨 Global Theme & Design System

**Edit colors, fonts, and design tokens**

**Primary File**: `src/index.css`
**Design Tokens**: Lines 105-198 (CSS custom properties)
**Key Sections**:
```css
:root {
  --primary: [hsl values];
  --secondary: [hsl values];
  /* ... other color variables */
}
```

**Tailwind Config**: `tailwind.config.ts`
**Color Palette**: Lines 12-98 (theme.extend.colors)
**Custom Classes**: Lines 200-457 in index.css

---

### 📋 Modal Components

**Edit modal appearance and behavior**

**Generic Confirmation Modal**:
- **File**: `src/components/common/ConfirmModal.tsx`
- **JSX Anchor**: `<div className="cc-float-modal">`

**Incident Quick-Add Modal**:
- **File**: `src/components/IncidentModal.tsx`
- **Component**: `IncidentModal`
- **JSX Anchor**: `<Dialog open={open} onOpenChange={onOpenChange}>`

**Bulk Export Modal**:
- **File**: `src/components/BulkExportModal.tsx`
- **JSX Anchor**: `<DialogTitle id="bulk-export-title">`

**Modal Triggers**: Search for `setModalOpen`, `onOpenChange`, or `useState.*modal` patterns

**Modal Styling**: `src/styles/modal.css` for custom modal styles

---

### 📊 Charts and Data Visualization

**Edit chart containers and styling**

**Chart Library**: Recharts (imported as needed in components)
**No Centralized Chart Components**: Charts are inline in their respective components

**Common Chart Patterns**:
```jsx
import { LineChart, AreaChart, BarChart } from 'recharts';
```

**Search For**: `Chart`, `recharts`, `ResponsiveContainer` in component files

---

### 🖥️ Layout Wrapper

**Edit main layout structure**

**File**: `src/components/Layout.tsx`  
**Component**: `Layout` (named export)
**JSX Anchor**:
```jsx
<div className="min-h-[100dvh] flex flex-col bg-background">
  <AppHeader />
  <main className="page-container">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {children}
    </div>
  </main>
  <Footer />
</div>
```
**Layout Structure**: Lines 10-22
**Content Container**: Line 15-17
**Page Spacing**: `.page-container` class in index.css

---

### 🎯 Page-Specific Components

**Home Page (Incident List)**:
- **File**: `src/pages/Home.tsx`
- **Key Sections**: Incident cards, search, bulk actions
- **JSX Anchors**: `<IncidentCard>`, `<IncidentListControls>`

**Add Incident Form**:
- **File**: `src/pages/AddIncident.tsx`  
- **Form Component**: `src/components/SharedIncidentForm.tsx`
- **JSX Anchor**: `<SharedIncidentForm>`

**Settings Page**:
- **File**: `src/pages/Settings.tsx`
- **Resource Section**: `<ResourcesSection>` (also in `src/pages/Resources.tsx`)

---

### 🔄 Loading States & Overlays

**Privacy Screen Overlay**:
- **File**: `src/components/common/ScreenPrivacyOverlay.tsx`
- **Trigger**: Native app switching

**Loading Indicators**: Component-specific, search for `isLoading`, `loading`, `isPending`

**Toast Notifications**:
- **Files**: `src/components/Toast.tsx`, `src/components/SuccessToast.tsx`
- **System**: Uses both custom toasts and Sonner library

---

### 📱 Responsive Design

**Mobile Breakpoints**: Defined in `tailwind.config.ts`
**Mobile-First Approach**: Most components use mobile-first responsive classes
**Key Responsive Utilities**: In `src/index.css` lines 200-457

**Common Patterns**:
```css
.class { /* mobile styles */ }
@media (min-width: 768px) { /* tablet+ styles */ }
@media (min-width: 1024px) { /* desktop+ styles */ }
```

---

### 🎨 Component Styling Patterns

**Shadcn Component Customization**:
- **Location**: `src/components/ui/` directory
- **Variants**: Use `class-variance-authority` (cva) for component variants
- **Theme Integration**: Components use CSS variables from index.css

**Custom Component Styling**:
- **Approach**: Tailwind classes + semantic design tokens
- **Avoid**: Direct color values (use CSS variables instead)
- **Pattern**: `className="bg-background text-foreground border-border"`

---

## Fast VS Code Navigation Tips

**Multi-file Search Shortcuts**:
1. `Ctrl/Cmd + Shift + F` - Global search across all files
2. `Ctrl/Cmd + P` - Quick file finder
3. `Ctrl/Cmd + Shift + P` - Command palette
4. `F12` - Go to definition (for imported components)

**Useful VS Code Extensions**:
- Auto Rename Tag
- Tailwind CSS IntelliSense  
- ES7+ React/Redux/React-Native snippets
- TypeScript Importer