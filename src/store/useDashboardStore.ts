import { create } from 'zustand';
import { Layout } from 'react-grid-layout';
import {
  DashboardWidget,
  ResponsiveLayouts,
  WidgetType,
  DashboardPageMeta,
  DashboardPageData,
  TrashEntry,
  GridBreakpoint,
} from '../types/widget';
import { WallpaperSettings, AppearanceSettings, DockItem, KeyboardShortcutBinding } from '../types/settings';
import {
  storageService,
  createDefaultWidgets,
  createDefaultLayouts,
  hydratePageData,
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
import { runMigrations } from '../services/migrations';
import { getTranslation, resolveLanguageCode } from '../i18n/resolve';
import { getDefaultWidgetTitle } from '../utils/widgetTitle';
import { getRegionalDockItems, getRegionalShortcuts } from '../config/defaults/regionalPresets';
import { WIDGET_DEFINITIONS } from '../components/widgets/widgetDefinitions';
import { uniqueId } from '../utils/id';
import { calculateBottomY, sanitizeResponsiveLayouts } from '../utils/layout';
import { useUndoStore } from './useUndoStore';
import { getLocalizedWidgetTitle } from '../utils/widgetTitle';
import { getPageDisplayName } from '../utils/pageName';
import {
  createTrashedWidget,
  createTrashedPage,
  pruneTrash,
  layoutsWithRestoredWidget,
  withFreshWidgetId,
} from '../services/trashService';
import { GRID_BREAKPOINT_KEYS } from '../config/grid';

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

  // Deleted widgets/pages, restorable from Settings > Trash for 30 days.
  trash: TrashEntry[];

  // Actions
  initialize: () => Promise<void>;
  setEditMode: (isEditMode: boolean) => void;
  toggleAppDrawer: (open?: boolean) => void;
  openSettingsModal: (type: 'settings' | 'addWidget' | 'editWidget', widgetId?: string) => void;
  closeSettingsModal: () => void;

  addWidget: (type: WidgetType, customTitle?: string, initialConfig?: Record<string, any>) => void;
  removeWidget: (id: string) => void;
  updateWidgetConfig: (id: string, config: Record<string, any>, title?: string) => void;
  /**
   * Like updateWidgetConfig, but the previous values of the patched keys
   * are captured so the change can be undone (toast / Ctrl+Z). For
   * in-widget deletions — a task, a note page, a shortcut tile.
   */
  updateWidgetConfigUndoable: (id: string, config: Record<string, any>, label: string) => void;
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

  /** Puts a trashed widget back on its page (or the current one) / re-adds a trashed page. */
  restoreFromTrash: (entryId: string) => void;
  deleteFromTrash: (entryId: string) => void;
  emptyTrash: () => void;

  /**
   * Re-reads everything from storage and applies whatever differs. Used to
   * pick up writes made by another new-tab instance (see useStorageSync).
   */
  syncFromStorage: () => Promise<void>;

  resetToDefault: () => Promise<void>;
  importConfig: (jsonData: string) => Promise<boolean>;
  exportConfig: () => Promise<string>;
}

// Language-neutral fallback (the global preset); a new Shortcuts widget
// gets the preset for the dashboard's current language instead.
export const DEFAULT_SHORTCUTS = getRegionalShortcuts('en');

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

  // --- Undo support -------------------------------------------------------
  // Every destructive action below is split into a plain "do" helper and
  // the public action, which runs the helper and registers how to reverse
  // it. Undo re-inserts what was removed into the *current* state (never
  // replaces the whole slice) so it stays safe with other tabs' changes;
  // redo re-runs the helper.
  const tr = () => getTranslation(get().appearance.language || 'auto');
  const pushUndo = (label: string, undo: () => void, redo?: () => void) =>
    useUndoStore.getState().pushUndo({ label, undo, redo });
  const fmt = (template: string, name: string) => template.replace('{name}', name);

  type BreakpointKey = GridBreakpoint;
  const BREAKPOINTS = GRID_BREAKPOINT_KEYS;

  /** The live copy of a page: the active page's mirror, or its pageData entry. */
  const readPage = (pageId: string): DashboardPageData | null => {
    const { activePageId, widgets, layouts, pageData } = get();
    if (pageId === activePageId) return { widgets, layouts };
    return pageData[pageId] || null;
  };

  const writePage = (pageId: string, page: DashboardPageData) => {
    if (pageId === get().activePageId) {
      persistPageState(page.widgets, page.layouts);
      return;
    }
    const updatedPageData = { ...get().pageData, [pageId]: page };
    set({ pageData: updatedPageData });
    storageService.savePageData(updatedPageData);
  };

  interface RemovedWidget {
    widget: DashboardWidget;
    index: number;
    pageId: string;
    layouts: Partial<Record<BreakpointKey, Layout>>;
  }

  const removeWidgetFromPage = (pageId: string, id: string): RemovedWidget | null => {
    const page = readPage(pageId);
    if (!page) return null;
    const index = page.widgets.findIndex((w) => w.id === id);
    if (index === -1) return null;
    const removed: RemovedWidget = { widget: page.widgets[index], index, pageId, layouts: {} };
    const updatedLayouts = { ...page.layouts } as ResponsiveLayouts;
    for (const bp of BREAKPOINTS) {
      const list = page.layouts[bp] || [];
      const match = list.find((l) => l.i === id);
      if (match) removed.layouts[bp] = match;
      updatedLayouts[bp] = list.filter((l) => l.i !== id);
    }
    writePage(pageId, { widgets: page.widgets.filter((w) => w.id !== id), layouts: updatedLayouts });
    return removed;
  };

  const removeWidgetInternal = (id: string) => removeWidgetFromPage(get().activePageId, id);

  /**
   * Puts a removed widget back where it was. If its page no longer exists
   * it lands on the current page instead; an id that already exists again
   * (restored elsewhere) is left alone.
   */
  const restoreWidgetInternal = (removed: RemovedWidget) => {
    const { pageData, activePageId } = get();
    const { widget, index } = removed;
    const pageId = removed.pageId === activePageId || pageData[removed.pageId] ? removed.pageId : activePageId;
    const page = readPage(pageId);
    if (!page || page.widgets.some((w) => w.id === widget.id)) return;
    writePage(pageId, {
      widgets: insertAt(page.widgets, index, widget),
      layouts: withLayoutEntries(page.layouts, widget, removed.layouts),
    });
  };

  const saveTrash = (trash: TrashEntry[]) => {
    set({ trash });
    storageService.saveTrash(trash);
  };
  const addTrash = (entry: TrashEntry) => {
    if (get().trash.some((e) => e.id === entry.id)) return;
    saveTrash(pruneTrash([...get().trash, entry]));
  };
  const removeTrashEntry = (entryId: string) => {
    if (!get().trash.some((e) => e.id === entryId)) return;
    saveTrash(get().trash.filter((e) => e.id !== entryId));
  };

  const insertAt = <T>(list: T[], index: number, item: T): T[] => {
    const next = [...list];
    next.splice(Math.min(index, next.length), 0, item);
    return next;
  };

  const withLayoutEntries = (
    layouts: ResponsiveLayouts,
    widget: DashboardWidget,
    saved: Partial<Record<BreakpointKey, Layout>>
  ): ResponsiveLayouts => {
    const next = { ...layouts } as ResponsiveLayouts;
    for (const bp of BREAKPOINTS) {
      const list = (layouts[bp] || []).filter((l) => l.i !== widget.id);
      next[bp] = [...list, saved[bp] || { ...widget.layout, i: widget.id }];
    }
    return next;
  };

  interface RemovedPage {
    meta: DashboardPageMeta;
    index: number;
    data: DashboardPageData;
    wasActive: boolean;
  }

  const removePageInternal = (id: string): RemovedPage | null => {
    const { pages, pageData, activePageId, widgets, layouts } = get();
    if (pages.length <= 1) return null; // always keep at least one page
    const index = pages.findIndex((p) => p.id === id);
    if (index === -1) return null;

    const switchingAway = activePageId === id;
    const removed: RemovedPage = {
      meta: pages[index],
      index,
      // The active page's live mirror is the freshest copy of its data.
      data: switchingAway ? { widgets, layouts } : pageData[id] || { widgets: [], layouts: EMPTY_LAYOUTS },
      wasActive: switchingAway,
    };

    const newPages = pages.filter((p) => p.id !== id);
    const updatedPageData = { ...pageData };
    delete updatedPageData[id];

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
    return removed;
  };

  const restorePageInternal = (removed: RemovedPage) => {
    const { pages, pageData, activePageId, widgets, layouts } = get();
    if (pages.some((p) => p.id === removed.meta.id)) return;
    const newPages = insertAt(pages, removed.index, removed.meta);
    const updatedPageData = {
      ...pageData,
      [activePageId]: { widgets, layouts },
      [removed.meta.id]: removed.data,
    };
    set({ pages: newPages, pageData: updatedPageData });
    storageService.savePages(newPages);
    storageService.savePageData(updatedPageData);
    if (removed.wasActive) get().switchPage(removed.meta.id);
  };

  const saveDock = (updated: DockItem[]) => {
    set({ dockItems: updated });
    storageService.saveDockItems(updated);
  };

  const saveKeys = (updated: KeyboardShortcutBinding[]) => {
    set({ keyboardShortcuts: updated });
    storageService.saveKeyboardShortcuts(updated);
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
    trash: [],

    toggleAppDrawer: (open) =>
      set((state) => ({ isAppDrawerOpen: open !== undefined ? open : !state.isAppDrawerOpen })),

    initialize: async () => {
      const fallbackPagesState = {
        pages: DEFAULT_PAGES,
        activePageId: DEFAULT_PAGE_ID,
        pageData: { [DEFAULT_PAGE_ID]: { widgets: DEFAULT_WIDGETS, layouts: DEFAULT_LAYOUTS } },
      };

      try {
        // Schema migrations first, before anything reads the data. A
        // failure here must not keep the dashboard from starting: the
        // reads below cope with older shapes via hydration, and the next
        // launch retries from the last completed step.
        try {
          await withTimeout(runMigrations(), 5000, null);
        } catch (err) {
          console.error('Schema migration failed; continuing with current data:', err);
        }

        // Appearance first: on a fresh install the default page is built
        // in the browser's language, so the welcome note, sample todos and
        // news feed read naturally instead of defaulting to English.
        const appearance = await withTimeout(storageService.getAppearance(), 5000, DEFAULT_APPEARANCE);
        const defaults = localizedDefaults(appearance.language);

        const [{ pages, activePageId, pageData }, wallpaper, dockItems, keyboardShortcuts, storedTrash] =
          await Promise.all([
            withTimeout(storageService.getPagesState(defaults), 5000, fallbackPagesState),
            withTimeout(storageService.getWallpaper(), 5000, DEFAULT_WALLPAPER),
            withTimeout(storageService.getDockItems(defaults.dockItems), 5000, defaults.dockItems),
            withTimeout(storageService.getKeyboardShortcuts(), 5000, DEFAULT_KEYBOARD_SHORTCUTS),
            withTimeout(storageService.getTrash(), 5000, []),
          ]);

        // Expired trash is dropped here (new-tab page only, never the
        // service worker) and written back only when something changed.
        const trash = pruneTrash(storedTrash);
        if (trash !== storedTrash) storageService.saveTrash(trash);

        // Guard against corrupted persisted data (e.g. an activePageId that
        // no longer has a matching pageData entry) rather than propagating
        // an `undefined` active page into the rest of the app.
        const safePages = Array.isArray(pages) && pages.length > 0 ? pages : DEFAULT_PAGES;
        const safeActivePageId = safePages.some((p) => p.id === activePageId) ? activePageId : safePages[0].id;
        // Widgets saved by an older version may lack config keys added
        // since; fill them from today's defaults (in memory only — storage
        // is rewritten the next time the user changes something).
        const hydratedPageData = hydratePageData(
          pageData || fallbackPagesState.pageData,
          getTranslation(appearance.language),
          resolveLanguageCode(appearance.language)
        );
        const activeRaw = hydratedPageData[safeActivePageId] || defaults;
        const active = {
          ...activeRaw,
          layouts: sanitizeResponsiveLayouts(activeRaw.layouts),
        };

        set({
          pages: safePages,
          activePageId: safeActivePageId,
          pageData: hydratedPageData,
          widgets: active.widgets,
          layouts: active.layouts,
          wallpaper,
          appearance,
          dockItems,
          keyboardShortcuts,
          trash,
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
    const definition = WIDGET_DEFINITIONS[type];
    const size = definition.size;
    const languageSetting = appearance.language || 'auto';
    const defaultConfig = definition.createDefaultConfig(getTranslation(languageSetting), resolveLanguageCode(languageSetting));
    const config = { ...defaultConfig, ...initialConfig };

    // Stock titles are recognised by WidgetWrapper and re-localized on
    // language change, so it's fine to persist the current language's one.
    const title = customTitle || getDefaultWidgetTitle(type, getTranslation(languageSetting));

    // Place at the bottom of the current layout per breakpoint (never use Infinity:
    // in react-grid-layout, Infinity causes an infinite compaction while-loop).
    const newLayout: Layout = {
      i: id,
      x: 0,
      y: calculateBottomY(layouts.lg || []),
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
      lg: [...(layouts.lg || []), newLayout],
      md: [
        ...(layouts.md || []),
        { ...newLayout, y: calculateBottomY(layouts.md || []), w: Math.min(newLayout.w, 5) },
      ],
      sm: [
        ...(layouts.sm || []),
        { ...newLayout, y: calculateBottomY(layouts.sm || []), w: 6 },
      ],
      xs: [
        ...(layouts.xs || []),
        { ...newLayout, y: calculateBottomY(layouts.xs || []), w: 4 },
      ],
      xxs: [
        ...(layouts.xxs || []),
        { ...newLayout, y: calculateBottomY(layouts.xxs || []), w: 2 },
      ],
    };

    persistPageState(updatedWidgets, updatedLayouts);
    set({ activeSettingsModal: null });
  },

  removeWidget: (id) => {
    const { pages, activePageId } = get();
    const pageIndex = pages.findIndex((p) => p.id === activePageId);
    const pageName = pageIndex === -1 ? '' : getPageDisplayName(pages[pageIndex], pageIndex, tr());
    const removed = removeWidgetInternal(id);
    if (!removed) return;
    const entry = createTrashedWidget(removed.widget, removed.layouts, removed.pageId, pageName);
    addTrash(entry);
    pushUndo(
      fmt(tr().undo.removedWidget, getLocalizedWidgetTitle(removed.widget, tr())),
      () => {
        restoreWidgetInternal(removed);
        removeTrashEntry(entry.id);
      },
      () => {
        removeWidgetInternal(id);
        addTrash(entry);
      }
    );
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

  updateWidgetConfigUndoable: (id, config, label) => {
    const { widgets, layouts } = get();
    const target = widgets.find((w) => w.id === id);
    if (!target) return;
    const previous: Record<string, any> = {};
    for (const key of Object.keys(config)) previous[key] = target.config?.[key];

    const apply = (patch: Record<string, any>) => {
      const current = get();
      if (!current.widgets.some((w) => w.id === id)) return;
      const updated = current.widgets.map((w) => (w.id === id ? { ...w, config: { ...w.config, ...patch } } : w));
      persistPageState(updated, current.layouts);
    };

    persistPageState(
      widgets.map((w) => (w.id === id ? { ...w, config: { ...w.config, ...config } } : w)),
      layouts
    );
    pushUndo(label, () => apply(previous), () => apply(config));
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
    // In time-aware mode the image is chosen per slot; "change wallpaper"
    // just moves to the next picture within the current slot.
    if (wallpaper.dynamic?.enabled) {
      const updated = {
        ...wallpaper,
        dynamic: { ...wallpaper.dynamic, seed: (wallpaper.dynamic.seed ?? 0) + 1 },
        lastRefreshed: Date.now(),
      };
      set({ wallpaper: updated });
      storageService.saveWallpaper(updated);
      return;
    }
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
    const index = dockItems.findIndex((item) => item.id === id);
    if (index === -1) return;
    const removed = dockItems[index];
    saveDock(dockItems.filter((item) => item.id !== id));
    pushUndo(
      fmt(tr().undo.removedDockItem, removed.label),
      () => {
        const current = get().dockItems;
        if (current.some((item) => item.id === id)) return;
        saveDock(insertAt(current, index, removed));
      },
      () => saveDock(get().dockItems.filter((item) => item.id !== id))
    );
  },

  moveDockItem: (id, direction) => {
    const { dockItems } = get();
    const index = dockItems.findIndex((item) => item.id === id);
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (index === -1 || targetIndex < 0 || targetIndex >= dockItems.length) return;
    get().reorderDockItem(id, targetIndex);
  },

  reorderDockItem: (id, toIndex) => {
    const { dockItems } = get();
    const fromIndex = dockItems.findIndex((item) => item.id === id);
    if (fromIndex === -1 || toIndex < 0 || toIndex >= dockItems.length || fromIndex === toIndex) return;

    const move = (from: number, to: number) => {
      const current = get().dockItems;
      if (from >= current.length || to >= current.length) return;
      const updated = [...current];
      const [moved] = updated.splice(from, 1);
      updated.splice(to, 0, moved);
      saveDock(updated);
    };
    move(fromIndex, toIndex);
    pushUndo(tr().undo.reorderedDock, () => move(toIndex, fromIndex), () => move(fromIndex, toIndex));
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
    const index = keyboardShortcuts.findIndex((item) => item.id === id);
    if (index === -1) return;
    const removed = keyboardShortcuts[index];
    saveKeys(keyboardShortcuts.filter((item) => item.id !== id));
    pushUndo(
      fmt(tr().undo.removedShortcut, removed.label),
      () => {
        const current = get().keyboardShortcuts;
        if (current.some((item) => item.id === id)) return;
        saveKeys(insertAt(current, index, removed));
      },
      () => saveKeys(get().keyboardShortcuts.filter((item) => item.id !== id))
    );
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
    const { pages } = get();
    const index = pages.findIndex((p) => p.id === id);
    if (index === -1) return;
    const name = getPageDisplayName(pages[index], index, tr());
    const removed = removePageInternal(id);
    if (!removed) return;
    const entry = createTrashedPage(removed.meta, removed.data);
    addTrash(entry);
    pushUndo(
      fmt(tr().undo.removedPage, name),
      () => {
        restorePageInternal(removed);
        removeTrashEntry(entry.id);
      },
      () => {
        removePageInternal(id);
        addTrash(entry);
      }
    );
  },

  restoreFromTrash: (entryId) => {
    const entry = get().trash.find((e) => e.id === entryId);
    if (!entry) return;

    if (entry.kind === 'widget') {
      const { pageData, activePageId } = get();
      const pageId = entry.sourcePageId === activePageId || pageData[entry.sourcePageId] ? entry.sourcePageId : activePageId;
      // The id may be live again (the delete was undone, or the widget
      // restored from another tab); give the copy a fresh one then.
      const idTaken =
        Object.values(pageData).some((p) => p.widgets.some((w) => w.id === entry.widget.id)) ||
        get().widgets.some((w) => w.id === entry.widget.id);
      const restored = idTaken ? withFreshWidgetId(entry, uniqueId('widget-' + entry.widget.type)) : entry;
      const page = readPage(pageId);
      if (!page) return;
      writePage(pageId, {
        widgets: [...page.widgets, restored.widget],
        layouts: layoutsWithRestoredWidget(page.layouts, restored.widget, restored.layouts),
      });
      removeTrashEntry(entry.id);
      if (pageId !== get().activePageId) get().switchPage(pageId);
      pushUndo(fmt(tr().undo.restoredFromTrash, getLocalizedWidgetTitle(restored.widget, tr())), () => {
        removeWidgetFromPage(pageId, restored.widget.id);
        addTrash(entry);
      });
      return;
    }

    const { pages, activePageId, widgets, layouts, pageData } = get();
    const pageId = pages.some((p) => p.id === entry.pageMeta.id) ? uniqueId('page') : entry.pageMeta.id;
    const meta = { ...entry.pageMeta, id: pageId };
    const newPages = [...pages, meta];
    const updatedPageData = { ...pageData, [activePageId]: { widgets, layouts }, [pageId]: entry.pageData };
    set({ pages: newPages, pageData: updatedPageData });
    storageService.savePages(newPages);
    storageService.savePageData(updatedPageData);
    removeTrashEntry(entry.id);
    get().switchPage(pageId);
    pushUndo(fmt(tr().undo.restoredFromTrash, getPageDisplayName(meta, newPages.length - 1, tr())), () => {
      removePageInternal(pageId);
      addTrash(entry);
    });
  },

  deleteFromTrash: (entryId) => removeTrashEntry(entryId),

  emptyTrash: () => {
    if (get().trash.length === 0) return;
    saveTrash([]);
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
    const [{ pages, activePageId, pageData }, wallpaper, appearance, dockItems, keyboardShortcuts, trash] =
      await Promise.all([
        storageService.getPagesState(defaults),
        storageService.getWallpaper(),
        storageService.getAppearance(),
        storageService.getDockItems(current.dockItems),
        storageService.getKeyboardShortcuts(),
        storageService.getTrash(),
      ]);

    const safeActivePageId = pages.some((p) => p.id === activePageId) ? activePageId : pages[0].id;
    const hydrated = hydratePageData(pageData, getTranslation(appearance.language), resolveLanguageCode(appearance.language));
    const active = hydrated[safeActivePageId] || { widgets: [], layouts: EMPTY_LAYOUTS };

    const next = {
      pages,
      activePageId: safeActivePageId,
      pageData: hydrated,
      widgets: active.widgets,
      layouts: active.layouts,
      wallpaper,
      appearance,
      dockItems,
      keyboardShortcuts,
      trash,
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
      // The trash deliberately survives a reset: it is the last resort.
      isEditMode: false,
      activeSettingsModal: null,
      editingWidgetId: null,
    });
    useUndoStore.getState().clear();
  },

  importConfig: async (jsonData) => {
    const success = await storageService.importDashboardData(jsonData);
    if (success) {
      const [{ pages, activePageId, pageData }, wallpaper, appearance, dockItems, keyboardShortcuts, trash] =
        await Promise.all([
          storageService.getPagesState(),
          storageService.getWallpaper(),
          storageService.getAppearance(),
          storageService.getDockItems(),
          storageService.getKeyboardShortcuts(),
          storageService.getTrash(),
        ]);

      const hydrated = hydratePageData(pageData, getTranslation(appearance.language), resolveLanguageCode(appearance.language));
      const active = hydrated[activePageId] || { widgets: [], layouts: EMPTY_LAYOUTS };

      set({
        pages,
        activePageId,
        pageData: hydrated,
        widgets: active.widgets,
        layouts: active.layouts,
        wallpaper,
        appearance,
        dockItems,
        keyboardShortcuts,
        trash,
        activeSettingsModal: null,
      });
      // Nothing on the old stack refers to what is on screen any more.
      useUndoStore.getState().clear();
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
