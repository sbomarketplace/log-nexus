import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import './styles/typography.css'
import './styles/paywall.css'
import { migrateIncidentsToDateTime } from './utils/incidentMigration'
import { isNative } from './lib/platform'

// Run migration on app startup
migrateIncidentsToDateTime()

// Disable service worker registration on native platforms
if (!isNative && 'serviceWorker' in navigator) {
  // Only register service worker on web
  // navigator.serviceWorker.register('/sw.js').catch(console.warn);
}

createRoot(document.getElementById("root")!).render(<App />);
