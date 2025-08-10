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
  const incidents = (data?.normalized?.incidents ?? []).map((incident: any) => {
    // Handle structured notes object
    let notesText = "";
    if (incident.notes) {
      if (typeof incident.notes === 'object' && incident.notes !== null) {
        // Convert structured notes object to formatted text
        const notesObj = incident.notes;
        const sections = [];
        
        if (notesObj.Timeline) sections.push(`Timeline:\n${notesObj.Timeline}`);
        if (notesObj["Requests/Responses"]) sections.push(`Requests/Responses:\n${notesObj["Requests/Responses"]}`);
        if (notesObj["Policy Violations"]) sections.push(`Policy Violations:\n${notesObj["Policy Violations"]}`);
        if (notesObj["Important Quotes"]) sections.push(`Important Quotes:\n${notesObj["Important Quotes"]}`);
        if (notesObj["Evidence/Testing"]) sections.push(`Evidence/Testing:\n${notesObj["Evidence/Testing"]}`);
        if (notesObj["Additional Details"]) sections.push(`Additional Details:\n${notesObj["Additional Details"]}`);
        
        notesText = sections.join('\n\n');
      } else {
        notesText = String(incident.notes);
      }
    }

    return {
      date: incident.date || "",
      categoryOrIssue: incident.category || "",
      who: Array.isArray(incident.who) ? incident.who.join(", ") : incident.who || "",
      what: incident.what || "",
      where: incident.where || "",
      when: incident.when || "",
      witnesses: Array.isArray(incident.witnesses) ? incident.witnesses.join(", ") : incident.witnesses || "",
      notes: notesText
    };
  }) as OrganizedIncident[];
  
  return incidents;
}