import { en } from './locales/en';
import { ja } from './locales/ja';
import { zh } from './locales/zh';
import { es } from './locales/es';
import { fr } from './locales/fr';
import { de } from './locales/de';
import { ko } from './locales/ko';
import { useDashboardStore } from '../store/useDashboardStore';

export type SupportedLanguage = 'auto' | 'en' | 'ja' | 'zh-CN' | 'es' | 'fr' | 'de' | 'ko';

export const LOCALES: Record<string, typeof en> = {
  en,
  ja,
  'zh-CN': zh,
  zh,
  es,
  fr,
  de,
  ko,
};

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

export function getTranslation(languageSetting: SupportedLanguage = 'auto'): typeof en {
  let langKey = languageSetting === 'auto' ? detectBrowserLanguage() : languageSetting;
  return LOCALES[langKey] || LOCALES.en;
}

export function useTranslation() {
  const { appearance } = useDashboardStore();
  const currentLang = appearance.language || 'auto';
  const t = getTranslation(currentLang);
  const activeLanguageCode = currentLang === 'auto' ? detectBrowserLanguage() : currentLang;

  return {
    t,
    currentLanguage: currentLang,
    activeLanguageCode,
  };
}
