import { DashboardWidget, ResponsiveLayouts } from '../types/widget';
import { WallpaperSettings, AppearanceSettings, DashboardExportData } from '../types/settings';
import { storageGet, storageSet } from '../utils/storage';

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
  theme: 'dark',
  glassBlur: 16,
  glassOpacity: 0.45,
  borderRadius: '2xl',
  compactMode: false,
  dockPosition: 'bottom',
};

export const DEFAULT_WIDGETS: DashboardWidget[] = [
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
    layout: { i: 'widget-clock-1', x: 0, y: 0, w: 4, h: 2, minW: 2, minH: 2 },
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
    layout: { i: 'widget-weather-1', x: 4, y: 0, w: 4, h: 2, minW: 3, minH: 2 },
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
    layout: { i: 'widget-bookmarks-1', x: 8, y: 0, w: 4, h: 4, minW: 3, minH: 3 },
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
    layout: { i: 'widget-rss-1', x: 0, y: 2, w: 4, h: 4, minW: 3, minH: 3 },
  },
  {
    id: 'widget-notes-1',
    type: 'notes',
    title: 'Quick Notes',
    config: {
      content: '# Welcome to ZenithTab 🌌\n\n- [x] High-performance Dashboard\n- [ ] Customize your widgets\n- [ ] Explore bookmarks and RSS feeds\n\n*Click the Edit icon on top right to adjust layout!*',
      fontSize: 'base',
      fontFamily: 'sans',
    },
    layout: { i: 'widget-notes-1', x: 4, y: 2, w: 4, h: 4, minW: 3, minH: 3 },
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
      version: '1.0.0',
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

      await this.saveWidgets(data.widgets);
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
