import type { DashboardWidget, DashboardPageData, WidgetType, GoogleNewsTopic } from '../../types/widget';
import type { Translation } from '../../i18n/resolve';
import { WIDGET_DEFINITIONS } from '../../components/widgets/widgetDefinitions';
import { createDefaultLayouts } from '../../services/storageService';
import { rssService } from '../../services/rssService';
import { uniqueId } from '../../utils/id';

/**
 * Ready-made page layouts ("Work", "Study", "News", …). A template is a
 * list of widget placements on the 12-column `lg` grid; the widgets
 * themselves are built from the registry's `createDefaultConfig`, so a
 * template never has to know a widget's config shape and always follows
 * the dashboard language. Used by "Add page → From a template" and by the
 * first-run setup's "what will you use this for?" step.
 */

export type PageTemplateId = 'standard' | 'work' | 'study' | 'news' | 'minimal';

export const PAGE_TEMPLATE_IDS: PageTemplateId[] = ['standard', 'work', 'study', 'news', 'minimal'];

interface Placement {
  type: WidgetType;
  x: number;
  y: number;
  w: number;
  h: number;
  /** Overrides merged over the registry default; `lang` is available for URL building. */
  config?: (t: Translation, lang: string) => Record<string, any>;
  /** Title override; defaults to `t.widgets.<type>.title`. */
  title?: (t: Translation) => string;
}

interface PageTemplate {
  id: PageTemplateId;
  /** Lucide icon name, resolved by the picker (kept React-free here). */
  icon: 'layout-dashboard' | 'briefcase' | 'graduation-cap' | 'newspaper' | 'minus';
  placements: Placement[];
}

const newsTopic =
  (topic: GoogleNewsTopic) =>
  (_t: Translation, lang: string): Record<string, any> => ({
    isGoogleNews: true,
    googleNewsMode: 'topic',
    googleNewsTopic: topic,
    feedUrl: rssService.buildGoogleNewsTopicUrl(topic, lang),
  });

const TEMPLATES: Record<PageTemplateId, PageTemplate> = {
  // Mirrors the out-of-the-box dashboard (createDefaultWidgets).
  standard: {
    id: 'standard',
    icon: 'layout-dashboard',
    placements: [
      { type: 'search', x: 2, y: 0, w: 8, h: 1 },
      { type: 'clock', x: 0, y: 1, w: 4, h: 2 },
      { type: 'weather', x: 4, y: 1, w: 4, h: 2 },
      { type: 'pomodoro', x: 8, y: 1, w: 4, h: 2 },
      { type: 'bookmarks', x: 0, y: 3, w: 4, h: 4 },
      { type: 'rss', x: 4, y: 3, w: 4, h: 4, title: (t) => t.defaults.newsTitle },
      { type: 'todo', x: 8, y: 3, w: 4, h: 4 },
      { type: 'notes', x: 0, y: 7, w: 4, h: 4 },
    ],
  },
  work: {
    id: 'work',
    icon: 'briefcase',
    placements: [
      { type: 'search', x: 2, y: 0, w: 8, h: 1 },
      { type: 'clock', x: 0, y: 1, w: 4, h: 2 },
      { type: 'weather', x: 4, y: 1, w: 4, h: 2 },
      { type: 'pomodoro', x: 8, y: 1, w: 4, h: 2 },
      { type: 'calendar', x: 0, y: 3, w: 4, h: 4 },
      { type: 'todo', x: 4, y: 3, w: 4, h: 4, config: () => ({ items: [] }) },
      { type: 'notes', x: 8, y: 3, w: 4, h: 4, config: () => ({ content: '' }) },
      { type: 'shortcuts', x: 0, y: 7, w: 12, h: 3 },
    ],
  },
  study: {
    id: 'study',
    icon: 'graduation-cap',
    placements: [
      { type: 'search', x: 2, y: 0, w: 8, h: 1 },
      { type: 'pomodoro', x: 0, y: 1, w: 4, h: 3 },
      { type: 'todo', x: 4, y: 1, w: 4, h: 3, config: () => ({ items: [] }) },
      { type: 'habits', x: 8, y: 1, w: 4, h: 3 },
      { type: 'notes', x: 0, y: 4, w: 6, h: 4, config: () => ({ content: '' }) },
      { type: 'countdown', x: 6, y: 4, w: 3, h: 4 },
      { type: 'clock', x: 9, y: 4, w: 3, h: 4 },
    ],
  },
  news: {
    id: 'news',
    icon: 'newspaper',
    placements: [
      { type: 'search', x: 2, y: 0, w: 8, h: 1 },
      { type: 'clock', x: 0, y: 1, w: 4, h: 2 },
      { type: 'weather', x: 4, y: 1, w: 4, h: 2 },
      { type: 'rss', x: 8, y: 1, w: 4, h: 6, title: (t) => t.widgets.rss.topics.TECHNOLOGY, config: newsTopic('TECHNOLOGY') },
      { type: 'rss', x: 0, y: 3, w: 4, h: 4, title: (t) => t.defaults.newsTitle },
      { type: 'rss', x: 4, y: 3, w: 4, h: 4, title: (t) => t.widgets.rss.topics.BUSINESS, config: newsTopic('BUSINESS') },
    ],
  },
  minimal: {
    id: 'minimal',
    icon: 'minus',
    placements: [
      { type: 'clock', x: 4, y: 0, w: 4, h: 2, config: () => ({ style: 'minimal', showSeconds: false }) },
      { type: 'search', x: 2, y: 2, w: 8, h: 1 },
      { type: 'shortcuts', x: 2, y: 3, w: 8, h: 3 },
    ],
  },
};

export function getPageTemplate(id: PageTemplateId): PageTemplate {
  return TEMPLATES[id];
}

/** Widget types a template places, in order and without duplicates (for the picker's summary). */
export function templateWidgetTypes(id: PageTemplateId): WidgetType[] {
  return Array.from(new Set(TEMPLATES[id].placements.map((p) => p.type)));
}

/**
 * Builds the widgets and layouts for a template in the given language.
 * Ids are always fresh so a template can be added next to existing pages
 * without colliding with them.
 */
export function buildTemplatePage(id: PageTemplateId, t: Translation, lang: string): DashboardPageData {
  const widgets: DashboardWidget[] = TEMPLATES[id].placements.map((p) => {
    const meta = WIDGET_DEFINITIONS[p.type];
    const widgetId = uniqueId(`widget-${p.type}`);
    return {
      id: widgetId,
      type: p.type,
      title: p.title ? p.title(t) : t.widgets[p.type].title,
      config: { ...meta.createDefaultConfig(t, lang), ...(p.config ? p.config(t, lang) : {}) },
      layout: { i: widgetId, x: p.x, y: p.y, w: p.w, h: p.h, minW: meta.size.minW, minH: meta.size.minH },
    };
  });
  return { widgets, layouts: createDefaultLayouts(widgets) };
}
