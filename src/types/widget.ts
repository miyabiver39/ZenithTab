import { Layout } from 'react-grid-layout';

export type WidgetType =
  | 'clock'
  | 'weather'
  | 'bookmarks'
  | 'rss'
  | 'iframe'
  | 'notes'
  | 'search'
  | 'pomodoro'
  | 'todo'
  | 'shortcuts'
  | 'qrcode'
  | 'quickaccess'
  | 'countdown';

export interface BaseWidgetConfig {
  title?: string;
  transparentBackground?: boolean;
}

export interface ClockWidgetConfig extends BaseWidgetConfig {
  style: 'digital' | 'analog' | 'minimal';
  showSeconds: boolean;
  showDate: boolean;
  is24Hour: boolean;
  timezone?: string;
}

export interface WeatherWidgetConfig extends BaseWidgetConfig {
  city: string;
  latitude?: number;
  longitude?: number;
  unit: 'celsius' | 'fahrenheit';
  showForecast: boolean;
  autoDetectLocation?: boolean;
}

export interface BookmarkWidgetConfig extends BaseWidgetConfig {
  rootFolderId?: string;
  viewMode: 'grid' | 'list' | 'tree';
  showFavicons: boolean;
  columns: number;
}

/** Google News "section" feeds (https://news.google.com/rss/headlines/section/topic/<TOPIC>). */
export type GoogleNewsTopic =
  | 'WORLD'
  | 'NATION'
  | 'BUSINESS'
  | 'TECHNOLOGY'
  | 'ENTERTAINMENT'
  | 'SPORTS'
  | 'SCIENCE'
  | 'HEALTH';

export type GoogleNewsMode = 'headlines' | 'topic' | 'search';

export interface RssFeedWidgetConfig extends BaseWidgetConfig {
  feedUrl: string;
  isGoogleNews?: boolean;
  /**
   * Which Google News feed to show. Older configs have no mode: they are
   * treated as 'search' when a searchQuery is present, 'headlines'
   * otherwise (see rssService.resolveGoogleNewsMode).
   */
  googleNewsMode?: GoogleNewsMode;
  googleNewsTopic?: GoogleNewsTopic;
  searchQuery?: string;
  maxItems: number;
  refreshIntervalMinutes: number;
  showThumbnail: boolean;
  showDate: boolean;
  showDescription: boolean;
}

export interface IframeWidgetConfig extends BaseWidgetConfig {
  url: string;
  title: string;
  allowScroll: boolean;
  customFallbackTitle?: string;
}

export interface NotePage {
  id: string;
  title: string;
  content: string;
}

export interface QuickNotesWidgetConfig extends BaseWidgetConfig {
  /** @deprecated Legacy single-note content, kept only to migrate old configs into `pages`. */
  content?: string;
  pages?: NotePage[];
  activePageId?: string;
  fontSize: 'sm' | 'base' | 'lg';
  fontFamily: 'sans' | 'mono' | 'serif';
}

export type SearchEngine = 'google' | 'bing' | 'duckduckgo' | 'github' | 'youtube' | 'chatgpt';

export interface CustomSearchEngine {
  id: string;
  name: string;
  /** Must contain a `{query}` placeholder, e.g. "https://example.com/search?q={query}". */
  urlTemplate: string;
  /** Optional emoji/short string shown instead of the generic search icon. */
  icon?: string;
}

export interface SearchWidgetConfig extends BaseWidgetConfig {
  /** A built-in SearchEngine key, or a CustomSearchEngine id from customEngines. */
  defaultEngine: string;
  showEngineSelector: boolean;
  openInNewTab: boolean;
  customEngines?: CustomSearchEngine[];
  /** Built-in engines the user removed — managed the same way as custom ones. */
  hiddenBuiltinEngines?: SearchEngine[];
}

export interface PomodoroWidgetConfig extends BaseWidgetConfig {
  focusDurationMinutes: number;
  shortBreakDurationMinutes: number;
  longBreakDurationMinutes: number;
  autoStartBreaks: boolean;
}

export interface TodoItem {
  id: string;
  text: string;
  completed: boolean;
  priority?: 'high' | 'medium' | 'low';
  createdAt: number;
}

export interface TodoWidgetConfig extends BaseWidgetConfig {
  items: TodoItem[];
}

export interface ShortcutItem {
  id: string;
  title: string;
  url: string;
  iconUrl?: string;
  iconColor?: string;
  category?: string;
}

export interface ShortcutsWidgetConfig extends BaseWidgetConfig {
  items: ShortcutItem[];
  columns: number;
  openInNewTab: boolean;
  viewMode: 'grid' | 'compact';
}

export type QuickAccessView = 'topSites' | 'recentlyClosed';

export interface QuickAccessWidgetConfig extends BaseWidgetConfig {
  defaultView: QuickAccessView;
  maxItems: 5 | 8 | 12;
  viewMode: 'list' | 'grid';
  openInNewTab: boolean;
}

export interface QrCodeWidgetConfig extends BaseWidgetConfig {
  mode: 'url' | 'phone' | 'text';
  value: string;
}

export interface CountdownEvent {
  id: string;
  name: string;
  /** Local calendar date, "YYYY-MM-DD". */
  date: string;
  emoji?: string;
  /** Count towards next year's date once this year's has passed (birthdays, holidays). */
  repeatYearly?: boolean;
}

export interface CountdownWidgetConfig extends BaseWidgetConfig {
  events: CountdownEvent[];
}

export type WidgetConfig =
  | { type: 'clock'; config: ClockWidgetConfig }
  | { type: 'weather'; config: WeatherWidgetConfig }
  | { type: 'bookmarks'; config: BookmarkWidgetConfig }
  | { type: 'rss'; config: RssFeedWidgetConfig }
  | { type: 'iframe'; config: IframeWidgetConfig }
  | { type: 'notes'; config: QuickNotesWidgetConfig }
  | { type: 'search'; config: SearchWidgetConfig }
  | { type: 'pomodoro'; config: PomodoroWidgetConfig }
  | { type: 'todo'; config: TodoWidgetConfig }
  | { type: 'shortcuts'; config: ShortcutsWidgetConfig }
  | { type: 'qrcode'; config: QrCodeWidgetConfig }
  | { type: 'quickaccess'; config: QuickAccessWidgetConfig }
  | { type: 'countdown'; config: CountdownWidgetConfig };

export interface DashboardWidget {
  id: string;
  type: WidgetType;
  title: string;
  config: Record<string, any>;
  layout: Layout;
}

export interface ResponsiveLayouts {
  lg: Layout[];
  md: Layout[];
  sm: Layout[];
  xs: Layout[];
  [key: string]: Layout[];
}

export interface DashboardPageMeta {
  id: string;
  name: string;
}

export interface DashboardPageData {
  widgets: DashboardWidget[];
  layouts: ResponsiveLayouts;
}

/** Grid breakpoint names, as used by react-grid-layout and ResponsiveLayouts. */
export type GridBreakpoint = 'lg' | 'md' | 'sm' | 'xs' | 'xxs';

interface TrashEntryBase {
  id: string;
  deletedAt: number;
}

/** A widget removed from a page, with its slot on every breakpoint. */
export interface TrashedWidget extends TrashEntryBase {
  kind: 'widget';
  widget: DashboardWidget;
  layouts: Partial<Record<GridBreakpoint, Layout>>;
  sourcePageId: string;
  /** Display name at deletion time, so the row still reads well if the page is gone. */
  sourcePageName: string;
}

/** A whole page removed from the dashboard. */
export interface TrashedPage extends TrashEntryBase {
  kind: 'page';
  pageMeta: DashboardPageMeta;
  pageData: DashboardPageData;
}

/**
 * Deleted widgets/pages, kept for a while so an accidental delete can be
 * undone long after the undo toast is gone (see services/trashService.ts).
 */
export type TrashEntry = TrashedWidget | TrashedPage;
