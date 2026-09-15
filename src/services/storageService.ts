import { DashboardWidget, ResponsiveLayouts, DashboardPageMeta, DashboardPageData } from '../types/widget';
import {
  WallpaperSettings,
  AppearanceSettings,
  DashboardExportData,
  DockItem,
  KeyboardShortcutBinding,
} from '../types/settings';
import { storageGet, storageSet } from '../utils/storage';
import { rssService } from './rssService';
import { en } from '../i18n/locales/en';
import type { Translation } from '../i18n/resolve';

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

  // Custom search engines: the URL is a template (contains a literal
  // "{query}" placeholder), so validate it with that placeholder swapped
  // for a harmless value rather than as a URL directly.
  if (Array.isArray(config.customEngines)) {
    config.customEngines = config.customEngines.filter(
      (engine: any) =>
        engine &&
        typeof engine.id === 'string' &&
        typeof engine.name === 'string' &&
        typeof engine.urlTemplate === 'string' &&
        engine.urlTemplate.includes('{query}') &&
        isSafeUrl(engine.urlTemplate.replace('{query}', 'q'))
    );
  }

  const KNOWN_BUILTIN_ENGINES = ['google', 'bing', 'duckduckgo', 'github', 'youtube', 'chatgpt'];
  if (Array.isArray(config.hiddenBuiltinEngines)) {
    config.hiddenBuiltinEngines = config.hiddenBuiltinEngines.filter(
      (key: unknown) => typeof key === 'string' && KNOWN_BUILTIN_ENGINES.includes(key)
    );
  }

  return {
    ...raw,
    title: typeof raw.title === 'string' ? raw.title : 'Widget',
    config,
  } as DashboardWidget;
}

function sanitizeKeyboardShortcuts(raw: unknown): KeyboardShortcutBinding[] {
  if (!Array.isArray(raw)) return [];
  return raw.filter(
    (item): item is KeyboardShortcutBinding =>
      !!item &&
      typeof item.id === 'string' &&
      typeof item.combo === 'string' &&
      typeof item.label === 'string' &&
      isSafeUrl(item.url)
  );
}

export const STORAGE_KEYS = {
  WIDGETS: 'dashboard_widgets',
  LAYOUTS: 'dashboard_layouts',
  WALLPAPER: 'dashboard_wallpaper',
  APPEARANCE: 'dashboard_appearance',
  RSS_CACHE: 'rss_cache',
  NOTES: 'quick_notes',
  DOCK_ITEMS: 'dashboard_dock_items',
  KEYBOARD_SHORTCUTS: 'dashboard_keyboard_shortcuts',
  PAGES: 'dashboard_pages',
  ACTIVE_PAGE_ID: 'dashboard_active_page_id',
  PAGE_DATA: 'dashboard_page_data',
} as const;

export const DEFAULT_KEYBOARD_SHORTCUTS: KeyboardShortcutBinding[] = [];

export const DEFAULT_PAGE_ID = 'page-1';
// An empty name means "unnamed": the UI renders it as the localized
// "Page N" for its position, so it follows the language setting and
// renumbers itself when pages are removed. Only user-typed names persist.
export const DEFAULT_PAGES: DashboardPageMeta[] = [{ id: DEFAULT_PAGE_ID, name: '' }];

/** Localized defaults handed in by the store for first launch / reset. */
export interface DashboardDefaults {
  widgets: DashboardWidget[];
  layouts: ResponsiveLayouts;
}

// General-audience picks — the previous GitHub / Dev Docs set assumed a
// developer at the keyboard, which most new-tab users are not.
export const DEFAULT_DOCK_ITEMS: DockItem[] = [
  { id: 'dock-google', label: 'Google', url: 'https://google.com', icon: 'globe', openInNewTab: true },
  { id: 'dock-youtube', label: 'YouTube', url: 'https://youtube.com', icon: 'video', openInNewTab: true },
  { id: 'dock-gmail', label: 'Gmail', url: 'https://mail.google.com', icon: 'mail', openInNewTab: true },
  { id: 'dock-chatgpt', label: 'ChatGPT', url: 'https://chatgpt.com', icon: 'sparkles', openInNewTab: true },
  { id: 'dock-maps', label: 'Google Maps', url: 'https://maps.google.com', icon: 'map', openInNewTab: true },
  { id: 'dock-wikipedia', label: 'Wikipedia', url: 'https://www.wikipedia.org', icon: 'book', openInNewTab: true },
];

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

/**
 * Packs widgets two-per-row at a fixed width. Unlike clamping only `w`,
 * this also recomputes `x`/`y` so no item's `x + w` can ever exceed the
 * breakpoint's column count (that mismatch was causing react-grid-layout
 * to visibly reflow/overlap widgets at the `md` breakpoint).
 */
function packTwoColumnLayout(widgets: DashboardWidget[], itemWidth: number) {
  let rowY = 0;
  let rowMaxH = 0;
  return widgets.map((widget, index) => {
    const col = index % 2;
    if (col === 0 && index > 0) {
      rowY += rowMaxH;
      rowMaxH = 0;
    }
    rowMaxH = Math.max(rowMaxH, widget.layout.h);
    return { ...widget.layout, x: col * itemWidth, y: rowY, w: itemWidth };
  });
}

export function createDefaultLayouts(widgets: DashboardWidget[]): ResponsiveLayouts {
  return {
    lg: widgets.map((w) => w.layout),
    md: packTwoColumnLayout(widgets, 5),
    sm: widgets.map((w, index) => ({ ...w.layout, x: 0, y: index * 2, w: 6 })),
    xs: widgets.map((w, index) => ({ ...w.layout, x: 0, y: index * 2, w: 4 })),
    xxs: widgets.map((w, index) => ({ ...w.layout, x: 0, y: index * 2, w: 2 })),
  };
}

/**
 * The out-of-the-box dashboard, with every user-visible string (widget
 * titles, the welcome note, sample todos) taken from `t`. This runs once at
 * first launch in the browser's language; the result is then persisted like
 * any user-authored content, so a later language switch leaves it alone.
 */
export function createDefaultWidgets(t: Translation, lang = 'en'): DashboardWidget[] {
  return [
    {
      id: 'widget-search-1',
      type: 'search',
      title: t.widgets.search.title,
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
      title: t.widgets.clock.title,
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
      title: t.widgets.weather.title,
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
      title: t.widgets.pomodoro.title,
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
      title: t.widgets.bookmarks.title,
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
      title: t.defaults.newsTitle,
      config: {
        // Top stories for the user's region rather than a "technology"
        // keyword feed — no interest profile needed, and not dev-flavoured.
        feedUrl: rssService.buildGoogleNewsTopStoriesUrl(lang),
        isGoogleNews: true,
        searchQuery: '',
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
      title: t.widgets.todo.title,
      config: {
        items: [
          { id: '1', text: t.defaults.todoExplore, completed: false, createdAt: Date.now() },
          { id: '2', text: t.defaults.todoCustomize, completed: true, createdAt: Date.now() - 1000 },
        ],
      },
      layout: { i: 'widget-todo-1', x: 8, y: 3, w: 4, h: 4, minW: 3, minH: 2 },
    },
    {
      id: 'widget-notes-1',
      type: 'notes',
      title: t.widgets.notes.title,
      config: {
        content: t.defaults.notes,
        fontSize: 'base',
        fontFamily: 'sans',
      },
      layout: { i: 'widget-notes-1', x: 0, y: 7, w: 4, h: 4, minW: 3, minH: 2 },
    },
  ];
}

// English fallbacks for code paths that have no language to hand
// (corrupted-storage recovery, unit tests). First launch and "reset to
// default" go through createDefaultWidgets() with the real language.
export const DEFAULT_WIDGETS: DashboardWidget[] = createDefaultWidgets(en);
export const DEFAULT_LAYOUTS: ResponsiveLayouts = createDefaultLayouts(DEFAULT_WIDGETS);

export const storageService = {
  async getWidgets(fallback: DashboardWidget[] = DEFAULT_WIDGETS): Promise<DashboardWidget[]> {
    const widgets = await storageGet<DashboardWidget[]>(STORAGE_KEYS.WIDGETS, fallback);
    return widgets || fallback;
  },

  async saveWidgets(widgets: DashboardWidget[]): Promise<void> {
    await storageSet(STORAGE_KEYS.WIDGETS, widgets);
  },

  async getLayouts(fallback: ResponsiveLayouts = DEFAULT_LAYOUTS): Promise<ResponsiveLayouts> {
    const layouts = await storageGet<ResponsiveLayouts>(STORAGE_KEYS.LAYOUTS, fallback);
    return layouts || fallback;
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

  async getDockItems(): Promise<DockItem[]> {
    const items = await storageGet<DockItem[]>(STORAGE_KEYS.DOCK_ITEMS, DEFAULT_DOCK_ITEMS);
    return items || DEFAULT_DOCK_ITEMS;
  },

  async saveDockItems(items: DockItem[]): Promise<void> {
    await storageSet(STORAGE_KEYS.DOCK_ITEMS, items);
  },

  async getKeyboardShortcuts(): Promise<KeyboardShortcutBinding[]> {
    const items = await storageGet<KeyboardShortcutBinding[]>(
      STORAGE_KEYS.KEYBOARD_SHORTCUTS,
      DEFAULT_KEYBOARD_SHORTCUTS
    );
    return items || DEFAULT_KEYBOARD_SHORTCUTS;
  },

  async saveKeyboardShortcuts(items: KeyboardShortcutBinding[]): Promise<void> {
    await storageSet(STORAGE_KEYS.KEYBOARD_SHORTCUTS, items);
  },

  /**
   * Loads (pages, activePageId, pageData). On an install that predates
   * multi-page support, `dashboard_pages`/`dashboard_page_data` won't
   * exist yet — in that case the legacy single `dashboard_widgets` /
   * `dashboard_layouts` keys are migrated in-place into a single "Page 1"
   * so existing users keep exactly what they had. On a genuinely fresh
   * install neither key exists and `defaults` (localized by the caller)
   * becomes the first page.
   */
  async getPagesState(defaults?: DashboardDefaults): Promise<{
    pages: DashboardPageMeta[];
    activePageId: string;
    pageData: Record<string, DashboardPageData>;
  }> {
    const pages = await storageGet<DashboardPageMeta[]>(STORAGE_KEYS.PAGES, undefined);
    const pageData = await storageGet<Record<string, DashboardPageData>>(STORAGE_KEYS.PAGE_DATA, undefined);

    if (pages && pages.length > 0 && pageData && Object.keys(pageData).length > 0) {
      const storedActiveId = await storageGet<string>(STORAGE_KEYS.ACTIVE_PAGE_ID, undefined);
      const activePageId = storedActiveId && pages.some((p) => p.id === storedActiveId)
        ? storedActiveId
        : pages[0].id;
      return { pages, activePageId, pageData };
    }

    const widgets = await this.getWidgets(defaults?.widgets);
    const layouts = await this.getLayouts(defaults?.layouts);
    return {
      pages: DEFAULT_PAGES,
      activePageId: DEFAULT_PAGE_ID,
      pageData: { [DEFAULT_PAGE_ID]: { widgets, layouts } },
    };
  },

  async savePages(pages: DashboardPageMeta[]): Promise<void> {
    await storageSet(STORAGE_KEYS.PAGES, pages);
  },

  async saveActivePageId(id: string): Promise<void> {
    await storageSet(STORAGE_KEYS.ACTIVE_PAGE_ID, id);
  },

  async savePageData(pageData: Record<string, DashboardPageData>): Promise<void> {
    await storageSet(STORAGE_KEYS.PAGE_DATA, pageData);
  },

  async exportDashboardData(): Promise<DashboardExportData> {
    const { pages, activePageId, pageData } = await this.getPagesState();
    const wallpaper = await this.getWallpaper();
    const appearance = await this.getAppearance();
    const dockItems = await this.getDockItems();
    const keyboardShortcuts = await this.getKeyboardShortcuts();
    const activePage = pageData[activePageId] || { widgets: [], layouts: DEFAULT_LAYOUTS };

    return {
      version: currentVersion(),
      exportedAt: new Date().toISOString(),
      widgets: activePage.widgets,
      layouts: activePage.layouts,
      wallpaper,
      appearance,
      dockItems,
      keyboardShortcuts,
      pages,
      pageData,
      activePageId,
    };
  },

  async importDashboardData(jsonData: string): Promise<boolean> {
    try {
      const data: DashboardExportData = JSON.parse(jsonData);

      if (Array.isArray(data.pages) && data.pageData && typeof data.pageData === 'object') {
        // Multi-page (1.3+) export shape.
        const sanitizedPageData: Record<string, DashboardPageData> = {};
        for (const page of data.pages) {
          const raw = data.pageData[page.id];
          if (!raw || !Array.isArray(raw.widgets)) continue;
          const pageWidgets = raw.widgets
            .map(sanitizeWidget)
            .filter((w): w is DashboardWidget => w !== null);
          sanitizedPageData[page.id] = { widgets: pageWidgets, layouts: raw.layouts || DEFAULT_LAYOUTS };
        }

        const validPages = data.pages.filter((p) => sanitizedPageData[p.id]);
        if (validPages.length === 0) {
          throw new Error('Imported file contained no usable pages');
        }

        const activePageId =
          data.activePageId && sanitizedPageData[data.activePageId] ? data.activePageId : validPages[0].id;

        await this.savePages(validPages);
        await this.savePageData(sanitizedPageData);
        await this.saveActivePageId(activePageId);
        // Mirror the legacy single-page keys onto the active page so
        // anything still reading them directly isn't left with stale data.
        await this.saveWidgets(sanitizedPageData[activePageId].widgets);
        await this.saveLayouts(sanitizedPageData[activePageId].layouts);
      } else {
        // Legacy (pre-1.3) single-page export shape.
        if (!data.widgets || !Array.isArray(data.widgets)) {
          throw new Error('Invalid widget format in imported data');
        }

        const widgets = data.widgets
          .map(sanitizeWidget)
          .filter((w): w is DashboardWidget => w !== null);

        if (widgets.length === 0) {
          throw new Error('Imported file contained no usable widgets');
        }

        const layouts = data.layouts || DEFAULT_LAYOUTS;
        await this.saveWidgets(widgets);
        await this.saveLayouts(layouts);
        await this.savePages(DEFAULT_PAGES);
        await this.savePageData({ [DEFAULT_PAGE_ID]: { widgets, layouts } });
        await this.saveActivePageId(DEFAULT_PAGE_ID);
      }

      if (data.wallpaper) await this.saveWallpaper(data.wallpaper);
      if (data.appearance) await this.saveAppearance(data.appearance);
      if (Array.isArray(data.dockItems)) {
        const dockItems = data.dockItems.filter(
          (item): item is DockItem =>
            !!item &&
            typeof item.id === 'string' &&
            typeof item.label === 'string' &&
            typeof item.icon === 'string' &&
            isSafeUrl(item.url)
        );
        if (dockItems.length > 0) await this.saveDockItems(dockItems);
      }
      if (Array.isArray(data.keyboardShortcuts)) {
        await this.saveKeyboardShortcuts(sanitizeKeyboardShortcuts(data.keyboardShortcuts));
      }

      return true;
    } catch (error) {
      console.error('Failed to import ZenithTab dashboard data:', error);
      return false;
    }
  },

  async resetDashboard(defaults: DashboardDefaults = { widgets: DEFAULT_WIDGETS, layouts: DEFAULT_LAYOUTS }): Promise<void> {
    await this.saveWidgets(defaults.widgets);
    await this.saveLayouts(defaults.layouts);
    await this.saveWallpaper(DEFAULT_WALLPAPER);
    await this.saveAppearance(DEFAULT_APPEARANCE);
    await this.saveDockItems(DEFAULT_DOCK_ITEMS);
    await this.saveKeyboardShortcuts(DEFAULT_KEYBOARD_SHORTCUTS);
    await this.savePages(DEFAULT_PAGES);
    await this.savePageData({ [DEFAULT_PAGE_ID]: { widgets: defaults.widgets, layouts: defaults.layouts } });
    await this.saveActivePageId(DEFAULT_PAGE_ID);
  },
};
