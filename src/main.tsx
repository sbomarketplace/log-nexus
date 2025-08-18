import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { migrateIncidentsToDateTime } from './utils/incidentMigration'

// Run migration on app startup
migrateIncidentsToDateTime()

createRoot(document.getElementById("root")!).render(<App />);
