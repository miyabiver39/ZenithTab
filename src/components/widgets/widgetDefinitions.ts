import { WidgetType } from '../../types/widget';
import type { Translation } from '../../i18n/resolve';
import { rssService } from '../../services/rssService';
import { getRegionalShortcuts, getRegionalWeatherDefault } from '../../config/defaults/regionalPresets';

/**
 * The React-free half of the widget registry: everything the store and the
 * storage layer need to know about a widget type without pulling in its
 * components. `registry.tsx` layers icons, components and config forms on
 * top of these entries — register a new widget in BOTH files.
 *
 * Kept separate on purpose: the store and storageService evaluate at
 * module load, and importing components from them would create an import
 * cycle (component → store → storageService → component).
 */

export interface WidgetSize {
  w: number;
  h: number;
  minW: number;
  minH: number;
}

export interface WidgetDefinitionMeta {
  type: WidgetType;
  /** Grid footprint when the widget is first added. */
  size: WidgetSize;
  /** Config a freshly added widget starts with, localized for `t` / `lang`. */
  createDefaultConfig: (t: Translation, lang: string) => Record<string, any>;
  /**
   * Config keys that hold a URL the widget will navigate to or embed.
   * Anything that isn't http(s) is stripped on import.
   */
  urlKeys?: string[];
  /** Extra import-time cleanup for nested structures (item lists, engines…). */
  sanitizeConfig?: (config: Record<string, any>, isSafeUrl: (value: unknown) => boolean) => Record<string, any>;
  /**
   * Upgrade rule for configs written by older versions, run before missing
   * keys are filled from createDefaultConfig. Return only the keys to set.
   * Use it when a plain default would change what the user sees — e.g. an
   * old keyword-search news widget must not be defaulted to "headlines".
   */
  migrateConfig?: (config: Record<string, any>) => Record<string, any>;
  /**
   * Chrome API permissions from manifest `optional_permissions` this widget
   * needs. Requested when the widget is added (a user gesture); the widget
   * itself offers a "grant" button until they are given.
   */
  optionalPermissions?: string[];
}

const KNOWN_BUILTIN_ENGINES = ['google', 'bing', 'duckduckgo', 'github', 'youtube', 'chatgpt'];

export const WIDGET_DEFINITIONS: Record<WidgetType, WidgetDefinitionMeta> = {
  search: {
    type: 'search',
    size: { w: 8, h: 1, minW: 4, minH: 1 },
    createDefaultConfig: () => ({
      defaultEngine: 'google',
      showEngineSelector: true,
      openInNewTab: true,
      smartTools: true,
    }),
    sanitizeConfig: (config, isSafeUrl) => {
      const next = { ...config };
      // Custom search engines: the URL is a template (contains a literal
      // "{query}" placeholder), so validate it with that placeholder swapped
      // for a harmless value rather than as a URL directly.
      if (Array.isArray(next.customEngines)) {
        next.customEngines = next.customEngines.filter(
          (engine: any) =>
            engine &&
            typeof engine.id === 'string' &&
            typeof engine.name === 'string' &&
            typeof engine.urlTemplate === 'string' &&
            engine.urlTemplate.includes('{query}') &&
            isSafeUrl(engine.urlTemplate.replace('{query}', 'q'))
        );
      }
      if (Array.isArray(next.hiddenBuiltinEngines)) {
        next.hiddenBuiltinEngines = next.hiddenBuiltinEngines.filter(
          (key: unknown) => typeof key === 'string' && KNOWN_BUILTIN_ENGINES.includes(key)
        );
      }
      return next;
    },
  },

  shortcuts: {
    type: 'shortcuts',
    size: { w: 6, h: 3, minW: 3, minH: 2 },
    createDefaultConfig: (_t, lang) => ({
      items: getRegionalShortcuts(lang),
      columns: 4,
      openInNewTab: true,
      viewMode: 'grid',
    }),
    sanitizeConfig: (config, isSafeUrl) => {
      if (!Array.isArray(config.items)) return config;
      return {
        ...config,
        items: config.items.filter((item: any) => !item || typeof item.url !== 'string' || isSafeUrl(item.url)),
      };
    },
  },

  clock: {
    type: 'clock',
    size: { w: 4, h: 2, minW: 2, minH: 2 },
    createDefaultConfig: () => ({
      style: 'digital',
      showSeconds: true,
      showDate: true,
      is24Hour: true,
    }),
  },

  weather: {
    type: 'weather',
    size: { w: 4, h: 2, minW: 3, minH: 2 },
    createDefaultConfig: (_t, lang) => ({
      ...getRegionalWeatherDefault(lang),
      unit: 'celsius',
      showForecast: true,
    }),
  },

  bookmarks: {
    type: 'bookmarks',
    size: { w: 4, h: 4, minW: 3, minH: 3 },
    createDefaultConfig: () => ({
      viewMode: 'grid',
      showFavicons: true,
      columns: 4,
    }),
  },

  rss: {
    type: 'rss',
    size: { w: 4, h: 4, minW: 3, minH: 3 },
    urlKeys: ['feedUrl'],
    // Pre-1.4 configs have no googleNewsMode: derive it from the keyword
    // they did have, so "technology" keeps searching instead of becoming
    // the front page once the default mode is filled in.
    migrateConfig: (config) =>
      config.isGoogleNews && config.googleNewsMode === undefined
        ? { googleNewsMode: rssService.resolveGoogleNewsMode(config) }
        : {},
    createDefaultConfig: (_t, lang) => ({
      feedUrl: rssService.buildGoogleNewsTopStoriesUrl(lang),
      isGoogleNews: true,
      googleNewsMode: 'headlines',
      searchQuery: '',
      maxItems: 8,
      refreshIntervalMinutes: 30,
      showThumbnail: true,
      showDate: true,
      showDescription: true,
    }),
  },

  pomodoro: {
    type: 'pomodoro',
    size: { w: 4, h: 3, minW: 3, minH: 2 },
    createDefaultConfig: () => ({
      focusDurationMinutes: 25,
      shortBreakDurationMinutes: 5,
      longBreakDurationMinutes: 15,
      autoStartBreaks: false,
    }),
  },

  todo: {
    type: 'todo',
    size: { w: 4, h: 3, minW: 3, minH: 2 },
    createDefaultConfig: (t) => ({
      items: [
        { id: '1', text: t.defaults.todoExplore, completed: false, createdAt: Date.now() },
        { id: '2', text: t.defaults.todoCustomize, completed: true, createdAt: Date.now() - 1000 },
      ],
    }),
  },

  iframe: {
    type: 'iframe',
    size: { w: 6, h: 4, minW: 3, minH: 3 },
    urlKeys: ['url'],
    createDefaultConfig: () => ({
      url: 'https://developer.mozilla.org',
      title: 'MDN Web Docs',
      allowScroll: true,
    }),
  },

  notes: {
    type: 'notes',
    size: { w: 4, h: 4, minW: 3, minH: 2 },
    createDefaultConfig: (t) => ({
      content: t.defaults.notes,
      fontSize: 'base',
      fontFamily: 'sans',
    }),
  },

  quickaccess: {
    type: 'quickaccess',
    size: { w: 4, h: 4, minW: 3, minH: 3 },
    optionalPermissions: ['topSites', 'sessions', 'tabs'],
    createDefaultConfig: () => ({
      defaultView: 'topSites',
      maxItems: 8,
      viewMode: 'list',
      openInNewTab: true,
    }),
  },

  qrcode: {
    type: 'qrcode',
    size: { w: 3, h: 4, minW: 3, minH: 3 },
    createDefaultConfig: () => ({
      mode: 'url',
      value: '',
    }),
  },

  countdown: {
    type: 'countdown',
    size: { w: 3, h: 3, minW: 2, minH: 2 },
    createDefaultConfig: (t) => ({
      // One yearly example so the widget isn't an empty box on first add.
      events: [{ id: 'countdown-newyear', name: t.defaults.countdownNewYear, date: `${new Date().getFullYear() + 1}-01-01`, emoji: '🎍', repeatYearly: true }],
    }),
    sanitizeConfig: (config) => {
      if (!Array.isArray(config.events)) return config;
      return {
        ...config,
        events: config.events.filter(
          (event: any) => event && typeof event.id === 'string' && typeof event.name === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(String(event.date))
        ),
      };
    },
  },

  habits: {
    type: 'habits',
    size: { w: 4, h: 3, minW: 3, minH: 2 },
    createDefaultConfig: (t) => ({
      habits: [
        { id: 'habit-water', name: t.defaults.habitWater, emoji: '💧', history: [], createdAt: Date.now() },
        { id: 'habit-exercise', name: t.defaults.habitExercise, emoji: '🏃', history: [], createdAt: Date.now() - 1 },
        { id: 'habit-read', name: t.defaults.habitRead, emoji: '📖', history: [], createdAt: Date.now() - 2 },
      ],
      showWeek: true,
    }),
    sanitizeConfig: (config) => {
      if (!Array.isArray(config.habits)) return config;
      return {
        ...config,
        habits: config.habits
          .filter((habit: any) => habit && typeof habit.id === 'string' && typeof habit.name === 'string')
          .map((habit: any) => ({
            ...habit,
            history: Array.isArray(habit.history) ? habit.history.filter((d: unknown) => typeof d === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(d)) : [],
          })),
      };
    },
  },
};

export const WIDGET_TYPES = Object.keys(WIDGET_DEFINITIONS) as WidgetType[];

export function getWidgetMeta(type: string): WidgetDefinitionMeta | undefined {
  return (WIDGET_DEFINITIONS as Record<string, WidgetDefinitionMeta>)[type];
}

/**
 * Config keys sanitized for widgets whose type isn't registered (old or
 * corrupted data): the union of every registered widget's URL keys plus
 * the historical generic list, so nothing unsafe slips through.
 */
export const GENERIC_URL_KEYS: string[] = Array.from(
  new Set(['feedUrl', 'url', 'targetUrl', 'iconUrl', ...WIDGET_TYPES.flatMap((type) => WIDGET_DEFINITIONS[type].urlKeys || [])])
);
