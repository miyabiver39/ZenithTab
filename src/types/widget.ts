import { Layout } from 'react-grid-layout';

export type WidgetType =
  | 'clock'
  | 'weather'
  | 'bookmarks'
  | 'rss'
  | 'iframe'
  | 'notes';

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

export type WidgetConfig =
  | { type: 'clock'; config: ClockWidgetConfig }
  | { type: 'weather'; config: WeatherWidgetConfig }
  | { type: 'bookmarks'; config: BookmarkWidgetConfig }
  | { type: 'rss'; config: RssFeedWidgetConfig }
  | { type: 'iframe'; config: IframeWidgetConfig }
  | { type: 'notes'; config: QuickNotesWidgetConfig };

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
