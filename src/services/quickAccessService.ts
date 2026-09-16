import { getFaviconUrl } from '../utils/favicon';
import { isSafeHttpUrl } from '../utils/url';
import { hasApiPermissions, requestApiPermissions } from '../utils/permissions';

/**
 * Declared as optional permissions and requested when the widget is added,
 * so shipping this widget never disabled anyone's extension on update.
 */
export const QUICK_ACCESS_PERMISSIONS = ['topSites', 'sessions'];

/**
 * "Quick Access" data: Chrome's own most-visited list and recently closed
 * tabs. Everything comes from browser-internal APIs and stays in the
 * browser — nothing here talks to the network.
 */

export interface QuickAccessItem {
  id: string;
  title: string;
  url: string;
  faviconUrl: string;
  /** Present for recently closed tabs; lets `restoreSession` reopen it in place. */
  sessionId?: string;
  /** Epoch seconds the tab was closed (recently closed only). */
  lastModified?: number;
}

// Shown outside the extension (dev server, tests) so the widget still has
// something to render and lay out.
const MOCK_TOP_SITES: QuickAccessItem[] = [
  { id: 'top-1', title: 'YouTube', url: 'https://www.youtube.com', faviconUrl: '' },
  { id: 'top-2', title: 'Wikipedia', url: 'https://www.wikipedia.org', faviconUrl: '' },
  { id: 'top-3', title: 'GitHub', url: 'https://github.com', faviconUrl: '' },
  { id: 'top-4', title: 'MDN Web Docs', url: 'https://developer.mozilla.org', faviconUrl: '' },
];

const MOCK_RECENTLY_CLOSED: QuickAccessItem[] = [
  { id: 'closed-1', title: 'Weather – Open-Meteo', url: 'https://open-meteo.com', faviconUrl: '', lastModified: 0 },
  { id: 'closed-2', title: 'Unsplash', url: 'https://unsplash.com', faviconUrl: '', lastModified: 0 },
];

const withFavicon = (item: QuickAccessItem): QuickAccessItem => ({ ...item, faviconUrl: getFaviconUrl(item.url, 32) });

function hostnameTitle(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return url;
  }
}

// Inside the extension the API namespaces only exist once the optional
// permission is granted, so "namespace missing" means "not granted" there
// and "not an extension" everywhere else (dev server, tests).
const inExtension = () => typeof chrome !== 'undefined' && !!chrome.runtime?.id;

function topSitesApi(): typeof chrome.topSites | undefined {
  if (typeof chrome === 'undefined') return undefined;
  const api = (chrome as any).topSites;
  return api && typeof api.get === 'function' ? api : undefined;
}

function sessionsApi(): typeof chrome.sessions | undefined {
  if (typeof chrome === 'undefined') return undefined;
  const api = (chrome as any).sessions;
  return api && typeof api.getRecentlyClosed === 'function' ? api : undefined;
}

export const quickAccessService = {
  hasPermission(): Promise<boolean> {
    return hasApiPermissions(QUICK_ACCESS_PERMISSIONS);
  },

  /** Must be called from a click handler — Chrome only prompts inside a user gesture. */
  requestPermission(): Promise<boolean> {
    return requestApiPermissions(QUICK_ACCESS_PERMISSIONS);
  },

  async getTopSites(limit = 8): Promise<QuickAccessItem[]> {
    const api = topSitesApi();
    if (!api) return inExtension() ? [] : MOCK_TOP_SITES.slice(0, limit).map(withFavicon);

    try {
      const sites = await api.get();
      return sites
        .filter((site) => isSafeHttpUrl(site.url))
        .slice(0, limit)
        .map((site, index) =>
          withFavicon({ id: `top-${index}-${site.url}`, title: site.title || hostnameTitle(site.url), url: site.url, faviconUrl: '' })
        );
    } catch (err) {
      console.warn('[ZenithTab] chrome.topSites.get failed:', err);
      return [];
    }
  },

  async getRecentlyClosed(limit = 8): Promise<QuickAccessItem[]> {
    const api = sessionsApi();
    if (!api) return inExtension() ? [] : MOCK_RECENTLY_CLOSED.slice(0, limit).map(withFavicon);

    try {
      // Chrome caps maxResults at 25; ask for a few more than we show so
      // window entries (which we flatten) don't starve the list.
      const sessions = await api.getRecentlyClosed({ maxResults: Math.min(25, limit + 5) });
      const items: QuickAccessItem[] = [];
      for (const session of sessions) {
        const tabs = session.tab ? [session.tab] : session.window?.tabs || [];
        for (const tab of tabs) {
          if (!tab.url || !isSafeHttpUrl(tab.url) || !tab.sessionId) continue;
          items.push(
            withFavicon({
              id: `closed-${tab.sessionId}`,
              title: tab.title || hostnameTitle(tab.url),
              url: tab.url,
              faviconUrl: '',
              sessionId: tab.sessionId,
              lastModified: session.lastModified,
            })
          );
          if (items.length >= limit) return items;
        }
      }
      return items;
    } catch (err) {
      console.warn('[ZenithTab] chrome.sessions.getRecentlyClosed failed:', err);
      return [];
    }
  },

  /**
   * Reopens a closed tab where it was. Returns false when the sessions
   * API isn't available so the caller can fall back to a plain link.
   */
  async restoreSession(sessionId: string): Promise<boolean> {
    const api = sessionsApi();
    if (!api || typeof api.restore !== 'function') return false;
    try {
      await api.restore(sessionId);
      return true;
    } catch (err) {
      console.warn('[ZenithTab] chrome.sessions.restore failed:', err);
      return false;
    }
  },

  hostnameOf: hostnameTitle,
};
