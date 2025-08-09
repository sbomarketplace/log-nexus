export interface IncidentEvent {
  date: string;            // ISO date string
  category: string;        // "Accusation", "Harassment", etc.
  who: string;              // Comma-separated list of people, properly capitalized
  what: string;             // Short description of incident
  where: string;            // Location
  when: string;              // Time of day
  witnesses: string;         // Comma-separated list of names
  notes: string;             // Detailed notes
}

export interface IncidentRecord {
  id: string;                // UUID
  created_at: string;        // Supabase timestamp
  events: IncidentEvent[];   // Array of parsed events
}

export type Incident = {
  date: string;
  category: string;
  who: string;
  what: string;
  where: string;
  when: string;
  witnesses: string;
  notes: string;
};

export type OrganizeResponse = {
  incidents: Incident[];
};

export interface OrganizedIncident {
  date: string;
  categoryOrIssue: string;
  who: string;
  what: string;
  where: string;
  when: string;
  witnesses: string;
  notes: string;
}