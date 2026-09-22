import {
  storageService,
  hydratePageData,
  DEFAULT_WIDGETS,
  DEFAULT_LAYOUTS,
  DEFAULT_WALLPAPER,
  DEFAULT_APPEARANCE,
  DEFAULT_KEYBOARD_SHORTCUTS,
  DEFAULT_PAGES,
  DEFAULT_PAGE_ID,
} from '../../services/storageService';
import { runMigrations } from '../../services/migrations';
import { getTranslation, resolveLanguageCode, preloadLocale } from '../../i18n/resolve';
import { sanitizeResponsiveLayouts } from '../../utils/layout';
import { pruneTrash } from '../../services/trashService';
import { snapshotService, snapshotDataFromState, DEFAULT_BACKUP_SETTINGS } from '../../services/snapshotService';
import { onboardingService } from '../../services/onboardingService';
import { buildSetupResult } from '../../config/setup/applySetup';
import { useUndoStore } from '../useUndoStore';
import { createStoreHelpers, EMPTY_LAYOUTS, withTimeout, localizedDefaults } from './helpers';
import type { DashboardSliceCreator, DashboardState, PersistenceSlice } from '../types';

export const createPersistenceSlice: DashboardSliceCreator<PersistenceSlice> = (set, get) => {
  const { reloadFromStorage } = createStoreHelpers(set, get);

  return {
    isInitialized: false,

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
        // The active language's locale (only) is loaded before anything
        // below reads a translation, so the very first paint — default
        // widget titles included — is already in the right language
        // instead of flashing English while the chunk streams in (#77).
        await withTimeout(preloadLocale(appearance.language), 5000, null);
        const defaults = localizedDefaults(appearance.language);
        // Decided before anything is written: a fresh install (no user
        // data at all) gets the setup wizard; everyone else at most the
        // newcomer hint. Never blocks start-up.
        const onboarding = await withTimeout(onboardingService.evaluateStartup(), 3000, { showSetup: false, showHint: false });

        const [{ pages, activePageId, pageData }, wallpaper, dockItems, keyboardShortcuts, storedTrash, backupSettings] =
          await Promise.all([
            withTimeout(storageService.getPagesState(defaults), 5000, fallbackPagesState),
            withTimeout(storageService.getWallpaper(), 5000, DEFAULT_WALLPAPER),
            withTimeout(storageService.getDockItems(defaults.dockItems), 5000, defaults.dockItems),
            withTimeout(storageService.getKeyboardShortcuts(), 5000, DEFAULT_KEYBOARD_SHORTCUTS),
            withTimeout(storageService.getTrash(), 5000, []),
            withTimeout(snapshotService.getSettings(), 5000, DEFAULT_BACKUP_SETTINGS),
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
          backupSettings,
          isOnboardingOpen: onboarding.showSetup,
          showFirstRunHint: onboarding.showHint,
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
      // Awaited first so the auto-snapshot subscriber sees it and doesn't
      // store a duplicate of the same state.
      await snapshotService.take('before-reset', snapshotDataFromState(get()));
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

    applySetup: async (choices, language) => {
      if (await onboardingService.hasUserData()) {
        await snapshotService.take('before-reset', snapshotDataFromState(get()));
      }
      const appearance = { ...get().appearance, language };
      const lang = resolveLanguageCode(language);
      await preloadLocale(language);
      const { page, dockItems } = buildSetupResult(choices, getTranslation(language), lang);

      // Wallpaper and keyboard shortcuts are left alone: the wizard is about
      // content and language, not looks.
      await Promise.all([
        storageService.saveAppearance(appearance),
        storageService.savePages(DEFAULT_PAGES),
        storageService.savePageData({ [DEFAULT_PAGE_ID]: page }),
        storageService.saveActivePageId(DEFAULT_PAGE_ID),
        storageService.saveWidgets(page.widgets),
        storageService.saveLayouts(page.layouts),
        storageService.saveDockItems(dockItems),
      ]);
      await onboardingService.markCompleted();

      set({
        pages: DEFAULT_PAGES,
        activePageId: DEFAULT_PAGE_ID,
        pageData: { [DEFAULT_PAGE_ID]: page },
        widgets: page.widgets,
        layouts: page.layouts,
        appearance,
        dockItems,
        isEditMode: false,
        activeSettingsModal: null,
        editingWidgetId: null,
        isOnboardingOpen: false,
        showFirstRunHint: true,
      });
      useUndoStore.getState().clear();
    },

    skipSetup: async () => {
      set({ isOnboardingOpen: false });
      const state = await onboardingService.get();
      if (!state.completedAt) {
        await onboardingService.markCompleted();
        set({ showFirstRunHint: true });
      }
    },

    importConfig: async (jsonData) => {
      // Keep what is being replaced. An unparsable file fails below and the
      // snapshot is simply one more (harmless) copy of the current state.
      await snapshotService.take('before-import', snapshotDataFromState(get()));
      const success = await storageService.importDashboardData(jsonData);
      if (success) {
        await reloadFromStorage();
        return true;
      }
      return false;
    },

    exportConfig: async () => {
      const exportData = await storageService.exportDashboardData();
      return JSON.stringify(exportData, null, 2);
    },
  };
};
