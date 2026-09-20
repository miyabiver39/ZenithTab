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
    // Google News items carry no per-article image, so the RSS widget falls
    // back to a favicon of this source URL — the parser must extract it.
    expect(items[0].sourceUrl).toBe('https://techcrunch.com');
  });

  it('空または無効なXML入力時に安全に空配列を返すこと', () => {
    expect(parseRssXml('')).toEqual([]);
    expect(parseRssXml('Invalid non-xml string')).toEqual([]);
  });
});

describe('rssParser edge cases', () => {
  it('RSS: オブジェクト形式の title / link / guid、media:content 配列、source 要素、不正な日付', () => {
    const xml = `
      <rss version="2.0"><channel>
        <item>
          <title><![CDATA[<b>Bold</b> title]]></title>
          <link href="https://example.com/obj">ignored</link>
          <guid isPermaLink="false">guid-1</guid>
          <pubDate>not a date</pubDate>
          <media:content url="https://img.example/a.jpg" /><media:content url="https://img.example/b.jpg" />
          <source url="https://src.example">Source Name</source>
        </item>
        <item>
          <title>Plain - Publisher</title>
          <link>https://example.com/2</link>
          <enclosure url="https://img.example/enc.png" type="image/png" />
          <description><![CDATA[<p>Hello &amp; welcome</p>]]></description>
        </item>
        <item>
          <title>Img in html</title>
          <link>https://example.com/3</link>
          <enclosure url="https://files.example/doc.pdf" type="application/pdf" />
          <description><![CDATA[<img src='https://img.example/inline.jpg'> text]]></description>
        </item>
      </channel></rss>`;
    const items = parseRssXml(xml);
    expect(items).toHaveLength(3);
    expect(items[0]).toMatchObject({ title: 'Bold title', link: 'https://example.com/obj', id: 'guid-1', imageUrl: 'https://img.example/a.jpg', sourceTitle: 'Source Name', sourceUrl: 'https://src.example' });
    expect(items[0].isoDate).toBeUndefined();
    expect(items[1]).toMatchObject({ sourceTitle: 'Publisher', imageUrl: 'https://img.example/enc.png', contentSnippet: 'Hello & welcome' });
    // A non-image enclosure is ignored and the <img> in the body wins.
    expect(items[2].imageUrl).toBe('https://img.example/inline.jpg');
  });

  it('RSS 1.0 (RDF) と単一 item(配列でない)を扱えること', () => {
    const xml = `
      <rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#" xmlns:dc="http://purl.org/dc/elements/1.1/">
        <item><title>RDF item</title><link>https://example.com/rdf</link><dc:date>2026-09-20T00:00:00Z</dc:date></item>
      </rdf:RDF>`;
    const items = parseRssXml(xml);
    expect(items).toHaveLength(1);
    expect(items[0]).toMatchObject({ title: 'RDF item', link: 'https://example.com/rdf', isoDate: '2026-09-20T00:00:00.000Z' });
  });

  it('Atom: link の配列 / オブジェクト / 文字列、object title、サムネイル優先順位、著者', () => {
    const xml = `
      <feed xmlns="http://www.w3.org/2005/Atom" xmlns:media="http://search.yahoo.com/mrss/">
        <entry>
          <title type="html">Object &lt;i&gt;title&lt;/i&gt;</title>
          <link rel="self" href="https://example.com/self"/><link rel="alternate" href="https://example.com/alt"/>
          <id>a1</id><updated>2026-09-20T01:00:00Z</updated>
          <media:thumbnail url="https://img.example/thumb.jpg"/><media:content url="https://img.example/content.jpg"/>
          <author><name>Alice</name></author>
          <content type="html">&lt;p&gt;Body&lt;/p&gt;</content>
        </entry>
        <entry>
          <title>Object link</title><link href="https://example.com/obj"/><id>a2</id>
          <media:content url="https://img.example/content2.jpg"/>
          <summary>plain</summary>
        </entry>
        <entry>
          <title>String link</title><link>https://example.com/str</link><id>a3</id>
          <summary type="html">&lt;img src="https://img.example/sum.jpg"&gt; hi</summary>
        </entry>
      </feed>`;
    const items = parseRssXml(xml);
    expect(items).toHaveLength(3);
    expect(items[0]).toMatchObject({ title: 'Object title', link: 'https://example.com/alt', imageUrl: 'https://img.example/thumb.jpg', creator: 'Alice', contentSnippet: 'Body', isoDate: '2026-09-20T01:00:00.000Z' });
    expect(items[1]).toMatchObject({ link: 'https://example.com/obj', imageUrl: 'https://img.example/content2.jpg', contentSnippet: 'plain' });
    expect(items[2]).toMatchObject({ link: 'https://example.com/str', imageUrl: 'https://img.example/sum.jpg' });
  });

  it('Atom: 不正な日付のエントリがあってもフィード全体が空にならないこと', () => {
    const xml = `
      <feed xmlns="http://www.w3.org/2005/Atom">
        <entry><title>Bad date</title><link href="https://example.com/1"/><id>b1</id><published>yesterday-ish</published></entry>
        <entry><title>Good</title><link href="https://example.com/2"/><id>b2</id><published>2026-09-20T00:00:00Z</published></entry>
      </feed>`;
    const items = parseRssXml(xml);
    expect(items.map((i) => i.title)).toEqual(['Bad date', 'Good']);
    expect(items[0].isoDate).toBeUndefined();
    expect(items[1].isoDate).toBe('2026-09-20T00:00:00.000Z');
  });

  it('item / entry の無い文書は空配列', () => {
    expect(parseRssXml('<rss version="2.0"><channel><title>Empty</title></channel></rss>')).toEqual([]);
    expect(parseRssXml('<feed xmlns="http://www.w3.org/2005/Atom"><title>Empty</title></feed>')).toEqual([]);
  });
});
