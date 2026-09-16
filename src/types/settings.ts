export type WallpaperSource = 'unsplash' | 'gradient' | 'custom' | 'collection';

export type WallpaperCategory = 'nature' | 'minimal' | 'architecture' | 'space' | 'abstract' | 'cyberpunk';

/** Time-aware wallpaper: 'smart' uses curated presets, 'custom' the user's own slots. */
export type DynamicWallpaperMode = 'smart' | 'custom';

export type TimeSlot = 'morning' | 'day' | 'sunset' | 'night';

export interface TimeSlotConfig {
  /** Hour (0–23) at which this slot begins; slots wrap around midnight. */
  startHour: number;
  source: 'unsplash' | 'gradient';
  category: WallpaperCategory;
  /** Index into GRADIENT_PRESETS when source is 'gradient'. */
  gradientIndex?: number;
  blur?: number; // 0 to 20
  brightness?: number; // 0.2 to 1.2
  overlayOpacity?: number; // 0 to 0.8
}

export interface DynamicWallpaperSettings {
  enabled: boolean;
  mode: DynamicWallpaperMode;
  /** Only read in 'custom' mode; 'smart' always uses the built-in slots. */
  slots?: Record<TimeSlot, TimeSlotConfig>;
  /** Bumped by "change wallpaper" to cycle to another image within the slot. */
  seed?: number;
}

export interface WallpaperSettings {
  source: WallpaperSource;
  customUrl?: string;
  category: WallpaperCategory;
  blur: number; // in px: 0 to 20
  brightness: number; // 0.2 to 1.2
  overlayOpacity: number; // 0 to 0.8
  refreshInterval: 'never' | 'hourly' | 'daily' | 'newtab';
  lastRefreshed?: number;
  currentWallpaperUrl: string;
  /** When enabled, overrides source/category/blur/brightness/overlay by time of day. */
  dynamic?: DynamicWallpaperSettings;
}

export interface AppearanceSettings {
  language: 'auto' | 'en' | 'ja' | 'zh-CN' | 'es' | 'fr' | 'de' | 'ko';
  theme: 'dark' | 'light' | 'system';
  glassBlur: number; // in px
  glassOpacity: number; // 0.1 to 0.95
  borderRadius: 'none' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';
  compactMode: boolean;
  dockPosition: 'bottom' | 'top' | 'hidden';
}

export interface DockItem {
  id: string;
  label: string;
  url: string;
  /** A key from the curated DOCK_ICON_LIBRARY, or a free-form emoji/short string. */
  icon: string;
  openInNewTab: boolean;
}

export interface KeyboardShortcutBinding {
  id: string;
  /** Normalized combo string, e.g. "Ctrl+Alt+G" — see utils/keyboardShortcuts.ts. */
  combo: string;
  label: string;
  url: string;
  openInNewTab: boolean;
}

export interface DashboardExportData {
  version: string;
  /** Shape generation of the file; absent in exports from before 1.7.0 (= 1). */
  schemaVersion?: number;
  exportedAt: string;
  /** The active page's widgets/layouts — kept for backward compatibility with pre-1.3 exports. */
  widgets: any[];
  layouts: any;
  wallpaper: WallpaperSettings;
  appearance: AppearanceSettings;
  dockItems?: DockItem[];
  keyboardShortcuts?: KeyboardShortcutBinding[];
  pages?: { id: string; name: string }[];
  pageData?: Record<string, { widgets: any[]; layouts: any }>;
  activePageId?: string;
}
