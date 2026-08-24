import { DashboardWidget, ResponsiveLayouts } from '../types/widget';
import { WallpaperSettings, AppearanceSettings, DashboardExportData } from '../types/settings';
import { storageGet, storageSet } from '../utils/storage';

/** The running extension version, so exports carry the version that produced them. */
function currentVersion(): string {
  try {
    if (typeof chrome !== 'undefined' && chrome.runtime?.getManifest) {
      return chrome.runtime.getManifest().version || '0.0.0';
    }
  } catch {
    // Outside the extension context (unit tests, dev server) there is no manifest.
  }
  return '0.0.0';
}

/**
 * Import guard. A config file is user-supplied data that ends up rendered as
 * links and embedded frames, so every URL it carries is re-validated here —
 * `javascript:` and `data:` payloads must never survive a round-trip through
 * export/import.
 */
function isSafeUrl(value: unknown): boolean {
  if (typeof value !== 'string' || !value) return false;
  try {
    const protocol = new URL(value).protocol;
    return protocol === 'https:' || protocol === 'http:';
  } catch {
    return false;
  }
}

const URL_CONFIG_KEYS = ['feedUrl', 'url', 'targetUrl', 'iconUrl'] as const;

function sanitizeWidget(raw: any): DashboardWidget | null {
  if (!raw || typeof raw !== 'object') return null;
  if (typeof raw.id !== 'string' || typeof raw.type !== 'string') return null;
  if (!raw.layout || typeof raw.layout !== 'object') return null;

  const config: Record<string, any> = { ...(raw.config || {}) };

  for (const key of URL_CONFIG_KEYS) {
    if (config[key] !== undefined && !isSafeUrl(config[key])) {
      delete config[key];
    }
  }

  // Shortcut and app-drawer entries are nested one level deeper.
  if (Array.isArray(config.items)) {
    config.items = config.items.filter(
      (item: any) => !item || typeof item.url !== 'string' || isSafeUrl(item.url)
    );
  }

  return {
    ...raw,
    title: typeof raw.title === 'string' ? raw.title : 'Widget',
    config,
  } as DashboardWidget;
}

export const STORAGE_KEYS = {
  WIDGETS: 'dashboard_widgets',
  LAYOUTS: 'dashboard_layouts',
  WALLPAPER: 'dashboard_wallpaper',
  APPEARANCE: 'dashboard_appearance',
  RSS_CACHE: 'rss_cache',
  NOTES: 'quick_notes',
} as const;

export const DEFAULT_WALLPAPER: WallpaperSettings = {
  source: 'unsplash',
  category: 'space',
  blur: 4,
  brightness: 0.85,
  overlayOpacity: 0.35,
  refreshInterval: 'hourly',
  currentWallpaperUrl: 'https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?auto=format&fit=crop&w=2560&q=80',
};

export const DEFAULT_APPEARANCE: AppearanceSettings = {
  language: 'auto',
  theme: 'dark',
  glassBlur: 16,
  glassOpacity: 0.45,
  borderRadius: '2xl',
  compactMode: false,
  dockPosition: 'bottom',
};

export const DEFAULT_WIDGETS: DashboardWidget[] = [
  {
    id: 'widget-search-1',
    type: 'search',
    title: 'Search',
    config: {
      defaultEngine: 'google',
      showEngineSelector: true,
      openInNewTab: true,
    },
    layout: { i: 'widget-search-1', x: 2, y: 0, w: 8, h: 1, minW: 4, minH: 1 },
  },
  {
    id: 'widget-clock-1',
    type: 'clock',
    title: 'Clock',
    config: {
      style: 'digital',
      showSeconds: true,
      showDate: true,
      is24Hour: true,
    },
    layout: { i: 'widget-clock-1', x: 0, y: 1, w: 4, h: 2, minW: 2, minH: 2 },
  },
  {
    id: 'widget-weather-1',
    type: 'weather',
    title: 'Weather',
    config: {
      city: 'Tokyo',
      latitude: 35.6762,
      longitude: 139.6503,
      unit: 'celsius',
      showForecast: true,
    },
    layout: { i: 'widget-weather-1', x: 4, y: 1, w: 4, h: 2, minW: 3, minH: 2 },
  },
  {
    id: 'widget-pomodoro-1',
    type: 'pomodoro',
    title: 'Focus Timer',
    config: {
      focusDurationMinutes: 25,
      shortBreakDurationMinutes: 5,
      longBreakDurationMinutes: 15,
      autoStartBreaks: false,
    },
    layout: { i: 'widget-pomodoro-1', x: 8, y: 1, w: 4, h: 2, minW: 3, minH: 2 },
  },
  {
    id: 'widget-bookmarks-1',
    type: 'bookmarks',
    title: 'Bookmarks',
    config: {
      viewMode: 'grid',
      showFavicons: true,
      columns: 4,
    },
    layout: { i: 'widget-bookmarks-1', x: 0, y: 3, w: 4, h: 4, minW: 3, minH: 3 },
  },
  {
    id: 'widget-rss-1',
    type: 'rss',
    title: 'Tech News',
    config: {
      feedUrl: 'https://news.google.com/rss/search?q=technology&hl=en-US&gl=US&ceid=US:en',
      isGoogleNews: true,
      searchQuery: 'technology',
      maxItems: 8,
      refreshIntervalMinutes: 30,
      showThumbnail: true,
      showDate: true,
      showDescription: true,
    },
    layout: { i: 'widget-rss-1', x: 4, y: 3, w: 4, h: 4, minW: 3, minH: 3 },
  },
  {
    id: 'widget-todo-1',
    type: 'todo',
    title: 'Todo List',
    config: {
      items: [
        { id: '1', text: 'Explore ZenithTab settings', completed: false, createdAt: Date.now() },
        { id: '2', text: 'Customize widgets & wallpapers', completed: true, createdAt: Date.now() - 1000 },
      ],
    },
    layout: { i: 'widget-todo-1', x: 8, y: 3, w: 4, h: 4, minW: 3, minH: 2 },
  },
];

export const DEFAULT_LAYOUTS: ResponsiveLayouts = {
  lg: DEFAULT_WIDGETS.map((w) => w.layout),
  md: DEFAULT_WIDGETS.map((w) => ({ ...w.layout, w: Math.min(w.layout.w, 5) })),
  sm: DEFAULT_WIDGETS.map((w, index) => ({ ...w.layout, x: 0, y: index * 2, w: 6 })),
  xs: DEFAULT_WIDGETS.map((w, index) => ({ ...w.layout, x: 0, y: index * 2, w: 4 })),
};

export const storageService = {
  async getWidgets(): Promise<DashboardWidget[]> {
    const widgets = await storageGet<DashboardWidget[]>(STORAGE_KEYS.WIDGETS, DEFAULT_WIDGETS);
    return widgets || DEFAULT_WIDGETS;
  },

  async saveWidgets(widgets: DashboardWidget[]): Promise<void> {
    await storageSet(STORAGE_KEYS.WIDGETS, widgets);
  },

  async getLayouts(): Promise<ResponsiveLayouts> {
    const layouts = await storageGet<ResponsiveLayouts>(STORAGE_KEYS.LAYOUTS, DEFAULT_LAYOUTS);
    return layouts || DEFAULT_LAYOUTS;
  },

  async saveLayouts(layouts: ResponsiveLayouts): Promise<void> {
    await storageSet(STORAGE_KEYS.LAYOUTS, layouts);
  },

  async getWallpaper(): Promise<WallpaperSettings> {
    const wallpaper = await storageGet<WallpaperSettings>(STORAGE_KEYS.WALLPAPER, DEFAULT_WALLPAPER);
    return wallpaper || DEFAULT_WALLPAPER;
  },

  async saveWallpaper(wallpaper: WallpaperSettings): Promise<void> {
    await storageSet(STORAGE_KEYS.WALLPAPER, wallpaper);
  },

  async getAppearance(): Promise<AppearanceSettings> {
    const appearance = await storageGet<AppearanceSettings>(STORAGE_KEYS.APPEARANCE, DEFAULT_APPEARANCE);
    return appearance || DEFAULT_APPEARANCE;
  },

  async saveAppearance(appearance: AppearanceSettings): Promise<void> {
    await storageSet(STORAGE_KEYS.APPEARANCE, appearance);
  },

  async exportDashboardData(): Promise<DashboardExportData> {
    const widgets = await this.getWidgets();
    const layouts = await this.getLayouts();
    const wallpaper = await this.getWallpaper();
    const appearance = await this.getAppearance();

    return {
      version: currentVersion(),
      exportedAt: new Date().toISOString(),
      widgets,
      layouts,
      wallpaper,
      appearance,
    };
  },

  async importDashboardData(jsonData: string): Promise<boolean> {
    try {
      const data: DashboardExportData = JSON.parse(jsonData);
      if (!data.widgets || !Array.isArray(data.widgets)) {
        throw new Error('Invalid widget format in imported data');
      }

      const widgets = data.widgets
        .map(sanitizeWidget)
        .filter((w): w is DashboardWidget => w !== null);

      if (widgets.length === 0) {
        throw new Error('Imported file contained no usable widgets');
      }

      await this.saveWidgets(widgets);
      if (data.layouts) await this.saveLayouts(data.layouts);
      if (data.wallpaper) await this.saveWallpaper(data.wallpaper);
      if (data.appearance) await this.saveAppearance(data.appearance);

      return true;
    } catch (error) {
      console.error('Failed to import ZenithTab dashboard data:', error);
      return false;
    }
  },

  async resetDashboard(): Promise<void> {
    await this.saveWidgets(DEFAULT_WIDGETS);
    await this.saveLayouts(DEFAULT_LAYOUTS);
    await this.saveWallpaper(DEFAULT_WALLPAPER);
    await this.saveAppearance(DEFAULT_APPEARANCE);
  },
};
