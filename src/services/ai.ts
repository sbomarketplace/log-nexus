import type { OrganizedIncident } from "@/types/incidents";

const FN_PATH = "/functions/v1/organize-incidents";

export async function organizeIncidents(rawNotes: string): Promise<OrganizedIncident[]> {
  const url = `${import.meta.env.VITE_SUPABASE_URL ?? ""}${FN_PATH}`;

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ rawNotes }),
  });

  if (!res.ok) {
    let msg = "Service error";
    try {
      const j = await res.json();
      if (j?.error) msg = j.error;
    } catch {
      /* ignore */
    }
    throw new Error(msg);
  }

  const data = await res.json();
  const incidents = (data?.incidents ?? []) as OrganizedIncident[];
  return incidents;
}