/**
 * Voice normalizer for converting incident reports to first-person perspective
 * Maintains third-person for other people and preserves quoted speech
 */

export interface VoiceNormalizationOptions {
  authorPerspective: 'first_person' | 'third_person';
}

export function normalizeToFirstPerson(text: string, options: VoiceNormalizationOptions = { authorPerspective: 'first_person' }): string {
  if (options.authorPerspective !== 'first_person') {
    return text;
  }

  // Split text into segments, preserving quoted sections
  const segments = splitPreservingQuotes(text);
  
  return segments.map(segment => {
    if (segment.isQuote) {
      // Don't modify quoted text
      return segment.text;
    }
    
    return normalizeSegment(segment.text);
  }).join('');
}

interface TextSegment {
  text: string;
  isQuote: boolean;
}

function splitPreservingQuotes(text: string): TextSegment[] {
  const segments: TextSegment[] = [];
  const quotePattern = /(["""].*?["""]|'[^']*'|"[^"]*")/g;
  let lastIndex = 0;
  let match;

  while ((match = quotePattern.exec(text)) !== null) {
    // Add non-quoted text before this quote
    if (match.index > lastIndex) {
      segments.push({
        text: text.slice(lastIndex, match.index),
        isQuote: false
      });
    }
    
    // Add the quoted text
    segments.push({
      text: match[0],
      isQuote: true
    });
    
    lastIndex = match.index + match[0].length;
  }
  
  // Add remaining non-quoted text
  if (lastIndex < text.length) {
    segments.push({
      text: text.slice(lastIndex),
      isQuote: false
    });
  }
  
  return segments;
}

function normalizeSegment(text: string): string {
  // Patterns for converting third-person reporter references to first-person
  const replacements = [
    // Direct reporter references
    { pattern: /\bthe reporting employee\b/gi, replacement: 'I' },
    { pattern: /\bthe employee who reported\b/gi, replacement: 'I' },
    { pattern: /\bthe worker who reported\b/gi, replacement: 'I' },
    { pattern: /\bthe person reporting\b/gi, replacement: 'I' },
    
    // Possessive forms
    { pattern: /\bthe reporting employee's\b/gi, replacement: 'my' },
    { pattern: /\bthe employee's\b/gi, replacement: 'my' },
    { pattern: /\bthe worker's\b/gi, replacement: 'my' },
    
    // When clearly referring to the reporter in context
    { pattern: /\bthe employee(?=\s+(?:was|felt|experienced|reported|stated|said|told|asked|requested|complained|noted|observed|witnessed))/gi, replacement: 'I' },
    { pattern: /\bthe worker(?=\s+(?:was|felt|experienced|reported|stated|said|told|asked|requested|complained|noted|observed|witnessed))/gi, replacement: 'I' },
    
    // Handle verb agreement after replacements
    { pattern: /\bI were\b/g, replacement: 'I was' },
    { pattern: /\bI are\b/g, replacement: 'I am' },
    { pattern: /\bI have been\b/g, replacement: 'I was' }, // Context dependent
  ];

  let result = text;
  
  for (const { pattern, replacement } of replacements) {
    result = result.replace(pattern, replacement);
  }
  
  // Fix capitalization issues after replacements
  result = fixCapitalization(result);
  
  return result;
}

function fixCapitalization(text: string): string {
  // Ensure 'I' is always capitalized
  text = text.replace(/\bi\b/g, 'I');
  
  // Fix sentence beginnings
  text = text.replace(/(^|\. )([a-z])/g, (match, prefix, letter) => prefix + letter.toUpperCase());
  
  return text;
}

// Test function for validation
export function testVoiceNormalization(): { test: string; input: string; expected: string; actual: string; passed: boolean }[] {
  const testCases = [
    {
      test: 'Basic reporting employee conversion',
      input: 'The reporting employee was approached by the manager.',
      expected: 'I was approached by the manager.'
    },
    {
      test: 'Preserve quoted speech',
      input: 'The manager said "the employee needs to improve" to the reporting employee.',
      expected: 'The manager said "the employee needs to improve" to me.'
    },
    {
      test: 'Possessive conversion',
      input: "The reporting employee's concerns were dismissed.",
      expected: 'My concerns were dismissed.'
    },
    {
      test: 'Context-sensitive employee reference',
      input: 'The employee was told to stop by the supervisor.',
      expected: 'I was told to stop by the supervisor.'
    },
    {
      test: 'Preserve third-person for others',
      input: 'The manager and the employee discussed the issue.',
      expected: 'The manager and I discussed the issue.'
    }
  ];

  return testCases.map(testCase => {
    const actual = normalizeToFirstPerson(testCase.input);
    return {
      ...testCase,
      actual,
      passed: actual === testCase.expected
    };
  });
}