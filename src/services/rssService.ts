import { RssFeedData } from '../types/rss';
import { parseRssXml } from '../utils/rssParser';
import { storageGet, storageSet } from '../utils/storage';
import { hasHostPermission } from '../utils/permissions';

const RSS_CACHE_KEY = 'zenith_rss_cache';
const CACHE_TTL_MS = 1000 * 60 * 15; // 15 minutes default cache
const REQUEST_TIMEOUT_MS = 15000;

/**
 * Raised when the feed's origin has not been granted yet. The UI turns this
 * into an "Allow access" button rather than an opaque failure, because the user
 * can fix it in one click.
 */
export class FeedPermissionRequired extends Error {
  url: string;

  constructor(url: string) {
    super(`ZenithTab has not been granted access to ${url}`);
    this.name = 'FeedPermissionRequired';
    this.url = url;
  }
}

function fetchWithTimeout(input: string, init: RequestInit = {}, timeoutMs = REQUEST_TIMEOUT_MS) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  return fetch(input, { ...init, signal: controller.signal }).finally(() => clearTimeout(timer));
}

export const rssService = {
  buildGoogleNewsRssUrl(query: string, lang = 'en', country = 'US'): string {
    const encoded = encodeURIComponent(query.trim());
    if (lang === 'ja' || country === 'JP') {
      return `https://news.google.com/rss/search?q=${encoded}&hl=ja&gl=JP&ceid=JP:ja`;
    }
    return `https://news.google.com/rss/search?q=${encoded}&hl=${lang}-${country}&gl=${country}&ceid=${country}:${lang}`;
  },

  async fetchFeed(url: string, bypassCache = false): Promise<RssFeedData> {
    const cacheStore = (await storageGet<Record<string, RssFeedData>>(RSS_CACHE_KEY, {})) || {};
    const cached = cacheStore[url];

    const now = Date.now();
    if (!bypassCache && cached && now - cached.lastUpdated < CACHE_TTL_MS) {
      return cached;
    }

    // Custom feeds live outside our granted hosts. Ask before we fetch so the
    // user sees an actionable prompt instead of a silent CORS failure.
    if (!(await hasHostPermission(url))) {
      if (cached) return cached;
      throw new FeedPermissionRequired(url);
    }

    try {
      const response = await fetchWithTimeout(url, {
        headers: {
          Accept: 'application/rss+xml, application/xml, text/xml, application/atom+xml, */*',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error ${response.status}: ${response.statusText}`);
      }

      const xmlText = await response.text();
      const items = parseRssXml(xmlText);

      const feedData: RssFeedData = {
        title: items[0]?.sourceTitle || 'RSS Feed',
        link: url,
        lastUpdated: now,
        items,
      };

      cacheStore[url] = feedData;
      await storageSet(RSS_CACHE_KEY, cacheStore);

      return feedData;
    } catch (error) {
      console.error(`Failed to fetch RSS feed from ${url}:`, error);

      // A stale feed beats an empty box.
      if (cached) {
        return cached;
      }

      throw error instanceof Error ? error : new Error('Failed to fetch RSS feed.');
    }
  },

  async refreshAllFeeds(feedUrls: string[]): Promise<Record<string, RssFeedData>> {
    const results: Record<string, RssFeedData> = {};
    await Promise.all(
      feedUrls.map(async (url) => {
        try {
          results[url] = await this.fetchFeed(url, true);
        } catch (err) {
          console.error(`Failed refreshing feed ${url}:`, err);
        }
      })
    );
    return results;
  },
};
