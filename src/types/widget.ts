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
  | 'todo';

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

export interface RssFeedWidgetConfig extends BaseWidgetConfig {
  feedUrl: string;
  isGoogleNews?: boolean;
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

export interface QuickNotesWidgetConfig extends BaseWidgetConfig {
  content: string;
  fontSize: 'sm' | 'base' | 'lg';
  fontFamily: 'sans' | 'mono' | 'serif';
}

export type SearchEngine = 'google' | 'bing' | 'duckduckgo' | 'github' | 'youtube' | 'chatgpt';

export interface SearchWidgetConfig extends BaseWidgetConfig {
  defaultEngine: SearchEngine;
  showEngineSelector: boolean;
  openInNewTab: boolean;
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

export type WidgetConfig =
  | { type: 'clock'; config: ClockWidgetConfig }
  | { type: 'weather'; config: WeatherWidgetConfig }
  | { type: 'bookmarks'; config: BookmarkWidgetConfig }
  | { type: 'rss'; config: RssFeedWidgetConfig }
  | { type: 'iframe'; config: IframeWidgetConfig }
  | { type: 'notes'; config: QuickNotesWidgetConfig }
  | { type: 'search'; config: SearchWidgetConfig }
  | { type: 'pomodoro'; config: PomodoroWidgetConfig }
  | { type: 'todo'; config: TodoWidgetConfig };

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
