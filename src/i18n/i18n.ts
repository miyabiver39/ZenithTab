import { useDashboardStore } from '../store/useDashboardStore';
import { getTranslation, resolveLanguageCode } from './resolve';

export { LOCALES, detectBrowserLanguage, getTranslation, resolveLanguageCode } from './resolve';
export type { SupportedLanguage, Translation } from './resolve';

export function useTranslation() {
  const { appearance } = useDashboardStore();
  const currentLang = appearance.language || 'auto';
  const t = getTranslation(currentLang);
  const activeLanguageCode = resolveLanguageCode(currentLang);

  return {
    t,
    currentLanguage: currentLang,
    activeLanguageCode,
  };
}
