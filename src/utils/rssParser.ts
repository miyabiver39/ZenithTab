import { XMLParser } from 'fast-xml-parser';
import { RssFeedItem } from '../types/rss';

function stripHtml(html?: string): string {
  if (!html) return '';
  return html
    .replace(/<[^>]*>?/gm, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .trim();
}

function extractImageFromHtml(html?: string): string | undefined {
  if (!html) return undefined;
  const match = html.match(/<img[^>]+src=["']([^"']+)["']/i);
  return match ? match[1] : undefined;
}

export function parseRssXml(xmlText: string): RssFeedItem[] {
  if (!xmlText || typeof xmlText !== 'string') {
    return [];
  }

  const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: '@_',
    textNodeName: '#text',
    trimValues: true,
    parseTagValue: false,
  });

  try {
    const parsed = parser.parse(xmlText);
    const items: RssFeedItem[] = [];

    // RSS 2.0 / 0.9x / 1.0 (RDF)
    if (parsed.rss?.channel?.item || parsed['rdf:RDF']?.item) {
      const rawItems = parsed.rss?.channel?.item || parsed['rdf:RDF']?.item;
      const itemList = Array.isArray(rawItems) ? rawItems : [rawItems];

      for (let i = 0; i < itemList.length; i++) {
        const item = itemList[i];
        if (!item) continue;

        let title = item.title || 'Untitled';
        if (typeof title === 'object') {
          title = title['#text'] || JSON.stringify(title);
        }
        title = stripHtml(String(title));

        let link = item.link || '';
        if (typeof link === 'object') {
          link = link['@_href'] || link['#text'] || '';
        }

        const pubDate = item.pubDate || item['dc:date'] || '';
        const description = item.description || item['content:encoded'] || '';
        const contentSnippet = stripHtml(typeof description === 'string' ? description : description?.['#text'] || '');

        let imageUrl: string | undefined;
        // Check media:content or media:thumbnail
        const mediaContent = item['media:content'] || item['media:thumbnail'];
        if (mediaContent) {
          if (Array.isArray(mediaContent) && mediaContent[0]?.['@_url']) {
            imageUrl = mediaContent[0]['@_url'];
          } else if (mediaContent['@_url']) {
            imageUrl = mediaContent['@_url'];
          }
        }
        // Check enclosure
        if (!imageUrl && item.enclosure?.['@_url'] && item.enclosure?.['@_type']?.startsWith('image/')) {
          imageUrl = item.enclosure['@_url'];
        }
        // Check embedded html img tag
        if (!imageUrl && typeof description === 'string') {
          imageUrl = extractImageFromHtml(description);
        }

        // Source title (Google News format often has "Article Title - Source Name" or <source>)
        let sourceTitle: string | undefined;
        if (item.source) {
          sourceTitle = typeof item.source === 'string' ? item.source : item.source['#text'];
        } else if (title.includes(' - ')) {
          const parts = title.split(' - ');
          sourceTitle = parts[parts.length - 1];
        }

        let isoDate: string | undefined;
        if (pubDate) {
          try {
            const d = new Date(pubDate);
            if (!isNaN(d.getTime())) {
              isoDate = d.toISOString();
            }
          } catch {
            // ignore date parse error
          }
        }

        items.push({
          id: item.guid?.['#text'] || item.guid || link || `rss-item-${i}-${Date.now()}`,
          title,
          link: String(link).trim(),
          pubDate: String(pubDate),
          isoDate,
          contentSnippet,
          imageUrl,
          sourceTitle,
        });
      }
      return items;
    }

    // Atom 1.0
    if (parsed.feed?.entry) {
      const rawEntries = parsed.feed.entry;
      const entryList = Array.isArray(rawEntries) ? rawEntries : [rawEntries];

      for (let i = 0; i < entryList.length; i++) {
        const entry = entryList[i];
        if (!entry) continue;

        let title = entry.title || 'Untitled';
        if (typeof title === 'object') {
          title = title['#text'] || '';
        }
        title = stripHtml(String(title));

        let link = '';
        if (Array.isArray(entry.link)) {
          const altLink = entry.link.find((l: any) => l['@_rel'] === 'alternate') || entry.link[0];
          link = altLink?.['@_href'] || '';
        } else if (entry.link?.['@_href']) {
          link = entry.link['@_href'];
        } else if (typeof entry.link === 'string') {
          link = entry.link;
        }

        const pubDate = entry.published || entry.updated || '';
        const summary = entry.summary || entry.content || '';
        const contentSnippet = stripHtml(typeof summary === 'string' ? summary : summary?.['#text'] || '');

        let imageUrl: string | undefined;
        if (entry['media:thumbnail']?.['@_url']) {
          imageUrl = entry['media:thumbnail']['@_url'];
        } else if (entry['media:content']?.['@_url']) {
          imageUrl = entry['media:content']['@_url'];
        } else {
          imageUrl = extractImageFromHtml(typeof summary === 'string' ? summary : summary?.['#text']);
        }

        items.push({
          id: entry.id?.['#text'] || entry.id || link || `atom-item-${i}-${Date.now()}`,
          title,
          link: String(link).trim(),
          pubDate: String(pubDate),
          isoDate: pubDate ? new Date(pubDate).toISOString() : undefined,
          contentSnippet,
          imageUrl,
          creator: entry.author?.name || entry.author?.['#text'],
        });
      }
      return items;
    }

    return items;
  } catch (error) {
    console.error('Error parsing RSS/Atom XML:', error);
    return [];
  }
}
