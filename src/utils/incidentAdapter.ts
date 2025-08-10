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
  // Parse timeline events from when/what fields
  const timelineEvents: TimelineEvent[] = [];
  
  // If we have a when field, try to extract timeline events
  if (apiIncident.when) {
    const timeEntries = apiIncident.when.split(/[,;]/).map(entry => entry.trim()).filter(Boolean);
    timeEntries.forEach(entry => {
      const timeMatch = entry.match(/(\d{1,2}:\d{2}\s?(?:AM|PM|am|pm)?)/);
      if (timeMatch) {
        const time = timeMatch[1];
        const event = entry.replace(timeMatch[0], '').replace(/^[-–]\s*/, '').trim();
        if (event) {
          timelineEvents.push({
            time,
            event,
            quotes: []
          });
        }
      }
    });
  }
  
  // Fallback: create a single timeline event from what field if no timeline parsed
  if (timelineEvents.length === 0 && apiIncident.what) {
    timelineEvents.push({
      time: null,
      event: apiIncident.what,
      quotes: []
    });
  }

  // Parse notes to extract structured information
  const notes = apiIncident.notes || '';
  const requestsAndResponses = [];
  const policyOrProcedure = [];
  const evidenceOrTests = [];
  const additionalNotes = [];

  if (notes) {
    const lines = notes.split(/[.\n]/).map(line => line.trim()).filter(Boolean);
    
    for (const line of lines) {
      const lowerLine = line.toLowerCase();
      
      // Extract requests/responses
      if (lowerLine.includes('request') && (lowerLine.includes('denied') || lowerLine.includes('approved'))) {
        const denied = lowerLine.includes('denied');
        requestsAndResponses.push({
          request: line.replace(/denied|approved/gi, '').trim(),
          response: denied ? 'denied' : 'approved',
          byWhom: null
        });
      }
      // Extract policy violations
      else if (lowerLine.includes('policy') || lowerLine.includes('procedure')) {
        policyOrProcedure.push(line);
      }
      // Extract evidence/testing info
      else if (lowerLine.includes('test') || lowerLine.includes('lab') || lowerLine.includes('sample')) {
        evidenceOrTests.push({
          type: lowerLine.includes('lab') ? 'lab test' : 'test',
          detail: line,
          status: lowerLine.includes('confused') || lowerLine.includes('unclear') ? 'unclear' : 'performed'
        });
      }
      // Other notes
      else if (line.length > 10) { // Skip very short fragments
        additionalNotes.push(line);
      }
    }
  }

  // Parse names from who array into categorized groups
  const whoGroups = {
    accused: [],
    accusers: [],
    managers: apiIncident.who.filter(name => name.toLowerCase().includes('manager')),
    unionStewards: apiIncident.who.filter(name => name.toLowerCase().includes('steward')),
    security: apiIncident.who.filter(name => name.toLowerCase().includes('security')),
    others: apiIncident.who.filter(name => {
      const lowerName = name.toLowerCase();
      return !lowerName.includes('manager') && !lowerName.includes('steward') && !lowerName.includes('security');
    })
  };

  return {
    date: apiIncident.date || null,
    category: apiIncident.category || "Uncategorized",
    who: whoGroups,
    where: apiIncident.where || null,
    timeline: timelineEvents,
    whatHappened: apiIncident.what || "No description provided",
    requestsAndResponses,
    policyOrProcedure,
    evidenceOrTests,
    witnesses: [], // Only include people explicitly mentioned as witnesses in the notes
    outcomeOrNext: null,
    notes: additionalNotes
  };
}