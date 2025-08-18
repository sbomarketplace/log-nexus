/**
 * Utility for extracting date and time information from incident data
 */

export interface ExtractedDateTime {
  date?: string; // Original date text like "6/8"
  time?: string; // First time from timeline like "12:23pm"
}

/**
 * Extracts the first time mentioned in a timeline string
 * Looks for patterns like "12:23pm", "3:45 AM", "14:30", etc.
 */
export function extractFirstTimeFromTimeline(timeline?: string): string | null {
  if (!timeline?.trim()) return null;
  
  const timePatterns = [
    // 12-hour format with am/pm
    /\b(\d{1,2}:\d{2}\s*(?:am|pm|a\.m\.|p\.m\.?))\b/gi,
    // 24-hour format
    /\b(\d{1,2}:\d{2})(?:\s|$|[^\d:])/g,
    // Hour only with am/pm
    /\b(\d{1,2}\s*(?:am|pm|a\.m\.|p\.m\.?))\b/gi
  ];
  
  for (const pattern of timePatterns) {
    const matches = timeline.match(pattern);
    if (matches && matches.length > 0) {
      return matches[0].trim();
    }
  }
  
  return null;
}

/**
 * Converts time text to 24-hour HH:mm format for form inputs
 */
export function normalizeTimeForInput(timeText: string): string {
  if (!timeText) return '';
  
  // Remove extra spaces and normalize
  const normalized = timeText.trim().toLowerCase();
  
  // Handle 12-hour format
  const twelveHourMatch = normalized.match(/(\d{1,2})(?::(\d{2}))?\s*(am|pm|a\.m\.|p\.m\.?)/);
  if (twelveHourMatch) {
    let hours = parseInt(twelveHourMatch[1]);
    const minutes = parseInt(twelveHourMatch[2] || '0');
    const meridiem = twelveHourMatch[3];
    
    const isPM = meridiem.includes('p');
    
    if (isPM && hours !== 12) hours += 12;
    if (!isPM && hours === 12) hours = 0;
    
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  }
  
  // Handle 24-hour format or hour only
  const twentyFourHourMatch = normalized.match(/(\d{1,2})(?::(\d{2}))?/);
  if (twentyFourHourMatch) {
    const hours = parseInt(twentyFourHourMatch[1]);
    const minutes = parseInt(twentyFourHourMatch[2] || '0');
    
    if (hours >= 0 && hours <= 23 && minutes >= 0 && minutes <= 59) {
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
    }
  }
  
  return '';
}

/**
 * Converts date text like "6/8" to YYYY-MM-DD format for form inputs
 * Assumes current year if not specified, and past date if in future
 */
export function normalizeDateForInput(dateText: string, referenceDate = new Date()): string {
  if (!dateText?.trim()) return '';
  
  const text = dateText.trim();
  const currentYear = referenceDate.getFullYear();
  
  // Handle MM/DD or M/D format
  const shortDateMatch = text.match(/(\d{1,2})\/(\d{1,2})$/);
  if (shortDateMatch) {
    const month = parseInt(shortDateMatch[1]);
    const day = parseInt(shortDateMatch[2]);
    
    if (month >= 1 && month <= 12 && day >= 1 && day <= 31) {
      let year = currentYear;
      const testDate = new Date(year, month - 1, day);
      
      // If the date is in the future, use previous year
      if (testDate > referenceDate) {
        year = currentYear - 1;
      }
      
      return `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
    }
  }
  
  // Handle MM/DD/YYYY format
  const fullDateMatch = text.match(/(\d{1,2})\/(\d{1,2})\/(\d{2,4})/);
  if (fullDateMatch) {
    const month = parseInt(fullDateMatch[1]);
    const day = parseInt(fullDateMatch[2]);
    let year = parseInt(fullDateMatch[3]);
    
    if (year < 100) year += 2000; // Convert 2-digit year
    
    if (month >= 1 && month <= 12 && day >= 1 && day <= 31) {
      return `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
    }
  }
  
  return '';
}

/**
 * Gets the preferred date and time from incident data
 * Prioritizes original date text and first timeline time
 */
export function getPreferredDateTime(incident: any): ExtractedDateTime {
  const result: ExtractedDateTime = {};
  
  // Prioritize original date text (like "6/8")
  if (incident.originalEventDateText?.trim()) {
    result.date = normalizeDateForInput(incident.originalEventDateText);
  }
  
  // Extract first time from timeline (like "12:23pm")
  const firstTime = extractFirstTimeFromTimeline(incident.timeline);
  if (firstTime) {
    result.time = normalizeTimeForInput(firstTime);
  }
  
  return result;
}