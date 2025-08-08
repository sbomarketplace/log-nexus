import { Person, UnionInvolvement } from '@/types/incident';

interface ParsedIncident {
  title?: string;
  date?: string;
  time?: string;
  location?: string; // Enhanced: extracted location
  category?: string; // Enhanced: inferred category
  peopleInvolved?: string[]; // Enhanced: quick list of people names
  what?: string;
  where?: string;
  why?: string;
  how?: string;
  who?: Person[];
  witnesses?: Person[];
  unionInvolvement?: UnionInvolvement[];
}

// Enhanced category detection keywords
const categoryKeywords = {
  'Wrongful Accusation': ['false', 'wrongful', 'accused', 'allegation', 'unfair'],
  'Disciplinary Action': ['written up', 'discipline', 'reprimand', 'suspension', 'warning'],
  'Harassment': ['harassment', 'hostile', 'bullying', 'intimidation', 'discrimination'],
  'Safety Violation': ['safety', 'unsafe', 'hazard', 'injury', 'accident', 'violation'],
  'Workplace Conflict': ['conflict', 'dispute', 'argument', 'confrontation', 'disagreement'],
  'Policy Violation': ['policy', 'procedure', 'rule', 'violation', 'breach'],
  'Retaliation': ['retaliation', 'revenge', 'payback', 'targeting'],
  'Work Environment': ['environment', 'conditions', 'workplace', 'facilities']
};

// Enhanced location detection patterns
const locationPatterns = [
  /(?:in|at|near|by)\s+(?:the\s+)?([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*(?:\s+(?:room|area|department|office|floor|building|section|zone|desk|station)))/gi,
  /(?:room|area|department|office|floor|building|section|zone)\s+([A-Z0-9][A-Za-z0-9\s]*)/gi,
  /([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\s+(?:room|area|department|office|floor|building)/gi
];

// Enhanced people detection patterns with role context
const peoplePatterns = [
  /(?:supervisor|manager|boss|lead|director|hr|human resources)\s+([A-Z][a-z]+(?:\s+[A-Z]\.?)?)/gi,
  /([A-Z][a-z]+(?:\s+[A-Z]\.?)?)\s+(?:said|told|asked|stated|mentioned|claimed)/gi,
  /(?:witness|witnesses?):\s*([A-Z][a-z]+(?:\s+[A-Z]\.?)?(?:,\s*[A-Z][a-z]+(?:\s+[A-Z]\.?)?)*)/gi,
  /(?:with|from|by|to)\s+([A-Z][a-z]+(?:\s+[A-Z]\.?)?)/gi,
  /([A-Z][a-z]+)\s+(?:was|is|had|has|did|does)/gi,
  /(?:who|people involved):\s*([A-Z][a-z]+(?:\s+[A-Z]\.?)?(?:,\s*[A-Z][a-z]+(?:\s+[A-Z]\.?)?)*)/gi
];

function extractTitle(text: string): string {
  // Extract first meaningful sentence or create from key elements
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 10);
  if (sentences.length > 0) {
    return sentences[0].trim().substring(0, 80) + (sentences[0].length > 80 ? '...' : '');
  }
  
  // Fallback: create title from key words
  const words = text.split(/\s+/).slice(0, 10);
  return words.join(' ').substring(0, 80) + (words.join(' ').length > 80 ? '...' : '');
}

function extractLocation(text: string): string | undefined {
  // First check for explicit location patterns
  const locationMarkers = [
    /(?:where|location|at|in):\s*([^\n\.]+)/gi,
    /(?:occurred at|happened at|took place at)\s+([^\n\.]+)/gi
  ];
  
  for (const marker of locationMarkers) {
    const match = text.match(marker);
    if (match) {
      return match[1].trim();
    }
  }
  
  // Then check general location patterns
  for (const pattern of locationPatterns) {
    const matches = Array.from(text.matchAll(pattern));
    if (matches.length > 0) {
      const location = matches[0][1]?.trim();
      if (location && location.length > 2) {
        return location;
      }
    }
  }
  return undefined;
}

function extractCategory(text: string): string | undefined {
  const lowerText = text.toLowerCase();
  
  for (const [category, keywords] of Object.entries(categoryKeywords)) {
    if (keywords.some(keyword => lowerText.includes(keyword))) {
      return category;
    }
  }
  return undefined;
}

function extractPeopleInvolved(text: string): string[] {
  const people = new Set<string>();
  
  // Extract from explicit patterns first
  const explicitPatterns = [
    /(?:who|people involved|witnesses?):\s*([A-Z][a-z]+(?:\s+[A-Z]\.?)?(?:,\s*[A-Z][a-z]+(?:\s+[A-Z]\.?)?)*)/gi,
    /(?:witness|witnesses?)\s+(?:by|were)\s+([A-Z][a-z]+(?:\s+[A-Z]\.?)?(?:,\s*[A-Z][a-z]+(?:\s+[A-Z]\.?)?)*)/gi
  ];
  
  for (const pattern of explicitPatterns) {
    const matches = Array.from(text.matchAll(pattern));
    matches.forEach(match => {
      const names = match[1].split(',').map(n => n.trim());
      names.forEach(name => {
        if (name && name.length > 1 && name.length < 30) {
          // Capitalize first letter of each word
          const capitalizedName = name.split(' ').map(word => 
            word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
          ).join(' ');
          people.add(capitalizedName);
        }
      });
    });
  }
  
  // Fall back to general patterns if no explicit mentions
  if (people.size === 0) {
    for (const pattern of peoplePatterns) {
      const matches = Array.from(text.matchAll(pattern));
      matches.forEach(match => {
        const name = match[1]?.trim();
        if (name && name.length > 1 && name.length < 30) {
          const capitalizedName = name.split(' ').map(word => 
            word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
          ).join(' ');
          people.add(capitalizedName);
        }
      });
    }
  }
  
  return Array.from(people).slice(0, 5); // Limit to 5 names for display
}

function parseDate(dateStr: string): string {
  // Convert various date formats to YYYY-MM-DD
  const cleanDate = dateStr.replace(/[^\d\/\-]/g, '');
  const parts = cleanDate.split(/[\/\-]/);
  
  if (parts.length === 3) {
    // Handle MM/DD/YYYY or MM/DD/YY formats
    if (parts[2].length === 2) {
      parts[2] = '20' + parts[2]; // Assume 20xx for 2-digit years
    }
    
    if (parts[0].length <= 2 && parts[1].length <= 2) {
      // MM/DD/YYYY format
      const month = parts[0].padStart(2, '0');
      const day = parts[1].padStart(2, '0');
      const year = parts[2];
      return `${year}-${month}-${day}`;
    }
  }
  
  return dateStr; // Return as-is if can't parse
}
