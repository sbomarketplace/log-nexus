import type { StructuredIncident, TimelineEvent } from "@/types/structured-incidents";

// API response shape from organize-incidents function
interface ApiIncident {
  date: string;
  category: string;
  who: string[];
  what: string;
  where: string;
  when: string;
  witnesses: string[];
  notes: string;
}

export function adaptApiToStructuredIncident(apiIncident: ApiIncident): StructuredIncident {
  // Create a timeline event from the what/when fields
  const timelineEvent: TimelineEvent = {
    time: apiIncident.when || null,
    event: apiIncident.what || "No event description provided",
    quotes: []
  };

  // Parse names from who array into categorized groups
  const whoGroups = {
    accused: [],
    accusers: [],
    managers: [],
    unionStewards: [],
    security: [],
    others: apiIncident.who || []
  };

  return {
    date: apiIncident.date || null,
    category: apiIncident.category || "Uncategorized",
    who: whoGroups,
    where: apiIncident.where || null,
    timeline: [timelineEvent],
    whatHappened: apiIncident.what || "No description provided",
    requestsAndResponses: [],
    policyOrProcedure: [],
    evidenceOrTests: [],
    witnesses: apiIncident.witnesses || [],
    outcomeOrNext: null,
    notes: apiIncident.notes ? [apiIncident.notes] : []
  };
}