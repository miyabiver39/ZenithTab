import { create } from 'zustand';
import { getRegionalShortcuts } from '../config/defaults/regionalPresets';
import type { DashboardState } from './types';
import { createUiSlice } from './slices/uiSlice';
import { createWidgetSlice } from './slices/widgetSlice';
import { createPageSlice } from './slices/pageSlice';
import { createSettingsSlice } from './slices/settingsSlice';
import { createTrashSlice } from './slices/trashSlice';
import { createSnapshotSlice } from './slices/snapshotSlice';
import { createPersistenceSlice } from './slices/persistenceSlice';

export type { DashboardState } from './types';

// Language-neutral fallback (the global preset); a new Shortcuts widget
// gets the preset for the dashboard's current language instead.
export const DEFAULT_SHORTCUTS = getRegionalShortcuts('en');

/**
 * One store, composed from domain slices (see ./slices). The public shape
 * is unchanged: every component keeps calling `useDashboardStore` with the
 * same selectors and actions.
 */
export const useDashboardStore = create<DashboardState>()((...a) => ({
  ...createUiSlice(...a),
  ...createWidgetSlice(...a),
  ...createPageSlice(...a),
  ...createSettingsSlice(...a),
  ...createTrashSlice(...a),
  ...createSnapshotSlice(...a),
  ...createPersistenceSlice(...a),
}));
