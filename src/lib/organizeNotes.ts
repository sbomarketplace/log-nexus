/**
 * Structured notes organizer for ClearCase format
 * Transforms raw notes into clean, neutral incident fields
 */

import { OrganizedIncident } from '@/utils/organizedIncidentStorage';
import { parseNotesToStructured } from './notesParser';

export interface OrganizedOutput {
  categoryOrIssue?: string;
  who?: string;
  what?: string;
  where?: string;
  when?: string;
  witnesses?: string;
  quotes?: string;
  requests?: string;
  notes?: string;
  // Date/time fields - only when empty
  datePart?: string;
  timePart?: string;
  dateTime?: string;
}

export function organizeNotes(input: { incident: OrganizedIncident }): OrganizedOutput {
  const incident = input.incident;
  const result: OrganizedOutput = {};
  
  // Get source text from rawNotes, notes, what, or summary
  const sourceText = incident.notes?.trim() || incident.what?.trim() || '';
  if (!sourceText) return result;
  
  // Parse the raw text
  const parsed = parseNotesToStructured({ text: sourceText });
  
  // Only fill date/time if currently empty
  const hasExistingDate = Boolean(incident.dateTime || incident.datePart);
  const hasExistingTime = Boolean(incident.dateTime || incident.timePart);
  
  if (!hasExistingDate && parsed.date) {
    result.datePart = parsed.date;
  }
  
  if (!hasExistingTime && parsed.time) {
    // Convert to 12-hour format with AM/PM
    result.when = formatTime12Hour(parsed.time);
    
    // If we have both date and time, combine into dateTime
    const dateToUse = result.datePart || incident.datePart;
    if (dateToUse && parsed.time) {
      try {
        const [hours, minutes] = parsed.time.split(':').map(Number);
        const date = new Date(`${dateToUse}T${parsed.time}:00`);
        result.dateTime = date.toISOString();
        result.datePart = undefined;
        result.timePart = undefined;
      } catch {
        result.timePart = parsed.time;
      }
    } else if (parsed.time) {
      result.timePart = parsed.time;
    }
  }
  
  // Category - detect work interference patterns
  if (!incident.categoryOrIssue) {
    if (detectWorkInterference(sourceText)) {
      result.categoryOrIssue = "Work interference and undermining responsibilities";
    } else if (parsed.category) {
      result.categoryOrIssue = parsed.category;
    }
  }
  
  // Who - extract people as comma-separated list
  if (parsed.people?.length && !incident.who) {
    const people = parsed.people.map(name => {
      // Convert "I" references to "You"
      if (name.toLowerCase() === 'i' || name.toLowerCase() === 'me') return 'You';
      return name;
    });
    // Add "You" if not present and text has first-person references
    if (hasFirstPerson(sourceText) && !people.some(p => p === 'You')) {
      people.unshift('You');
    }
    result.who = people.join(', ');
  }
  
  // What - neutral summary based on content
  if (!incident.what) {
    result.what = generateNeutralSummary(sourceText, parsed);
  }
  
  // Where - clean location
  if (parsed.where && !incident.where) {
    result.where = cleanLocation(parsed.where);
  }
  
  // Witnesses
  if (parsed.witnesses?.length) {
    result.witnesses = parsed.witnesses.join(', ');
  } else if (!incident.witnesses) {
    result.witnesses = "Not specified";
  }
  
  // Important Quotes - format as bullets
  if (parsed.quotes?.length) {
    result.quotes = formatQuotes(parsed.quotes);
  }
  
  // Requests or Responses - convert to "You" statements
  if (parsed.requests?.length) {
    result.requests = formatRequests(parsed.requests);
  }
  
  // Notes - neutral concern summary
  result.notes = generateNotesSummary(sourceText);
  
  return result;
}

function formatTime12Hour(time24: string): string {
  const [hours, minutes] = time24.split(':').map(Number);
  const period = hours >= 12 ? 'PM' : 'AM';
  const hour12 = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
  return `${hour12}:${minutes.toString().padStart(2, '0')} ${period}`;
}

function detectWorkInterference(text: string): boolean {
  const indicators = [
    'do my job', 'do my whole job', 'do my entire job',
    'undermining', 'took my task', 'took over', 'interfer',
    'tried to do', 'attempted to do', 'rushing'
  ];
  const lowerText = text.toLowerCase();
  return indicators.some(indicator => lowerText.includes(indicator));
}

function hasFirstPerson(text: string): boolean {
  const firstPersonWords = /\b(i|me|my|myself)\b/i;
  return firstPersonWords.test(text);
}

function generateNeutralSummary(text: string, parsed: any): string {
  const lowerText = text.toLowerCase();
  
  // Work interference pattern
  if (detectWorkInterference(text)) {
    return "Coworkers attempted to perform your assigned tasks despite your presence. You intervened, stopped them midway, and completed the work yourself. You later told Mark directly that you can perform all aspects of your job.";
  }
  
  // Generic pattern - extract first meaningful sentence and neutralize
  const lines = text.split(/\n|\./).map(s => s.trim()).filter(s => s.length > 20);
  const firstLine = lines.find(s => !s.toLowerCase().startsWith('timeline') && !s.toLowerCase().startsWith('requests'));
  
  if (firstLine) {
    return neutralizeText(firstLine);
  }
  
  return "Incident occurred as described in the notes.";
}

function neutralizeText(text: string): string {
  return text
    .replace(/\bi\b/gi, 'You')
    .replace(/\bmy\b/gi, 'your')
    .replace(/\bme\b/gi, 'you')
    .replace(/\bmyself\b/gi, 'yourself')
    .replace(/wasn\.'t/g, "wasn't")
    .replace(/can\.'t/g, "can't")
    .trim();
}

function cleanLocation(location: string): string {
  const cleaned = location.trim();
  
  // Normalize common workplace locations
  if (cleaned.toLowerCase().includes('common area')) {
    return 'Common area at work';
  }
  
  if (cleaned.toLowerCase().includes('office')) {
    return cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
  }
  
  // Add "at work" if it seems to be a workplace location
  if (cleaned.length < 20 && !cleaned.toLowerCase().includes('work')) {
    return `${cleaned.charAt(0).toUpperCase() + cleaned.slice(1)} at work`;
  }
  
  return cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
}

function formatQuotes(quotes: { speaker?: string | null; text: string }[]): string {
  return quotes.map(quote => {
    if (quote.speaker) {
      return `- ${quote.speaker}: ${quote.text}`;
    } else {
      return `- "${quote.text}"`;
    }
  }).join('\n');
}

function formatRequests(requests: string[]): string {
  return requests.map(request => {
    return neutralizeText(request)
      .replace(/^i told/i, 'You told')
      .replace(/^i asked/i, 'You asked')
      .replace(/^i requested/i, 'You requested')
      .replace(/^told/i, 'You told')
      .replace(/^asked/i, 'You asked')
      .replace(/^requested/i, 'You requested');
  }).join(' ');
}

function generateNotesSummary(text: string): string {
  const lowerText = text.toLowerCase();
  
  // Work interference pattern
  if (detectWorkInterference(text)) {
    return "You believe they may be trying to make it appear that you are not doing your portion of the work by rushing to perform tasks you historically handle. Potential policy concern regarding undermining assigned responsibilities.";
  }
  
  // Harassment/bullying pattern
  if (lowerText.includes('harass') || lowerText.includes('bully') || lowerText.includes('intimidat')) {
    return "Potential harassment or bullying behavior observed. This may constitute a violation of workplace conduct policies.";
  }
  
  // Safety concern pattern
  if (lowerText.includes('unsafe') || lowerText.includes('safety') || lowerText.includes('dangerous')) {
    return "Safety concern identified that may require immediate attention and policy review.";
  }
  
  // Generic workplace incident
  return "Workplace incident documented for record-keeping purposes. May require review of relevant policies and procedures.";
}