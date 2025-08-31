# ClearCase - Component Map

## Core App Structure

| Path | Component | Export | Purpose | Parents | Children | UI Layer |
|------|-----------|--------|---------|---------|----------|----------|
| `src/App.tsx` | `App` | default | Root app component with routing, consent, and global providers | - | All pages, modals | root |
| `src/main.tsx` | - | - | App entry point with SubscriptionProvider | - | App | document |

## Layout Components

| Path | Component | Export | Purpose | Parents | Children | UI Layer |
|------|-----------|--------|---------|---------|----------|----------|
| `src/components/Layout.tsx` | `Layout` | named | Main page layout wrapper with header/footer | All pages | AppHeader, Footer | content |
| `src/components/common/AppHeader.tsx` | `AppHeader` | default | Sticky top navigation with logo and brand | Layout | BrandLogo | header |
| `src/components/Footer.tsx` | `Footer` | named | App footer (hidden on mobile) | Layout | - | footer |
| `src/components/BottomNav.tsx` | `BottomNav` | default | Mobile bottom navigation tabs | App | - | navigation |
| `src/components/BrandLogo.tsx` | `BrandLogo` | named | Brand logo with optional text | AppHeader, others | - | chrome |

## Pages (Route Components)

| Path | Component | Export | Purpose | Parents | Children | UI Layer |
|------|-----------|--------|---------|---------|----------|----------|
| `src/pages/Home.tsx` | `Home` | default | Main incidents list page | App (route) | Layout, IncidentCard, modals | content |
| `src/pages/AddIncident.tsx` | `AddIncident` | default | Add new incident form page | App (route) | Layout, SharedIncidentForm | content |
| `src/pages/Settings.tsx` | `Settings` | default | Settings and resources combined page | App (route) | Layout, ResourcesSection | content |
| `src/pages/Resources.tsx` | `Resources` | default | Legacy resources page (redirects) | App (route) | Layout, ResourcesSection | content |
| `src/pages/ViewIncident.tsx` | `ViewIncident` | default | Single incident view page | App (route) | Layout, IncidentCard | content |
| `src/pages/NotFound.tsx` | `NotFound` | default | 404 error page | App (route) | - | content |

## Modal Components (Portal Layer)

| Path | Component | Export | Purpose | Parents | Children | UI Layer |
|------|-----------|--------|---------|---------|----------|----------|
| `src/components/IncidentModal.tsx` | `IncidentModal` | named | Quick add/edit incident modal | Home, others | Dialog, SharedIncidentForm | modal |
| `src/components/ConsentModal.tsx` | `ConsentModal` | named | Initial consent/onboarding modal | App | - | modal |
| `src/components/BulkExportModal.tsx` | `BulkExportModal` | named | Bulk export incidents dialog | BulkBarMobile | Dialog | modal |
| `src/components/ExportModal.tsx` | `ExportModal` | named | Single incident export dialog | IncidentCard | Dialog | modal |
| `src/components/ExportOptionsModal.tsx` | `ExportOptionsModal` | named | Export format selection modal | BulkBarMobile | Dialog | modal |
| `src/components/ConfirmDeleteModal.tsx` | `ConfirmDeleteModal` | named | Delete confirmation dialog | Multiple | AlertDialog | modal |
| `src/components/PolicyModal.tsx` | `PolicyModal` | named | Legal policy display modal | Settings | Dialog | modal |
| `src/components/ResourceModal.tsx` | `ResourceModal` | named | Resource content modal | ResourcesSection | Dialog | modal |
| `src/components/EmergencyContactsModal.tsx` | `EmergencyContactsModal` | named | Emergency contacts manager | ResourcesSection | Dialog | modal |
| `src/components/feedback/RateAppModal.tsx` | `RateAppModal` | default | App rating prompt dialog | App | Dialog | modal |
| `src/components/feedback/FeedbackModal.tsx` | `FeedbackModal` | default | User feedback form | RateAppModal | Dialog | modal |
| `src/components/paywall/PaywallModal.tsx` | `PaywallModal` | default | Subscription paywall dialog | PaywallWrapper | Dialog | modal |
| `src/components/common/ConfirmModal.tsx` | `ConfirmModal` | default | Generic confirmation modal | Multiple | createPortal | modal |

## Form Components

| Path | Component | Export | Purpose | Parents | Children | UI Layer |
|------|-----------|--------|---------|---------|----------|----------|
| `src/components/SharedIncidentForm.tsx` | `SharedIncidentForm` | named | Main incident form component | AddIncident, IncidentModal | Form fields, buttons | content |
| `src/components/PillInputs.tsx` | `PillInput` | named | Tag/pill input component | SharedIncidentForm | Input | content |

## List & Card Components

| Path | Component | Export | Purpose | Parents | Children | UI Layer |
|------|-----------|--------|---------|---------|----------|----------|
| `src/components/IncidentCard.tsx` | `IncidentCard` | named | Individual incident display card | Home | IncidentCardHeader, actions | content |
| `src/components/IncidentCardHeader.tsx` | `IncidentCardHeader` | named | Incident card header section | IncidentCard | - | content |
| `src/components/IncidentListControls.tsx` | `IncidentListControls` | named | List view controls (bulk actions) | Home | BulkBarMobile | content |
| `src/components/ContactCard.tsx` | `ContactCard` | named | Emergency contact display card | EmergencyContactsModal | PhoneLink | content |

## Utility Components

| Path | Component | Export | Purpose | Parents | Children | UI Layer |
|------|-----------|--------|---------|---------|----------|----------|
| `src/components/ScrollToTop.tsx` | `ScrollToTop` | default | Auto-scroll on route change | App | - | utility |
| `src/components/IncidentRedirect.tsx` | `IncidentRedirect` | named | Legacy route redirect handler | App (route) | - | utility |
| `src/components/common/ScreenPrivacyOverlay.tsx` | `ScreenPrivacyOverlay` | default | Privacy screen for app switching | App | - | overlay |
| `src/components/Toast.tsx` | `Toast` | named | Custom toast notification | Multiple | - | toast |
| `src/components/SuccessToast.tsx` | `SuccessToast` | named | Success message toast | Multiple | createPortal | toast |

## Specialized Components

| Path | Component | Export | Purpose | Parents | Children | UI Layer |
|------|-----------|--------|---------|---------|----------|----------|
| `src/components/ads/InlineAd.tsx` | `InlineAd` | default | Advertisement display component | Home, others | - | content |
| `src/components/export/ReportHeader.tsx` | `ReportHeader` | named | Export report header formatting | Export generators | - | print |
| `src/components/icons/CustomIcons.tsx` | `PlusIcon, FileIcon` | named | Custom SVG icon components | Multiple | - | content |
| `src/components/GrammarImprovementIndicator.tsx` | `GrammarImprovementIndicator` | named | AI grammar improvement indicator | SharedIncidentForm | - | content |

## Modal and Portal Architecture

**Modal Rendering Layer**: All modals use React Portals and render to `document.body`. There is no dedicated modal root element.

**Modal Components Use**:
- `@radix-ui/react-dialog` for standard modals
- `@radix-ui/react-alert-dialog` for confirmations  
- `createPortal` from `react-dom` for custom modals

**Chart Rendering**: Charts use `recharts` library and render inline within their parent components (no separate chart layer).

## Key Props Patterns

**Modal Props**: `{ open: boolean, onOpenChange: (open: boolean) => void }`
**Form Props**: `{ onSubmit: () => void, initialData?: any }`  
**Card Props**: `{ incident: Incident, onUpdate?: () => void }`
**List Props**: `{ items: T[], onItemClick?: (item: T) => void }`