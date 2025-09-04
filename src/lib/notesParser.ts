/**
 * Advanced notes parser that extracts structured data from raw incident notes
 * Never defaults to current date/time - only extracts what's explicitly found
 */

import { toStr, sReplace } from './strings';

export type ParsedNotes = {
  date?: string | null;           // "YYYY-MM-DD"
  time?: string | null;           // "HH:mm" 24h format
  where?: string | null;
  people?: string[];
  witnesses?: string[] | null;
  quotes?: { speaker?: string | null; text: string }[];
  requests?: string[] | null;
  category?: string | null;
  summary?: string | null;
};

const MONTHS = "(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*";
const reMDY = /\b(?<m>\d{1,2})[\/\-](?<d>\d{1,2})[\/\-](?<y>\d{2,4})\b/;
const reYMD = /\b(?<y>\d{4})-(?<m>\d{2})-(?<d>\d{2})\b/;
const reMonName = new RegExp(`\\b(?<mon>${MONTHS})\\s+(?<d>\\d{1,2})(?:,)?\\s+(?<y>\\d{2,4})\\b`, "i");
const reTime12 = /\b(?<h>\d{1,2}):(?<min>\d{2})\s*(?<ampm>AM|PM)\b/i;
const reTime24 = /\b(?<h>\d{1,2}):(?<min>\d{2})\b/;
const reCaseNumber = /\bcase\s*(?:#|no\.?|number)\s*([A-Za-z0-9\-\/ ]{1,50})\b/i;

const reWhere = /\b(?:in|at|inside|outside|near|to)\s+(the\s+)?(?<place>[A-Za-z0-9\-\s]{3,25})(?:\.|,|;|\n|$)/i;
const reWhoLine = /^(?:who|people|participants|managers?|coworkers?)\s*:\s*(?<list>.+)$/im;
const reWitnessLine = /^(?:witnesses?)\s*:\s*(?<list>.+)$/im;
const reQuote = /(?:"|")(?<q>[^""]{1,200})(?:"|")/g;
const reSaid = /(?<speaker>[A-Z][a-z]+)\s+(said|asked|told)\s*:\s*(?:"|")?(?<q>[^"".\n]{1,200})(?:"|")?/gi;
const reRequest = /\b(I\s+(told|asked|requested|reported|emailed)|requested|asked)\b[^.\n]{1,100}[.\n]/gi;

export function parseNotesToStructured(input: { text: string }): ParsedNotes {
  const text = toStr(input?.text).trim();
  if (!text) return {};
  
  const out: ParsedNotes = {};

  // Date parsing - try multiple formats
  const mdy = text.match(reMDY);
  const ymd = text.match(reYMD);
  const mon = text.match(reMonName);
  const dateISO = normalizeDate({ mdy, ymd, mon });
  if (dateISO) out.date = dateISO;

  // Time parsing - try 12h first, then 24h
  const t12 = text.match(reTime12);
  let time24: string | null = null;
  if (t12) time24 = normalizeTime12(t12);
  if (!time24) {
    const t24 = text.match(reTime24);
    time24 = normalizeTime24(t24);
  }
  if (time24) out.time = time24;

  // Location extraction
  const wm = text.match(reWhere);
  if (wm && wm.groups?.place) {
    const place = sReplace(wm.groups.place.trim(), /\s{2,}/g, " ");
    out.where = sReplace(place, /\s*(,|\.|;)+$/, "");
  }

  // People extraction
  const whoExplicit = text.match(reWhoLine)?.groups?.list || "";
  const whoNames = extractNames(whoExplicit || text);
  out.people = dedupe(whoNames);

  // Witnesses extraction
  const wit = text.match(reWitnessLine)?.groups?.list || "";
  const witNames = extractNames(wit);
  out.witnesses = witNames.length ? dedupe(witNames) : null;

  // Quote extraction
  const quotes: { speaker?: string | null; text: string }[] = [];
  let sm;
  reSaid.lastIndex = 0; // Reset regex
  while ((sm = reSaid.exec(text)) !== null) {
    quotes.push({ speaker: sm.groups?.speaker || null, text: sm.groups?.q || "" });
  }
  
  reQuote.lastIndex = 0; // Reset regex
  let qm;
  while ((qm = reQuote.exec(text)) !== null) {
    const qt = qm.groups?.q || "";
    if (!quotes.some(q => q.text === qt)) {
      quotes.push({ speaker: null, text: qt });
    }
  }
  if (quotes.length) out.quotes = quotes;

  // Requests extraction
  const reqs = Array.from(text.matchAll(reRequest)).map(m => m[0].trim());
  out.requests = reqs.length ? reqs : null;

  // Category inference
  out.category = inferCategory(text);

  // Summary generation
  out.summary = buildSummary(text);

  return out;
}

// Helper functions
function normalizeDate(parts: { 
  mdy: RegExpMatchArray | null; 
  ymd: RegExpMatchArray | null; 
  mon: RegExpMatchArray | null 
}): string | null {
  if (parts.mdy?.groups) {
    const y = fixYear(parts.mdy.groups.y);
    const m = pad2(parts.mdy.groups.m);
    const d = pad2(parts.mdy.groups.d);
    return `${y}-${m}-${d}`;
  }
  if (parts.ymd?.groups) {
    const y = parts.ymd.groups.y;
    const m = parts.ymd.groups.m;
    const d = parts.ymd.groups.d;
    return `${y}-${m}-${d}`;
  }
  if (parts.mon?.groups) {
    const y = fixYear(parts.mon.groups.y);
    const m = monthToNum(parts.mon.groups.mon);
    const d = pad2(parts.mon.groups.d);
    return `${y}-${m}-${d}`;
  }
  return null;
}

function normalizeTime12(m: RegExpMatchArray | null): string | null {
  if (!m?.groups) return null;
  let h = parseInt(m.groups.h, 10);
  const min = pad2(m.groups.min);
  const ampm = (m.groups.ampm || "").toUpperCase();
  if (ampm === "PM" && h !== 12) h += 12;
  if (ampm === "AM" && h === 12) h = 0;
  return `${pad2(String(h))}:${min}`;
}

function normalizeTime24(m: RegExpMatchArray | null): string | null {
  if (!m?.[0]) return null;
  const [h, min] = m[0].split(":");
  if (!h || !min) return null;
  const hh = Math.min(Math.max(parseInt(h, 10), 0), 23);
  const mm = Math.min(Math.max(parseInt(min, 10), 0), 59);
  return `${pad2(String(hh))}:${pad2(String(mm))}`;
}

function fixYear(y: string): string {
  if (y.length === 4) return y;
  const yy = parseInt(y, 10);
  // Choose 2000-2069 for 00-69, else 1900-1999
  return yy <= 69 ? `20${pad2(String(yy))}` : `19${pad2(String(yy))}`;
}

function monthToNum(mon: string): string {
  const months = ["jan","feb","mar","apr","may","jun","jul","aug","sep","oct","nov","dec"];
  const idx = months.indexOf(mon.toLowerCase().slice(0,3));
  return pad2(String(idx + 1));
}

function pad2(s: string): string {
  return s.length === 1 ? `0${s}` : s;
}

function extractNames(source: string): string[] {
  // Split on commas and "and", keep capitalized token sequences
  const candidates = source
    .split(/[,;&]| and /i)
    .map(s => s.trim())
    .filter(Boolean);
  
  const names: string[] = [];
  for (const c of candidates) {
    const m = c.match(/\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+){0,2})\b/);
    if (m) names.push(m[1]);
  }
  return names;
}

function dedupe<T>(arr: T[]): T[] {
  return Array.from(new Set(arr));
}

function inferCategory(text: string): string | null {
  const t = text.toLowerCase();
  const rules: { label: string; keys: string[] }[] = [
    { label: "Bullying / Intimidation", keys: ["bully", "intimidat", "mock", "insult", "do my whole job", "do my job", "took over", "tried to do"] },
    { label: "Harassment", keys: ["harass", "demean", "hostil"] },
    { label: "Retaliation", keys: ["retaliat", "punish", "after i reported"] },
    { label: "Safety", keys: ["unsafe", "safety", "fire exit", "forklift", "spill"] },
    { label: "Work interference", keys: ["undermining", "took over my job", "interfer", "took my task", "do my entire job", "rushing"] },
    { label: "Timekeeping or attendance", keys: ["clock", "timecard", "attendance", "late", "no call no show"] },
    { label: "Discrimination", keys: ["discriminat", "racist", "sexist", "ageist"] }
  ];
  
  for (const r of rules) {
    if (r.keys.some(k => t.includes(k))) return r.label;
  }
  return null;
}

function buildSummary(text: string): string | null {
  // Pull the first meaningful line as a summary
  const lines = text.split(/\n/).map(s => s.trim()).filter(s => s.length > 10);
  const line = lines.find(s => !s.toLowerCase().startsWith('timeline') && !s.toLowerCase().startsWith('requests'));
  if (!line) return null;
  
  return sentenceCase(sReplace(sReplace(line, /^timeline[:\-]\s*/i, ""), /^requests\/responses[:\-]\s*/i, ""));
}

function sentenceCase(s: string): string {
  if (!s) return s;
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export function extractCaseNumber(text: string): string | null {
  const m = reCaseNumber.exec(toStr(text));
  if (!m?.[1]) return null;
  // Sanitize: keep letters, numbers, spaces, dash, slash; trim and collapse spaces
  const cleaned = sReplace(sReplace(toStr(m[1]), /[^A-Za-z0-9\-\/ ]/g, ""), /\s{2,}/g, " ")
    .trim();
  return cleaned || null;
}
