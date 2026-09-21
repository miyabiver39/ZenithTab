import type { DashboardWidget, DashboardPageData, TodoItem, CountdownEvent } from '../types/widget';
import type { ICalEvent } from './icalParser';
import { expandOccurrences } from './icalParser';
import { daysUntil } from './countdown';

/**
 * The one-line "today" digest in the header: events today, open tasks and
 * the nearest countdown, gathered from every page's widgets so the digest
 * is true for the whole dashboard, not just the page on screen.
 */
export interface TodaySummary {
  /** Calendar occurrences overlapping today (undefined = no calendar widget). */
  events?: number;
  /** Uncompleted tasks across all Task widgets (undefined = no task widget). */
  openTasks?: number;
  /** The closest upcoming countdown, if any. */
  nextCountdown?: { name: string; days: number };
}

/** Every widget on every page, the active page taken from its live mirror. */
export function allWidgets(pageData: Record<string, DashboardPageData>, activePageId: string, activeWidgets: DashboardWidget[]): DashboardWidget[] {
  const out: DashboardWidget[] = [];
  for (const [pageId, page] of Object.entries(pageData)) {
    if (pageId === activePageId) continue;
    out.push(...(page?.widgets || []));
  }
  out.push(...activeWidgets);
  return out;
}

/** Calendar feed URLs referenced by any calendar widget, de-duplicated. */
export function calendarFeedUrls(widgets: DashboardWidget[]): string[] {
  const urls = new Set<string>();
  for (const w of widgets) {
    if (w.type !== 'calendar') continue;
    for (const feed of (w.config.feeds || []) as { url?: string }[]) {
      if (feed?.url) urls.add(feed.url);
    }
  }
  return Array.from(urls);
}

export function countTodayEvents(events: ICalEvent[], now = new Date()): number {
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const end = new Date(start.getFullYear(), start.getMonth(), start.getDate() + 1);
  return expandOccurrences(events, start, end).length;
}

export function computeTodaySummary(widgets: DashboardWidget[], events: ICalEvent[] | null, now = new Date()): TodaySummary {
  const summary: TodaySummary = {};

  const todos = widgets.filter((w) => w.type === 'todo');
  if (todos.length > 0) {
    summary.openTasks = todos.reduce((n, w) => n + ((w.config.items || []) as TodoItem[]).filter((item) => item && !item.completed).length, 0);
  }

  let best: { name: string; days: number } | undefined;
  for (const w of widgets) {
    if (w.type !== 'countdown') continue;
    for (const event of (w.config.events || []) as CountdownEvent[]) {
      const days = daysUntil(event, now);
      if (days === null || days < 0) continue;
      if (!best || days < best.days) best = { name: event.name, days };
    }
  }
  if (best) summary.nextCountdown = best;

  if (widgets.some((w) => w.type === 'calendar') && events) {
    summary.events = countTodayEvents(events, now);
  }

  return summary;
}

/** True when there is nothing worth a line. */
export function isEmptySummary(summary: TodaySummary): boolean {
  return !summary.events && !summary.openTasks && !summary.nextCountdown;
}
