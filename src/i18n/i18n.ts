import { useDashboardStore } from '../store/useDashboardStore';
import { getTranslation, resolveLanguageCode } from './resolve';

export { LOCALES, detectBrowserLanguage, getTranslation, resolveLanguageCode } from './resolve';
export type { SupportedLanguage, Translation } from './resolve';

export function useTranslation() {
  // Subscribe to the language only: this hook is called by nearly every
  // component, so re-rendering on any store change was a page-wide cost.
  const currentLang = useDashboardStore((s) => s.appearance.language || 'auto');
  const t = getTranslation(currentLang);
  const activeLanguageCode = resolveLanguageCode(currentLang);

  return {
    t,
    currentLanguage: currentLang,
    activeLanguageCode,
  };
}
