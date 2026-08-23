import { describe, it, expect } from 'vitest';
import { parseRssXml } from '../../src/utils/rssParser';

describe('rssParser', () => {
  it('RSS 2.0 フォーマットを正しくパースできること', () => {
    const mockXml = `
      <rss version="2.0">
        <channel>
          <title>Test Feed</title>
          <item>
            <title>記事タイトル 1</title>
            <link>https://example.com/1</link>
            <pubDate>Sun, 23 Aug 2026 06:00:00 GMT</pubDate>
            <description>This is a test article description.</description>
          </item>
        </channel>
      </rss>
    `;
    const items = parseRssXml(mockXml);
    expect(items).toHaveLength(1);
    expect(items[0].title).toBe('記事タイトル 1');
    expect(items[0].link).toBe('https://example.com/1');
    expect(items[0].contentSnippet).toBe('This is a test article description.');
  });

  it('Atom 1.0 フォーマットを正しくパースできること', () => {
    const mockAtom = `
      <?xml version="1.0" encoding="utf-8"?>
      <feed xmlns="http://www.w3.org/2005/Atom">
        <title>Atom Feed</title>
        <entry>
          <title>Atom Entry Title</title>
          <link href="https://example.com/atom/1" rel="alternate"/>
          <id>urn:uuid:12345</id>
          <published>2026-08-23T06:00:00Z</published>
          <summary>Summary of atom entry</summary>
        </entry>
      </feed>
    `;
    const items = parseRssXml(mockAtom);
    expect(items).toHaveLength(1);
    expect(items[0].title).toBe('Atom Entry Title');
    expect(items[0].link).toBe('https://example.com/atom/1');
    expect(items[0].contentSnippet).toBe('Summary of atom entry');
  });

  it('Google News 形式のタイトルからソース名を抽出できること', () => {
    const mockGoogleNewsXml = `
      <rss version="2.0">
        <channel>
          <title>Google News</title>
          <item>
            <title>New Space Telescope Launched - TechCrunch</title>
            <link>https://news.google.com/rss/articles/123</link>
            <pubDate>Sun, 23 Aug 2026 07:00:00 GMT</pubDate>
            <source url="https://techcrunch.com">TechCrunch</source>
          </item>
        </channel>
      </rss>
    `;
    const items = parseRssXml(mockGoogleNewsXml);
    expect(items).toHaveLength(1);
    expect(items[0].sourceTitle).toBe('TechCrunch');
  });

  it('空または無効なXML入力時に安全に空配列を返すこと', () => {
    expect(parseRssXml('')).toEqual([]);
    expect(parseRssXml('Invalid non-xml string')).toEqual([]);
  });
});
