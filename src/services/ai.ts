import { supabase } from "@/integrations/supabase/client";
import type { OrganizedIncident } from "@/types/incidents";

export async function organizeIncidents(rawNotes: string): Promise<OrganizedIncident[]> {
  const { data, error } = await supabase.functions.invoke("organize-incidents", {
    body: { notes: rawNotes },
  });

  if (error) {
    throw new Error(error.message || "Service error");
  }

  if (!data?.ok) {
    const msg = data?.errors?.join("; ") || "Service returned error";
    throw new Error(msg);
  }

  // Map normalized response to OrganizedIncident format
  const incidents = (data?.normalized?.incidents ?? []).map((incident: any) => ({
    date: incident.date || "",
    categoryOrIssue: incident.category || "",
    who: Array.isArray(incident.who) ? incident.who.join(", ") : incident.who || "",
    what: incident.what || "",
    where: incident.where || "",
    when: incident.when || "",
    witnesses: Array.isArray(incident.witnesses) ? incident.witnesses.join(", ") : incident.witnesses || "",
    notes: incident.notes || ""
  })) as OrganizedIncident[];
  
  return incidents;
}