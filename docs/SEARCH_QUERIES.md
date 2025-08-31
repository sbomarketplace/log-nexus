# ClearCase - VS Code Search Queries

Copy and paste these search queries into VS Code's search (`Ctrl/Cmd + Shift + F`) to quickly locate UI elements.

## 🔍 Header and App Chrome

```
AppHeader OR "export default function AppHeader" OR "app-header"
```

```
BrandLogo OR "clearcase-mark.png" OR "ClearCase" className
```

```
"sticky top-0" OR "z-\[900\]" OR "backdrop-blur"
```

## 📱 Footer and Bottom Navigation

```
BottomNav OR "export default function BottomNav" OR "bottom-nav"
```

```
Footer OR "export const Footer" OR "© SBO Marketplace"
```

```
"nav-home" OR "nav-add" OR "nav-settings" OR IconHome OR IconPlus OR IconGear
```

```
"fixed bottom-0" OR "bottom-nav" OR "safe-bottom"
```

## 🍔 Drawer or Side Menu

```
SlideOverMenu OR AppMenuDrawer OR "hamburger" OR "side menu"
```

```
Drawer OR Sheet OR "slide-over" OR "menu-drawer"
```

```
"MenuSheet" OR "slideOver" OR "drawer-content"
```

## 📋 Modal and Dialog Components

```
Modal OR Dialog OR "createPortal\(" OR "modal-root"
```

```
IncidentModal OR BulkExportModal OR ConsentModal OR PolicyModal
```

```
"AlertDialog" OR "DialogContent" OR "DialogTitle" OR "DialogHeader"
```

```
"cc-float-modal" OR "cc-modal" OR "modal-overlay"
```

```
"open.*onOpenChange" OR "isOpen.*onClose" OR "modalOpen.*setModalOpen"
```

## 📊 Charts and Data Visualization

```
Chart OR Recharts OR "recharts" OR "LineChart" OR "AreaChart" OR "BarChart"
```

```
"ResponsiveContainer" OR "XAxis" OR "YAxis" OR "CartesianGrid"
```

```
"chart-container" OR "data-viz" OR "visualization"
```

## 📄 Layout and Page Structure

```
Layout\.tsx OR AppLayout OR "export const Layout" OR "children.*LayoutProps"
```

```
"page-container" OR "max-w-7xl" OR "min-h-\[100dvh\]"
```

```
"main className" OR "page-content" OR "content-wrapper"
```

## 🛣️ Routing and Navigation

```
Routes OR Route.*path= OR BrowserRouter OR "react-router-dom"
```

```
"element=\{<" OR "path=\"/" OR "Route path"
```

```
Navigate OR useNavigate OR "redirect" OR IncidentRedirect
```

```
"to=\"/" OR "href=\"/" OR Link.*to=
```

## 🎨 Styling and Design System

```
index\.css OR tailwind\.config OR "design system" OR ":root"
```

```
"--primary" OR "--background" OR "--foreground" OR "hsl\(var\("
```

```
"theme\.extend" OR "colors:" OR "borderRadius:" OR "animation:"
```

```
"className=" OR "class=" OR "@apply" OR "layer base"
```

## 📱 Form Components and Inputs

```
SharedIncidentForm OR "incident.*form" OR "form-container"
```

```
Input OR Textarea OR Select OR Button OR "form.*field"
```

```
"react-hook-form" OR "useForm" OR "register" OR "formState"
```

```
PillInput OR "pill.*input" OR "tag.*input" OR "badge.*input"
```

## 🎯 State Management

```
useState OR useEffect OR "store" OR "atom" OR zustand
```

```
settingsStore OR aiQuotaStore OR "state/" OR "store\.ts"
```

```
"react-query" OR "useQuery" OR "useMutation" OR QueryClient
```

## 🔔 Notifications and Toasts

```
Toast OR Sonner OR "toast" OR "notification"
```

```
"useToast" OR "showToast" OR "toaster" OR "success.*toast"
```

```
SuccessToast OR "createPortal.*toast" OR "toast-container"
```

## 🔐 Authentication and Security

```
ConsentModal OR "consent" OR "privacy" OR "terms"
```

```
auth OR "authenticated" OR "login" OR "session"
```

```
ScreenPrivacyOverlay OR "privacy.*screen" OR "app.*switching"
```

## 💳 Paywall and Subscription

```
PaywallModal OR PaywallWrapper OR "paywall" OR "subscription"
```

```
"iap" OR "in-app.*purchase" OR "revenue.*cat" OR "purchase"
```

```
"premium" OR "pro" OR "upgrade" OR "billing"
```

## 📤 Export and Sharing

```
ExportModal OR BulkExportModal OR "export" OR "share"
```

```
"docx" OR "pdf" OR "txt" OR "export.*format"
```

```
"jspdf" OR "docx.*generator" OR "file-saver" OR nativeShare
```

## 🎲 Utilities and Helpers

```
utils\.ts OR "utility" OR "helper" OR "lib/"
```

```
"datetime" OR "format" OR "parse" OR "validate"
```

```
"storage" OR "localStorage" OR "backup" OR "migration"
```

## 📱 Native and Capacitor

```
Capacitor OR "native" OR "ios" OR "android"
```

```
"@capacitor" OR "cordova" OR "platform.*native"
```

```
"isNative" OR "platform\.ts" OR "device"
```

## 🔧 Configuration Files

```
vite\.config OR tailwind\.config OR "config\.ts" OR "config\.js"
```

```
package\.json OR tsconfig OR eslint\.config OR "\.env"
```

```
components\.json OR capacitor\.config OR supabase.*config
```

---

## 🎯 Component-Specific Quick Finds

### Find Specific Incident Components
```
IncidentCard OR IncidentCardHeader OR IncidentListControls
```

### Find All Modal Components
```
Modal\.tsx$ OR Dialog.*\.tsx$ OR "Modal.*export"
```

### Find All Page Components  
```
pages/.*\.tsx$ OR "pages/" OR "export default.*Page"
```

### Find Styled Components
```
"styled" OR "emotion" OR "tw-" OR "cn\(" OR "clsx"
```

### Find Error Boundaries and Loading States
```
"loading" OR "error" OR "fallback" OR "Suspense" OR "ErrorBoundary"
```

---

## 💡 Advanced Search Patterns

**Find All Exports**: `export.*function|export.*const|export.*default`
**Find Props Interfaces**: `interface.*Props`  
**Find Event Handlers**: `onClick|onSubmit|onChange|onOpen|onClose`
**Find CSS Classes**: `className=|class=`
**Find Imports**: `import.*from`
**Find TypeScript Types**: `type.*=|interface.*{`

**Regex Search Tips**: 
- Enable regex with the `.*` button in VS Code search
- Use `\b` for word boundaries
- Use `$` for end of line matching
- Use `|` for OR conditions