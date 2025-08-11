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

/**
 * Extract phone numbers from text and wrap them in clickable tel: links
 */
export const makePhoneNumbersClickable = (text: string): string => {
  // Pattern to match various phone number formats
  const phonePattern = /(\+?1?[-.\s]?\(?[0-9]{3}\)?[-.\s]?[0-9]{3}[-.\s]?[0-9]{4})/g;
  
  return text.replace(phonePattern, (match) => {
    const cleanNumber = cleanPhoneForTel(match);
    return `<a href="tel:${cleanNumber}" class="text-primary hover:underline" aria-label="Call ${match.trim()}">${match}</a>`;
  });
};

/**
 * Component for rendering a clickable phone number
 */
export interface PhoneLinkProps {
  phone: string;
  className?: string;
  children?: React.ReactNode;
}