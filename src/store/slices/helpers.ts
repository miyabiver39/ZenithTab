import { Layout } from 'react-grid-layout';
import { DashboardWidget, ResponsiveLayouts, DashboardPageMeta, DashboardPageData, TrashEntry, GridBreakpoint } from '../../types/widget';
import { AppearanceSettings, DockItem, KeyboardShortcutBinding } from '../../types/settings';
import { storageService, createDefaultWidgets, createDefaultLayouts, hydratePageData } from '../../services/storageService';
import { getTranslation, resolveLanguageCode } from '../../i18n/resolve';
import { getRegionalDockItems } from '../../config/defaults/regionalPresets';
import { pruneTrash } from '../../services/trashService';
import { GRID_BREAKPOINT_KEYS } from '../../config/grid';
import { useUndoStore } from '../useUndoStore';
import type { DashboardState } from '../types';

export const EMPTY_LAYOUTS: ResponsiveLayouts = { lg: [], md: [], sm: [], xs: [], xxs: [] };

/**
 * chrome.storage.local calls are expected to settle quickly, but a hung
 * call here would leave `isInitialized` false forever — the new-tab page
 * stuck on its loading screen with no way out short of reinstalling the
 * extension. Race the real load against a timeout so the dashboard always
 * reaches a usable state, worst case falling back to in-memory defaults.
 */
export function withTimeout<T>(promise: Promise<T>, ms: number, fallback: T): Promise<T> {
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

/** Widgets/layouts for a fresh page-1 in the given language setting. */
export function localizedDefaults(languageSetting: AppearanceSettings['language']) {
  const lang = resolveLanguageCode(languageSetting);
  const widgets = createDefaultWidgets(getTranslation(languageSetting), lang);
  return { widgets, layouts: createDefaultLayouts(widgets), dockItems: getRegionalDockItems(lang) };
}

/**
 * Gives every widget on a page a fresh id (in both the widget list and each
 * breakpoint's layout) so a duplicated page never shares ids with its source.
 */
export function cloneWidgetsWithNewIds(widgets: DashboardWidget[], layouts: ResponsiveLayouts): DashboardPageData {
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

type Set = (partial: Partial<DashboardState> | ((state: DashboardState) => Partial<DashboardState>)) => void;
type Get = () => DashboardState;

/**
 * The helpers every slice shares: page read/write that keeps the active
 * page's mirror and `pageData` in sync, widget/page removal and restore
 * (used by delete, undo and the trash), trash bookkeeping, and the undo
 * plumbing. Each slice creates its own instance over the same set/get.
 */
export function createStoreHelpers(set: Set, get: Get) {
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

  /**
   * Replaces the whole in-memory dashboard with what storage holds — after
   * an import or a snapshot restore, where everything may have changed.
   */
  const reloadFromStorage = async () => {
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
      isEditMode: false,
      activeSettingsModal: null,
      editingWidgetId: null,
    });
    // Nothing on the old stack refers to what is on screen any more.
    useUndoStore.getState().clear();
  };

  return {
    persistPageState,
    tr,
    pushUndo,
    fmt,
    readPage,
    writePage,
    removeWidgetFromPage,
    removeWidgetInternal,
    restoreWidgetInternal,
    saveTrash,
    addTrash,
    removeTrashEntry,
    insertAt,
    removePageInternal,
    restorePageInternal,
    saveDock,
    saveKeys,
    reloadFromStorage,
  };
}

export type StoreHelpers = ReturnType<typeof createStoreHelpers>;
