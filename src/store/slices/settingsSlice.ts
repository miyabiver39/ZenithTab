import { DockItem, KeyboardShortcutBinding } from '../../types/settings';
import { storageService, DEFAULT_WALLPAPER, DEFAULT_APPEARANCE, DEFAULT_DOCK_ITEMS, DEFAULT_KEYBOARD_SHORTCUTS } from '../../services/storageService';
import { wallpaperService } from '../../services/wallpaperService';
import { uniqueId } from '../../utils/id';
import { createStoreHelpers } from './helpers';
import type { DashboardSliceCreator, SettingsSlice } from '../types';

export const createSettingsSlice: DashboardSliceCreator<SettingsSlice> = (set, get) => {
  const { tr, pushUndo, fmt, insertAt, saveDock, saveKeys } = createStoreHelpers(set, get);

  return {
    wallpaper: DEFAULT_WALLPAPER,
    appearance: DEFAULT_APPEARANCE,
    dockItems: DEFAULT_DOCK_ITEMS,
    keyboardShortcuts: DEFAULT_KEYBOARD_SHORTCUTS,

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

    replaceDockItems: (items) => {
      const previous = get().dockItems;
      saveDock(items.map((item) => ({ ...item, id: uniqueId('dock') })));
      pushUndo(tr().undo.replacedDock, () => saveDock(previous));
    },

    isApplyingSyncedSettings: false,
    syncSkipped: [],

    applySyncedSettings: (settings) => {
      // The flag is visible to store subscribers during this very set(),
      // which is how the sync hook tells a remote value from a local edit.
      set({ isApplyingSyncedSettings: true, ...settings });
      set({ isApplyingSyncedSettings: false });
      if (settings.appearance) storageService.saveAppearance(settings.appearance);
      if (settings.dockItems) storageService.saveDockItems(settings.dockItems);
      if (settings.keyboardShortcuts) storageService.saveKeyboardShortcuts(settings.keyboardShortcuts);
    },

    setSyncSkipped: (keys) => {
      if (JSON.stringify(keys) !== JSON.stringify(get().syncSkipped)) set({ syncSkipped: keys });
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
  };
};
