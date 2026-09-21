/**
 * Every chrome.storage.local key ZenithTab owns. Lives in its own module so
 * the migration pipeline and storageService can both import it without a
 * circular dependency.
 */
export const STORAGE_KEYS = {
  WIDGETS: 'dashboard_widgets',
  LAYOUTS: 'dashboard_layouts',
  WALLPAPER: 'dashboard_wallpaper',
  APPEARANCE: 'dashboard_appearance',
  RSS_CACHE: 'rss_cache',
  NOTES: 'quick_notes',
  DOCK_ITEMS: 'dashboard_dock_items',
  KEYBOARD_SHORTCUTS: 'dashboard_keyboard_shortcuts',
  PAGES: 'dashboard_pages',
  ACTIVE_PAGE_ID: 'dashboard_active_page_id',
  PAGE_DATA: 'dashboard_page_data',
  /** Deleted widgets/pages awaiting restore or expiry (services/trashService.ts). */
  TRASH: 'dashboard_trash',
  /**
   * Whole-dashboard snapshots (services/snapshotService.ts). Not part of
   * USER_DATA_KEYS on purpose: a snapshot must not contain the snapshots.
   */
  SNAPSHOTS: 'dashboard_snapshots',
  BACKUP_SETTINGS: 'dashboard_backup_settings',
  /** First-run setup progress and the first-run hint counter (services/onboardingService.ts). */
  ONBOARDING: 'dashboard_onboarding',
  /** Schema generation of everything above; see services/migrations.ts. */
  SCHEMA_VERSION: 'schema_version',
} as const;

/**
 * Keys that describe the user's dashboard (as opposed to caches). These
 * are what a migration may reshape and what gets snapshotted before one
 * runs.
 */
export const USER_DATA_KEYS: string[] = [
  STORAGE_KEYS.WIDGETS,
  STORAGE_KEYS.LAYOUTS,
  STORAGE_KEYS.WALLPAPER,
  STORAGE_KEYS.APPEARANCE,
  STORAGE_KEYS.DOCK_ITEMS,
  STORAGE_KEYS.KEYBOARD_SHORTCUTS,
  STORAGE_KEYS.PAGES,
  STORAGE_KEYS.ACTIVE_PAGE_ID,
  STORAGE_KEYS.PAGE_DATA,
  STORAGE_KEYS.TRASH,
];
