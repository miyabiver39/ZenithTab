export function getFaviconUrl(url?: string, size = 32): string {
  if (!url) {
    return '';
  }

  try {
    const parsed = new URL(url);

    // If running inside Chrome Extension environment with chrome.runtime
    if (typeof chrome !== 'undefined' && chrome.runtime?.getURL) {
      try {
        const chromeFaviconUrl = new URL(chrome.runtime.getURL('/_favicon/'));
        chromeFaviconUrl.searchParams.set('pageUrl', url);
        chromeFaviconUrl.searchParams.set('size', size.toString());
        return chromeFaviconUrl.toString();
      } catch {
        // Fallback if _favicon is not directly supported in context
      }
    }

    // Google Favicon service fallback
    return `https://www.google.com/s2/favicons?domain=${encodeURIComponent(parsed.hostname)}&sz=${size}`;
  } catch {
    return '';
  }
}
