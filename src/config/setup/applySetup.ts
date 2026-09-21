import type { DashboardPageData, GoogleNewsTopic, ShortcutItem } from '../../types/widget';
import type { DockItem } from '../../types/settings';
import type { Translation } from '../../i18n/resolve';
import { buildTemplatePage, type PageTemplateId } from '../templates/pageTemplates';
import { rssService } from '../../services/rssService';
import { getSiteCatalog, SITE_CATEGORY_LABELS, type SiteCategoryKey } from '../catalog/siteCatalog';
import { getRegionalDockItems, resolvePresetLanguage, shortcutFromSite } from '../defaults/regionalPresets';

/**
 * Turns the first-run wizard's answers into a dashboard. Pure: the store
 * persists whatever comes back. Skipped steps arrive as the defaults
 * below, which reproduce the stock dashboard.
 */
export interface SetupChoices {
  /** News topics the user ticked; empty = keep the stock top-stories feed. */
  interests: GoogleNewsTopic[];
  /** "What will you use this for?" → page template. */
  purpose: PageTemplateId;
}

export const DEFAULT_SETUP_CHOICES: SetupChoices = { interests: [], purpose: 'standard' };

export const SETUP_INTERESTS: GoogleNewsTopic[] = ['WORLD', 'BUSINESS', 'TECHNOLOGY', 'ENTERTAINMENT', 'SPORTS', 'SCIENCE', 'HEALTH'];

/** Extra shortcut tiles worth adding for an interest (catalog category keys). */
const INTEREST_SITE_CATEGORIES: Partial<Record<GoogleNewsTopic, SiteCategoryKey[]>> = {
  TECHNOLOGY: ['ai'],
  ENTERTAINMENT: ['video'],
  BUSINESS: ['money'],
  SCIENCE: ['learn'],
  WORLD: ['news'],
};

const MAX_EXTRA_SHORTCUTS_PER_INTEREST = 3;

export interface SetupResult {
  page: DashboardPageData;
  dockItems: DockItem[];
}

export function buildSetupResult(choices: SetupChoices, t: Translation, lang: string): SetupResult {
  const page = buildTemplatePage(choices.purpose, t, lang);
  const region = resolvePresetLanguage(lang);
  const topics = choices.interests;

  // News: every Google News feed the template placed takes a chosen topic,
  // in order (the News template has three, Standard has one). No interests
  // → the template's own headline / topic feeds stay as they are.
  if (topics.length > 0) {
    page.widgets
      .filter((w) => w.type === 'rss' && w.config.isGoogleNews)
      .forEach((widget, index) => {
        const topic = topics[index % topics.length];
        widget.config = {
          ...widget.config,
          googleNewsMode: 'topic',
          googleNewsTopic: topic,
          searchQuery: '',
          feedUrl: rssService.buildGoogleNewsTopicUrl(topic, lang),
        };
        widget.title = t.widgets.rss.topics[topic];
      });
  }

  // Shortcuts: a few catalog sites per interest on top of the regional defaults.
  const shortcuts = page.widgets.find((w) => w.type === 'shortcuts');
  if (shortcuts && topics.length > 0) {
    const labels = SITE_CATEGORY_LABELS[region];
    const catalog = getSiteCatalog(region);
    const existing: ShortcutItem[] = shortcuts.config.items || [];
    const seen = new Set(existing.map((item) => item.url));
    const extra: ShortcutItem[] = [];
    for (const topic of topics) {
      for (const key of INTEREST_SITE_CATEGORIES[topic] || []) {
        catalog
          .filter((site) => site.category === labels[key] && !seen.has(site.url))
          .slice(0, MAX_EXTRA_SHORTCUTS_PER_INTEREST)
          .forEach((site) => {
            seen.add(site.url);
            extra.push(shortcutFromSite(site));
          });
      }
    }
    shortcuts.config = { ...shortcuts.config, items: [...existing, ...extra] };
  }

  return { page, dockItems: getRegionalDockItems(lang) };
}
