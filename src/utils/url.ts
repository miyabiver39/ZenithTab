/**
 * URL guards shared by everything that turns user input into a link,
 * embed or fetch target. Only `http:` / `https:` are ever accepted:
 * `javascript:`, `data:`, `file:` and friends must never reach an
 * `<iframe src>`, an `<a href>` or `fetch()`.
 */

export function isSafeHttpUrl(value: unknown): value is string {
  if (typeof value !== 'string' || !value.trim()) return false;
  try {
    const protocol = new URL(value).protocol;
    return protocol === 'https:' || protocol === 'http:';
  } catch {
    return false;
  }
}

/**
 * Cleans up a URL typed by hand: trims whitespace and assumes `https://`
 * when no scheme was given ("example.com" → "https://example.com").
 * Returns `null` for anything that still isn't a safe http(s) URL.
 */
export function normalizeHttpUrl(input: string): string | null {
  const trimmed = input.trim();
  if (!trimmed) return null;
  const withScheme = /^[a-z][a-z0-9+.-]*:/i.test(trimmed) ? trimmed : `https://${trimmed}`;
  return isSafeHttpUrl(withScheme) ? new URL(withScheme).toString() : null;
}

/** Hostname for display, or '' when the URL can't be parsed. */
export function hostnameOf(url: string): string {
  try {
    return new URL(url).hostname;
  } catch {
    return '';
  }
}
