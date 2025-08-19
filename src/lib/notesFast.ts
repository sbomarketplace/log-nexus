// src/lib/notesFast.ts
import { extractCaseNumberFlexible } from "./caseNumber";

export function quickScan(text = ""): { time?: string | null; caseNumber?: string | null } {
  // Fast extraction of case number for instant UI feedback
  const caseNumber = extractCaseNumberFlexible(text);
  
  // Fast time extraction - prefer from "Timeline" section first, then anywhere
  let time: string | null = null;
  
  // Look for times in timeline section first
  const timelineMatch = text.match(/timeline[:\s]*(.+?)(?:\n\n|\n[A-Z]|$)/is);
  if (timelineMatch) {
    const timeMatch = timelineMatch[1].match(/\b(\d{1,2}):(\d{2})\s*(AM|PM|am|pm)?\b/);
    if (timeMatch) {
      let hour = parseInt(timeMatch[1]);
      const minute = timeMatch[2];
      const meridiem = timeMatch[3]?.toUpperCase();
      
      // Convert to 12-hour format with AM/PM
      if (meridiem) {
        time = `${hour}:${minute} ${meridiem}`;
      } else {
        // Convert 24-hour to 12-hour
        const ampm = hour >= 12 ? 'PM' : 'AM';
        if (hour > 12) hour -= 12;
        if (hour === 0) hour = 12;
        time = `${hour}:${minute} ${ampm}`;
      }
    }
  }
  
  // If no time found in timeline, look anywhere in text
  if (!time) {
    const globalTimeMatch = text.match(/\b(\d{1,2}):(\d{2})\s*(AM|PM|am|pm)?\b/);
    if (globalTimeMatch) {
      let hour = parseInt(globalTimeMatch[1]);
      const minute = globalTimeMatch[2];
      const meridiem = globalTimeMatch[3]?.toUpperCase();
      
      if (meridiem) {
        time = `${hour}:${minute} ${meridiem}`;
      } else {
        const ampm = hour >= 12 ? 'PM' : 'AM';
        if (hour > 12) hour -= 12;
        if (hour === 0) hour = 12;
        time = `${hour}:${minute} ${ampm}`;
      }
    }
  }
  
  return { time, caseNumber };
}