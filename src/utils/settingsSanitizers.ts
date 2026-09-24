import type { WallpaperSettings, AppearanceSettings, DockItem, KeyboardShortcutBinding, WallpaperSource, WallpaperCategory } from '../types/settings';
import type { DashboardPageMeta } from '../types/widget';
import { isSafeHttpUrl } from './url';

/**
 * Shape checks for the settings objects that arrive from outside the
 * running tab: an imported config file, a share code, chrome.storage.sync
 * from another device, or storage written by an older version. Each
 * returns a value the UI can render without surprises: enums fall back to
 * the default, numbers are clamped, URLs are http(s) (or a data:image for
 * an uploaded wallpaper), list entries need every field the widget reads.
 *
 * Kept free of React and storage imports so services and the store can
 * share it.
 */

export const DEFAULT_WALLPAPER: WallpaperSettings = {
  source: 'unsplash',
  category: 'space',
  blur: 4,
  brightness: 0.85,
  overlayOpacity: 0.35,
  refreshInterval: 'hourly',
  currentWallpaperUrl: 'https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?auto=format&fit=crop&w=2560&q=80',
};

export const DEFAULT_APPEARANCE: AppearanceSettings = {
  language: 'auto',
  theme: 'dark',
  glassBlur: 16,
  glassOpacity: 0.45,
  borderRadius: '2xl',
  compactMode: false,
  dockPosition: 'bottom',
  adaptiveTextColor: true,
};

const WALLPAPER_SOURCES: WallpaperSource[] = ['unsplash', 'gradient', 'custom', 'collection'];
const WALLPAPER_CATEGORIES: WallpaperCategory[] = ['nature', 'minimal', 'architecture', 'space', 'abstract', 'cyberpunk'];
const REFRESH_INTERVALS: WallpaperSettings['refreshInterval'][] = ['never', 'hourly', 'daily', 'newtab'];
const LANGUAGES: AppearanceSettings['language'][] = ['auto', 'en', 'ja', 'zh-CN', 'es', 'fr', 'de', 'ko'];
const THEMES: AppearanceSettings['theme'][] = ['dark', 'light', 'system'];
const RADII: AppearanceSettings['borderRadius'][] = ['none', 'sm', 'md', 'lg', 'xl', '2xl', 'full'];
const DOCK_POSITIONS: AppearanceSettings['dockPosition'][] = ['bottom', 'top', 'hidden'];

const oneOf = <T extends string>(value: unknown, allowed: readonly T[], fallback: T): T =>
  typeof value === 'string' && (allowed as readonly string[]).includes(value) ? (value as T) : fallback;

const clampNumber = (value: unknown, min: number, max: number, fallback: number): number =>
  typeof value === 'number' && Number.isFinite(value) ? Math.min(max, Math.max(min, value)) : fallback;

const bool = (value: unknown, fallback: boolean): boolean => (typeof value === 'boolean' ? value : fallback);

/**
 * A CSS gradient we are willing to put in `background:`. Only the
 * gradient functions, and only characters a colour-stop list needs — no
 * `url(`, no `;`, no `}`, nothing that could close the declaration.
 */
export function isSafeGradient(value: unknown): value is string {
  return typeof value === 'string' && /^(?:linear|radial|conic)-gradient\([\w\s#%.,()/-]*\)$/i.test(value) && !/url\s*\(/i.test(value);
}

/** An uploaded wallpaper: a data: URL that declares itself an image. */
export function isDataImageUrl(value: unknown): value is string {
  return typeof value === 'string' && /^data:image\/(?:png|jpe?g|gif|webp|avif|bmp);base64,[A-Za-z0-9+/=]+$/.test(value);
}

/** What may become a wallpaper layer: an http(s) image, an uploaded data: image, or a gradient. */
export function isSafeWallpaperUrl(value: unknown): value is string {
  return isSafeHttpUrl(value) || isDataImageUrl(value) || isSafeGradient(value);
}

export function sanitizeWallpaper(raw: unknown): WallpaperSettings {
  const r = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>;
  const source = oneOf(r.source, WALLPAPER_SOURCES, DEFAULT_WALLPAPER.source);
  const url = r.currentWallpaperUrl;
  const urlOk = source === 'gradient' ? isSafeGradient(url) : isSafeHttpUrl(url) || isDataImageUrl(url);
  const out: WallpaperSettings = {
    source,
    category: oneOf(r.category, WALLPAPER_CATEGORIES, DEFAULT_WALLPAPER.category),
    blur: clampNumber(r.blur, 0, 20, DEFAULT_WALLPAPER.blur),
    brightness: clampNumber(r.brightness, 0.2, 1.2, DEFAULT_WALLPAPER.brightness),
    overlayOpacity: clampNumber(r.overlayOpacity, 0, 0.8, DEFAULT_WALLPAPER.overlayOpacity),
    refreshInterval: oneOf(r.refreshInterval, REFRESH_INTERVALS, DEFAULT_WALLPAPER.refreshInterval),
    // A gradient source whose value isn't a gradient (or vice versa) is
    // put back on the stock image rather than rendered as raw CSS.
    currentWallpaperUrl: urlOk ? (url as string) : DEFAULT_WALLPAPER.currentWallpaperUrl,
  };
  if (!urlOk) out.source = DEFAULT_WALLPAPER.source;
  if (typeof r.lastRefreshed === 'number' && Number.isFinite(r.lastRefreshed)) out.lastRefreshed = r.lastRefreshed;
  if (isSafeHttpUrl(r.customUrl) || isDataImageUrl(r.customUrl)) out.customUrl = r.customUrl as string;
  if (r.dynamic && typeof r.dynamic === 'object') out.dynamic = sanitizeDynamic(r.dynamic as Record<string, unknown>);
  return out;
}

function sanitizeDynamic(d: Record<string, unknown>): WallpaperSettings['dynamic'] {
  const out: NonNullable<WallpaperSettings['dynamic']> = {
    enabled: bool(d.enabled, false),
    mode: oneOf(d.mode, ['smart', 'custom'] as const, 'smart'),
  };
  if (typeof d.seed === 'number' && Number.isFinite(d.seed)) out.seed = d.seed;
  if (d.slots && typeof d.slots === 'object') {
    const slots: Record<string, any> = {};
    for (const key of ['morning', 'day', 'sunset', 'night'] as const) {
      const s = (d.slots as Record<string, unknown>)[key];
      if (!s || typeof s !== 'object') continue;
      const c = s as Record<string, unknown>;
      slots[key] = {
        startHour: clampNumber(c.startHour, 0, 23, 0),
        source: oneOf(c.source, ['unsplash', 'gradient'] as const, 'unsplash'),
        category: oneOf(c.category, WALLPAPER_CATEGORIES, 'nature'),
        ...(typeof c.gradientIndex === 'number' ? { gradientIndex: clampNumber(c.gradientIndex, 0, 99, 0) } : {}),
        ...(c.blur !== undefined ? { blur: clampNumber(c.blur, 0, 20, 4) } : {}),
        ...(c.brightness !== undefined ? { brightness: clampNumber(c.brightness, 0.2, 1.2, 0.85) } : {}),
        ...(c.overlayOpacity !== undefined ? { overlayOpacity: clampNumber(c.overlayOpacity, 0, 0.8, 0.35) } : {}),
      };
    }
    // A partial custom config (only some time slots set) is intentional —
    // wallpaperService.getActiveSlots fills the rest from the presets — so
    // keep whichever slots parsed, rather than requiring all four.
    if (Object.keys(slots).length > 0) out.slots = slots as NonNullable<WallpaperSettings['dynamic']>['slots'];
  }
  return out;
}

export function sanitizeAppearance(raw: unknown): AppearanceSettings {
  const r = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>;
  return {
    language: oneOf(r.language, LANGUAGES, DEFAULT_APPEARANCE.language),
    theme: oneOf(r.theme, THEMES, DEFAULT_APPEARANCE.theme),
    glassBlur: clampNumber(r.glassBlur, 0, 40, DEFAULT_APPEARANCE.glassBlur),
    glassOpacity: clampNumber(r.glassOpacity, 0.1, 0.95, DEFAULT_APPEARANCE.glassOpacity),
    borderRadius: oneOf(r.borderRadius, RADII, DEFAULT_APPEARANCE.borderRadius),
    compactMode: bool(r.compactMode, DEFAULT_APPEARANCE.compactMode),
    dockPosition: oneOf(r.dockPosition, DOCK_POSITIONS, DEFAULT_APPEARANCE.dockPosition),
    adaptiveTextColor: bool(r.adaptiveTextColor, DEFAULT_APPEARANCE.adaptiveTextColor ?? true),
  };
}

export function sanitizeDockItems(raw: unknown): DockItem[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter(
      (item): item is DockItem =>
        !!item && typeof item === 'object' && typeof item.id === 'string' && typeof item.label === 'string' && typeof item.icon === 'string' && isSafeHttpUrl(item.url)
    )
    .map((item) => ({ id: item.id, label: item.label, url: item.url, icon: item.icon, openInNewTab: item.openInNewTab !== false }));
}

export function sanitizeKeyboardShortcuts(raw: unknown): KeyboardShortcutBinding[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter(
      (item): item is KeyboardShortcutBinding =>
        !!item && typeof item === 'object' && typeof item.id === 'string' && typeof item.combo === 'string' && typeof item.label === 'string' && isSafeHttpUrl(item.url)
    )
    .map((item) => ({ id: item.id, combo: item.combo, label: item.label, url: item.url, openInNewTab: item.openInNewTab !== false }));
}

/** Longest page name kept; matches what a share code carries. */
export const MAX_PAGE_NAME_LENGTH = 60;

// Keys that, used as a page id, would reach Object.prototype through the
// `pageData[id]` lookups instead of an own record.
const RESERVED_PAGE_IDS = new Set(['__proto__', 'constructor', 'prototype']);

/**
 * The page list (tab strip): every entry needs a usable string id — the
 * key into pageData — and a string name, since the tab renders the name
 * directly and a non-string there crashes the whole dashboard on every
 * load. Duplicate ids would make rename/remove/switch hit two tabs at
 * once, so the first one wins.
 */
export function sanitizePages(raw: unknown): DashboardPageMeta[] {
  if (!Array.isArray(raw)) return [];
  const seen = new Set<string>();
  const out: DashboardPageMeta[] = [];
  for (const item of raw) {
    if (!item || typeof item !== 'object') continue;
    const { id, name } = item as Record<string, unknown>;
    if (typeof id !== 'string' || id === '' || RESERVED_PAGE_IDS.has(id) || seen.has(id)) continue;
    seen.add(id);
    out.push({ id, name: typeof name === 'string' ? name.slice(0, MAX_PAGE_NAME_LENGTH) : '' });
  }
  return out;
}

/**
 * `url("...")` with the characters that could end the string or the
 * function escaped, so a value can never break out of the declaration
 * even if a check upstream is bypassed.
 */
export function cssUrl(value: string): string {
  return `url("${value.replace(/[\\"()\s]/g, (ch) => `\\${ch.charCodeAt(0).toString(16)} `)}")`;
}
