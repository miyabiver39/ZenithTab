export type WallpaperSource = 'unsplash' | 'gradient' | 'custom' | 'collection';

export type WallpaperCategory = 'nature' | 'minimal' | 'architecture' | 'space' | 'abstract' | 'cyberpunk';

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
}

export interface AppearanceSettings {
  theme: 'dark' | 'light' | 'system';
  glassBlur: number; // in px
  glassOpacity: number; // 0.1 to 0.95
  borderRadius: 'none' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';
  compactMode: boolean;
  dockPosition: 'bottom' | 'top' | 'hidden';
}

export interface DashboardExportData {
  version: string;
  exportedAt: string;
  widgets: any[];
  layouts: any;
  wallpaper: WallpaperSettings;
  appearance: AppearanceSettings;
}
