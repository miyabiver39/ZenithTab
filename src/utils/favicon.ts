/**
 * Resolves a site icon for a given URL.
 *
 * Icons come exclusively from Chrome's own favicon store (the `favicon`
 * permission + the `_favicon/` internal endpoint), which is served from the
 * browser's local cache. We deliberately do NOT fall back to a third-party
 * favicon service: doing so would leak the hostname of every bookmark and
 * shortcut a user has to an outside server, which would contradict ZenithTab's
 * local-first privacy promise.
 *
 * Returns an empty string when no icon can be resolved locally — callers render
 * a lettered placeholder in that case.
 */
export function getFaviconUrl(url?: string, size = 32): string {
  if (!url) {
    return '';
  }

  try {
    // Validate early so malformed input never reaches the favicon endpoint.
    const parsed = new URL(url);
    if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
      return '';
    }

    if (typeof chrome !== 'undefined' && chrome.runtime?.getURL) {
      const chromeFaviconUrl = new URL(chrome.runtime.getURL('/_favicon/'));
      chromeFaviconUrl.searchParams.set('pageUrl', url);
      chromeFaviconUrl.searchParams.set('size', size.toString());
      return chromeFaviconUrl.toString();
    }

    return '';
  } catch {
    return '';
  }
}
