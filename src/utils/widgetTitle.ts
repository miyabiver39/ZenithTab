import { DashboardWidget, WidgetType } from '../types/widget';
import type { Translation } from '../i18n/resolve';
import { CATALOG_TITLES, NEWS_TITLES } from '../i18n/defaultTitles';

/** Which stock title a stored title corresponds to. */
type StockKind = 'catalog' | 'news';

/**
 * Titles that older versions stamped onto default widgets, in English,
 * before titles were localized at first launch (1.3.3). Kept so those
 * installs pick up the current language too. `addWidget` also used to
 * title new widgets with the capitalized type name.
 */
const LEGACY_TITLES: Array<[WidgetType, string, StockKind]> = [
  ['search', 'Search', 'catalog'],
  ['clock', 'Clock', 'catalog'],
  ['weather', 'Weather', 'catalog'],
  ['pomodoro', 'Pomodoro', 'catalog'],
  ['bookmarks', 'Bookmarks', 'catalog'],
  ['rss', 'Rss', 'catalog'],
  ['rss', 'Tech News', 'news'],
  ['todo', 'Todo', 'catalog'],
  ['notes', 'Notes', 'catalog'],
  ['iframe', 'Iframe', 'catalog'],
  ['shortcuts', 'Shortcuts', 'catalog'],
  ['qrcode', 'Qrcode', 'catalog'],
];

// Every locale's stock title for each widget type. A widget whose stored
// title is one of these was never renamed by the user, so it can safely
// follow the language setting. Built once, lazily, from the small
// always-bundled defaultTitles.ts — NOT from i18n's LOCALES, which loads
// languages other than the active one lazily (#77); this index needs
// every language's titles at once, so it carries its own tiny copy of
// just the titles instead of forcing every locale to load.
let stockIndex: Map<WidgetType, Map<string, StockKind>> | null = null;

function buildIndex(): Map<WidgetType, Map<string, StockKind>> {
  const index = new Map<WidgetType, Map<string, StockKind>>();
  const add = (type: WidgetType, title: string | undefined, kind: StockKind) => {
    if (!title) return;
    if (!index.has(type)) index.set(type, new Map());
    const byTitle = index.get(type)!;
    if (!byTitle.has(title)) byTitle.set(title, kind);
  };

  for (const [type, byLocale] of Object.entries(CATALOG_TITLES)) {
    for (const title of Object.values(byLocale)) add(type as WidgetType, title, 'catalog');
  }
  // The default news widget is titled "News" (per locale) rather than
  // the catalogue entry "RSS & News".
  for (const title of Object.values(NEWS_TITLES)) add('rss', title, 'news');
  for (const [type, title, kind] of LEGACY_TITLES) add(type, title, kind);
  return index;
}

function stockKindOf(widget: Pick<DashboardWidget, 'type' | 'title'>): StockKind | undefined {
  if (!stockIndex) stockIndex = buildIndex();
  return stockIndex.get(widget.type)?.get(widget.title);
}

/** True when the widget still carries a stock title (any locale, any version). */
export function isDefaultWidgetTitle(widget: Pick<DashboardWidget, 'type' | 'title'>): boolean {
  return stockKindOf(widget) !== undefined;
}

/** The catalogue title for a widget type in the given language. */
export function getDefaultWidgetTitle(type: WidgetType, t: Translation): string {
  const entry = (t.widgets as Record<string, { title?: string }>)[type];
  return entry?.title || type.charAt(0).toUpperCase() + type.slice(1);
}

/**
 * What to show in a widget's header: a title the user typed stays as-is;
 * a stock title is re-resolved in the current language so switching the
 * dashboard language updates every default widget immediately, without
 * rewriting anything in storage.
 */
export function getLocalizedWidgetTitle(widget: Pick<DashboardWidget, 'type' | 'title'>, t: Translation): string {
  const kind = stockKindOf(widget);
  if (kind === 'news') return t.defaults.newsTitle;
  if (kind === 'catalog') return getDefaultWidgetTitle(widget.type, t);
  return widget.title;
}
