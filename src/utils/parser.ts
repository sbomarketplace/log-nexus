interface ParsedIncident {
  title?: string;
  date?: string;
  time?: string;
  what?: string;
  where?: string;
  why?: string;
  how?: string;
  who?: Array<{ name: string; role?: string }>;
  witnesses?: Array<{ name: string; role?: string }>;
  unionInvolvement?: Array<{
    name: string;
    union: string;
    role?: string;
    notes: string;
  }>;
}

export const parseIncidentNote = (text: string): ParsedIncident => {
  const result: ParsedIncident = {};
  const lines = text.split('\n').map(line => line.trim()).filter(line => line);
  
  // Extract title - usually the first non-empty line or line after "Title:", "Subject:", etc.
  const titleKeywords = ['title:', 'subject:', 'incident:', 'summary:'];
  let titleLine = lines[0];
  
  for (const line of lines) {
    const lowerLine = line.toLowerCase();
    for (const keyword of titleKeywords) {
      if (lowerLine.startsWith(keyword)) {
        titleLine = line.substring(keyword.length).trim();
        break;
      }
    }
  }
  
  if (titleLine && !titleKeywords.some(k => titleLine.toLowerCase().startsWith(k))) {
    result.title = titleLine;
  }

  // Extract date and time
  const dateRegex = /(?:date[:\s]*)?(\d{4}[-\/]\d{1,2}[-\/]\d{1,2})/i;
  const timeRegex = /(?:time[:\s]*)?(\d{1,2}:\d{2}(?::\d{2})?(?:\s*[ap]m)?)/i;
  
  for (const line of lines) {
    const dateMatch = line.match(dateRegex);
    if (dateMatch && !result.date) {
      result.date = dateMatch[1].replace(/\//g, '-');
    }
    
    const timeMatch = line.match(timeRegex);
    if (timeMatch && !result.time) {
      let time = timeMatch[1];
      // Convert to 24-hour format if needed
      if (time.toLowerCase().includes('pm') && !time.startsWith('12')) {
        const [hours, minutes] = time.split(':');
        time = `${parseInt(hours) + 12}:${minutes.split(' ')[0]}`;
      } else if (time.toLowerCase().includes('am') && time.startsWith('12')) {
        time = `00:${time.split(':')[1].split(' ')[0]}`;
      }
      result.time = time.replace(/[ap]m/i, '').trim();
    }
  }

  // Extract what happened
  const whatKeywords = ['what happened:', 'description:', 'details:', 'incident description:', 'what:'];
  result.what = extractSection(lines, whatKeywords);

  // Extract where
  const whereKeywords = ['where:', 'location:', 'place:', 'occurred at:', 'happened at:'];
  result.where = extractSection(lines, whereKeywords);

  // Extract why
  const whyKeywords = ['why:', 'cause:', 'reason:', 'why it happened:', 'contributing factors:'];
  result.why = extractSection(lines, whyKeywords);

  // Extract how
  const howKeywords = ['how:', 'how it happened:', 'sequence:', 'process:', 'steps:'];
  result.how = extractSection(lines, howKeywords);

  // Extract people involved
  const whoKeywords = ['who:', 'involved:', 'people involved:', 'participants:', 'who was involved:'];
  const whoText = extractSection(lines, whoKeywords);
  if (whoText) {
    result.who = extractPeople(whoText);
  }

  // Extract witnesses
  const witnessKeywords = ['witnesses:', 'witness:', 'saw:', 'observed by:', 'bystanders:'];
  const witnessText = extractSection(lines, witnessKeywords);
  if (witnessText) {
    result.witnesses = extractPeople(witnessText);
  }

  // Extract union involvement
  const unionKeywords = ['union:', 'union involvement:', 'union representative:', 'steward:', 'union rep:'];
  const unionText = extractSection(lines, unionKeywords);
  if (unionText) {
    result.unionInvolvement = extractUnionInvolvement(unionText);
  }

  return result;
};

const extractSection = (lines: string[], keywords: string[]): string | undefined => {
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].toLowerCase();
    const matchedKeyword = keywords.find(keyword => line.includes(keyword));
    
    if (matchedKeyword) {
      let content = lines[i].substring(lines[i].toLowerCase().indexOf(matchedKeyword) + matchedKeyword.length).trim();
      
      // Collect subsequent lines until we hit another section or end
      for (let j = i + 1; j < lines.length; j++) {
        const nextLine = lines[j].toLowerCase();
        const isNewSection = keywords.some(k => nextLine.includes(k)) ||
          ['who:', 'what:', 'where:', 'when:', 'why:', 'how:', 'witnesses:', 'union:'].some(k => nextLine.includes(k));
        
        if (isNewSection) break;
        content += '\n' + lines[j];
      }
      
      return content.trim() || undefined;
    }
  }
  return undefined;
};

const extractPeople = (text: string): Array<{ name: string; role?: string }> => {
  const people: Array<{ name: string; role?: string }> = [];
  const lines = text.split('\n').map(l => l.trim()).filter(l => l);
  
  for (const line of lines) {
    // Look for patterns like "John Doe (Manager)" or "Jane Smith - Supervisor"
    const roleMatch = line.match(/^(.+?)\s*[\(\-]\s*(.+?)[\)]?\s*$/);
    if (roleMatch) {
      people.push({
        name: roleMatch[1].trim(),
        role: roleMatch[2].trim()
      });
    } else if (line && !line.includes(':')) {
      // Simple name without role
      people.push({ name: line.trim() });
    }
  }
  
  return people;
};

const extractUnionInvolvement = (text: string): Array<{ name: string; union: string; role?: string; notes: string }> => {
  const involvement: Array<{ name: string; union: string; role?: string; notes: string }> = [];
  const lines = text.split('\n').map(l => l.trim()).filter(l => l);
  
  let currentEntry: Partial<{ name: string; union: string; role?: string; notes: string }> = {};
  
  for (const line of lines) {
    if (line.toLowerCase().includes('name:')) {
      if (currentEntry.name) {
        // Save previous entry
        if (currentEntry.name && currentEntry.union) {
          involvement.push({
            name: currentEntry.name,
            union: currentEntry.union,
            role: currentEntry.role,
            notes: currentEntry.notes || ''
          });
        }
        currentEntry = {};
      }
      currentEntry.name = line.substring(line.toLowerCase().indexOf('name:') + 5).trim();
    } else if (line.toLowerCase().includes('union:')) {
      currentEntry.union = line.substring(line.toLowerCase().indexOf('union:') + 6).trim();
    } else if (line.toLowerCase().includes('role:')) {
      currentEntry.role = line.substring(line.toLowerCase().indexOf('role:') + 5).trim();
    } else if (line.toLowerCase().includes('notes:')) {
      currentEntry.notes = line.substring(line.toLowerCase().indexOf('notes:') + 6).trim();
    } else if (currentEntry.name && !line.includes(':')) {
      // Continuation of notes
      currentEntry.notes = (currentEntry.notes || '') + '\n' + line;
    }
  }
  
  // Save last entry
  if (currentEntry.name && currentEntry.union) {
    involvement.push({
      name: currentEntry.name,
      union: currentEntry.union,
      role: currentEntry.role,
      notes: currentEntry.notes || ''
    });
  }
  
  return involvement;
};