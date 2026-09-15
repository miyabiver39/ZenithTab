import { useDashboardStore } from '../../src/store/useDashboardStore';
import {
  DEFAULT_WIDGETS,
  DEFAULT_LAYOUTS,
  DEFAULT_WALLPAPER,
  DEFAULT_APPEARANCE,
  DEFAULT_DOCK_ITEMS,
  DEFAULT_KEYBOARD_SHORTCUTS,
  DEFAULT_PAGES,
  DEFAULT_PAGE_ID,
} from '../../src/services/storageService';

/**
 * Puts the (module-singleton) Zustand store back to a known, initialized
 * default state without touching storage. Call it in `beforeEach` of any
 * test that mutates the store.
 */
export function resetDashboardStore(overrides: Partial<ReturnType<typeof useDashboardStore.getState>> = {}) {
  useDashboardStore.setState({
    isInitialized: true,
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
    pageData: { [DEFAULT_PAGE_ID]: { widgets: DEFAULT_WIDGETS, layouts: DEFAULT_LAYOUTS } },
    ...overrides,
  });
}

/** Lets pending `storageService.save*` promises settle. */
export const flushPromises = () => new Promise((resolve) => setTimeout(resolve, 0));
