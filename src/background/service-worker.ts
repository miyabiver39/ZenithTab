import { parseRssXml } from '../utils/rssParser';
import { STORAGE_KEYS } from '../services/storageService';
import { DashboardWidget } from '../types/widget';
import { RssFeedData } from '../types/rss';
import { hasHostPermission } from '../utils/permissions';

const RSS_ALARM_NAME = 'zenith-refresh-rss';
const ALARM_INTERVAL_MINUTES = 30;
const FETCH_TIMEOUT_MS = 15000;

/** Verbose logging is developer-only noise; keep the shipped worker quiet. */
const DEBUG = import.meta.env?.DEV ?? false;
const log = (...args: unknown[]) => {
  if (DEBUG) console.log('[ZenithTab]', ...args);
};

chrome.runtime.onInstalled.addListener(() => {
  log('Extension installed/updated. Initializing background tasks.');
  chrome.alarms.create(RSS_ALARM_NAME, {
    periodInMinutes: ALARM_INTERVAL_MINUTES,
  });
});

// Periodic RSS background synchronization
chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === RSS_ALARM_NAME) {
    log('Alarm triggered: refreshing RSS feeds.');
    await refreshAllConfiguredFeeds();
  }
});

function fetchWithTimeout(input: string, init: RequestInit = {}, timeoutMs = FETCH_TIMEOUT_MS) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  return fetch(input, { ...init, signal: controller.signal }).finally(() => clearTimeout(timer));
}

async function refreshAllConfiguredFeeds() {
  try {
    const result = await chrome.storage.local.get([STORAGE_KEYS.WIDGETS, STORAGE_KEYS.RSS_CACHE]);
    const widgets: DashboardWidget[] = result[STORAGE_KEYS.WIDGETS] || [];
    const cacheStore: Record<string, RssFeedData> = result[STORAGE_KEYS.RSS_CACHE] || {};

    const rssWidgets = widgets.filter((w) => w.type === 'rss');
    if (rssWidgets.length === 0) {
      return;
    }

    const feedUrls = Array.from(
      new Set(
        rssWidgets
          .map((w) => w.config?.feedUrl)
          .filter((url): url is string => Boolean(url && typeof url === 'string'))
      )
    );

    const now = Date.now();
    let refreshed = 0;

    await Promise.all(
      feedUrls.map(async (url) => {
        // Background refresh can never prompt, so silently skip any feed whose
        // origin the user has not granted yet. The widget shows an explicit
        // "Allow this feed" button in the foreground instead.
        if (!(await hasHostPermission(url))) {
          log(`Skipping ${url} — origin not granted.`);
          return;
        }

        try {
          const response = await fetchWithTimeout(url, {
            headers: {
              Accept: 'application/rss+xml, application/xml, text/xml, application/atom+xml, */*',
            },
          });
          if (response.ok) {
            const xml = await response.text();
            const items = parseRssXml(xml);
            cacheStore[url] = {
              title: items[0]?.sourceTitle || 'RSS Feed',
              link: url,
              lastUpdated: now,
              items,
            };
            refreshed += 1;
          }
        } catch (error) {
          console.warn(`[ZenithTab] Background fetch failed for ${url}:`, error);
        }
      })
    );

    if (refreshed > 0) {
      await chrome.storage.local.set({ [STORAGE_KEYS.RSS_CACHE]: cacheStore });
    }
    log(`Refreshed ${refreshed} of ${feedUrls.length} feeds in background.`);
  } catch (error) {
    console.error('[ZenithTab] Error in background feed refresh:', error);
  }
}

// Support messaging from the new tab page
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message?.type === 'REFRESH_FEEDS_NOW') {
    refreshAllConfiguredFeeds().then(() => sendResponse({ success: true }));
    return true;
  }
  return undefined;
});
