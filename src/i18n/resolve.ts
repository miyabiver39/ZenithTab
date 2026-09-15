import { en } from './locales/en';
import { ja } from './locales/ja';
import { zh } from './locales/zh';
import { es } from './locales/es';
import { fr } from './locales/fr';
import { de } from './locales/de';
import { ko } from './locales/ko';

// Store-free half of the i18n layer. `useDashboardStore` imports this to
// localize first-run defaults, so nothing here may import the store back
// (i18n.ts, which owns the `useTranslation` hook, does that instead).

export type SupportedLanguage = 'auto' | 'en' | 'ja' | 'zh-CN' | 'es' | 'fr' | 'de' | 'ko';

export type Translation = typeof en;

export const LOCALES: Record<string, Translation> = {
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

export function resolveLanguageCode(languageSetting: SupportedLanguage = 'auto'): string {
  return languageSetting === 'auto' ? detectBrowserLanguage() : languageSetting;
}

export function getTranslation(languageSetting: SupportedLanguage = 'auto'): Translation {
  return LOCALES[resolveLanguageCode(languageSetting)] || LOCALES.en;
}
