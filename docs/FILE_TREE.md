# ClearCase - File Tree Structure

## Project Root
```
clearcase/
├── .env
├── .env.production
├── README.md
├── capacitor.config.ts
├── eslint.config.js
├── index.html
├── vite.config.ts
├── tailwind.config.ts
├── tsconfig.json
├── tsconfig.app.json
├── tsconfig.node.json
├── postcss.config.js
├── components.json
├── package.json
├── package-lock.json
├── bun.lockb
├── .gitignore
│
├── docs/                           # Generated documentation (this directory)
│   ├── FILE_TREE.md
│   ├── COMPONENT_MAP.md
│   ├── ROUTE_MAP.md
│   ├── UI_EDIT_GUIDE.md
│   ├── SEARCH_QUERIES.md
│   └── component-index.json
│
├── public/                         # Static assets
│   ├── icon-192.png
│   ├── icon-512.png
│   ├── apple-touch-icon.png
│   ├── manifest.webmanifest
│   ├── robots.txt
│   ├── brand/
│   │   └── clearcase-mark.png
│   └── lovable-uploads/
│       ├── 57e14644-6765-4dfd-a219-99bb00bbbbc6.png
│       ├── 581b2158-980b-43c9-89b0-e73fc6de832d.png
│       └── 9b8aa48f-bbf3-4956-ba85-a4ca7f06362f.png
│
├── src/                            # Main source directory
│   ├── main.tsx                    # App entry point
│   ├── App.tsx                     # Root app component with routing
│   ├── App.css                     # Legacy app styles
│   ├── index.css                   # Main CSS with design system
│   ├── vite-env.d.ts              # Vite type definitions
│   │
│   ├── components/                 # Reusable UI components
│   │   ├── Layout.tsx              # Main layout wrapper
│   │   ├── Footer.tsx              # App footer
│   │   ├── BottomNav.tsx           # Mobile bottom navigation
│   │   ├── BrandLogo.tsx           # Brand logo component
│   │   ├── ScrollToTop.tsx         # Router scroll utility
│   │   │
│   │   ├── common/                 # Common UI components
│   │   │   ├── AppHeader.tsx       # Main app header/nav
│   │   │   ├── ConfirmModal.tsx    # Confirmation dialog
│   │   │   └── ScreenPrivacyOverlay.tsx # Privacy screen overlay
│   │   │
│   │   ├── ui/                     # shadcn/ui components
│   │   │   ├── button.tsx
│   │   │   ├── dialog.tsx
│   │   │   ├── alert-dialog.tsx
│   │   │   ├── card.tsx
│   │   │   ├── input.tsx
│   │   │   ├── textarea.tsx
│   │   │   ├── select.tsx
│   │   │   ├── toast.tsx
│   │   │   ├── toaster.tsx
│   │   │   ├── sonner.tsx
│   │   │   ├── use-toast.ts
│   │   │   └── [40+ other shadcn components]
│   │   │
│   │   ├── feedback/               # User feedback components
│   │   │   ├── FeedbackModal.tsx
│   │   │   └── RateAppModal.tsx
│   │   │
│   │   ├── paywall/                # Subscription/paywall components
│   │   │   ├── PaywallModal.tsx
│   │   │   ├── PaywallWrapper.tsx
│   │   │   └── RemoveAdsPrompt.tsx
│   │   │
│   │   ├── settings/               # Settings page components
│   │   │   ├── DataStorageCard.tsx
│   │   │   ├── IntegrationModal.tsx
│   │   │   └── SecurityPrivacyCard.tsx
│   │   │
│   │   ├── navigation/             # Navigation components
│   │   │   └── AppMenuDrawer.tsx
│   │   │
│   │   ├── export/                 # Export functionality
│   │   │   └── ReportHeader.tsx
│   │   │
│   │   ├── icons/                  # Custom icons
│   │   │   └── CustomIcons.tsx
│   │   │
│   │   ├── ads/                    # Advertisement components
│   │   │   └── InlineAd.tsx
│   │   │
│   │   └── [30+ incident/modal components]
│   │       ├── IncidentModal.tsx
│   │       ├── IncidentCard.tsx
│   │       ├── ConsentModal.tsx
│   │       ├── ExportModal.tsx
│   │       └── [other modals...]
│   │
│   ├── pages/                      # Route page components
│   │   ├── Home.tsx                # Main home/incidents page
│   │   ├── AddIncident.tsx         # Add new incident page
│   │   ├── Settings.tsx            # Settings page
│   │   ├── Resources.tsx           # Resources page (redirects to Settings)
│   │   ├── ViewIncident.tsx        # View incident page
│   │   ├── NotFound.tsx            # 404 error page
│   │   └── Index.tsx               # Blank index (unused)
│   │
│   ├── styles/                     # CSS modules and styles
│   │   ├── typography.css
│   │   ├── paywall.css
│   │   ├── print.css
│   │   ├── sensitive.css
│   │   ├── settings.css
│   │   └── modal.css
│   │
│   ├── hooks/                      # React hooks
│   │   ├── use-mobile.tsx
│   │   ├── use-toast.ts
│   │   ├── useEnsureExportAuth.ts
│   │   └── useExportIncident.ts
│   │
│   ├── lib/                        # Core business logic
│   │   ├── utils.ts
│   │   ├── platform.ts
│   │   ├── subscription.ts
│   │   ├── paywall-bridge.ts
│   │   ├── nativeAuth.ts
│   │   ├── iap.ts
│   │   └── [20+ other utilities]
│   │
│   ├── services/                   # External service integrations
│   │   ├── ai.ts
│   │   ├── incidents.ts
│   │   ├── grammarService.ts
│   │   └── [other services]
│   │
│   ├── utils/                      # Helper utilities
│   │   ├── storage.ts
│   │   ├── datetime.ts
│   │   ├── backup.ts
│   │   └── [30+ other utilities]
│   │
│   ├── state/                      # State management
│   │   ├── settingsStore.ts
│   │   ├── aiQuotaStore.ts
│   │   ├── pin.ts
│   │   └── selection.ts
│   │
│   ├── types/                      # TypeScript type definitions
│   │   ├── incident.d.ts
│   │   ├── incidents.ts
│   │   ├── export.ts
│   │   └── structured-incidents.ts
│   │
│   ├── ui/                         # UI utilities
│   │   └── incidentDisplay.ts
│   │
│   ├── helpers/                    # Helper functions
│   │   └── people.ts
│   │
│   ├── content/                    # Static content (markdown)
│   │   ├── legal/
│   │   │   ├── privacy.md
│   │   │   ├── terms.md
│   │   │   └── cookies.md
│   │   └── resources/
│   │       ├── incident-reporting-guidelines.md
│   │       └── investigation-checklist.md
│   │
│   └── integrations/               # External integrations
│       ├── index.ts
│       └── supabase/
│           ├── client.ts
│           └── types.ts (read-only)
│
├── supabase/                       # Supabase backend configuration
│   ├── config.toml
│   └── functions/
│       ├── improve-grammar/
│       ├── organize-incidents/
│       ├── parse-incident-notes/
│       ├── parse-notes/
│       ├── rewrite-incident/
│       └── send-feedback/
│
├── scripts/                        # Build and utility scripts
│   └── verify-ios-preflight.mjs
│
└── ios/                           # iOS Capacitor build (generated)
    ├── App/
    ├── Podfile
    ├── Podfile.lock
    └── [iOS build artifacts]
```

## Key UI Architecture Notes

- **Entry Point**: `src/main.tsx` → `src/App.tsx`
- **Layout Wrapper**: `src/components/Layout.tsx` (contains AppHeader + Footer)
- **Routing**: React Router setup in `src/App.tsx`
- **Modal Layer**: Portals render to document body (no specific modal root)
- **Design System**: Defined in `src/index.css` + `tailwind.config.ts`
- **Mobile Navigation**: `src/components/BottomNav.tsx` (sticky bottom)
- **Charts**: Uses Recharts library (in components as needed)