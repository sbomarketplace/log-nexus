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

export function parseMultipleIncidents(rawText: string): ParsedIncident[] {
  if (!rawText || !rawText.trim()) {
    return [];
  }

  // Enhanced splitting patterns for multiple incidents
  const datePatterns = [
    /(?:^|\n)(\d{1,2}\/\d{1,2}(?:\/\d{2,4})?)\s*[-–—]\s*/gm,
    /(?:^|\n)((?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{1,2}(?:,?\s+\d{4})?)\s*[-–—]\s*/gm,
    /(?:^|\n)((?:Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday),?\s+(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{1,2}(?:,?\s+\d{4})?)\s*[-–—]\s*/gm,
    /(?:^|\n)(?:Date|Incident|Event):\s*(\d{1,2}\/\d{1,2}(?:\/\d{2,4})?)/gm,
    /(?:^|\n)=+\s*(\d{1,2}\/\d{1,2}(?:\/\d{2,4})?)/gm
  ];

  let incidents: ParsedIncident[] = [];
  let remainingText = rawText;

  // Try each pattern to split incidents
  for (const pattern of datePatterns) {
    const matches = Array.from(remainingText.matchAll(pattern));
    
    if (matches.length > 0) {
      // Split by date markers
      let lastIndex = 0;
      
      matches.forEach((match, index) => {
        if (index > 0) {
          // Extract text between previous match and current match
          const prevMatch = matches[index - 1];
          const startIndex = prevMatch.index! + prevMatch[0].length;
          const endIndex = match.index!;
          const incidentText = remainingText.substring(startIndex, endIndex).trim();
          
          if (incidentText) {
            const parsed = parseIncidentSection(incidentText, prevMatch[1]);
            if (parsed.what || parsed.title) {
              incidents.push(parsed);
            }
          }
        }
        
        // Handle the last incident
        if (index === matches.length - 1) {
          const startIndex = match.index! + match[0].length;
          const lastIncidentText = remainingText.substring(startIndex).trim();
          
          if (lastIncidentText) {
            const parsed = parseIncidentSection(lastIncidentText, match[1]);
            if (parsed.what || parsed.title) {
              incidents.push(parsed);
            }
          }
        }
      });
      
      // If we found incidents with this pattern, stop trying other patterns
      if (incidents.length > 0) {
        break;
      }
    }
  }

  // If no date patterns worked, treat as single incident
  if (incidents.length === 0) {
    const singleIncident = parseIncidentSection(rawText);
    if (singleIncident.what || singleIncident.title) {
      incidents.push(singleIncident);
    }
  }

  return incidents;
}

function parseIncidentSection(text: string, extractedDate?: string): ParsedIncident {
  const result: ParsedIncident = {};

  // Enhanced metadata extraction
  result.title = extractTitle(text);
  result.location = extractLocation(text);
  result.category = extractCategory(text);
  result.peopleInvolved = extractPeopleInvolved(text);

  // Parse date
  if (extractedDate) {
    result.date = parseDate(extractedDate);
  } else {
    const dateMatch = text.match(/(\d{1,2}\/\d{1,2}(?:\/\d{2,4})?)/);
    if (dateMatch) {
      result.date = parseDate(dateMatch[1]);
    }
  }

  // Parse time
  const timeMatch = text.match(/(\d{1,2}:\d{2}(?:\s*[AP]M)?)/i);
  if (timeMatch) {
    result.time = timeMatch[1];
  }

  // Parse main content as "what happened"
  result.what = text.trim();

  // Format location as full sentence
  if (result.location) {
    result.where = `Incident occurred at ${result.location}.`;
  } else {
    const whereMatch = text.match(/(?:where|location|at|in):\s*([^\n]+)/i);
    if (whereMatch) {
      result.where = `Incident occurred at ${whereMatch[1].trim()}.`;
      result.location = whereMatch[1].trim();
    }
  }

  // Parse why
  const whyMatch = text.match(/(?:why|because|reason|cause):\s*([^\n]+)/i);
  if (whyMatch) {
    result.why = whyMatch[1].trim();
  }

  // Parse how
  const howMatch = text.match(/(?:how|method|manner):\s*([^\n]+)/i);
  if (howMatch) {
    result.how = howMatch[1].trim();
  }

  // Parse people involved
  result.who = [];
  const peopleMatches = text.match(/(?:people|who|involved|present):\s*([^\n]+)/i);
  if (peopleMatches) {
    const people = peopleMatches[1].split(',').map(p => p.trim());
    result.who = people.map(person => {
      const roleSeparator = person.indexOf('(');
      if (roleSeparator > -1) {
        const name = person.substring(0, roleSeparator).trim();
        const role = person.substring(roleSeparator + 1, person.indexOf(')')).trim();
        return { name, role };
      }
      return { name: person };
    });
  }

  // Parse witnesses
  const witnessMatches = text.match(/(?:witness|witnesses|saw|present):\s*([^\n]+)/i);
  if (witnessMatches) {
    const witnesses = witnessMatches[1].split(',').map(w => w.trim());
    result.witnesses = witnesses.map(witness => ({ name: witness }));
  }

  // Parse union involvement
  const unionMatches = text.match(/(?:union|representative|rep|steward):\s*([^\n]+)/i);
  if (unionMatches) {
    result.unionInvolvement = [{
      name: unionMatches[1].trim(),
      union: 'Union Representative',
      notes: 'Extracted from incident notes'
    }];
  }

  return result;
}

// Legacy exports for backward compatibility
export const parseIncidentNote = (text: string): ParsedIncident => {
  return parseIncidentSection(text);
};