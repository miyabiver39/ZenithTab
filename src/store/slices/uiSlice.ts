import type { DashboardSliceCreator, UiSlice } from '../types';

export const createUiSlice: DashboardSliceCreator<UiSlice> = (set) => ({
  isEditMode: false,
  isAppDrawerOpen: false,
  activeSettingsModal: null,
  editingWidgetId: null,

    toggleAppDrawer: (open) =>
      set((state) => ({ isAppDrawerOpen: open !== undefined ? open : !state.isAppDrawerOpen })),

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
});
