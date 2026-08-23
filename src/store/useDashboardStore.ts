import { create } from 'zustand';
import { Layout } from 'react-grid-layout';
import { DashboardWidget, ResponsiveLayouts, WidgetType } from '../types/widget';
import { WallpaperSettings, AppearanceSettings } from '../types/settings';
import {
  storageService,
  DEFAULT_WIDGETS,
  DEFAULT_LAYOUTS,
  DEFAULT_WALLPAPER,
  DEFAULT_APPEARANCE,
} from '../services/storageService';
import { wallpaperService } from '../services/wallpaperService';

interface DashboardState {
  isInitialized: boolean;
  isEditMode: boolean;
  activeSettingsModal: 'settings' | 'addWidget' | 'editWidget' | null;
  editingWidgetId: string | null;

  widgets: DashboardWidget[];
  layouts: ResponsiveLayouts;
  wallpaper: WallpaperSettings;
  appearance: AppearanceSettings;

  // Actions
  initialize: () => Promise<void>;
  setEditMode: (isEditMode: boolean) => void;
  openSettingsModal: (type: 'settings' | 'addWidget' | 'editWidget', widgetId?: string) => void;
  closeSettingsModal: () => void;

  addWidget: (type: WidgetType, customTitle?: string, initialConfig?: Record<string, any>) => void;
  removeWidget: (id: string) => void;
  updateWidgetConfig: (id: string, config: Record<string, any>, title?: string) => void;
  updateLayouts: (currentLayout: Layout[], allLayouts: ResponsiveLayouts) => void;

  updateWallpaper: (partial: Partial<WallpaperSettings>) => void;
  rotateWallpaper: () => void;
  updateAppearance: (partial: Partial<AppearanceSettings>) => void;

  resetToDefault: () => Promise<void>;
  importConfig: (jsonData: string) => Promise<boolean>;
  exportConfig: () => Promise<string>;
}

const DEFAULT_WIDGET_SIZES: Record<WidgetType, { w: number; h: number; minW: number; minH: number }> = {
  search: { w: 8, h: 1, minW: 4, minH: 1 },
  clock: { w: 4, h: 2, minW: 2, minH: 2 },
  weather: { w: 4, h: 2, minW: 3, minH: 2 },
  bookmarks: { w: 4, h: 4, minW: 3, minH: 3 },
  rss: { w: 4, h: 4, minW: 3, minH: 3 },
  pomodoro: { w: 4, h: 3, minW: 3, minH: 2 },
  todo: { w: 4, h: 3, minW: 3, minH: 2 },
  iframe: { w: 6, h: 4, minW: 3, minH: 3 },
  notes: { w: 4, h: 4, minW: 3, minH: 2 },
};

const DEFAULT_CONFIGS_BY_TYPE: Record<WidgetType, Record<string, any>> = {
  search: {
    defaultEngine: 'google',
    showEngineSelector: true,
    openInNewTab: true,
  },
  clock: {
    style: 'digital',
    showSeconds: true,
    showDate: true,
    is24Hour: true,
  },
  weather: {
    city: 'Tokyo',
    latitude: 35.6762,
    longitude: 139.6503,
    unit: 'celsius',
    showForecast: true,
  },
  bookmarks: {
    viewMode: 'grid',
    showFavicons: true,
    columns: 4,
  },
  rss: {
    feedUrl: 'https://news.google.com/rss/search?q=technology&hl=en-US&gl=US&ceid=US:en',
    isGoogleNews: true,
    searchQuery: 'technology',
    maxItems: 8,
    refreshIntervalMinutes: 30,
    showThumbnail: true,
    showDate: true,
    showDescription: true,
  },
  pomodoro: {
    focusDurationMinutes: 25,
    shortBreakDurationMinutes: 5,
    longBreakDurationMinutes: 15,
    autoStartBreaks: false,
  },
  todo: {
    items: [
      { id: '1', text: 'Explore ZenithTab settings', completed: false, createdAt: Date.now() },
      { id: '2', text: 'Customize widgets & wallpapers', completed: true, createdAt: Date.now() - 1000 },
    ],
  },
  iframe: {
    url: 'https://developer.mozilla.org',
    title: 'MDN Web Docs',
    allowScroll: true,
  },
  notes: {
    content: '### Quick Note\n- Type anything here\n- Auto-saved instantly',
    fontSize: 'base',
    fontFamily: 'sans',
  },
};

export const useDashboardStore = create<DashboardState>((set, get) => ({
  isInitialized: false,
  isEditMode: false,
  activeSettingsModal: null,
  editingWidgetId: null,

  widgets: DEFAULT_WIDGETS,
  layouts: DEFAULT_LAYOUTS,
  wallpaper: DEFAULT_WALLPAPER,
  appearance: DEFAULT_APPEARANCE,

  initialize: async () => {
    try {
      const [widgets, layouts, wallpaper, appearance] = await Promise.all([
        storageService.getWidgets(),
        storageService.getLayouts(),
        storageService.getWallpaper(),
        storageService.getAppearance(),
      ]);

      set({
        widgets,
        layouts,
        wallpaper,
        appearance,
        isInitialized: true,
      });
    } catch (err) {
      console.error('Failed initializing dashboard store:', err);
      set({ isInitialized: true });
    }
  },

  setEditMode: (isEditMode) => set({ isEditMode }),

  openSettingsModal: (type, widgetId) => {
    set({
      activeSettingsModal: type,
      editingWidgetId: widgetId || null,
    });
  },

  closeSettingsModal: () => {
    set({
      activeSettingsModal: null,
      editingWidgetId: null,
    });
  },

  addWidget: (type, customTitle, initialConfig) => {
    const { widgets, layouts } = get();
    const id = `widget-${type}-${Date.now()}`;
    const size = DEFAULT_WIDGET_SIZES[type];
    const defaultConfig = DEFAULT_CONFIGS_BY_TYPE[type];
    const config = { ...defaultConfig, ...initialConfig };

    const title = customTitle || (type.charAt(0).toUpperCase() + type.slice(1));

    // Find next available spot at top or bottom
    const newLayout: Layout = {
      i: id,
      x: 0,
      y: Infinity, // Place at bottom
      w: size.w,
      h: size.h,
      minW: size.minW,
      minH: size.minH,
    };

    const newWidget: DashboardWidget = {
      id,
      type,
      title,
      config,
      layout: newLayout,
    };

    const updatedWidgets = [...widgets, newWidget];
    const updatedLayouts: ResponsiveLayouts = {
      lg: [...layouts.lg, newLayout],
      md: [...layouts.md, { ...newLayout, w: Math.min(newLayout.w, 5) }],
      sm: [...layouts.sm, { ...newLayout, w: 6 }],
      xs: [...layouts.xs, { ...newLayout, w: 4 }],
    };

    set({
      widgets: updatedWidgets,
      layouts: updatedLayouts,
      activeSettingsModal: null,
    });

    storageService.saveWidgets(updatedWidgets);
    storageService.saveLayouts(updatedLayouts);
  },

  removeWidget: (id) => {
    const { widgets, layouts } = get();
    const updatedWidgets = widgets.filter((w) => w.id !== id);
    const filterLayout = (list: Layout[]) => list.filter((l) => l.i !== id);

    const updatedLayouts: ResponsiveLayouts = {
      lg: filterLayout(layouts.lg),
      md: filterLayout(layouts.md),
      sm: filterLayout(layouts.sm),
      xs: filterLayout(layouts.xs),
    };

    set({
      widgets: updatedWidgets,
      layouts: updatedLayouts,
    });

    storageService.saveWidgets(updatedWidgets);
    storageService.saveLayouts(updatedLayouts);
  },

  updateWidgetConfig: (id, config, title) => {
    const { widgets } = get();
    const updatedWidgets = widgets.map((w) => {
      if (w.id === id) {
        return {
          ...w,
          title: title !== undefined ? title : w.title,
          config: { ...w.config, ...config },
        };
      }
      return w;
    });

    set({
      widgets: updatedWidgets,
      activeSettingsModal: null,
      editingWidgetId: null,
    });

    storageService.saveWidgets(updatedWidgets);
  },

  updateLayouts: (_currentLayout, allLayouts) => {
    const { widgets } = get();

    // Sync layout coordinates back to widget layout reference
    const updatedWidgets = widgets.map((w) => {
      const match = allLayouts.lg?.find((l) => l.i === w.id) || w.layout;
      return {
        ...w,
        layout: match,
      };
    });

    set({
      widgets: updatedWidgets,
      layouts: allLayouts,
    });

    storageService.saveWidgets(updatedWidgets);
    storageService.saveLayouts(allLayouts);
  },

  updateWallpaper: (partial) => {
    const { wallpaper } = get();
    const updated = { ...wallpaper, ...partial };
    set({ wallpaper: updated });
    storageService.saveWallpaper(updated);
  },

  rotateWallpaper: () => {
    const { wallpaper } = get();
    if (wallpaper.source === 'unsplash' || wallpaper.source === 'collection') {
      const newUrl = wallpaperService.getRandomWallpaper(wallpaper.category);
      const updated = {
        ...wallpaper,
        currentWallpaperUrl: newUrl,
        lastRefreshed: Date.now(),
      };
      set({ wallpaper: updated });
      storageService.saveWallpaper(updated);
    }
  },

  updateAppearance: (partial) => {
    const { appearance } = get();
    const updated = { ...appearance, ...partial };
    set({ appearance: updated });
    storageService.saveAppearance(updated);
  },

  resetToDefault: async () => {
    await storageService.resetDashboard();
    set({
      widgets: DEFAULT_WIDGETS,
      layouts: DEFAULT_LAYOUTS,
      wallpaper: DEFAULT_WALLPAPER,
      appearance: DEFAULT_APPEARANCE,
      isEditMode: false,
      activeSettingsModal: null,
      editingWidgetId: null,
    });
  },

  importConfig: async (jsonData) => {
    const success = await storageService.importDashboardData(jsonData);
    if (success) {
      const [widgets, layouts, wallpaper, appearance] = await Promise.all([
        storageService.getWidgets(),
        storageService.getLayouts(),
        storageService.getWallpaper(),
        storageService.getAppearance(),
      ]);

      set({
        widgets,
        layouts,
        wallpaper,
        appearance,
        activeSettingsModal: null,
      });
      return true;
    }
    return false;
  },

  exportConfig: async () => {
    const exportData = await storageService.exportDashboardData();
    return JSON.stringify(exportData, null, 2);
  },
}));
