import type { Translation } from '../i18n/resolve';

/**
 * Localized label for an Open-Meteo / WMO weather code. The service keeps
 * an English `condition` string in its cache; the widget re-derives the
 * label from the code so it follows the dashboard language instead.
 */
export function getWeatherConditionLabel(code: number, t: Translation, fallback = ''): string {
  const conditions = t.widgets.weather.conditions as Record<string, string>;
  return conditions[String(code)] || fallback || conditions['0'];
}
