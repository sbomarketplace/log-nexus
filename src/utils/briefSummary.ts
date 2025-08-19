export function briefIncidentSummary(incident: any): string {
  const pick = (...vals: any[]) =>
    vals.find(v => typeof v === "string" && v.trim().length > 0)?.trim() || "";

  // Prefer explicit fields likely to summarize the incident
  const source = pick(incident?.title, incident?.what, incident?.summary, incident?.notes, incident?.category);
  if (!source) return "Brief summary unavailable.";

  // Normalize whitespace
  let text = source.replace(/\s+/g, " ").trim();

  // Take first sentence if punctuation exists
  const sentenceMatch = text.match(/^(.*?[\.!\?])\s/);
  if (sentenceMatch && sentenceMatch[1]) text = sentenceMatch[1];

  // Clip to 10 words max
  const words = text.split(" ").filter(Boolean);
  const clipped = words.slice(0, 10).join(" ");

  // Clean trailing punctuation and ensure single sentence with period
  let out = clipped.replace(/[;:,\s]+$/g, "");
  out = out.charAt(0).toUpperCase() + out.slice(1);
  if (!/[\.!\?]$/.test(out)) out += ".";

  return out;
}