/**
 * Safe prefill utility that applies parsed notes data without overwriting existing values
 */

import { parseNotesToStructured } from "./notesParser";
import { combineLocalDateAndTime, toUTCISO } from "@/utils/incidentFormatting";
import { OrganizedIncident } from "@/utils/organizedIncidentStorage";

export function prefillIncidentFromNotes(incident: OrganizedIncident): Partial<OrganizedIncident> {
  const result: Partial<OrganizedIncident> = {};
  
  // Check what's already filled
  const alreadyHasDate = Boolean(incident.dateTime || incident.datePart);
  const alreadyHasTime = Boolean(incident.dateTime || incident.timePart);

  // Parse from notes only if both parts are blank
  if (!alreadyHasDate || !alreadyHasTime) {
    const sourceText = (incident.notes || incident.what || "").trim();
    
    if (sourceText) {
      const parsed = parseNotesToStructured({ text: sourceText });

      // Date and time mapping with safe defaults
      if (!alreadyHasDate && parsed.date) {
        result.datePart = parsed.date;
      }
      
      if (!alreadyHasTime && parsed.time) {
        // If we now have both date and time, prefer dateTime
        const date = (result.datePart || incident.datePart) as string | undefined;
        if (date && parsed.time) {
          try {
            const local = combineLocalDateAndTime(date, parsed.time);
            result.dateTime = toUTCISO(local);
            result.datePart = undefined;
            result.timePart = undefined;
          } catch (error) {
            // If combining fails, just set the time part
            result.timePart = parsed.time;
          }
        } else {
          result.timePart = parsed.time;
        }
      }

      // Optional field prefill (only if empty)
      if (!incident.where && parsed.where) {
        result.where = parsed.where;
      }
      
      if ((!incident.witnesses || incident.witnesses.length === 0) && parsed.witnesses?.length) {
        result.witnesses = parsed.witnesses.join(', ');
      }
      
      if (!incident.categoryOrIssue && parsed.category) {
        result.categoryOrIssue = parsed.category;
      }

      // Store people information in the 'who' field if empty
      if (!incident.who && parsed.people?.length) {
        result.who = parsed.people.join(', ');
      }

      // Store quotes and requests in notes if they exist and notes field is not too full
      if (parsed.quotes?.length || parsed.requests?.length) {
        let additionalNotes = '';
        
        if (parsed.quotes?.length) {
          additionalNotes += '\n\nQuotes:\n';
          parsed.quotes.forEach(quote => {
            if (quote.speaker) {
              additionalNotes += `${quote.speaker}: "${quote.text}"\n`;
            } else {
              additionalNotes += `"${quote.text}"\n`;
            }
          });
        }
        
        if (parsed.requests?.length) {
          additionalNotes += '\n\nRequests/Responses:\n';
          parsed.requests.forEach(req => {
            additionalNotes += `- ${req}\n`;
          });
        }
        
        // Only append if current notes aren't too long
        if (incident.notes && incident.notes.length < 8000 && additionalNotes.length < 2000) {
          result.notes = incident.notes + additionalNotes.trim();
        }
      }
    }
  }
  
  return result;
}

/**
 * Check if an incident needs one-time prefill (has no date/time data)
 */
export function shouldRunOneTimePrefill(incident: OrganizedIncident): boolean {
  return !incident.dateTime && !incident.datePart && !incident.timePart;
}