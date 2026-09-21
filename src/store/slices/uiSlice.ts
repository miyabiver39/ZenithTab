import { onboardingService } from '../../services/onboardingService';
import type { DashboardSliceCreator, UiSlice } from '../types';

export const createUiSlice: DashboardSliceCreator<UiSlice> = (set) => ({
  isEditMode: false,
  isAppDrawerOpen: false,
  activeSettingsModal: null,
  editingWidgetId: null,
  isOnboardingOpen: false,
  showFirstRunHint: false,

  setOnboardingOpen: (open) => set({ isOnboardingOpen: open }),

  dismissFirstRunHint: () => {
    set({ showFirstRunHint: false });
    void onboardingService.dismissHint();
  },

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
