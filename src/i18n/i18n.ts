import { useSyncExternalStore } from 'react';
import { useDashboardStore } from '../store/useDashboardStore';
import { getTranslation, resolveLanguageCode, onLocaleLoaded, getLocaleLoadVersion } from './resolve';

export { LOCALES, detectBrowserLanguage, getTranslation, resolveLanguageCode, preloadLocale, isLocaleLoaded } from './resolve';
export type { SupportedLanguage, Translation } from './resolve';

export function useTranslation() {
  // Subscribe to the language only: this hook is called by nearly every
  // component, so re-rendering on any store change was a page-wide cost.
  const currentLang = useDashboardStore((s) => s.appearance.language || 'auto');

  // By the time the dashboard renders at all, `initialize()` has already
  // awaited loading the active language (see persistenceSlice.ts), so
  // this is a plain cache read in the overwhelmingly common case. The
  // subscription only matters right after a language switch: it re-runs
  // this hook once that language's chunk finishes loading, so components
  // move off the transient `en` fallback without needing a manual re-render.
  useSyncExternalStore(onLocaleLoaded, getLocaleLoadVersion, getLocaleLoadVersion);

  const t = getTranslation(currentLang);
  const activeLanguageCode = resolveLanguageCode(currentLang);

  return {
    t,
    currentLanguage: currentLang,
    activeLanguageCode,
  };
}
