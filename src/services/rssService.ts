import { RssFeedData } from '../types/rss';
import { GoogleNewsMode, GoogleNewsTopic } from '../types/widget';
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

const GOOGLE_NEWS_EDITIONS: Record<string, { hl: string; gl: string; ceid: string }> = {
  en: { hl: 'en-US', gl: 'US', ceid: 'US:en' },
  ja: { hl: 'ja', gl: 'JP', ceid: 'JP:ja' },
  'zh-CN': { hl: 'zh-CN', gl: 'CN', ceid: 'CN:zh-Hans' },
  es: { hl: 'es', gl: 'ES', ceid: 'ES:es' },
  fr: { hl: 'fr', gl: 'FR', ceid: 'FR:fr' },
  de: { hl: 'de', gl: 'DE', ceid: 'DE:de' },
  ko: { hl: 'ko', gl: 'KR', ceid: 'KR:ko' },
};

export const GOOGLE_NEWS_TOPICS: GoogleNewsTopic[] = [
  'WORLD',
  'NATION',
  'BUSINESS',
  'TECHNOLOGY',
  'ENTERTAINMENT',
  'SPORTS',
  'SCIENCE',
  'HEALTH',
];

/**
 * Words people type into the search box when they really mean "just show
 * me the front page". Treated as headlines rather than searched literally
 * — searching for the word "ヘッドライン" returned articles *about*
 * headlines, which was the original bug report.
 */
const HEADLINE_KEYWORDS = /^(headlines?|top stories|top news|ヘッドライン|トップニュース|主要ニュース|头条|头条新闻|titulares|à la une|schlagzeilen|주요 뉴스|헤드라인)$/i;

export function isHeadlineKeyword(query: string): boolean {
  return query.trim() === '' || HEADLINE_KEYWORDS.test(query.trim());
}

export const rssService = {
  /**
   * Google News edition parameters for a dashboard language code. Every
   * supported UI language maps to the matching regional edition so both the
   * headlines and the keyword search come back in that language.
   */
  googleNewsEdition(lang = 'en'): string {
    const edition = GOOGLE_NEWS_EDITIONS[lang] || GOOGLE_NEWS_EDITIONS.en;
    return `hl=${edition.hl}&gl=${edition.gl}&ceid=${edition.ceid}`;
  },

  /**
   * Works out which feed a widget config asks for. Explicit modes win;
   * configs from before modes existed fall back on their keyword. A
   * keyword that just says "headlines" (in any supported language) is the
   * front page, not a literal search.
   */
  resolveGoogleNewsMode(config: { googleNewsMode?: GoogleNewsMode; googleNewsTopic?: GoogleNewsTopic; searchQuery?: string }): GoogleNewsMode {
    const query = (config.searchQuery || '').trim();
    if (config.googleNewsMode === 'topic') return config.googleNewsTopic ? 'topic' : 'headlines';
    if (config.googleNewsMode === 'headlines') return 'headlines';
    return isHeadlineKeyword(query) ? 'headlines' : 'search';
  },

  /**
   * One entry point for every Google News feed. A plain keyword searches;
   * an empty or "headlines"-like keyword returns the front page; a topic
   * (when `mode` is 'topic') returns that section.
   */
  buildGoogleNewsRssUrl(
    query: string,
    lang = 'en',
    mode: GoogleNewsMode = 'search',
    topic?: GoogleNewsTopic
  ): string {
    if (mode === 'topic' && topic) return this.buildGoogleNewsTopicUrl(topic, lang);
    if (mode === 'headlines' || isHeadlineKeyword(query)) return this.buildGoogleNewsTopStoriesUrl(lang);
    const encoded = encodeURIComponent(query.trim());
    return `https://news.google.com/rss/search?q=${encoded}&${this.googleNewsEdition(lang)}`;
  },

  /** The edition's front page ("top stories") — no keyword needed. */
  buildGoogleNewsTopStoriesUrl(lang = 'en'): string {
    return `https://news.google.com/rss?${this.googleNewsEdition(lang)}`;
  },

  /** A topic section (Technology, Business, …) of the edition. */
  buildGoogleNewsTopicUrl(topic: GoogleNewsTopic, lang = 'en'): string {
    return `https://news.google.com/rss/headlines/section/topic/${topic}?${this.googleNewsEdition(lang)}`;
  },

  /** Resolves a widget config straight to the feed URL it should load. */
  buildGoogleNewsUrlForConfig(
    config: { googleNewsMode?: GoogleNewsMode; googleNewsTopic?: GoogleNewsTopic; searchQuery?: string },
    lang = 'en'
  ): string {
    const mode = this.resolveGoogleNewsMode(config);
    return this.buildGoogleNewsRssUrl(config.searchQuery || '', lang, mode, config.googleNewsTopic);
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
