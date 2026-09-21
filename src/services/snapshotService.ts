import { storageGet, storageSet, storageRemove } from '../utils/storage';
import { STORAGE_KEYS, USER_DATA_KEYS } from './storageKeys';
import { CURRENT_SCHEMA_VERSION, EXPORT_FIELD_BY_KEY } from './migrations';
import { storageService, currentVersion } from './storageService';
import { uniqueId } from '../utils/id';
import type { DashboardWidget, ResponsiveLayouts, DashboardPageMeta, DashboardPageData } from '../types/widget';
import type { WallpaperSettings, AppearanceSettings, DockItem, KeyboardShortcutBinding } from '../types/settings';

/**
 * Whole-dashboard snapshots — the last line of defence after undo (seconds)
 * and the trash (individual widgets/pages, 30 days).
 *
 * A snapshot is the user-data keys as they were at one moment, kept under
 * STORAGE_KEYS.SNAPSHOTS. They are taken:
 * - automatically, of the state *before* the first change after a quiet
 *   half hour (so "the dashboard as it was before I started fiddling" is
 *   always one restore away),
 * - just before anything that replaces the dashboard wholesale (reset,
 *   import, restoring another snapshot),
 * - on request from the settings panel.
 * Restoring goes through the same import pipeline as a config file, so an
 * old snapshot is migrated and sanitized like any other outside data.
 */

export type SnapshotReason = 'auto' | 'manual' | 'before-reset' | 'before-import' | 'before-restore' | 'before-migration';

export interface SnapshotSummary {
  pages: number;
  widgets: number;
  dockItems: number;
  /** JSON size of `data`, for the list and the total-size cap. */
  bytes: number;
}

/** What the settings panel lists; `data` is loaded only when restoring. */
export interface SnapshotMeta {
  id: string;
  takenAt: number;
  reason: SnapshotReason;
  appVersion: string;
  schemaVersion: number;
  summary: SnapshotSummary;
}

export interface DashboardSnapshot extends SnapshotMeta {
  data: Record<string, unknown>;
  /** Dotted paths (from the storage key) whose data: URL was left out; see stripDataUrls. */
  omitted?: string[];
}

export interface BackupSettings {
  autoSnapshot: boolean;
  /** Sync appearance / Dock / keyboard shortcuts via chrome.storage.sync (services/syncService.ts). Absent = off. */
  syncSettings?: boolean;
}

export const DEFAULT_BACKUP_SETTINGS: BackupSettings = { autoSnapshot: true };

/** How many of each reason to keep (oldest dropped first). */
export const SNAPSHOT_RETENTION: Record<Exclude<SnapshotReason, 'before-migration'>, number> = {
  auto: 10,
  manual: 5,
  'before-reset': 3,
  'before-import': 3,
  'before-restore': 3,
};

/** A new auto snapshot is only taken this long after the previous one. */
export const AUTO_SNAPSHOT_MIN_INTERVAL_MS = 30 * 60 * 1000;

/** Total `data` size across snapshots before the oldest automatic ones go. */
export const MAX_SNAPSHOT_TOTAL_BYTES = 20 * 1024 * 1024;

/** data: URLs longer than this are left out of a snapshot (custom wallpapers run to megabytes). */
export const DATA_URL_OMIT_THRESHOLD = 256;

/** Keys a snapshot covers: the user data minus the trash, which has its own lifecycle. */
export const SNAPSHOT_KEYS: string[] = USER_DATA_KEYS.filter((key) => key !== STORAGE_KEYS.TRASH);

// --- Data shaping ---------------------------------------------------------

/** The store slices a snapshot is built from (no dependency on the store itself). */
export interface SnapshotSource {
  pages: DashboardPageMeta[];
  activePageId: string;
  pageData: Record<string, DashboardPageData>;
  widgets: DashboardWidget[];
  layouts: ResponsiveLayouts;
  wallpaper: WallpaperSettings;
  appearance: AppearanceSettings;
  dockItems: DockItem[];
  keyboardShortcuts: KeyboardShortcutBinding[];
}

/** Storage-key → value map for the given state, with the active page's live mirror folded in. */
export function snapshotDataFromState(state: SnapshotSource): Record<string, unknown> {
  const pageData = { ...state.pageData, [state.activePageId]: { widgets: state.widgets, layouts: state.layouts } };
  return {
    [STORAGE_KEYS.WIDGETS]: state.widgets,
    [STORAGE_KEYS.LAYOUTS]: state.layouts,
    [STORAGE_KEYS.WALLPAPER]: state.wallpaper,
    [STORAGE_KEYS.APPEARANCE]: state.appearance,
    [STORAGE_KEYS.DOCK_ITEMS]: state.dockItems,
    [STORAGE_KEYS.KEYBOARD_SHORTCUTS]: state.keyboardShortcuts,
    [STORAGE_KEYS.PAGES]: state.pages,
    [STORAGE_KEYS.ACTIVE_PAGE_ID]: state.activePageId,
    [STORAGE_KEYS.PAGE_DATA]: pageData,
  };
}

/** The same map read straight from storage (used for the pre-migration backups). */
export async function snapshotDataFromStorage(): Promise<Record<string, unknown>> {
  const data: Record<string, unknown> = {};
  for (const key of SNAPSHOT_KEYS) {
    const value = await storageGet(key);
    if (value !== undefined) data[key] = value;
  }
  return data;
}

const isBigDataUrl = (value: unknown): value is string =>
  typeof value === 'string' && value.startsWith('data:') && value.length > DATA_URL_OMIT_THRESHOLD;

/**
 * Deep-copies `data` without its large data: URLs (a custom wallpaper is
 * an image baked into the settings, easily several MB — ten snapshots of
 * it would dwarf everything else). The paths are recorded so a restore
 * can keep whatever image is current instead of blanking it.
 */
export function stripDataUrls(data: Record<string, unknown>): { data: Record<string, unknown>; omitted: string[] } {
  const omitted: string[] = [];
  const walk = (value: unknown, path: string): unknown => {
    if (isBigDataUrl(value)) {
      omitted.push(path);
      return undefined;
    }
    if (Array.isArray(value)) return value.map((item, i) => walk(item, `${path}.${i}`));
    if (value && typeof value === 'object') {
      const out: Record<string, unknown> = {};
      for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
        const walked = walk(v, path ? `${path}.${k}` : k);
        if (walked !== undefined) out[k] = walked;
      }
      return out;
    }
    return value;
  };
  return { data: walk(data, '') as Record<string, unknown>, omitted };
}

export function getPath(obj: unknown, path: string[]): unknown {
  let cur: any = obj;
  for (const seg of path) {
    if (cur === null || cur === undefined) return undefined;
    cur = cur[seg];
  }
  return cur;
}

export function setPath(obj: any, path: string[], value: unknown): void {
  let cur = obj;
  for (let i = 0; i < path.length - 1; i++) {
    const seg = path[i];
    if (cur[seg] === null || typeof cur[seg] !== 'object') cur[seg] = {};
    cur = cur[seg];
  }
  cur[path[path.length - 1]] = value;
}

export function summarize(data: Record<string, unknown>): SnapshotSummary {
  const pageData = (data[STORAGE_KEYS.PAGE_DATA] as Record<string, DashboardPageData> | undefined) || {};
  const pages = (data[STORAGE_KEYS.PAGES] as DashboardPageMeta[] | undefined) || [];
  const widgets = Object.values(pageData).reduce((n, p) => n + (p?.widgets?.length || 0), 0)
    || ((data[STORAGE_KEYS.WIDGETS] as DashboardWidget[] | undefined) || []).length;
  return {
    pages: pages.length || (Object.keys(pageData).length ? Object.keys(pageData).length : 1),
    widgets,
    dockItems: ((data[STORAGE_KEYS.DOCK_ITEMS] as DockItem[] | undefined) || []).length,
    bytes: JSON.stringify(data).length,
  };
}

const sameData = (a: Record<string, unknown>, b: Record<string, unknown>) => JSON.stringify(a) === JSON.stringify(b);

/** Snapshot → the export-file shape importDashboardData understands. */
export function snapshotToExport(snapshot: DashboardSnapshot): Record<string, unknown> {
  const out: Record<string, unknown> = {
    version: snapshot.appVersion,
    schemaVersion: snapshot.schemaVersion,
    exportedAt: new Date(snapshot.takenAt).toISOString(),
  };
  for (const [key, value] of Object.entries(snapshot.data)) {
    out[EXPORT_FIELD_BY_KEY[key] ?? key] = value;
  }
  return out;
}

// --- Retention ------------------------------------------------------------

/** Applies per-reason counts and the total-size cap. Never touches `keepId`. */
export function pruneSnapshots(list: DashboardSnapshot[], keepId?: string): DashboardSnapshot[] {
  const byNewest = [...list].sort((a, b) => b.takenAt - a.takenAt);
  const seen: Partial<Record<SnapshotReason, number>> = {};
  let kept = byNewest.filter((s) => {
    if (s.id === keepId) return true;
    if (s.reason === 'before-migration') return true;
    const count = (seen[s.reason] || 0) + 1;
    seen[s.reason] = count;
    return count <= SNAPSHOT_RETENTION[s.reason];
  });

  let total = kept.reduce((n, s) => n + s.summary.bytes, 0);
  // Oldest automatic ones first, then the oldest of anything else.
  const candidates = () => [...kept].reverse().filter((s) => s.id !== keepId);
  while (total > MAX_SNAPSHOT_TOTAL_BYTES) {
    const victim = candidates().find((s) => s.reason === 'auto') || candidates()[0];
    if (!victim) break;
    kept = kept.filter((s) => s.id !== victim.id);
    total -= victim.summary.bytes;
  }
  return kept;
}

// --- Storage --------------------------------------------------------------

async function readAll(): Promise<DashboardSnapshot[]> {
  const raw = await storageGet<DashboardSnapshot[]>(STORAGE_KEYS.SNAPSHOTS, []);
  return Array.isArray(raw)
    ? raw.filter((s) => s && typeof s.id === 'string' && typeof s.takenAt === 'number' && s.data && typeof s.data === 'object')
    : [];
}

async function writeAll(list: DashboardSnapshot[]): Promise<void> {
  await storageSet(STORAGE_KEYS.SNAPSHOTS, list);
}

const MIGRATION_ID_PREFIX = 'migration-v';

/**
 * The `backup_before_v<N>` keys the migration pipeline writes, presented
 * as snapshots so they show up in the same list and restore the same way.
 */
async function readMigrationBackups(): Promise<DashboardSnapshot[]> {
  const out: DashboardSnapshot[] = [];
  for (let v = 2; v <= CURRENT_SCHEMA_VERSION; v++) {
    const backup = await storageGet<{ takenAt: number; fromVersion: number; data: Record<string, unknown> }>(`backup_before_v${v}`);
    if (!backup || !backup.data) continue;
    const data: Record<string, unknown> = {};
    for (const key of SNAPSHOT_KEYS) if (backup.data[key] !== undefined) data[key] = backup.data[key];
    out.push({
      id: `${MIGRATION_ID_PREFIX}${v}`,
      takenAt: backup.takenAt,
      reason: 'before-migration',
      appVersion: '',
      schemaVersion: backup.fromVersion,
      summary: summarize(data),
      data,
    });
  }
  return out;
}

const toMeta = ({ id, takenAt, reason, appVersion, schemaVersion, summary }: DashboardSnapshot): SnapshotMeta => ({
  id,
  takenAt,
  reason,
  appVersion,
  schemaVersion,
  summary,
});

let autoInFlight: Promise<DashboardSnapshot | null> | null = null;

export const snapshotService = {
  async getSettings(): Promise<BackupSettings> {
    const stored = await storageGet<Partial<BackupSettings>>(STORAGE_KEYS.BACKUP_SETTINGS, undefined);
    return { ...DEFAULT_BACKUP_SETTINGS, ...(stored || {}) };
  },

  async saveSettings(settings: BackupSettings): Promise<void> {
    await storageSet(STORAGE_KEYS.BACKUP_SETTINGS, settings);
  },

  /** Newest first, migration backups included. */
  async list(): Promise<SnapshotMeta[]> {
    const all = [...(await readAll()), ...(await readMigrationBackups())];
    return all.sort((a, b) => b.takenAt - a.takenAt).map(toMeta);
  },

  async get(id: string): Promise<DashboardSnapshot | null> {
    if (id.startsWith(MIGRATION_ID_PREFIX)) {
      return (await readMigrationBackups()).find((s) => s.id === id) || null;
    }
    return (await readAll()).find((s) => s.id === id) || null;
  },

  /**
   * Stores a snapshot of `source` unless the newest stored one already has
   * exactly this content (a reset right after a restore, two tabs
   * reacting to one change…). Returns what was stored, or null.
   */
  async take(reason: SnapshotReason, source: Record<string, unknown>, now = Date.now()): Promise<DashboardSnapshot | null> {
    const { data, omitted } = stripDataUrls(source);
    const existing = await readAll();
    const newest = [...existing].sort((a, b) => b.takenAt - a.takenAt)[0];
    if (newest && sameData(newest.data, data)) return null;

    const snapshot: DashboardSnapshot = {
      id: uniqueId('snap'),
      takenAt: now,
      reason,
      appVersion: currentVersion(),
      schemaVersion: CURRENT_SCHEMA_VERSION,
      summary: summarize(data),
      data,
      omitted: omitted.length ? omitted : undefined,
    };
    await writeAll(pruneSnapshots([...existing, snapshot], snapshot.id));
    return snapshot;
  },

  /**
   * The automatic variant: honours the on/off setting and the minimum
   * interval since the previous automatic snapshot, and never runs twice
   * at once (every store change in a burst calls this).
   */
  async maybeTakeAuto(source: Record<string, unknown>, now = Date.now()): Promise<DashboardSnapshot | null> {
    if (autoInFlight) return autoInFlight;
    autoInFlight = (async () => {
      try {
        const settings = await this.getSettings();
        if (!settings.autoSnapshot) return null;
        const lastAuto = (await readAll())
          .filter((s) => s.reason === 'auto')
          .reduce((latest, s) => Math.max(latest, s.takenAt), 0);
        if (now - lastAuto < AUTO_SNAPSHOT_MIN_INTERVAL_MS) return null;
        return await this.take('auto', source, now);
      } catch (err) {
        console.error('Automatic snapshot failed:', err);
        return null;
      } finally {
        autoInFlight = null;
      }
    })();
    return autoInFlight;
  },

  async remove(id: string): Promise<void> {
    if (id.startsWith(MIGRATION_ID_PREFIX)) {
      await storageRemove(`backup_before_v${id.slice(MIGRATION_ID_PREFIX.length)}`);
      return;
    }
    const existing = await readAll();
    if (existing.some((s) => s.id === id)) await writeAll(existing.filter((s) => s.id !== id));
  },

  /**
   * Writes the snapshot back through the import pipeline (migration +
   * sanitizing), then puts back any data: URLs that were left out, taken
   * from `current` (the pre-restore state) so the wallpaper image stays.
   */
  async restore(snapshot: DashboardSnapshot, current: Record<string, unknown>): Promise<boolean> {
    const ok = await storageService.importDashboardData(JSON.stringify(snapshotToExport(snapshot)));
    if (!ok) return false;

    const byKey = new Map<string, string[][]>();
    for (const path of snapshot.omitted || []) {
      const [key, ...rest] = path.split('.');
      if (!rest.length) continue;
      if (!byKey.has(key)) byKey.set(key, []);
      byKey.get(key)!.push(rest);
    }
    for (const [key, paths] of byKey) {
      const restored = await storageGet<any>(key);
      if (!restored || typeof restored !== 'object') continue;
      let changed = false;
      for (const rest of paths) {
        const value = getPath(current[key], rest);
        if (isBigDataUrl(value)) {
          setPath(restored, rest, value);
          changed = true;
        }
      }
      if (changed) await storageSet(key, restored);
    }
    return true;
  },
};
