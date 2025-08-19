// src/lib/notesTime.ts
type NotesTime = { text: string } | null;

// Match times like 12:23pm, 6:05 PM, 09:00, 9:00
const RE_TIME_12 = /\b(\d{1,2}):(\d{2})\s*(am|pm)\b/i;
const RE_TIME_ANY = /\b(\d{1,2}):(\d{2})(?:\s*(am|pm))?\b/i;

function normalizeToDisplay(h: number, m: number, ampm?: string | null): string {
  let hour = h;
  const mm = String(m).padStart(2, "0");
  const mer = ampm ? ampm.toUpperCase() : null;
  if (mer) {
    if (mer === "AM" && hour === 12) hour = 0;
    if (mer === "PM" && hour !== 12) hour = hour + 12;
  }
  // Now hour is 0–23; convert to 12h label
  const hour12 = ((hour + 11) % 12) + 1;
  const merOut = hour >= 12 ? "PM" : "AM";
  return `${hour12}:${mm} ${merOut}`;
}

function firstTime(str: string): NotesTime {
  // Prefer explicit am/pm first
  const m12 = RE_TIME_12.exec(str);
  if (m12) {
    const h = parseInt(m12[1], 10);
    const m = parseInt(m12[2], 10);
    const ampm = m12[3];
    return { text: normalizeToDisplay(h, m, ampm) };
  }
  const mAny = RE_TIME_ANY.exec(str);
  if (mAny) {
    const h = parseInt(mAny[1], 10);
    const m = parseInt(mAny[2], 10);
    return { text: normalizeToDisplay(h, m, null) };
  }
  return null;
}

export function extractFirstTimeFromNotes(rawNotes?: string | null): NotesTime {
  if (!rawNotes) return null;
  const text = String(rawNotes);

  // 1) Try Timeline block first
  const tlStart = text.search(/^\s*timeline\s*:/im);
  if (tlStart >= 0) {
    // Capture from "Timeline:" until the next header or end
    const tail = text.slice(tlStart);
    const nextHeader = tail.search(/^\s*(requests\/responses|important quotes|additional details|witnesses|notes)\s*:/gim);
    const timelineBlock = nextHeader >= 0 ? tail.slice(0, nextHeader) : tail;
    const t = firstTime(timelineBlock);
    if (t) return { text: t.text.replace(/[.,;:]\s*$/, "") };
  }

  // 2) Else first time anywhere in notes
  const t2 = firstTime(text);
  return t2 ? { text: t2.text.replace(/[.,;:]\s*$/, "") } : null;
}