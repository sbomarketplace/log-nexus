import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import './styles/typography.css'
import './styles/paywall.css'
import './styles/safe-area.css'
import './styles/ios.css'
import { migrateIncidentsToDateTime } from './utils/incidentMigration'
import { isNative } from './lib/platform'
import { SubscriptionProvider } from './lib/subscription'

// Run migration on app startup
migrateIncidentsToDateTime()

// Disable service worker registration on native platforms
if (!isNative && 'serviceWorker' in navigator) {
  // Only register service worker on web
  // navigator.serviceWorker.register('/sw.js').catch(console.warn);
}

createRoot(document.getElementById("root")!).render(
  <SubscriptionProvider>
    <App />
  </SubscriptionProvider>
);
