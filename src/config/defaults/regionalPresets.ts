import { DockItem } from '../../types/settings';
import { ShortcutItem } from '../../types/widget';
import { getSiteCatalog, type CatalogSite } from '../catalog/siteCatalog';

/**
 * First-run Dock / Shortcut / weather presets per dashboard language.
 * The Dock and Shortcut lists are the ranked entries of the region's site
 * catalog (config/catalog/siteCatalog.ts); the picker offers the rest.
 *
 * The sites people open every day differ a lot by country — Yahoo! JAPAN
 * and Rakuten in Japan, Naver and Coupang in Korea, Bilibili and Taobao in
 * China — so a single global list either feels foreign or wastes slots.
 * Each preset targets the everyday 20s–30s user of that region (streaming,
 * social, shopping, AI, mail/maps), not developers.
 *
 * Only ever consulted when there is nothing saved yet (fresh install) or on
 * an explicit "reset to defaults"; existing users' items are never touched.
 * Unknown languages fall back to the global (`en`) preset.
 */

export type PresetLanguage = 'en' | 'ja' | 'ko' | 'zh-CN' | 'es' | 'fr' | 'de';

interface RegionalPreset {
  /** Default weather location for the region's largest city. */
  weather: { city: string; latitude: number; longitude: number };
}

const PRESETS: Record<PresetLanguage, RegionalPreset> = {
  en: { weather: { city: 'New York', latitude: 40.7128, longitude: -74.006 } },
  ja: { weather: { city: 'Tokyo', latitude: 35.6762, longitude: 139.6503 } },
  ko: { weather: { city: 'Seoul', latitude: 37.5665, longitude: 126.978 } },
  'zh-CN': { weather: { city: 'Shanghai', latitude: 31.2304, longitude: 121.4737 } },
  es: { weather: { city: 'Madrid', latitude: 40.4168, longitude: -3.7038 } },
  fr: { weather: { city: 'Paris', latitude: 48.8566, longitude: 2.3522 } },
  de: { weather: { city: 'Berlin', latitude: 52.52, longitude: 13.405 } },
};

/** A catalog site as a Dock item (`dock-<id>`, label may differ from the tile title). */
export function dockItemFromSite(site: CatalogSite): DockItem {
  return { id: `dock-${site.id}`, label: site.dockLabel || site.title, url: site.url, icon: site.icon, openInNewTab: true };
}

/** A catalog site as a Shortcuts tile (`app-<id>`). */
export function shortcutFromSite(site: CatalogSite): ShortcutItem {
  return { id: `app-${site.id}`, title: site.title, url: site.url, category: site.category };
}

/** Maps any language code the app might hand us onto a preset key. */
export function resolvePresetLanguage(lang?: string): PresetLanguage {
  if (!lang) return 'en';
  if (lang === 'zh' || lang.startsWith('zh-')) return 'zh-CN';
  const base = lang.split('-')[0];
  return (['en', 'ja', 'ko', 'es', 'fr', 'de'] as const).includes(base as any) ? (base as PresetLanguage) : 'en';
}

// Fresh copies every call so callers can't mutate the shared tables.
const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value));

export function getRegionalDockItems(lang?: string): DockItem[] {
  return getSiteCatalog(resolvePresetLanguage(lang))
    .filter((site) => site.dock !== undefined)
    .sort((a, b) => a.dock! - b.dock!)
    .map(dockItemFromSite);
}

export function getRegionalShortcuts(lang?: string): ShortcutItem[] {
  return getSiteCatalog(resolvePresetLanguage(lang))
    .filter((site) => site.shortcut !== undefined)
    .sort((a, b) => a.shortcut! - b.shortcut!)
    .map(shortcutFromSite);
}

export function getRegionalWeatherDefault(lang?: string): RegionalPreset['weather'] {
  return clone(PRESETS[resolvePresetLanguage(lang)].weather);
}

/** True when the coordinates are one of the regional defaults, i.e. the user never picked a place. */
export function isRegionalWeatherDefault(latitude?: number, longitude?: number): boolean {
  if (latitude === undefined || longitude === undefined) return true;
  return Object.values(PRESETS).some((p) => p.weather.latitude === latitude && p.weather.longitude === longitude);
}
