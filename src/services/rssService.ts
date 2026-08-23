import { RssFeedData } from '../types/rss';
import { parseRssXml } from '../utils/rssParser';
import { storageGet, storageSet } from '../utils/storage';

const RSS_CACHE_KEY = 'zenith_rss_cache';
const CACHE_TTL_MS = 1000 * 60 * 15; // 15 minutes default cache

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

    try {
      const response = await fetch(url, {
        headers: {
          Accept: 'application/rss+xml, application/xml, text/xml, application/atom+xml, */*',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error ${response.status}: ${response.statusText}`);
      }

      const xmlText = await response.text();
      const items = parseRssXml(xmlText);

      // Extract feed metadata from items or URL
      const feedData: RssFeedData = {
        title: items[0]?.sourceTitle || 'RSS Feed',
        link: url,
        lastUpdated: now,
        items,
      };

      // Save to cache
      cacheStore[url] = feedData;
      await storageSet(RSS_CACHE_KEY, cacheStore);

      return feedData;
    } catch (error) {
      console.error(`Failed to fetch RSS feed from ${url}:`, error);

      // Return cached version if exists, even if stale
      if (cached) {
        return cached;
      }

      // If failed and no cache, return empty feed
      return {
        title: 'Feed Unavailable',
        link: url,
        lastUpdated: now,
        items: [],
      };
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
