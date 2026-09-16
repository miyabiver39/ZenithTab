import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';
import { rssService, FeedPermissionRequired } from '../../../src/services/rssService';
import { chromeMock, chromeStorageData } from '../../helpers/chrome';

const FEED_URL = 'https://example.com/feed.xml';

const RSS_XML = `<?xml version="1.0"?>
<rss version="2.0">
  <channel>
    <title>Example Feed</title>
    <item>
      <title>First post</title>
      <link>https://example.com/1</link>
      <pubDate>Mon, 14 Sep 2026 10:00:00 GMT</pubDate>
      <description>Hello</description>
    </item>
    <item>
      <title>Second post</title>
      <link>https://example.com/2</link>
    </item>
  </channel>
</rss>`;

// Re-spying an already spied function returns the same spy, so clear the
// call history each time a test swaps the response.
function mockFetch(body = RSS_XML, ok = true, status = 200) {
  return vi.spyOn(globalThis, 'fetch').mockClear().mockResolvedValue({
    ok,
    status,
    statusText: ok ? 'OK' : 'Error',
    text: async () => body,
  } as Response);
}

describe('rssService.fetchFeed', () => {
  beforeEach(() => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it('ネットワークから取得してパースし、キャッシュに保存すること', async () => {
    const fetchSpy = mockFetch();

    const feed = await rssService.fetchFeed(FEED_URL);

    expect(fetchSpy).toHaveBeenCalledWith(FEED_URL, expect.objectContaining({ headers: expect.any(Object) }));
    expect(feed.items).toHaveLength(2);
    expect(feed.items[0].title).toBe('First post');
    expect(feed.link).toBe(FEED_URL);
    expect(chromeStorageData.zenith_rss_cache[FEED_URL].items).toHaveLength(2);
  });

  it('TTL内はキャッシュを返しネットワークに行かないこと', async () => {
    mockFetch();
    await rssService.fetchFeed(FEED_URL);
    const fetchSpy = mockFetch('<rss><channel><item><title>Newer</title></item></channel></rss>');

    const feed = await rssService.fetchFeed(FEED_URL);

    expect(fetchSpy).not.toHaveBeenCalled();
    expect(feed.items[0].title).toBe('First post');
  });

  it('bypassCache=true ならキャッシュがあっても再取得すること', async () => {
    mockFetch();
    await rssService.fetchFeed(FEED_URL);
    const fetchSpy = mockFetch('<rss><channel><item><title>Newer</title></item></channel></rss>');

    const feed = await rssService.fetchFeed(FEED_URL, true);

    expect(fetchSpy).toHaveBeenCalledTimes(1);
    expect(feed.items[0].title).toBe('Newer');
  });

  it('TTLを過ぎたキャッシュは再取得されること', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-09-16T00:00:00Z'));
    mockFetch();
    await rssService.fetchFeed(FEED_URL);

    vi.setSystemTime(new Date('2026-09-16T00:20:00Z'));
    const fetchSpy = mockFetch('<rss><channel><item><title>Newer</title></item></channel></rss>');
    const feed = await rssService.fetchFeed(FEED_URL);

    expect(fetchSpy).toHaveBeenCalledTimes(1);
    expect(feed.items[0].title).toBe('Newer');
  });

  it('ホスト権限が無くキャッシュも無い場合は FeedPermissionRequired を投げること', async () => {
    chromeMock.permissions.contains.mockResolvedValue(false);
    const fetchSpy = mockFetch();

    await expect(rssService.fetchFeed(FEED_URL)).rejects.toBeInstanceOf(FeedPermissionRequired);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('ホスト権限が無くてもキャッシュがあればそれを返すこと', async () => {
    mockFetch();
    await rssService.fetchFeed(FEED_URL);
    chromeMock.permissions.contains.mockResolvedValue(false);

    const feed = await rssService.fetchFeed(FEED_URL, true);
    expect(feed.items).toHaveLength(2);
  });

  it('HTTPエラー時はキャッシュがあれば古いデータを返し、無ければ例外を投げること', async () => {
    mockFetch(RSS_XML, false, 503);
    await expect(rssService.fetchFeed(FEED_URL)).rejects.toThrow(/HTTP error 503/);

    mockFetch();
    await rssService.fetchFeed(FEED_URL);
    mockFetch('', false, 500);
    const stale = await rssService.fetchFeed(FEED_URL, true);
    expect(stale.items).toHaveLength(2);
  });

  it('ネットワーク例外を Error として伝播すること', async () => {
    vi.spyOn(globalThis, 'fetch').mockRejectedValue('offline');
    await expect(rssService.fetchFeed(FEED_URL)).rejects.toThrow('Failed to fetch RSS feed.');
  });

  it('refreshAllFeeds は失敗したフィードを除いて結果を返すこと', async () => {
    vi.spyOn(globalThis, 'fetch').mockImplementation(async (input) => {
      const url = String(input);
      if (url.includes('bad')) throw new Error('nope');
      return { ok: true, status: 200, statusText: 'OK', text: async () => RSS_XML } as Response;
    });

    const results = await rssService.refreshAllFeeds(['https://good.example/feed', 'https://bad.example/feed']);

    expect(Object.keys(results)).toEqual(['https://good.example/feed']);
    expect(results['https://good.example/feed'].items).toHaveLength(2);
  });
});
