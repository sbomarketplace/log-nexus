# ClearCase - Route Map

## Router Configuration

**Router Type**: React Router v6 (`BrowserRouter`)  
**Configuration Location**: `src/App.tsx` (lines 89-105)

## Route Table

| Route Path | Component | File Path | Layout | Header | Footer | Bottom Nav |
|------------|-----------|-----------|---------|--------|--------|------------|
| `/` | `Home` | `src/pages/Home.tsx` | Layout | AppHeader | Footer | BottomNav |
| `/add` | `AddIncident` | `src/pages/AddIncident.tsx` | Layout | AppHeader | Footer | BottomNav |
| `/settings` | `Settings` | `src/pages/Settings.tsx` | Layout | AppHeader | Footer | BottomNav |
| `/resources` | `Navigate` | Redirects to `/settings#resources` | - | - | - | - |
| `/incident/:id` | `IncidentRedirect` | `src/components/IncidentRedirect.tsx` | - | - | - | - |
| `/incident/:id/edit` | `IncidentRedirect` | `src/components/IncidentRedirect.tsx` | - | - | - | - |
| `*` (catch-all) | `NotFound` | `src/pages/NotFound.tsx` | - | - | - | - |

## Layout Hierarchy

```
App
├── Global Providers (QueryClient, TooltipProvider)
├── Global Components (Toaster, ScreenPrivacyOverlay, RateAppModal)
├── BrowserRouter
│   ├── ScrollToTop (utility)
│   ├── Routes (main content)
│   └── BottomNav (persistent bottom navigation)
```

### Standard Page Layout Structure
```
Layout
├── AppHeader (sticky top navigation)
├── main.page-container
│   └── div.max-w-7xl (page content)
└── Footer (hidden on mobile)
```

## Route Components Details

### Primary Routes

**`/` - Home Page**
- **Component**: `Home` (`src/pages/Home.tsx`)
- **Purpose**: Main incidents list and dashboard
- **Layout**: Standard Layout wrapper
- **Key Features**: Incident cards, search, bulk actions, quick-add modal
- **Modal Triggers**: IncidentModal, BulkExportModal, ExportOptionsModal

**`/add` - Add Incident**
- **Component**: `AddIncident` (`src/pages/AddIncident.tsx`)
- **Purpose**: Create new incident form
- **Layout**: Standard Layout wrapper
- **Key Features**: Full incident form, AI assistance, paywall integration

**`/settings` - Settings & Resources**
- **Component**: `Settings` (`src/pages/Settings.tsx`)
- **Purpose**: App settings and resource center (combined page)
- **Layout**: Standard Layout wrapper
- **Key Features**: Settings cards, resource accordion, emergency contacts
- **Modal Triggers**: PolicyModal, EmergencyContactsModal, SupportLegalModal

### Legacy and Redirect Routes

**`/resources` - Legacy Resources**
- **Behavior**: Redirects to `/settings#resources`
- **Component**: `<Navigate to="/settings#resources" replace />`
- **Purpose**: Maintain backward compatibility

**`/incident/:id` - Legacy Incident View**
- **Component**: `IncidentRedirect` (`src/components/IncidentRedirect.tsx`)
- **Behavior**: Redirects to `/?incidentId=${id}` (opens modal on home)
- **Purpose**: Maintain backward compatibility

**`/incident/:id/edit` - Legacy Incident Edit**
- **Component**: `IncidentRedirect` (`src/components/IncidentRedirect.tsx`)  
- **Behavior**: Redirects to `/?incidentId=${id}` (opens modal on home)
- **Purpose**: Maintain backward compatibility

### Error Route

**`*` - Not Found**
- **Component**: `NotFound` (`src/pages/NotFound.tsx`)
- **Purpose**: 404 error page
- **Layout**: No Layout wrapper (custom styling)

## Navigation Components

### Bottom Navigation (`src/components/BottomNav.tsx`)
- **Visibility**: All routes (persistent)
- **Position**: Fixed bottom, z-index layering
- **Items**: 
  - Home (`/`) - House icon
  - Add (`/add`) - Plus icon  
  - Settings (`/settings`) - Gear icon
- **Active State**: Automatic based on current pathname

### Header Navigation (`src/components/common/AppHeader.tsx`)
- **Visibility**: All routes using Layout
- **Position**: Sticky top
- **Content**: Brand logo + "ClearCase" text
- **Actions**: No action buttons (uses bottom nav instead)

## Route Protection & Access Control

- **Authentication**: Consent-based (ConsentModal)
- **Access Levels**: Single user app (no role-based routing)
- **Paywall Integration**: Some features gated by subscription status
- **Native Integration**: Routes work in both web and Capacitor iOS app

## URL Patterns & Parameters

**Dynamic Routes**:
- `/incident/:id` - Legacy incident ID parameter (redirected)
- `/incident/:id/edit` - Legacy edit mode (redirected)

**Hash Navigation**:
- `/settings#resources` - Direct link to resources section

**Query Parameters** (handled in components, not routes):
- `/?incidentId=${id}` - Opens incident modal on home page

## Route-Level Data Loading

**Data Fetching Strategy**: Component-level (no route-level loaders)
- Uses `@tanstack/react-query` for data management
- Local storage for persistence
- Supabase integration for some features

**Loading States**: Handled per-component, not at route level