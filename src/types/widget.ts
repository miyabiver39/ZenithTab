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
  | 'quickaccess';

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
  | { type: 'quickaccess'; config: QuickAccessWidgetConfig };

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
