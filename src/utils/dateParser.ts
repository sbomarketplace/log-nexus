/**
 * Natural language date parser for incident reporting
 * Supports flexible human inputs and infers past dates
 */

export interface ParsedDate {
  canonicalEventDate: string; // ISO 8601 string
  originalEventDateText: string; // Original input
  confidence: 'high' | 'medium' | 'low';
}

const MONTHS = {
  'january': 0, 'jan': 0,
  'february': 1, 'feb': 1,
  'march': 2, 'mar': 2,
  'april': 3, 'apr': 3,
  'may': 4,
  'june': 5, 'jun': 5,
  'july': 6, 'jul': 6,
  'august': 7, 'aug': 7,
  'september': 8, 'sep': 8, 'sept': 8,
  'october': 9, 'oct': 9,
  'november': 10, 'nov': 10,
  'december': 11, 'dec': 11
};

const TIME_PATTERNS = {
  'morning': '09:00',
  'afternoon': '14:00',
  'evening': '18:00',
  'night': '20:00',
  'noon': '12:00',
  'midnight': '00:00'
};

export function parseIncidentDate(input: string, referenceDate = new Date()): ParsedDate | null {
  if (!input?.trim()) return null;

  const originalText = input.trim();
  const text = originalText.toLowerCase();
  
  // Handle relative dates
  const relativeResult = parseRelativeDate(text, referenceDate);
  if (relativeResult) {
    return {
      canonicalEventDate: relativeResult.toISOString(),
      originalEventDateText: originalText,
      confidence: 'high'
    };
  }

  // Handle absolute dates
  const absoluteResult = parseAbsoluteDate(text, referenceDate);
  if (absoluteResult) {
    return {
      canonicalEventDate: absoluteResult.date.toISOString(),
      originalEventDateText: originalText,
      confidence: absoluteResult.confidence
    };
  }

  return null;
}

function parseRelativeDate(text: string, referenceDate: Date): Date | null {
  const today = new Date(referenceDate);
  today.setHours(12, 0, 0, 0); // Set to noon to avoid timezone issues

  if (text.includes('today')) {
    const timeMatch = extractTime(text);
    if (timeMatch) {
      const [hours, minutes] = timeMatch.split(':').map(Number);
      today.setHours(hours, minutes, 0, 0);
    }
    return today;
  }

  if (text.includes('yesterday')) {
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const timeMatch = extractTime(text);
    if (timeMatch) {
      const [hours, minutes] = timeMatch.split(':').map(Number);
      yesterday.setHours(hours, minutes, 0, 0);
    }
    return yesterday;
  }

  // Handle "last [day of week]"
  const lastDayMatch = text.match(/last\s+(monday|tuesday|wednesday|thursday|friday|saturday|sunday)/);
  if (lastDayMatch) {
    const targetDayName = lastDayMatch[1];
    const targetDay = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'].indexOf(targetDayName);
    const currentDay = today.getDay();
    
    let daysBack = currentDay - targetDay;
    if (daysBack <= 0) daysBack += 7; // Go to previous week
    
    const targetDate = new Date(today);
    targetDate.setDate(targetDate.getDate() - daysBack);
    
    const timeMatch = extractTime(text);
    if (timeMatch) {
      const [hours, minutes] = timeMatch.split(':').map(Number);
      targetDate.setHours(hours, minutes, 0, 0);
    }
    
    return targetDate;
  }

  return null;
}

function parseAbsoluteDate(text: string, referenceDate: Date): { date: Date; confidence: 'high' | 'medium' | 'low' } | null {
  const currentYear = referenceDate.getFullYear();
  
  // Try MM/DD/YYYY, M/D/YY, MM-DD-YYYY formats
  const fullDateMatch = text.match(/(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{2,4})/);
  if (fullDateMatch) {
    const month = parseInt(fullDateMatch[1]) - 1;
    const day = parseInt(fullDateMatch[2]);
    let year = parseInt(fullDateMatch[3]);
    
    if (year < 100) year += 2000; // Convert 2-digit year
    
    if (month >= 0 && month <= 11 && day >= 1 && day <= 31) {
      const date = new Date(year, month, day, 12, 0, 0, 0);
      const timeMatch = extractTime(text);
      if (timeMatch) {
        const [hours, minutes] = timeMatch.split(':').map(Number);
        date.setHours(hours, minutes, 0, 0);
      }
      return { date, confidence: 'high' };
    }
  }

  // Try MM/DD or M/D (assume current year or most recent past)
  const shortDateMatch = text.match(/(\d{1,2})[\/\-\.](\d{1,2})(?![\/\-\.])/);
  if (shortDateMatch) {
    const month = parseInt(shortDateMatch[1]) - 1;
    const day = parseInt(shortDateMatch[2]);
    
    if (month >= 0 && month <= 11 && day >= 1 && day <= 31) {
      // Create date in local timezone at noon to avoid timezone conversion issues
      let date = new Date(currentYear, month, day, 12, 0, 0, 0);
      
      // If the date is in the future, use previous year
      if (date > referenceDate) {
        date = new Date(currentYear - 1, month, day, 12, 0, 0, 0);
      }
      
      const timeMatch = extractTime(text);
      if (timeMatch) {
        const [hours, minutes] = timeMatch.split(':').map(Number);
        date.setHours(hours, minutes, 0, 0);
      }
      
      return { date, confidence: 'medium' };
    }
  }

  // Try "Month DD" or "Month DD, YYYY"
  const monthDayMatch = text.match(/\b(january|february|march|april|may|june|july|august|september|october|november|december|jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec)\s+(\d{1,2})(?:,?\s*(\d{4}))?\b/);
  if (monthDayMatch) {
    const monthName = monthDayMatch[1];
    const day = parseInt(monthDayMatch[2]);
    const year = monthDayMatch[3] ? parseInt(monthDayMatch[3]) : currentYear;
    const month = MONTHS[monthName as keyof typeof MONTHS];
    
    if (month !== undefined && day >= 1 && day <= 31) {
      let date = new Date(year, month, day, 12, 0, 0, 0);
      
      // If no year specified and date is in future, use previous year
      if (!monthDayMatch[3] && date > referenceDate) {
        date = new Date(currentYear - 1, month, day, 12, 0, 0, 0);
      }
      
      const timeMatch = extractTime(text);
      if (timeMatch) {
        const [hours, minutes] = timeMatch.split(':').map(Number);
        date.setHours(hours, minutes, 0, 0);
      }
      
      return { date, confidence: 'high' };
    }
  }

  return null;
}

function extractTime(text: string): string | null {
  // Handle times like "8pm", "3:30am", "15:30"
  const timeMatch = text.match(/(\d{1,2})(?::(\d{2}))?\s*(am|pm|a\.m\.|p\.m\.)?/);
  if (timeMatch) {
    let hours = parseInt(timeMatch[1]);
    const minutes = timeMatch[2] ? parseInt(timeMatch[2]) : 0;
    const meridiem = timeMatch[3];
    
    if (meridiem) {
      const isPM = meridiem.toLowerCase().includes('p');
      if (isPM && hours !== 12) hours += 12;
      if (!isPM && hours === 12) hours = 0;
    }
    
    if (hours >= 0 && hours <= 23 && minutes >= 0 && minutes <= 59) {
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
    }
  }

  // Handle named times
  for (const [name, time] of Object.entries(TIME_PATTERNS)) {
    if (text.includes(name)) {
      return time;
    }
  }

  return null;
}

export function formatDisplayDate(isoString: string): string {
  try {
    const date = new Date(isoString);
    const hasTime = date.getHours() !== 12 || date.getMinutes() !== 0;
    
    if (hasTime) {
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit'
      });
    }
    
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  } catch {
    return 'Invalid date';
  }
}