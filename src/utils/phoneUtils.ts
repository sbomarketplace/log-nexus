/**
 * Utility functions for phone number handling
 */

/**
 * Clean phone number for tel: href attribute
 * Removes spaces, dashes, parentheses, and other formatting
 */
export const cleanPhoneForTel = (phoneNumber: string): string => {
  return phoneNumber.replace(/[\s\-\(\)\+\.]/g, '');
};

const phonePattern =
  /(?:(?:\+?1[\s.-]?)?(?:\(?\d{3}\)?[\s.-]?)\d{3}[\s.-]?\d{4})(?:\s*(?:ext\.?|x)\s*\d+)?/gi;

function escapeHtml(input: string): string {
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function normalizeToString(input: unknown): string {
  if (input == null) return "";
  if (typeof input === "string") return input;
  if (typeof input === "number" || typeof input === "boolean") return String(input);
  if (Array.isArray(input)) {
    return input.map(i => normalizeToString(i)).join(" ");
  }
  if (typeof input === "object") {
    // Try to extract primitive-like values
    try {
      const values = Object.values(input as Record<string, unknown>)
        .map(v => (typeof v === "string" || typeof v === "number" ? String(v) : ""))
        .filter(Boolean);
      if (values.length) return values.join(" ");
    } catch {
      // ignore
    }
  }
  try {
    return String(input);
  } catch {
    return "";
  }
}

/**
 * Safely converts phone numbers in text to clickable tel: links.
 * Accepts any input and never throws. Always returns a string.
 */
export const makePhoneNumbersClickable = (input: unknown): string => {
  const raw = normalizeToString(input);
  if (!raw) return "";
  // Escape everything first, then inject safe anchors for matches
  let html = escapeHtml(raw);
  html = html.replace(phonePattern, match => {
    const cleanNumber = cleanPhoneForTel(match);
    const label = escapeHtml(match.trim());
    return `<a href="tel:${cleanNumber}" class="text-primary hover:underline" aria-label="Call ${label}">${label}</a>`;
  });
  return html;
};

/**
 * Component for rendering a clickable phone number
 */
export interface PhoneLinkProps {
  phone: string;
  className?: string;
  children?: React.ReactNode;
}