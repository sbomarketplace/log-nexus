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
  
  // Extract time only (no event details) from when field
  let timeOnly = "Time unspecified";
  if (apiIncident.when) {
    const timeMatch = apiIncident.when.match(/(\d{1,2}:\d{2}\s?(?:AM|PM|am|pm)?)/);
    if (timeMatch) {
      timeOnly = timeMatch[1];
    }
  }
  
  // Create timeline events from structured what/when data
  if (apiIncident.what) {
    timelineEvents.push({
      time: timeOnly !== "Time unspecified" ? timeOnly : null,
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

  // Parse explicit witnesses only (not just anyone mentioned)
  const explicitWitnesses = [];
  if (notes) {
    const witnessMatches = notes.match(/witness(?:es)?:?\s*([^.]+)/gi);
    if (witnessMatches) {
      witnessMatches.forEach(match => {
        const names = match.replace(/witness(?:es)?:?\s*/gi, '').split(/[,;&]/).map(n => n.trim()).filter(Boolean);
        explicitWitnesses.push(...names);
      });
    }
  }

  // Parse who field with explicit roles only
  const whoWithRoles = [];
  apiIncident.who.forEach(person => {
    // Check if role is explicitly mentioned in the notes for this person
    const lowerNotes = notes.toLowerCase();
    const lowerPerson = person.toLowerCase();
    
    let role = null;
    if (lowerNotes.includes(`${lowerPerson}`) && lowerNotes.includes('manager')) {
      const managerPattern = new RegExp(`${lowerPerson}[^.]*manager|manager[^.]*${lowerPerson}`, 'i');
      if (managerPattern.test(notes)) role = 'Manager';
    }
    if (lowerNotes.includes(`${lowerPerson}`) && lowerNotes.includes('steward')) {
      const stewardPattern = new RegExp(`${lowerPerson}[^.]*steward|steward[^.]*${lowerPerson}`, 'i');
      if (stewardPattern.test(notes)) role = 'Union Steward';
    }
    if (lowerNotes.includes(`${lowerPerson}`) && lowerNotes.includes('security')) {
      const securityPattern = new RegExp(`${lowerPerson}[^.]*security|security[^.]*${lowerPerson}`, 'i');
      if (securityPattern.test(notes)) role = 'Security';
    }
    
    whoWithRoles.push(role ? `${person} (${role})` : person);
  });

  // Determine location type
  let whereLocation = apiIncident.where || "Location unspecified";
  if (whereLocation.toLowerCase().includes('email')) {
    whereLocation = "Email communication";
  } else if (whereLocation.toLowerCase().includes('phone') || whereLocation.toLowerCase().includes('telephone')) {
    whereLocation = "Telephone communication";
  } else if (whereLocation.toLowerCase().includes('chat') || whereLocation.toLowerCase().includes('message')) {
    whereLocation = "Digital chat platform";
  }

  // Generate unique incident summary - null safety for date access
  const summaryParts = [];
  const safeDate = apiIncident?.date;
  if (safeDate && safeDate.trim()) summaryParts.push(`On ${safeDate}`);
  if (whereLocation !== "Location unspecified") summaryParts.push(`at ${whereLocation}`);
  if (timeOnly !== "Time unspecified") summaryParts.push(`around ${timeOnly}`);
  
  const mainEvent = additionalNotes.length > 0 ? additionalNotes[0] : apiIncident.what;
  if (mainEvent) summaryParts.push(mainEvent);
  
  if (whoWithRoles.length > 0) {
    summaryParts.push(`Individuals involved include ${whoWithRoles.join(', ')}`);
  }
  
  const uniqueSummary = summaryParts.join(', ') + '.';

  // Categorize people based on explicit mentions only
  const whoGroups = {
    accused: [],
    accusers: [],
    managers: [],
    unionStewards: [],
    security: [],
    others: whoWithRoles
  };

  return {
    date: apiIncident?.date || null,
    category: apiIncident?.category || "Uncategorized",
    who: whoGroups,
    where: whereLocation,
    timeline: timelineEvents,
    whatHappened: additionalNotes.length > 0 ? additionalNotes.join(' ') : apiIncident.what || "No description provided",
    requestsAndResponses,
    policyOrProcedure,
    evidenceOrTests,
    witnesses: explicitWitnesses,
    outcomeOrNext: null,
    notes: [uniqueSummary]
  };
}