export interface SearchEnginePreset {
  id: string;
  name: string;
  urlTemplate: string;
  icon: string;
}

/**
 * One-click additions for popular engines that aren't built in. Covers the
 * languages ZenithTab ships in, so a Yahoo! JAPAN / Baidu / Naver user isn't
 * forced to hand-build a URL template just to add their default engine.
 */
export const SEARCH_ENGINE_PRESETS: SearchEnginePreset[] = [
  { id: 'yahoo-japan', name: 'Yahoo! JAPAN', urlTemplate: 'https://search.yahoo.co.jp/search?p={query}', icon: '🟣' },
  { id: 'yahoo', name: 'Yahoo!', urlTemplate: 'https://search.yahoo.com/search?p={query}', icon: '🟣' },
  { id: 'baidu', name: 'Baidu', urlTemplate: 'https://www.baidu.com/s?wd={query}', icon: '🔴' },
  { id: 'naver', name: 'Naver', urlTemplate: 'https://search.naver.com/search.naver?query={query}', icon: '🟢' },
  { id: 'ecosia', name: 'Ecosia', urlTemplate: 'https://www.ecosia.org/search?q={query}', icon: '🌳' },
  { id: 'brave', name: 'Brave Search', urlTemplate: 'https://search.brave.com/search?q={query}', icon: '🦁' },
];

const COMMON_QUERY_PARAM_NAMES = ['q', 'p', 'query', 'wd', 'text', 'search', 'keyword', 'k', 's'];

/**
 * Most users won't hand-author a `{query}`-templated URL — they'll paste a
 * real search-results URL copied from their address bar after actually
 * searching something. Detect that case and swap the query parameter's
 * value for the placeholder automatically. Returns null when no confident
 * guess can be made (caller should leave the input untouched).
 */
export function guessSearchUrlTemplate(url: string): string | null {
  const trimmed = url.trim();
  if (!trimmed || trimmed.includes('{query}')) return null;

  let parsed: URL;
  try {
    parsed = new URL(trimmed);
  } catch {
    return null;
  }

  for (const name of COMMON_QUERY_PARAM_NAMES) {
    const value = parsed.searchParams.get(name);
    if (value) {
      parsed.searchParams.set(name, '{query}');
      // URL's own serializer percent-encodes the braces; decode them back
      // so the stored template stays human-readable and still matches the
      // literal "{query}".replace() check used elsewhere.
      return parsed.toString().replace(/%7B/gi, '{').replace(/%7D/gi, '}');
    }
  }

  return null;
}
