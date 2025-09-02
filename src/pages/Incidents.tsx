import IncidentExplorer from "@/components/incidents/IncidentExplorer";

export default function IncidentsPage() {
  return (
    <main className="safe-top safe-bottom">
      <section className="mx-auto w-full max-w-screen-md px-4">
        <IncidentExplorer />
      </section>
    </main>
  );
}
