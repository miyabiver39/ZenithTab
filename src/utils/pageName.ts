import { DashboardPageMeta } from '../types/widget';
import type { Translation } from '../i18n/resolve';

/**
 * Display name for a dashboard page. Pages the user never renamed are stored
 * with an empty `name` and shown as the localized "Page N" for their current
 * position, so the label follows the language setting and renumbers itself
 * when earlier pages are removed. (Installs from before 1.3.3 stored a
 * literal "Page N"; those keep it until renamed.)
 */
export function getPageDisplayName(page: DashboardPageMeta, index: number, t: Translation): string {
  return page.name || t.pages.defaultName.replace('{n}', String(index + 1));
}
