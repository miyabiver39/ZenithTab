import { parseIcal, ICalEvent } from '../utils/icalParser';
import { storageGet, storageSet } from '../utils/storage';
import { hasHostPermission } from '../utils/permissions';
import { isSafeHttpUrl } from '../utils/url';

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
    return isSafeHttpUrl(trimmed) ? trimmed : null;
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
      const text = await response.text();
      if (!/BEGIN:VCALENDAR/i.test(text)) throw new Error('Not an iCalendar document.');

      cacheStore[url] = { text, lastUpdated: now };
      await storageSet(CALENDAR_CACHE_KEY, cacheStore);
      return parseIcal(text);
    } catch (error) {
      console.error(`Failed to fetch calendar from ${url}:`, error);
      // A stale calendar beats an empty box.
      if (cached) return parseIcal(cached.text);
      throw error instanceof Error ? error : new Error('Failed to fetch calendar.');
    }
  },
};
