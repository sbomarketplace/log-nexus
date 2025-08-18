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
    // Direct reporter references - expanded to catch more cases
    { pattern: /\bthe reporting employee\b/gi, replacement: 'I' },
    { pattern: /\bthe employee who reported\b/gi, replacement: 'I' },
    { pattern: /\bthe worker who reported\b/gi, replacement: 'I' },
    { pattern: /\bthe person reporting\b/gi, replacement: 'I' },
    
    // Possessive forms - more comprehensive
    { pattern: /\bthe reporting employee's\b/gi, replacement: 'my' },
    { pattern: /\bthe employee's\b/gi, replacement: 'my' },
    { pattern: /\bthe worker's\b/gi, replacement: 'my' },
    
    // When clearly referring to the reporter in context - expanded verb list
    { pattern: /\bthe employee(?=\s+(?:was|felt|experienced|reported|stated|said|told|asked|requested|complained|noted|observed|witnessed|intervened|completed|confirmed|stopped|finished|talked))/gi, replacement: 'I' },
    { pattern: /\bthe worker(?=\s+(?:was|felt|experienced|reported|stated|said|told|asked|requested|complained|noted|observed|witnessed|intervened|completed|confirmed|stopped|finished|talked))/gi, replacement: 'I' },
    
    // Context-sensitive patterns for "being present"
    { pattern: /\bthe employee being present\b/gi, replacement: 'my presence' },
    { pattern: /\bme being present\b/gi, replacement: 'my presence' },
    { pattern: /\bwith me being there\b/gi, replacement: 'with my presence' },
    
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
  
  // Apply grammar safety pass
  result = grammarSafetyPass(result);
  
  return result;
}

function fixCapitalization(text: string): string {
  // Ensure 'I' is always capitalized
  text = text.replace(/\bi\b/g, 'I');
  
  // Fix sentence beginnings
  text = text.replace(/(^|\. )([a-z])/g, (match, prefix, letter) => prefix + letter.toUpperCase());
  
  return text;
}

function grammarSafetyPass(text: string): string {
  let result = text;
  
  // Fix possessive issues - never allow "I's" or "I.'s"
  result = result.replace(/\bI\.?'s\b/g, 'my');
  result = result.replace(/\bI\.?'S\b/g, 'my');
  
  // Fix stray apostrophes in possessives
  result = result.replace(/\bemployee'S\b/g, "employee's");
  result = result.replace(/\bworker'S\b/g, "worker's");
  result = result.replace(/\bmanager'S\b/g, "manager's");
  
  // Fix double letters from replacements
  result = result.replace(/\btthe\b/g, 'the');
  result = result.replace(/\bwwhich\b/g, 'which');
  
  // Fix subject-verb agreement
  result = result.replace(/\bI were\b/g, 'I was');
  result = result.replace(/\bI are\b/g, 'I am');
  result = result.replace(/\bI is\b/g, 'I am');
  
  // Improve clarity in common phrases
  result = result.replace(/\bdespite me being present\b/gi, 'despite my presence');
  result = result.replace(/\bwith me being there\b/gi, 'with my presence');
  result = result.replace(/\bdespite the employee being present\b/gi, 'despite my presence');
  
  // Fix remaining third-person references that got missed
  result = result.replace(/\bthe employee confirmed\b/gi, 'I confirmed');
  result = result.replace(/\bthe employee intervened\b/gi, 'I intervened');
  result = result.replace(/\bthe employee completed\b/gi, 'I completed');
  result = result.replace(/\bthe employee stopped\b/gi, 'I stopped');
  result = result.replace(/\bthe employee finished\b/gi, 'I finished');
  
  // Ensure proper sentence case and punctuation
  result = result.replace(/([.!?]\s*)([a-z])/g, (match, punctuation, letter) => 
    punctuation + letter.toUpperCase());
  
  // Ensure sentences end with proper punctuation
  result = result.replace(/([a-zA-Z0-9])\s*$/, '$1.');
  
  return result;
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
                // Update test cases to include grammar safety pass scenarios
                    {
                      test: 'Fix I\'s possessive',
                      input: 'Mark and Troy attempted to perform I\'s job duties.',
                      expected: 'Mark and Troy attempted to perform my job duties.'
                    },
                    {
                      test: 'Fix stray apostrophes',
                      input: 'The employee\'S concerns were valid.',
                      expected: 'My concerns were valid.'
                    },
                    {
                      test: 'Improve clarity phrases',
                      input: 'Despite me being present, the incident occurred.',
                      expected: 'Despite my presence, the incident occurred.'
                    },
                    {
                      test: 'Fix I.\'s possessive with period',
                      input: 'Mark and Troy attempted to perform I.\'s job duties.',
                      expected: 'Mark and Troy attempted to perform my job duties.'
                    },
                    {
                      test: 'Fix missed employee references',
                      input: 'Despite the employee being present, the employee intervened and the employee confirmed.',
                      expected: 'Despite my presence, I intervened and I confirmed.'
                    },
                    {
                      test: 'Fix double letters from replacements',
                      input: 'The issue was tthe employee completed the task.',
                      expected: 'The issue was I completed the task.'
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