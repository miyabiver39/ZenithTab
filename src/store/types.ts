import { Layout } from 'react-grid-layout';
import { StateCreator } from 'zustand';
import { DashboardWidget, ResponsiveLayouts, WidgetType, DashboardPageMeta, DashboardPageData, TrashEntry } from '../types/widget';
import { WallpaperSettings, AppearanceSettings, DockItem, KeyboardShortcutBinding } from '../types/settings';
import type { BackupSettings, SnapshotMeta } from '../services/snapshotService';

/**
 * The dashboard store, split by domain. Components see the union
 * (`DashboardState`) exactly as before; each slice file implements one of
 * these interfaces and may read/call anything on the union through `get()`.
 */

/** Edit mode, the app drawer and which settings dialog is open. */
export interface UiSlice {
  isEditMode: boolean;
  isAppDrawerOpen: boolean;
  activeSettingsModal: 'settings' | 'addWidget' | 'editWidget' | null;
  editingWidgetId: string | null;

  setEditMode: (isEditMode: boolean) => void;
  toggleAppDrawer: (open?: boolean) => void;
  openSettingsModal: (type: 'settings' | 'addWidget' | 'editWidget', widgetId?: string) => void;
  closeSettingsModal: () => void;
}

/** The active page's widgets and layouts (mirrored into pageData by pageSlice). */
export interface WidgetSlice {
  widgets: DashboardWidget[];
  layouts: ResponsiveLayouts;

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
}

/** Multi-page dashboard: `widgets`/`layouts` always mirror the active page; `pageData` holds every page. */
export interface PageSlice {
  pages: DashboardPageMeta[];
  activePageId: string;
  pageData: Record<string, DashboardPageData>;

  switchPage: (id: string) => void;
  addPage: (options?: { name?: string; duplicateCurrent?: boolean; template?: DashboardPageData }) => void;
  removePage: (id: string) => void;
  renamePage: (id: string, name: string) => void;
}

/** Wallpaper, appearance, dock and keyboard shortcuts. */
export interface SettingsSlice {
  wallpaper: WallpaperSettings;
  appearance: AppearanceSettings;
  dockItems: DockItem[];
  keyboardShortcuts: KeyboardShortcutBinding[];

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
}

/** Deleted widgets/pages, restorable from Settings > Trash for 30 days. */
export interface TrashSlice {
  trash: TrashEntry[];

  /** Puts a trashed widget back on its page (or the current one) / re-adds a trashed page. */
  restoreFromTrash: (entryId: string) => void;
  deleteFromTrash: (entryId: string) => void;
  emptyTrash: () => void;
}

/**
 * Whole-dashboard snapshots (Settings > Backup). The list is loaded on
 * demand — it isn't needed to draw the dashboard — so null means "not
 * fetched yet".
 */
export interface SnapshotSlice {
  snapshots: SnapshotMeta[] | null;
  backupSettings: BackupSettings;

  refreshSnapshots: () => Promise<void>;
  /** "Back up now". Resolves false when nothing changed since the newest snapshot. */
  takeSnapshot: () => Promise<boolean>;
  /** Replaces the dashboard with the snapshot (after snapshotting the current state). */
  restoreSnapshot: (id: string) => Promise<boolean>;
  deleteSnapshot: (id: string) => Promise<void>;
  updateBackupSettings: (partial: Partial<BackupSettings>) => Promise<void>;
}

/** Startup, multi-tab sync, reset and import/export. */
export interface PersistenceSlice {
  isInitialized: boolean;
  initialize: () => Promise<void>;
  /**
   * Re-reads everything from storage and applies whatever differs. Used to
   * pick up writes made by another new-tab instance (see useStorageSync).
   */
  syncFromStorage: () => Promise<void>;

  resetToDefault: () => Promise<void>;
  importConfig: (jsonData: string) => Promise<boolean>;
  exportConfig: () => Promise<string>;
}

export type DashboardState = UiSlice & WidgetSlice & PageSlice & SettingsSlice & TrashSlice & SnapshotSlice & PersistenceSlice;

/** A slice creator that sees the whole store through `get()`. */
export type DashboardSliceCreator<T> = StateCreator<DashboardState, [], [], T>;
