import { Layout } from '@/components/Layout';
import IncidentExplorer from '@/components/incidents/IncidentExplorer';

export default function IncidentsPage() {
  return (
    <Layout>
      <div className="space-y-4 -mt-4 pb-[calc(var(--bottom-inset,58px)+8px)]">
        <IncidentExplorer />
      </div>
    </Layout>
  );
}