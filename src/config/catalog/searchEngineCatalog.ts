import type { PresetLanguage } from '../defaults/regionalPresets';
import type { SearchEngine } from '../../types/widget';

/**
 * Engines the Quick Search widget can add from its "add from catalog"
 * picker: web search, AI assistants, video, shopping, reference, dev and
 * social sites that accept the query in the URL.
 *
 * Every template holds a literal `{query}` placeholder (the same format a
 * hand-made custom engine uses), so picking one simply stores a
 * `CustomSearchEngine` — no new saved-data shape. Entries with `builtin`
 * are the widget's own engines: picking one un-hides it instead of adding
 * a duplicate.
 *
 * Only services that prefill (or run) the query from the URL are listed.
 * Gemini isn't: gemini.google.com ignores URL prompts, so Google's AI Mode
 * (`udm=50`) stands in for it. Copilot likewise goes through Bing's
 * Copilot Search (see COPILOT_SEARCH_TEMPLATE).
 */
export type SearchEngineCategory = 'web' | 'ai' | 'video' | 'shopping' | 'reference' | 'dev' | 'social';

export const SEARCH_ENGINE_CATEGORIES: SearchEngineCategory[] = ['web', 'ai', 'video', 'shopping', 'reference', 'dev', 'social'];

export interface CatalogSearchEngine {
  id: string;
  name: string;
  urlTemplate: string;
  category: SearchEngineCategory;
  /** Set on the engines the widget ships with (keyed in SearchWidget). */
  builtin?: SearchEngine;
}

/** The widget's built-in engines and where they send the query. */
export const BUILTIN_SEARCH_TEMPLATES: Record<SearchEngine, string> = {
  google: 'https://www.google.com/search?q={query}',
  duckduckgo: 'https://duckduckgo.com/?q={query}',
  bing: 'https://www.bing.com/search?q={query}',
  github: 'https://github.com/search?q={query}',
  youtube: 'https://www.youtube.com/results?search_query={query}',
  chatgpt: 'https://chatgpt.com/?q={query}',
};

export const BUILTIN_SEARCH_LABELS: Record<SearchEngine, string> = {
  google: 'Google',
  duckduckgo: 'DuckDuckGo',
  bing: 'Bing',
  github: 'GitHub',
  youtube: 'YouTube',
  chatgpt: 'ChatGPT',
};

export const BUILTIN_SEARCH_KEYS = Object.keys(BUILTIN_SEARCH_TEMPLATES) as SearchEngine[];

/**
 * Copilot's own site dropped `?q=` (to blunt prompt injection via links),
 * so copilot.microsoft.com opens with an empty box. Bing's Copilot Search
 * is the query-in-URL entry point Microsoft documents instead.
 */
export const LEGACY_COPILOT_TEMPLATE = 'https://copilot.microsoft.com/?q={query}';
export const COPILOT_SEARCH_TEMPLATE = 'https://www.bing.com/copilotsearch?q={query}';

type Row = [id: string, name: string, urlTemplate: string, category: SearchEngineCategory, regions?: PresetLanguage[]];

const builtin = (key: SearchEngine, category: SearchEngineCategory): CatalogSearchEngine => ({
  id: key,
  name: BUILTIN_SEARCH_LABELS[key],
  urlTemplate: BUILTIN_SEARCH_TEMPLATES[key],
  category,
  builtin: key,
});

// `regions` limits an entry to the picker's matching region (Yahoo! JAPAN
// means nothing to a German user); entries without it show everywhere.
const ROWS: Array<Row | CatalogSearchEngine> = [
  builtin('google', 'web'),
  builtin('bing', 'web'),
  builtin('duckduckgo', 'web'),
  ['yahoo-japan', 'Yahoo! JAPAN', 'https://search.yahoo.co.jp/search?p={query}', 'web', ['ja']],
  ['yahoo', 'Yahoo!', 'https://search.yahoo.com/search?p={query}', 'web', ['en', 'es', 'fr', 'de']],
  ['naver', 'Naver', 'https://search.naver.com/search.naver?query={query}', 'web', ['ko']],
  ['baidu', 'Baidu', 'https://www.baidu.com/s?wd={query}', 'web', ['zh-CN']],
  ['qwant', 'Qwant', 'https://www.qwant.com/?q={query}', 'web', ['fr', 'de']],
  ['ecosia', 'Ecosia', 'https://www.ecosia.org/search?q={query}', 'web'],
  ['brave', 'Brave Search', 'https://search.brave.com/search?q={query}', 'web'],
  ['startpage', 'Startpage', 'https://www.startpage.com/do/search?q={query}', 'web'],

  builtin('chatgpt', 'ai'),
  ['claude', 'Claude', 'https://claude.ai/new?q={query}', 'ai'],
  ['perplexity', 'Perplexity', 'https://www.perplexity.ai/search?q={query}', 'ai'],
  ['google-ai-mode', 'Google AI Mode', 'https://www.google.com/search?udm=50&q={query}', 'ai'],
  ['copilot', 'Copilot Search (Bing)', COPILOT_SEARCH_TEMPLATE, 'ai'],
  ['grok', 'Grok', 'https://grok.com/?q={query}', 'ai'],
  ['mistral', 'Le Chat (Mistral)', 'https://chat.mistral.ai/chat?q={query}', 'ai'],
  ['felo', 'Felo', 'https://felo.ai/search?q={query}', 'ai'],

  builtin('youtube', 'video'),
  ['niconico', 'ニコニコ動画', 'https://www.nicovideo.jp/search/{query}', 'video', ['ja']],
  ['bilibili', 'bilibili', 'https://search.bilibili.com/all?keyword={query}', 'video', ['zh-CN']],
  ['spotify', 'Spotify', 'https://open.spotify.com/search/{query}', 'video'],

  ['amazon', 'Amazon', 'https://www.amazon.com/s?k={query}', 'shopping', ['en', 'ko', 'zh-CN']],
  ['amazon-jp', 'Amazon.co.jp', 'https://www.amazon.co.jp/s?k={query}', 'shopping', ['ja']],
  ['amazon-es', 'Amazon.es', 'https://www.amazon.es/s?k={query}', 'shopping', ['es']],
  ['amazon-fr', 'Amazon.fr', 'https://www.amazon.fr/s?k={query}', 'shopping', ['fr']],
  ['amazon-de', 'Amazon.de', 'https://www.amazon.de/s?k={query}', 'shopping', ['de']],
  ['rakuten', '楽天市場', 'https://search.rakuten.co.jp/search/mall/{query}/', 'shopping', ['ja']],
  ['mercari', 'メルカリ', 'https://jp.mercari.com/search?keyword={query}', 'shopping', ['ja']],
  ['coupang', 'Coupang', 'https://www.coupang.com/np/search?q={query}', 'shopping', ['ko']],
  ['taobao', '淘宝', 'https://s.taobao.com/search?q={query}', 'shopping', ['zh-CN']],
  ['ebay', 'eBay', 'https://www.ebay.com/sch/i.html?_nkw={query}', 'shopping', ['en', 'es', 'fr', 'de']],

  ['wikipedia-en', 'Wikipedia', 'https://en.wikipedia.org/w/index.php?search={query}', 'reference', ['en']],
  ['wikipedia-ja', 'Wikipedia (日本語)', 'https://ja.wikipedia.org/w/index.php?search={query}', 'reference', ['ja']],
  ['wikipedia-ko', 'Wikipedia (한국어)', 'https://ko.wikipedia.org/w/index.php?search={query}', 'reference', ['ko']],
  ['wikipedia-zh', 'Wikipedia (中文)', 'https://zh.wikipedia.org/w/index.php?search={query}', 'reference', ['zh-CN']],
  ['wikipedia-es', 'Wikipedia (Español)', 'https://es.wikipedia.org/w/index.php?search={query}', 'reference', ['es']],
  ['wikipedia-fr', 'Wikipedia (Français)', 'https://fr.wikipedia.org/w/index.php?search={query}', 'reference', ['fr']],
  ['wikipedia-de', 'Wikipedia (Deutsch)', 'https://de.wikipedia.org/w/index.php?search={query}', 'reference', ['de']],
  ['google-maps', 'Google Maps', 'https://www.google.com/maps/search/{query}', 'reference'],
  ['google-images', 'Google Images', 'https://www.google.com/search?tbm=isch&q={query}', 'reference'],
  ['google-translate', 'Google Translate', 'https://translate.google.com/?sl=auto&op=translate&text={query}', 'reference'],
  ['weblio', 'Weblio 辞書', 'https://www.weblio.jp/content/{query}', 'reference', ['ja']],

  builtin('github', 'dev'),
  ['stackoverflow', 'Stack Overflow', 'https://stackoverflow.com/search?q={query}', 'dev'],
  ['mdn', 'MDN Web Docs', 'https://developer.mozilla.org/search?q={query}', 'dev'],
  ['npm', 'npm', 'https://www.npmjs.com/search?q={query}', 'dev'],
  ['qiita', 'Qiita', 'https://qiita.com/search?q={query}', 'dev', ['ja']],
  ['zenn', 'Zenn', 'https://zenn.dev/search?q={query}', 'dev', ['ja']],

  ['x', 'X', 'https://x.com/search?q={query}', 'social'],
  ['reddit', 'Reddit', 'https://www.reddit.com/search/?q={query}', 'social'],
];

const ENTRIES: Array<CatalogSearchEngine & { regions?: PresetLanguage[] }> = ROWS.map((row) =>
  Array.isArray(row) ? { id: row[0], name: row[1], urlTemplate: row[2], category: row[3], ...(row[4] ? { regions: row[4] } : {}) } : row
);

/** The catalog as the picker shows it for one region: global entries plus that region's own. */
export function getSearchEngineCatalog(region: PresetLanguage): CatalogSearchEngine[] {
  return ENTRIES.filter((e) => !e.regions || e.regions.includes(region)).map(({ regions: _regions, ...entry }) => entry);
}

/** The built-in engine a catalog template stands for, if any. */
export function builtinForTemplate(urlTemplate: string): SearchEngine | undefined {
  return BUILTIN_SEARCH_KEYS.find((key) => BUILTIN_SEARCH_TEMPLATES[key] === urlTemplate);
}
