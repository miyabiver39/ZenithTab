import { describe, it, expect, vi, afterEach } from 'vitest';
import { chromeMock, chromeStorageData } from '../helpers/chrome';
import { STORAGE_KEYS } from '../../src/services/storageService';

const RSS = (title: string) =>
  `<rss><channel><item><title>${title}</title><link>https://x.example/${title}</link></item></channel></rss>`;

const rssWidget = (id: string, feedUrl: string) => ({
  id,
  type: 'rss',
  title: id,
  config: { feedUrl, isGoogleNews: false, maxItems: 5, refreshIntervalMinutes: 30, showThumbnail: true, showDate: true, showDescription: true },
  layout: { i: id, x: 0, y: 0, w: 4, h: 4 },
});

async function loadWorkerAndGetMessageHandler() {
  vi.resetModules();
  await import('../../src/background/service-worker');
  expect(chromeMock.runtime.onInstalled.addListener).toHaveBeenCalled();
  const handler = chromeMock.runtime.onMessage.addListener.mock.calls[0][0] as (
    message: any,
    sender: any,
    sendResponse: (r: any) => void
  ) => boolean | undefined;
  return handler;
}

describe('background service worker', () => {
  afterEach(() => vi.restoreAllMocks());

  it('全ページの RSS ウィジェットを走査してキャッシュを更新すること', async () => {
    chromeStorageData[STORAGE_KEYS.WIDGETS] = [rssWidget('active', 'https://a.example/feed')];
    chromeStorageData[STORAGE_KEYS.PAGE_DATA] = {
      p1: { widgets: [rssWidget('active', 'https://a.example/feed')], layouts: {} },
      p2: { widgets: [rssWidget('other-page', 'https://b.example/feed'), { id: 'clock', type: 'clock', title: 'c', config: {}, layout: {} }], layouts: {} },
    };
    vi.spyOn(globalThis, 'fetch').mockImplementation(async (input) => {
      const url = String(input);
      return { ok: true, status: 200, text: async () => RSS(url.includes('a.example') ? 'A' : 'B') } as Response;
    });

    const handler = await loadWorkerAndGetMessageHandler();
    const response = await new Promise((resolve) => handler({ type: 'REFRESH_FEEDS_NOW' }, {}, resolve));

    expect(response).toEqual({ success: true });
    const cache = chromeStorageData[STORAGE_KEYS.RSS_CACHE];
    expect(Object.keys(cache).sort()).toEqual(['https://a.example/feed', 'https://b.example/feed']);
    expect(cache['https://b.example/feed'].items[0].title).toBe('B');
  });

  it('ページデータが無い旧インストールでは従来の単一ページキーを読むこと', async () => {
    chromeStorageData[STORAGE_KEYS.WIDGETS] = [rssWidget('legacy', 'https://legacy.example/feed')];
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({ ok: true, status: 200, text: async () => RSS('L') } as Response);

    const handler = await loadWorkerAndGetMessageHandler();
    await new Promise((resolve) => handler({ type: 'REFRESH_FEEDS_NOW' }, {}, resolve));

    expect(Object.keys(chromeStorageData[STORAGE_KEYS.RSS_CACHE])).toEqual(['https://legacy.example/feed']);
  });

  it('権限の無いフィードはスキップし、無関係なメッセージは無視すること', async () => {
    chromeStorageData[STORAGE_KEYS.PAGE_DATA] = { p1: { widgets: [rssWidget('x', 'https://denied.example/feed')], layouts: {} } };
    chromeMock.permissions.contains.mockResolvedValue(false);
    const fetchSpy = vi.spyOn(globalThis, 'fetch');

    const handler = await loadWorkerAndGetMessageHandler();
    expect(handler({ type: 'SOMETHING_ELSE' }, {}, () => {})).toBeUndefined();
    await new Promise((resolve) => handler({ type: 'REFRESH_FEEDS_NOW' }, {}, resolve));

    expect(fetchSpy).not.toHaveBeenCalled();
    expect(chromeStorageData[STORAGE_KEYS.RSS_CACHE]).toBeUndefined();
  });
});
