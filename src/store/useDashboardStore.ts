import { create } from 'zustand';
import { Layout } from 'react-grid-layout';
import { DashboardWidget, ResponsiveLayouts, WidgetType, DashboardPageMeta, DashboardPageData } from '../types/widget';
import { WallpaperSettings, AppearanceSettings, DockItem, KeyboardShortcutBinding } from '../types/settings';
import {
  storageService,
  DEFAULT_WIDGETS,
  DEFAULT_LAYOUTS,
  DEFAULT_WALLPAPER,
  DEFAULT_APPEARANCE,
  DEFAULT_NOTES_CONTENT,
  DEFAULT_DOCK_ITEMS,
  DEFAULT_KEYBOARD_SHORTCUTS,
  DEFAULT_PAGES,
  DEFAULT_PAGE_ID,
} from '../services/storageService';
import { wallpaperService } from '../services/wallpaperService';

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
  addPage: (name?: string) => void;
  removePage: (id: string) => void;
  renamePage: (id: string, name: string) => void;

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

export const DEFAULT_SHORTCUTS = [
  { id: 'app-chatgpt', title: 'ChatGPT', url: 'https://chatgpt.com', category: 'AI & Tools' },
  { id: 'app-github', title: 'GitHub', url: 'https://github.com', category: 'Development' },
  { id: 'app-youtube', title: 'YouTube', url: 'https://youtube.com', category: 'Media' },
  { id: 'app-gmail', title: 'Gmail', url: 'https://mail.google.com', category: 'Productivity' },
  { id: 'app-notion', title: 'Notion', url: 'https://notion.so', category: 'Productivity' },
  { id: 'app-twitter', title: 'X (Twitter)', url: 'https://x.com', category: 'Social' },
  { id: 'app-figma', title: 'Figma', url: 'https://figma.com', category: 'Design' },
  { id: 'app-spotify', title: 'Spotify', url: 'https://open.spotify.com', category: 'Media' },
  { id: 'app-reddit', title: 'Reddit', url: 'https://reddit.com', category: 'Social' },
];

const DEFAULT_CONFIGS_BY_TYPE: Record<WidgetType, Record<string, any>> = {
  search: {
    defaultEngine: 'google',
    showEngineSelector: true,
    openInNewTab: true,
  },
  shortcuts: {
    items: DEFAULT_SHORTCUTS,
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
    content: DEFAULT_NOTES_CONTENT,
    fontSize: 'base',
    fontFamily: 'sans',
  },
  qrcode: {
    mode: 'url',
    value: '',
  },
};

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
        const [{ pages, activePageId, pageData }, wallpaper, appearance, dockItems, keyboardShortcuts] =
          await Promise.all([
            withTimeout(storageService.getPagesState(), 5000, fallbackPagesState),
            withTimeout(storageService.getWallpaper(), 5000, DEFAULT_WALLPAPER),
            withTimeout(storageService.getAppearance(), 5000, DEFAULT_APPEARANCE),
            withTimeout(storageService.getDockItems(), 5000, DEFAULT_DOCK_ITEMS),
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
            : { widgets: DEFAULT_WIDGETS, layouts: DEFAULT_LAYOUTS };

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
    const newItem: DockItem = { ...item, id: `dock-${Date.now()}` };
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
    const newItem: KeyboardShortcutBinding = { ...item, id: `kbd-${Date.now()}` };
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

  addPage: (name) => {
    const { pages, pageData, activePageId, widgets, layouts } = get();
    const newId = `page-${Date.now()}`;
    const newPageMeta: DashboardPageMeta = { id: newId, name: name?.trim() || `Page ${pages.length + 1}` };
    const newPages = [...pages, newPageMeta];
    const updatedPageData = {
      ...pageData,
      [activePageId]: { widgets, layouts },
      [newId]: { widgets: [], layouts: EMPTY_LAYOUTS },
    };

    set({
      pages: newPages,
      pageData: updatedPageData,
      activePageId: newId,
      widgets: [],
      layouts: EMPTY_LAYOUTS,
      // A brand-new page starts empty — drop straight into edit mode so
      // "Add Widget" is immediately visible instead of a bare blank page.
      isEditMode: true,
    });

    storageService.savePages(newPages);
    storageService.savePageData(updatedPageData);
    storageService.saveActivePageId(newId);
    storageService.saveWidgets([]);
    storageService.saveLayouts(EMPTY_LAYOUTS);
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
    const trimmed = name.trim();
    if (!trimmed) return;
    const { pages } = get();
    const newPages = pages.map((p) => (p.id === id ? { ...p, name: trimmed } : p));
    set({ pages: newPages });
    storageService.savePages(newPages);
  },

  resetToDefault: async () => {
    await storageService.resetDashboard();
    set({
      pages: DEFAULT_PAGES,
      activePageId: DEFAULT_PAGE_ID,
      pageData: { [DEFAULT_PAGE_ID]: { widgets: DEFAULT_WIDGETS, layouts: DEFAULT_LAYOUTS } },
      widgets: DEFAULT_WIDGETS,
      layouts: DEFAULT_LAYOUTS,
      wallpaper: DEFAULT_WALLPAPER,
      appearance: DEFAULT_APPEARANCE,
      dockItems: DEFAULT_DOCK_ITEMS,
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
