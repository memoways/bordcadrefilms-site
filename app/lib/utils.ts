/**
 * Returns the URL only if it starts with http:// or https://, otherwise undefined.
 * Use this before rendering any URL from an external/CMS source as an href.
 */
export function safeExternalUrl(url: string | undefined): string | undefined {
  if (!url) return undefined;
  return /^https?:\/\//i.test(url.trim()) ? url.trim() : undefined;
}

/**
 * Returns the first usable string from an Airtable field value.
 * Handles plain strings and single-element string arrays (lookup fields).
 * Trims whitespace and returns undefined for empty results.
 */
export function firstString(val: unknown): string | undefined {
  if (typeof val === 'string') return val.trim() || undefined;
  if (Array.isArray(val) && val.length > 0 && typeof val[0] === 'string')
    return (val[0] as string).trim() || undefined;
  return undefined;
}

/**
 * Normalise a string into a URL-safe slug.
 */
export function slugify(str: string): string {
  return str
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/**
 * Extracts a usable image URL from any of the shapes Airtable (or plain strings) can produce:
 *   - string URL
 *   - Airtable attachment array  ({ url: string }[])
 *   - single Airtable attachment object ({ url: string })
 *   - local path starting with "/"
 */
export function getValidImageUrl(url: unknown): string | undefined {
  if (!url) return undefined;

  // Airtable attachment array
  if (Array.isArray(url) && url.length > 0) {
    if (typeof url[0] === "string") return url[0];
    if (
      typeof url[0] === "object" &&
      url[0] !== null &&
      typeof (url[0] as { url?: unknown }).url === "string"
    ) {
      return (url[0] as { url: string }).url;
    }
  }

  // Single Airtable attachment object
  if (
    typeof url === "object" &&
    url !== null &&
    typeof (url as { url?: unknown }).url === "string"
  ) {
    return (url as { url: string }).url;
  }

  // Plain string — extract first http(s) URL or accept local path
  if (typeof url === "string") {
    const match = url.match(/https?:\/\/[^\s)]+/);
    if (match) return match[0];
    if (url.startsWith("/")) return url;
  }

  return undefined;
}
