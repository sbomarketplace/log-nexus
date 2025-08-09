export interface TimelineEvent {
  time?: string | null;              // "8:00 AM", "9:25 AM"
  event: string;                     // concise event sentence
  quotes?: string[];                 // verbatim quotes if present
}

export interface RequestResponse {
  request: string;                   // e.g., "Requested search and dog sniff"
  response: "approved" | "denied" | "unknown";
  byWhom?: string | null;            // who approved/denied
}

export interface EvidenceTest {
  type: string;                      // "lab test", "rapid test", "security report"
  detail?: string;
  status?: string;                   // "performed", "planned", "unclear"
}

export interface StructuredIncident {
  date: string | null;                 // e.g., "7/22" or ISO if present
  category: string;                    // e.g., "Wrongful Accusation", "Harassment"
  who: {
    accused?: string[];                // people accused
    accusers?: string[];               // managers, reporters
    managers?: string[];
    unionStewards?: string[];
    security?: string[];
    others?: string[];
  };
  where: string | null;
  timeline: TimelineEvent[];
  whatHappened: string;                // stitched narrative (keep detail, no summarizing away)
  requestsAndResponses: RequestResponse[];
  policyOrProcedure: string[];         // explicit policy notes (e.g., "Two managers must approach together")
  evidenceOrTests: EvidenceTest[];
  witnesses: string[];                 // explicitly listed witnesses
  outcomeOrNext: string | null;        // outcome or next steps (if any)
  notes: string[];                     // keep extra details verbatim lines
}

export interface StructuredIncidentResponse {
  incidents: StructuredIncident[];
}