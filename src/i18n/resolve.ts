import { en } from './locales/en';

// Store-free half of the i18n layer. `useDashboardStore` imports this to
// localize first-run defaults, so nothing here may import the store back
// (i18n.ts, which owns the `useTranslation` hook, does that instead).

export type SupportedLanguage = 'auto' | 'en' | 'ja' | 'zh-CN' | 'es' | 'fr' | 'de' | 'ko';

export type Translation = typeof en;

/**
 * Every non-English locale is ~35 KB of UI copy that only one of them is
 * ever shown at a time; importing all seven statically (as this module
 * used to) meant every one of them was parsed on every new-tab open,
 * whichever language was actually active. Only `en` is bundled eagerly,
 * as the synchronous fallback; the rest load through this table's
 * `import()` on first use and are cached in `LOCALES` from then on, so
 * Vite/Rollup splits them into their own chunks instead of the main one.
 */
const LOADERS: Partial<Record<string, () => Promise<{ [key: string]: Translation }>>> = {
  ja: () => import('./locales/ja'),
  // `zh` is a bare alias of the same locale some older code/tests read
  // directly — kept so both spellings resolve without a second fetch.
  'zh-CN': () => import('./locales/zh').then((m) => ({ 'zh-CN': m.zh, zh: m.zh })),
  es: () => import('./locales/es'),
  fr: () => import('./locales/fr'),
  de: () => import('./locales/de'),
  ko: () => import('./locales/ko'),
};

/**
 * Loaded locales, `en` always present. Exported mainly for tests, which
 * preload every locale once in `tests/setup.ts` so it behaves like the
 * fully-populated synchronous map this used to be; production code
 * should go through `getTranslation`/`preloadLocale` instead of reading
 * this directly, since a language this tab hasn't needed yet may still
 * be missing from it.
 */
export const LOCALES: Record<string, Translation> = { en };

// One in-flight load per language, so concurrent callers (several
// components mounting the same render) share a single import() instead
// of racing separate dynamic imports.
const pending = new Map<string, Promise<Translation>>();
// Languages whose last load failed. `getTranslation` runs on nearly every
// render, so it must not retry these by itself — that would re-import
// and log an error on every re-render while the chunk is unreachable
// (#83). Only an explicit `ensureLocaleLoaded`/`preloadLocale` (a
// language switch, the next initialisation) tries again.
const failed = new Set<string>();
// Bumped whenever a locale finishes loading, so `useTranslation` knows to
// re-render components that rendered the `en` fallback while it loaded.
let loadVersion = 0;
const listeners = new Set<() => void>();

export function detectBrowserLanguage(): string {
  if (typeof navigator === 'undefined') return 'en';
  const lang = navigator.language || (navigator as any).userLanguage || 'en';

  if (lang.startsWith('ja')) return 'ja';
  if (lang.startsWith('zh')) return 'zh-CN';
  if (lang.startsWith('es')) return 'es';
  if (lang.startsWith('fr')) return 'fr';
  if (lang.startsWith('de')) return 'de';
  if (lang.startsWith('ko')) return 'ko';
  return 'en';
}

export function resolveLanguageCode(languageSetting: SupportedLanguage = 'auto'): string {
  return languageSetting === 'auto' ? detectBrowserLanguage() : languageSetting;
}

export function isLocaleLoaded(code: string): boolean {
  return code in LOCALES;
}

/**
 * Loads a specific locale code (already resolved from 'auto') and caches
 * it, sharing one in-flight import() across concurrent callers. Resolves
 * immediately if already loaded.
 */
export function ensureLocaleLoaded(code: string): Promise<Translation> {
  if (LOCALES[code]) return Promise.resolve(LOCALES[code]);
  const existing = pending.get(code);
  if (existing) return existing;
  failed.delete(code);

  const loader = LOADERS[code];
  const load = !loader
    ? Promise.resolve(en)
    : loader()
        .then((mod) => {
          // A loader may hand back more than one key (zh-CN's bare `zh`
          // alias) — cache all of them, not just the one that was asked for.
          Object.assign(LOCALES, mod);
          const loaded = mod[code] ?? Object.values(mod)[0];
          loadVersion += 1;
          listeners.forEach((fn) => fn());
          return loaded;
        })
        .catch((err) => {
          // Offline install, a corrupted chunk after an update mid-session…
          // `en` is always available, so the dashboard stays usable.
          console.error(`[ZenithTab] Failed to load locale "${code}":`, err);
          failed.add(code);
          return en;
        })
        .finally(() => pending.delete(code));
  pending.set(code, load);
  return load;
}

/** Resolves once the given language setting's locale is loaded (or has failed and fallen back to `en`). */
export function preloadLocale(languageSetting: SupportedLanguage = 'auto'): Promise<Translation> {
  return ensureLocaleLoaded(resolveLanguageCode(languageSetting));
}

export function onLocaleLoaded(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getLocaleLoadVersion(): number {
  return loadVersion;
}

/**
 * Synchronous by design (nearly every component reads `t` mid-render):
 * returns the requested language if already loaded, otherwise `en` and
 * kicks off loading it in the background. `useTranslation` re-renders
 * once that finishes; callers that must not show a transient `en`
 * fallback (store initialisation) should `await preloadLocale(...)` first.
 */
export function getTranslation(languageSetting: SupportedLanguage = 'auto'): Translation {
  const code = resolveLanguageCode(languageSetting);
  const loaded = LOCALES[code];
  if (loaded) return loaded;
  if (!failed.has(code)) void ensureLocaleLoaded(code);
  return LOCALES.en;
}
