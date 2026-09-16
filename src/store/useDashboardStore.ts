import { create } from 'zustand';
import { Layout } from 'react-grid-layout';
import { DashboardWidget, ResponsiveLayouts, WidgetType, DashboardPageMeta, DashboardPageData } from '../types/widget';
import { WallpaperSettings, AppearanceSettings, DockItem, KeyboardShortcutBinding } from '../types/settings';
import {
  storageService,
  createDefaultWidgets,
  createDefaultLayouts,
  DEFAULT_WIDGETS,
  DEFAULT_LAYOUTS,
  DEFAULT_WALLPAPER,
  DEFAULT_APPEARANCE,
  DEFAULT_DOCK_ITEMS,
  DEFAULT_KEYBOARD_SHORTCUTS,
  DEFAULT_PAGES,
  DEFAULT_PAGE_ID,
} from '../services/storageService';
import { wallpaperService } from '../services/wallpaperService';
import { rssService } from '../services/rssService';
import { getTranslation, resolveLanguageCode, Translation } from '../i18n/resolve';
import { getDefaultWidgetTitle } from '../utils/widgetTitle';
import { getRegionalDockItems, getRegionalShortcuts, getRegionalWeatherDefault } from '../config/defaults/regionalPresets';
import { uniqueId } from '../utils/id';

const EMPTY_LAYOUTS: ResponsiveLayouts = { lg: [], md: [], sm: [], xs: [], xxs: [] };

/**
 * chrome.storage.local calls are expected to settle quickly, but a hung
 * call here would leave `isInitialized` false forever — the new-tab page
 * stuck on its loading screen with no way out short of reinstalling the
 * extension. Race the real load against a timeout so the dashboard always
 * reaches a usable state, worst case falling back to in-memory defaults.
 */
function withTimeout<T>(promise: Promise<T>, ms: number, fallback: T): Promise<T> {
  return new Promise((resolve) => {
    const timer = setTimeout(() => resolve(fallback), ms);
    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      () => {
        clearTimeout(timer);
        resolve(fallback);
      }
    );
  });
}

interface DashboardState {
  isInitialized: boolean;
  isEditMode: boolean;
  isAppDrawerOpen: boolean;
  activeSettingsModal: 'settings' | 'addWidget' | 'editWidget' | null;
  editingWidgetId: string | null;

  widgets: DashboardWidget[];
  layouts: ResponsiveLayouts;
  wallpaper: WallpaperSettings;
  appearance: AppearanceSettings;
  dockItems: DockItem[];
  keyboardShortcuts: KeyboardShortcutBinding[];

  // Multi-page dashboard: `widgets`/`layouts` above always mirror the
  // active page; `pageData` holds every page's own widgets/layouts.
  pages: DashboardPageMeta[];
  activePageId: string;
  pageData: Record<string, DashboardPageData>;

  // Actions
  initialize: () => Promise<void>;
  setEditMode: (isEditMode: boolean) => void;
  toggleAppDrawer: (open?: boolean) => void;
  openSettingsModal: (type: 'settings' | 'addWidget' | 'editWidget', widgetId?: string) => void;
  closeSettingsModal: () => void;

  addWidget: (type: WidgetType, customTitle?: string, initialConfig?: Record<string, any>) => void;
  removeWidget: (id: string) => void;
  updateWidgetConfig: (id: string, config: Record<string, any>, title?: string) => void;
  updateLayouts: (currentLayout: Layout[], allLayouts: ResponsiveLayouts) => void;

  updateWallpaper: (partial: Partial<WallpaperSettings>) => void;
  rotateWallpaper: () => void;
  updateAppearance: (partial: Partial<AppearanceSettings>) => void;

  addDockItem: (item: Omit<DockItem, 'id'>) => void;
  updateDockItem: (id: string, partial: Partial<Omit<DockItem, 'id'>>) => void;
  removeDockItem: (id: string) => void;
  moveDockItem: (id: string, direction: 'up' | 'down') => void;
  reorderDockItem: (id: string, toIndex: number) => void;

  addKeyboardShortcut: (item: Omit<KeyboardShortcutBinding, 'id'>) => void;
  removeKeyboardShortcut: (id: string) => void;

  switchPage: (id: string) => void;
  addPage: (options?: { name?: string; duplicateCurrent?: boolean }) => void;
  removePage: (id: string) => void;
  renamePage: (id: string, name: string) => void;

  /**
   * Re-reads everything from storage and applies whatever differs. Used to
   * pick up writes made by another new-tab instance (see useStorageSync).
   */
  syncFromStorage: () => Promise<void>;

  resetToDefault: () => Promise<void>;
  importConfig: (jsonData: string) => Promise<boolean>;
  exportConfig: () => Promise<string>;
}

const DEFAULT_WIDGET_SIZES: Record<WidgetType, { w: number; h: number; minW: number; minH: number }> = {
  search: { w: 8, h: 1, minW: 4, minH: 1 },
  shortcuts: { w: 6, h: 3, minW: 3, minH: 2 },
  clock: { w: 4, h: 2, minW: 2, minH: 2 },
  weather: { w: 4, h: 2, minW: 3, minH: 2 },
  bookmarks: { w: 4, h: 4, minW: 3, minH: 3 },
  rss: { w: 4, h: 4, minW: 3, minH: 3 },
  pomodoro: { w: 4, h: 3, minW: 3, minH: 2 },
  todo: { w: 4, h: 3, minW: 3, minH: 2 },
  iframe: { w: 6, h: 4, minW: 3, minH: 3 },
  notes: { w: 4, h: 4, minW: 3, minH: 2 },
  qrcode: { w: 3, h: 4, minW: 3, minH: 3 },
};

// Language-neutral fallback (the global preset); a new Shortcuts widget
// gets the preset for the dashboard's current language instead.
export const DEFAULT_SHORTCUTS = getRegionalShortcuts('en');

// Built per call because the notes / todo / news defaults carry
// user-visible text in the dashboard's current language.
const DEFAULT_CONFIGS_BY_TYPE = (t: Translation, lang: string): Record<WidgetType, Record<string, any>> => ({
  search: {
    defaultEngine: 'google',
    showEngineSelector: true,
    openInNewTab: true,
  },
  shortcuts: {
    items: getRegionalShortcuts(lang),
    columns: 4,
    openInNewTab: true,
    viewMode: 'grid',
  },
  clock: {
    style: 'digital',
    showSeconds: true,
    showDate: true,
    is24Hour: true,
  },
  weather: {
    ...getRegionalWeatherDefault(lang),
    unit: 'celsius',
    showForecast: true,
  },
  bookmarks: {
    viewMode: 'grid',
    showFavicons: true,
    columns: 4,
  },
  rss: {
    feedUrl: rssService.buildGoogleNewsTopStoriesUrl(lang),
    isGoogleNews: true,
    googleNewsMode: 'headlines',
    searchQuery: '',
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
      { id: '1', text: t.defaults.todoExplore, completed: false, createdAt: Date.now() },
      { id: '2', text: t.defaults.todoCustomize, completed: true, createdAt: Date.now() - 1000 },
    ],
  },
  iframe: {
    url: 'https://developer.mozilla.org',
    title: 'MDN Web Docs',
    allowScroll: true,
  },
  notes: {
    content: t.defaults.notes,
    fontSize: 'base',
    fontFamily: 'sans',
  },
  qrcode: {
    mode: 'url',
    value: '',
  },
});

/** Widgets/layouts for a fresh page-1 in the given language setting. */
function localizedDefaults(languageSetting: AppearanceSettings['language']) {
  const lang = resolveLanguageCode(languageSetting);
  const widgets = createDefaultWidgets(getTranslation(languageSetting), lang);
  return { widgets, layouts: createDefaultLayouts(widgets), dockItems: getRegionalDockItems(lang) };
}

/**
 * Gives every widget on a page a fresh id (in both the widget list and each
 * breakpoint's layout) so a duplicated page never shares ids with its source.
 */
function cloneWidgetsWithNewIds(widgets: DashboardWidget[], layouts: ResponsiveLayouts): DashboardPageData {
  const stamp = Date.now();
  const idMap = new Map<string, string>();
  widgets.forEach((w, index) => idMap.set(w.id, `widget-${w.type}-${stamp}-${index}`));
  const remap = (layout: Layout): Layout => ({ ...layout, i: idMap.get(layout.i) || layout.i });

  const clonedWidgets: DashboardWidget[] = widgets.map((w) => ({
    ...w,
    id: idMap.get(w.id) || w.id,
    config: JSON.parse(JSON.stringify(w.config)),
    layout: remap(w.layout),
  }));
  const clonedLayouts: ResponsiveLayouts = {
    lg: (layouts.lg || []).map(remap),
    md: (layouts.md || []).map(remap),
    sm: (layouts.sm || []).map(remap),
    xs: (layouts.xs || []).map(remap),
    xxs: (layouts.xxs || []).map(remap),
  };
  return { widgets: clonedWidgets, layouts: clonedLayouts };
}

export const useDashboardStore = create<DashboardState>((set, get) => {
  // Shared by every widget/layout mutator: keeps `widgets`/`layouts` (the
  // active page's mirror) and `pageData[activePageId]` in sync, and
  // persists both.
  const persistPageState = (widgets: DashboardWidget[], layouts: ResponsiveLayouts) => {
    const { pageData, activePageId } = get();
    const updatedPageData = { ...pageData, [activePageId]: { widgets, layouts } };
    set({ widgets, layouts, pageData: updatedPageData });
    storageService.saveWidgets(widgets);
    storageService.saveLayouts(layouts);
    storageService.savePageData(updatedPageData);
  };

  return {
    isInitialized: false,
    isEditMode: false,
    isAppDrawerOpen: false,
    activeSettingsModal: null,
    editingWidgetId: null,

    widgets: DEFAULT_WIDGETS,
    layouts: DEFAULT_LAYOUTS,
    wallpaper: DEFAULT_WALLPAPER,
    appearance: DEFAULT_APPEARANCE,
    dockItems: DEFAULT_DOCK_ITEMS,
    keyboardShortcuts: DEFAULT_KEYBOARD_SHORTCUTS,

    pages: DEFAULT_PAGES,
    activePageId: DEFAULT_PAGE_ID,
    pageData: {},

    toggleAppDrawer: (open) =>
      set((state) => ({ isAppDrawerOpen: open !== undefined ? open : !state.isAppDrawerOpen })),

    initialize: async () => {
      const fallbackPagesState = {
        pages: DEFAULT_PAGES,
        activePageId: DEFAULT_PAGE_ID,
        pageData: { [DEFAULT_PAGE_ID]: { widgets: DEFAULT_WIDGETS, layouts: DEFAULT_LAYOUTS } },
      };

      try {
        // Appearance first: on a fresh install the default page is built
        // in the browser's language, so the welcome note, sample todos and
        // news feed read naturally instead of defaulting to English.
        const appearance = await withTimeout(storageService.getAppearance(), 5000, DEFAULT_APPEARANCE);
        const defaults = localizedDefaults(appearance.language);

        const [{ pages, activePageId, pageData }, wallpaper, dockItems, keyboardShortcuts] =
          await Promise.all([
            withTimeout(storageService.getPagesState(defaults), 5000, fallbackPagesState),
            withTimeout(storageService.getWallpaper(), 5000, DEFAULT_WALLPAPER),
            withTimeout(storageService.getDockItems(defaults.dockItems), 5000, defaults.dockItems),
            withTimeout(storageService.getKeyboardShortcuts(), 5000, DEFAULT_KEYBOARD_SHORTCUTS),
          ]);

        // Guard against corrupted persisted data (e.g. an activePageId that
        // no longer has a matching pageData entry) rather than propagating
        // an `undefined` active page into the rest of the app.
        const safePages = Array.isArray(pages) && pages.length > 0 ? pages : DEFAULT_PAGES;
        const safeActivePageId = safePages.some((p) => p.id === activePageId) ? activePageId : safePages[0].id;
        const active =
          pageData && pageData[safeActivePageId]
            ? pageData[safeActivePageId]
            : defaults;

        set({
          pages: safePages,
          activePageId: safeActivePageId,
          pageData: pageData || fallbackPagesState.pageData,
          widgets: active.widgets,
          layouts: active.layouts,
          wallpaper,
          appearance,
          dockItems,
          keyboardShortcuts,
          isInitialized: true,
        });
      } catch (err) {
        console.error('Failed initializing dashboard store:', err);
        set({
          ...fallbackPagesState,
          widgets: DEFAULT_WIDGETS,
          layouts: DEFAULT_LAYOUTS,
          isInitialized: true,
        });
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
    const { widgets, layouts, appearance } = get();
    const id = uniqueId(`widget-${type}`);
    const size = DEFAULT_WIDGET_SIZES[type];
    const languageSetting = appearance.language || 'auto';
    const defaultConfig = DEFAULT_CONFIGS_BY_TYPE(getTranslation(languageSetting), resolveLanguageCode(languageSetting))[type];
    const config = { ...defaultConfig, ...initialConfig };

    // Stock titles are recognised by WidgetWrapper and re-localized on
    // language change, so it's fine to persist the current language's one.
    const title = customTitle || getDefaultWidgetTitle(type, getTranslation(languageSetting));

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
      xxs: [...(layouts.xxs || []), { ...newLayout, w: 2 }],
    };

    persistPageState(updatedWidgets, updatedLayouts);
    set({ activeSettingsModal: null });
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
      xxs: filterLayout(layouts.xxs || []),
    };

    persistPageState(updatedWidgets, updatedLayouts);
  },

  updateWidgetConfig: (id, config, title) => {
    const { widgets, layouts } = get();
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

    persistPageState(updatedWidgets, layouts);
    set({ activeSettingsModal: null, editingWidgetId: null });
  },

  updateLayouts: (_currentLayout, allLayouts) => {
    const { widgets, layouts } = get();

    // An empty page has nothing to sync — react-grid-layout still fires
    // onLayoutChange for a 0-item grid, and persisting+re-rendering on every
    // one of those firings risks feeding a render loop for no benefit.
    if (widgets.length === 0) return;

    // Skip the write (and the state update it would trigger) when nothing
    // actually changed — react-grid-layout can re-report an equivalent
    // layout after unrelated re-renders, and persisting a no-op change on
    // every firing is exactly the kind of self-feeding loop that can hang
    // the tab.
    if (JSON.stringify(allLayouts) === JSON.stringify(layouts)) return;

    // Sync layout coordinates back to widget layout reference
    const updatedWidgets = widgets.map((w) => {
      const match = allLayouts.lg?.find((l) => l.i === w.id) || w.layout;
      return {
        ...w,
        layout: match,
      };
    });

    persistPageState(updatedWidgets, allLayouts);
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

  addDockItem: (item) => {
    const { dockItems } = get();
    const newItem: DockItem = { ...item, id: uniqueId('dock') };
    const updated = [...dockItems, newItem];
    set({ dockItems: updated });
    storageService.saveDockItems(updated);
  },

  updateDockItem: (id, partial) => {
    const { dockItems } = get();
    const updated = dockItems.map((item) => (item.id === id ? { ...item, ...partial } : item));
    set({ dockItems: updated });
    storageService.saveDockItems(updated);
  },

  removeDockItem: (id) => {
    const { dockItems } = get();
    const updated = dockItems.filter((item) => item.id !== id);
    set({ dockItems: updated });
    storageService.saveDockItems(updated);
  },

  moveDockItem: (id, direction) => {
    const { dockItems } = get();
    const index = dockItems.findIndex((item) => item.id === id);
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (index === -1 || targetIndex < 0 || targetIndex >= dockItems.length) return;

    const updated = [...dockItems];
    [updated[index], updated[targetIndex]] = [updated[targetIndex], updated[index]];
    set({ dockItems: updated });
    storageService.saveDockItems(updated);
  },

  reorderDockItem: (id, toIndex) => {
    const { dockItems } = get();
    const fromIndex = dockItems.findIndex((item) => item.id === id);
    if (fromIndex === -1 || toIndex < 0 || toIndex >= dockItems.length || fromIndex === toIndex) return;

    const updated = [...dockItems];
    const [moved] = updated.splice(fromIndex, 1);
    updated.splice(toIndex, 0, moved);
    set({ dockItems: updated });
    storageService.saveDockItems(updated);
  },

  addKeyboardShortcut: (item) => {
    const { keyboardShortcuts } = get();
    const newItem: KeyboardShortcutBinding = { ...item, id: uniqueId('kbd') };
    const updated = [...keyboardShortcuts, newItem];
    set({ keyboardShortcuts: updated });
    storageService.saveKeyboardShortcuts(updated);
  },

  removeKeyboardShortcut: (id) => {
    const { keyboardShortcuts } = get();
    const updated = keyboardShortcuts.filter((item) => item.id !== id);
    set({ keyboardShortcuts: updated });
    storageService.saveKeyboardShortcuts(updated);
  },

  switchPage: (id) => {
    const { pages, pageData, activePageId, widgets, layouts } = get();
    if (id === activePageId || !pages.some((p) => p.id === id)) return;

    // Snapshot the outgoing page's live state before switching away.
    const updatedPageData = { ...pageData, [activePageId]: { widgets, layouts } };
    const nextPage = updatedPageData[id] || { widgets: [], layouts: EMPTY_LAYOUTS };

    set({
      pageData: updatedPageData,
      activePageId: id,
      widgets: nextPage.widgets,
      layouts: nextPage.layouts,
      isEditMode: false,
    });

    storageService.savePageData(updatedPageData);
    storageService.saveActivePageId(id);
    storageService.saveWidgets(nextPage.widgets);
    storageService.saveLayouts(nextPage.layouts);
  },

  addPage: (options) => {
    const { pages, pageData, activePageId, widgets, layouts } = get();
    const newId = uniqueId('page');
    // Empty name = "unnamed", rendered as the localized "Page N".
    const newPageMeta: DashboardPageMeta = { id: newId, name: options?.name?.trim() || '' };
    const newPages = [...pages, newPageMeta];

    const newPage: DashboardPageData = options?.duplicateCurrent
      ? cloneWidgetsWithNewIds(widgets, layouts)
      : { widgets: [], layouts: EMPTY_LAYOUTS };

    const updatedPageData = {
      ...pageData,
      [activePageId]: { widgets, layouts },
      [newId]: newPage,
    };

    set({
      pages: newPages,
      pageData: updatedPageData,
      activePageId: newId,
      widgets: newPage.widgets,
      layouts: newPage.layouts,
      // A brand-new empty page drops straight into edit mode so "Add
      // Widget" is immediately visible; a duplicate is ready to use as-is.
      isEditMode: newPage.widgets.length === 0,
    });

    storageService.savePages(newPages);
    storageService.savePageData(updatedPageData);
    storageService.saveActivePageId(newId);
    storageService.saveWidgets(newPage.widgets);
    storageService.saveLayouts(newPage.layouts);
  },

  removePage: (id) => {
    const { pages, pageData, activePageId, widgets, layouts } = get();
    if (pages.length <= 1) return; // always keep at least one page

    const newPages = pages.filter((p) => p.id !== id);
    const updatedPageData = { ...pageData };
    delete updatedPageData[id];

    const switchingAway = activePageId === id;
    const newActiveId = switchingAway ? newPages[0].id : activePageId;
    const nextPage = switchingAway
      ? updatedPageData[newActiveId] || { widgets: [], layouts: EMPTY_LAYOUTS }
      : { widgets, layouts };

    set({
      pages: newPages,
      pageData: updatedPageData,
      activePageId: newActiveId,
      widgets: nextPage.widgets,
      layouts: nextPage.layouts,
      isEditMode: switchingAway ? false : get().isEditMode,
    });

    storageService.savePages(newPages);
    storageService.savePageData(updatedPageData);
    if (switchingAway) {
      storageService.saveActivePageId(newActiveId);
      storageService.saveWidgets(nextPage.widgets);
      storageService.saveLayouts(nextPage.layouts);
    }
  },

  renamePage: (id, name) => {
    // Clearing the name hands the page back to its localized "Page N".
    const trimmed = name.trim();
    const { pages } = get();
    const newPages = pages.map((p) => (p.id === id ? { ...p, name: trimmed } : p));
    set({ pages: newPages });
    storageService.savePages(newPages);
  },

  syncFromStorage: async () => {
    const current = get();
    // On a fresh install nothing has been written yet; fall back to what
    // this tab already shows rather than regenerating defaults (whose
    // timestamps would differ and force a pointless re-render).
    const defaults = { widgets: current.widgets, layouts: current.layouts };
    const [{ pages, activePageId, pageData }, wallpaper, appearance, dockItems, keyboardShortcuts] =
      await Promise.all([
        storageService.getPagesState(defaults),
        storageService.getWallpaper(),
        storageService.getAppearance(),
        storageService.getDockItems(current.dockItems),
        storageService.getKeyboardShortcuts(),
      ]);

    const safeActivePageId = pages.some((p) => p.id === activePageId) ? activePageId : pages[0].id;
    const active = pageData[safeActivePageId] || { widgets: [], layouts: EMPTY_LAYOUTS };

    const next = {
      pages,
      activePageId: safeActivePageId,
      pageData,
      widgets: active.widgets,
      layouts: active.layouts,
      wallpaper,
      appearance,
      dockItems,
      keyboardShortcuts,
    };

    // Only touch the slices that actually changed so an unchanged grid
    // doesn't re-render (and re-animate) for nothing.
    const changed: Partial<DashboardState> = {};
    for (const key of Object.keys(next) as (keyof typeof next)[]) {
      if (JSON.stringify(get()[key]) !== JSON.stringify(next[key])) {
        (changed as any)[key] = next[key];
      }
    }
    if (Object.keys(changed).length > 0) set(changed);
  },

  resetToDefault: async () => {
    const { widgets: defaultWidgets, layouts: defaultLayouts, dockItems: defaultDock } = localizedDefaults(get().appearance.language);
    await storageService.resetDashboard({ widgets: defaultWidgets, layouts: defaultLayouts, dockItems: defaultDock });
    set({
      pages: DEFAULT_PAGES,
      activePageId: DEFAULT_PAGE_ID,
      pageData: { [DEFAULT_PAGE_ID]: { widgets: defaultWidgets, layouts: defaultLayouts } },
      widgets: defaultWidgets,
      layouts: defaultLayouts,
      wallpaper: DEFAULT_WALLPAPER,
      appearance: DEFAULT_APPEARANCE,
      dockItems: defaultDock,
      keyboardShortcuts: DEFAULT_KEYBOARD_SHORTCUTS,
      isEditMode: false,
      activeSettingsModal: null,
      editingWidgetId: null,
    });
  },

  importConfig: async (jsonData) => {
    const success = await storageService.importDashboardData(jsonData);
    if (success) {
      const [{ pages, activePageId, pageData }, wallpaper, appearance, dockItems, keyboardShortcuts] =
        await Promise.all([
          storageService.getPagesState(),
          storageService.getWallpaper(),
          storageService.getAppearance(),
          storageService.getDockItems(),
          storageService.getKeyboardShortcuts(),
        ]);

      const active = pageData[activePageId] || { widgets: [], layouts: EMPTY_LAYOUTS };

      set({
        pages,
        activePageId,
        pageData,
        widgets: active.widgets,
        layouts: active.layouts,
        wallpaper,
        appearance,
        dockItems,
        keyboardShortcuts,
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
};
});
