import { parseRssXml } from '../utils/rssParser';
import { STORAGE_KEYS } from '../services/storageService';
import { DashboardWidget } from '../types/widget';
import { RssFeedData } from '../types/rss';

const RSS_ALARM_NAME = 'zenith-refresh-rss';
const ALARM_INTERVAL_MINUTES = 30;

// Setup alarms on installation
chrome.runtime.onInstalled.addListener(() => {
  console.log('[ZenithTab] Extension installed/updated. Initializing background tasks.');
  chrome.alarms.create(RSS_ALARM_NAME, {
    periodInMinutes: ALARM_INTERVAL_MINUTES,
  });
});

// Periodic RSS Background Synchronization
chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === RSS_ALARM_NAME) {
    console.log('[ZenithTab] Alarm triggered: Refreshing RSS feeds...');
    await refreshAllConfiguredFeeds();
  }
});

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

    await Promise.all(
      feedUrls.map(async (url) => {
        try {
          const response = await fetch(url, {
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
          }
        } catch (error) {
          console.warn(`[ZenithTab Service Worker] Failed background fetch for ${url}:`, error);
        }
      })
    );

    await chrome.storage.local.set({ [STORAGE_KEYS.RSS_CACHE]: cacheStore });
    console.log(`[ZenithTab] Successfully refreshed ${feedUrls.length} feeds in background.`);
  } catch (error) {
    console.error('[ZenithTab Service Worker] Error in background feed refresh:', error);
  }
}

// Support messaging from tab
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.type === 'REFRESH_FEEDS_NOW') {
    refreshAllConfiguredFeeds().then(() => sendResponse({ success: true }));
    return true;
  }
});
