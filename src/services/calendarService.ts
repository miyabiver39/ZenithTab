import { parseIcal, ICalEvent } from '../utils/icalParser';
import { storageGet } from '../utils/storage';
import { updateStoredMapEntry } from '../utils/storageMap';
import { hasHostPermission } from '../utils/permissions';
import { isSafeHttpUrl } from '../utils/url';
import { readTextWithLimit, MAX_ICAL_BYTES } from '../utils/fetchLimits';

const CALENDAR_CACHE_KEY = 'zenith_calendar_cache';
const CACHE_TTL_MS = 1000 * 60 * 15;
const REQUEST_TIMEOUT_MS = 15000;

/** Cached feeds are stored as the raw .ics text; parsing is cheap and keeps Dates out of storage. */
interface CalendarCacheEntry {
  text: string;
  lastUpdated: number;
}

/**
 * Raised when the calendar's origin hasn't been granted. Same idea as the
 * RSS feed: the widget shows an "Allow access" button instead of an error.
 */
/** The response wasn't an .ics document — usually a calendar's web page was pasted instead of its iCal link. */
export class NotAnICalDocument extends Error {
  constructor(url: string) {
    super(`${url} did not return an iCalendar document`);
    this.name = 'NotAnICalDocument';
  }
}

export class CalendarPermissionRequired extends Error {
  url: string;

  constructor(url: string) {
    super(`ZenithTab has not been granted access to ${url}`);
    this.name = 'CalendarPermissionRequired';
    this.url = url;
  }
}

function fetchWithTimeout(input: string, init: RequestInit = {}, timeoutMs = REQUEST_TIMEOUT_MS) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  return fetch(input, { ...init, signal: controller.signal }).finally(() => clearTimeout(timer));
}

export const calendarService = {
  /**
   * The URL we actually fetch: `webcal://` is what calendar apps hand
   * out, but it's plain HTTPS underneath. Returns null for anything that
   * isn't http(s) after that.
   */
  normalizeCalendarUrl(input: string): string | null {
    const trimmed = input.trim().replace(/^webcal:\/\//i, 'https://');
    if (!isSafeHttpUrl(trimmed)) return null;
    return this.unwrapGoogleCalendarUrl(trimmed);
  },

  /**
   * Google Calendar hands out two links people paste by mistake: the
   * "add by URL" link (`…/r?cid=<ics url>`) and the embed page
   * (`…/embed?src=<calendar id>`). Both can be turned into the .ics they
   * point at; the embed form only works for public calendars, which is
   * what those links are for anyway.
   */
  unwrapGoogleCalendarUrl(url: string): string {
    let parsed: URL;
    try {
      parsed = new URL(url);
    } catch {
      return url;
    }
    if (!/(^|\.)calendar\.google\.com$/i.test(parsed.hostname)) return url;
    const cid = parsed.searchParams.get('cid');
    if (cid) {
      const inner = cid.trim().replace(/^webcal:\/\//i, 'https://');
      return isSafeHttpUrl(inner) ? inner : url;
    }
    const src = parsed.searchParams.get('src');
    if (/\/calendar\/embed$/.test(parsed.pathname) && src) {
      return `https://calendar.google.com/calendar/ical/${encodeURIComponent(src)}/public/basic.ics`;
    }
    return url;
  },

  /** Heuristic for the settings form: warn when the link doesn't look like an iCal feed. */
  looksLikeICalUrl(url: string): boolean {
    return /\.ics(\?|#|$)|\/ical\/|ical|\/dav\//i.test(url);
  },

  /** Whatever the cache holds for the feed, however old; never fetches. Empty when nothing is cached. */
  async readCached(url: string): Promise<ICalEvent[]> {
    const cacheStore = (await storageGet<Record<string, CalendarCacheEntry>>(CALENDAR_CACHE_KEY, {})) || {};
    const cached = cacheStore[url];
    if (!cached) return [];
    try {
      return parseIcal(cached.text);
    } catch {
      return [];
    }
  },

  async fetchCalendar(url: string, bypassCache = false): Promise<ICalEvent[]> {
    const cacheStore = (await storageGet<Record<string, CalendarCacheEntry>>(CALENDAR_CACHE_KEY, {})) || {};
    const cached = cacheStore[url];
    const now = Date.now();
    if (!bypassCache && cached && now - cached.lastUpdated < CACHE_TTL_MS) {
      return parseIcal(cached.text);
    }

    if (!(await hasHostPermission(url))) {
      if (cached) return parseIcal(cached.text);
      throw new CalendarPermissionRequired(url);
    }

    try {
      const response = await fetchWithTimeout(url, { headers: { Accept: 'text/calendar, text/plain, */*' } });
      if (!response.ok) throw new Error(`HTTP error ${response.status}: ${response.statusText}`);
      const text = await readTextWithLimit(response, MAX_ICAL_BYTES, url);
      if (!/BEGIN:VCALENDAR/i.test(text)) throw new NotAnICalDocument(url);

      // Serialised per key so parallel feeds can't clobber each other's entry.
      await updateStoredMapEntry<CalendarCacheEntry>(CALENDAR_CACHE_KEY, url, { text, lastUpdated: now });
      return parseIcal(text);
    } catch (error) {
      console.error(`Failed to fetch calendar from ${url}:`, error);
      // A stale calendar beats an empty box.
      if (cached) return parseIcal(cached.text);
      throw error instanceof Error ? error : new Error('Failed to fetch calendar.');
    }
  },
};
