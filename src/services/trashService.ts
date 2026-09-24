import { Layout } from 'react-grid-layout';
import {
  DashboardWidget,
  DashboardPageMeta,
  DashboardPageData,
  ResponsiveLayouts,
  GridBreakpoint,
  TrashEntry,
  TrashedWidget,
  TrashedPage,
} from '../types/widget';
import { GRID_COLS, GRID_BREAKPOINT_KEYS } from '../config/grid';
import { uniqueId } from '../utils/id';
import { sanitizePages } from '../utils/settingsSanitizers';

/**
 * The trash: deleted widgets and pages, kept so they can be restored from
 * the settings panel after the undo toast has long gone.
 *
 * Entries are pure data (no closures), persisted under STORAGE_KEYS.TRASH
 * and exported with the rest of the dashboard. They expire after
 * TRASH_RETENTION_MS and the list is capped at MAX_TRASH_ENTRIES; both
 * are enforced by `pruneTrash`, which the store runs at start-up.
 */
export const TRASH_RETENTION_MS = 30 * 24 * 60 * 60 * 1000;
export const MAX_TRASH_ENTRIES = 50;

export function createTrashedWidget(
  widget: DashboardWidget,
  layouts: Partial<Record<GridBreakpoint, Layout>>,
  sourcePageId: string,
  sourcePageName: string,
  now = Date.now()
): TrashedWidget {
  return { id: uniqueId('trash'), kind: 'widget', deletedAt: now, widget, layouts, sourcePageId, sourcePageName };
}

export function createTrashedPage(pageMeta: DashboardPageMeta, pageData: DashboardPageData, now = Date.now()): TrashedPage {
  return { id: uniqueId('trash'), kind: 'page', deletedAt: now, pageMeta, pageData };
}

/** Drops expired entries and, beyond the cap, the oldest ones. Returns the same array when nothing changed. */
export function pruneTrash(entries: TrashEntry[], now = Date.now()): TrashEntry[] {
  const kept = entries.filter((e) => now - e.deletedAt < TRASH_RETENTION_MS);
  const capped = kept.length > MAX_TRASH_ENTRIES
    ? [...kept].sort((a, b) => b.deletedAt - a.deletedAt).slice(0, MAX_TRASH_ENTRIES)
    : kept;
  return capped.length === entries.length ? entries : capped;
}

/** Only entries with the shape the code expects survive a read from storage or an import. */
export function sanitizeTrash(raw: unknown): TrashEntry[] {
  if (!Array.isArray(raw)) return [];
  const entries = raw.filter((e): e is TrashEntry => {
    if (!e || typeof e !== 'object' || typeof e.id !== 'string' || typeof e.deletedAt !== 'number') return false;
    if (e.kind === 'widget') {
      return !!e.widget && typeof e.widget.id === 'string' && typeof e.widget.type === 'string' && typeof e.sourcePageId === 'string';
    }
    if (e.kind === 'page') {
      return !!e.pageMeta && typeof e.pageMeta.id === 'string' && !!e.pageData && Array.isArray(e.pageData.widgets);
    }
    return false;
  });
  // A restored page's meta goes straight into the tab strip, so it gets
  // the same check as the page list itself (#79): a non-string name would
  // crash the dashboard the moment the page is restored.
  return entries.flatMap((e): TrashEntry[] => {
    if (e.kind !== 'page') return [e];
    const [pageMeta] = sanitizePages([e.pageMeta]);
    return pageMeta ? [{ ...e, pageMeta }] : [];
  });
}

const overlaps = (a: Layout, b: Layout) =>
  a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;

/** First row below everything on the breakpoint. Always a finite number (see #20 for why that matters). */
function bottomRow(list: Layout[]): number {
  let bottom = 0;
  for (const l of list) {
    const end = (Number.isFinite(l.y) ? l.y : 0) + (Number.isFinite(l.h) ? l.h : 1);
    if (end > bottom) bottom = end;
  }
  return bottom;
}

/**
 * Where a restored widget goes on one breakpoint: its old slot if that is
 * still free, otherwise a fresh row at the bottom (left-aligned, width
 * clamped to the breakpoint's columns).
 */
export function placeRestoredLayout(
  existing: Layout[],
  widgetId: string,
  saved: Layout | undefined,
  fallback: Layout,
  cols: number
): Layout {
  const wanted: Layout = { ...(saved || fallback), i: widgetId };
  const w = Math.max(1, Math.min(wanted.w || 1, cols));
  const candidate: Layout = { ...wanted, w, x: Math.min(Math.max(0, wanted.x || 0), cols - w), y: Math.max(0, wanted.y || 0) };
  const others = existing.filter((l) => l.i !== widgetId);
  if (Number.isFinite(candidate.y) && !others.some((l) => overlaps(candidate, l))) return candidate;
  return { ...candidate, x: 0, y: bottomRow(others) };
}

/** Layouts for every breakpoint with `widget` placed via placeRestoredLayout. */
export function layoutsWithRestoredWidget(
  layouts: ResponsiveLayouts,
  widget: DashboardWidget,
  saved: Partial<Record<GridBreakpoint, Layout>>
): ResponsiveLayouts {
  const next = { ...layouts } as ResponsiveLayouts;
  for (const bp of GRID_BREAKPOINT_KEYS) {
    const list = (layouts[bp] || []).filter((l) => l.i !== widget.id);
    next[bp] = [...list, placeRestoredLayout(list, widget.id, saved[bp], widget.layout, GRID_COLS[bp])];
  }
  return next;
}

/** Re-ids a trashed widget (and its saved layouts) when its id is already in use again. */
export function withFreshWidgetId(entry: TrashedWidget, id: string): TrashedWidget {
  const layouts: Partial<Record<GridBreakpoint, Layout>> = {};
  for (const bp of GRID_BREAKPOINT_KEYS) {
    const l = entry.layouts[bp];
    if (l) layouts[bp] = { ...l, i: id };
  }
  return { ...entry, widget: { ...entry.widget, id, layout: { ...entry.widget.layout, i: id } }, layouts };
}
