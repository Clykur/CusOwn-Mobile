/**
 * Validates whether a given string is a valid image URL.
 * Filters out null, undefined, empty strings, and string literals like "null" or "undefined".
 */
export function isValidImageUrl(url?: string | null): boolean {
  if (!url) return false;
  const clean = url.trim().toLowerCase();
  return clean !== '' && clean !== 'null' && clean !== 'undefined';
}
