import { storageGet, storageSet, storageRemove } from '../utils/storage';
import { STORAGE_KEYS, USER_DATA_KEYS } from './storageKeys';

/**
 * Schema versioning for everything ZenithTab persists.
 *
 * The version describes the *shape* of the stored data, independently of
 * the app version. Additive changes (a new optional field) don't need a
 * new schema version — read-time hydration (storageService.hydrateWidget
 * & co.) covers those. Bump CURRENT_SCHEMA_VERSION and add a MIGRATIONS
 * entry only for a breaking change: renaming a key, changing how a value
 * is structured, splitting or merging keys.
 *
 * Rules every migration follows:
 * - Forward only, applied in order, one version per step. Each step is
 *   committed by writing `schema_version` = that step, so a crash midway
 *   resumes from the last completed step next launch.
 * - Idempotent: several new-tab pages can start at once, so a step must
 *   be safe to run twice (check before you reshape).
 * - A snapshot of the user-data keys is written to `backup_before_v<N>`
 *   just before step N runs. It is kept for one release so a bad
 *   migration can be undone by hand or by a follow-up release; the next
 *   release removes it.
 * - Never delete an old key in the same release that stops writing it;
 *   keep reading it for one release, drop it in the next.
 *
 * Migrations run in the new-tab page (`initialize()`), not in the service
 * worker: the page is what reads the data, and running them in both would
 * race. They also run over an export file on import, through the same
 * functions, via an in-memory data source.
 */

export const CURRENT_SCHEMA_VERSION = 1;

/** Minimal key/value view a migration works against (storage or an export object). */
export interface MigrationDataSource {
  get<T = any>(key: string): Promise<T | undefined>;
  set(key: string, value: any): Promise<void>;
  remove(key: string): Promise<void>;
}

export type Migration = (data: MigrationDataSource) => Promise<void>;

/**
 * Keyed by the version the step produces. Version 1 is the shape written
 * by every release up to and including 1.6.x; there is nothing to convert
 * into it, so the table starts empty.
 *
 * Example of a future entry:
 *   2: async (data) => {
 *     const wallpaper = await data.get(STORAGE_KEYS.WALLPAPER);
 *     if (wallpaper && 'category' in wallpaper) {   // idempotency check
 *       await data.set(STORAGE_KEYS.WALLPAPER, { ...wallpaper, theme: wallpaper.category });
 *     }
 *   },
 */
export const MIGRATIONS: Record<number, Migration> = {};

export interface MigrationResult {
  from: number;
  to: number;
  applied: number[];
}

/** chrome.storage.local (with the localStorage fallback) as a data source. */
export const storageDataSource: MigrationDataSource = {
  get: (key) => storageGet(key),
  set: (key, value) => storageSet(key, value),
  remove: (key) => storageRemove(key),
};

/**
 * Wraps a plain object (an export file) so the same migrations can run on
 * it. Export fields are named differently from storage keys; the map
 * translates between them.
 */
const EXPORT_FIELD_BY_KEY: Record<string, string> = {
  [STORAGE_KEYS.WIDGETS]: 'widgets',
  [STORAGE_KEYS.LAYOUTS]: 'layouts',
  [STORAGE_KEYS.WALLPAPER]: 'wallpaper',
  [STORAGE_KEYS.APPEARANCE]: 'appearance',
  [STORAGE_KEYS.DOCK_ITEMS]: 'dockItems',
  [STORAGE_KEYS.KEYBOARD_SHORTCUTS]: 'keyboardShortcuts',
  [STORAGE_KEYS.PAGES]: 'pages',
  [STORAGE_KEYS.ACTIVE_PAGE_ID]: 'activePageId',
  [STORAGE_KEYS.PAGE_DATA]: 'pageData',
  [STORAGE_KEYS.TRASH]: 'trash',
  [STORAGE_KEYS.SCHEMA_VERSION]: 'schemaVersion',
};

export function exportDataSource(target: Record<string, any>): MigrationDataSource {
  const field = (key: string) => EXPORT_FIELD_BY_KEY[key] ?? key;
  return {
    get: async (key) => target[field(key)],
    set: async (key, value) => {
      target[field(key)] = value;
    },
    remove: async (key) => {
      delete target[field(key)];
    },
  };
}

async function hasAnyUserData(data: MigrationDataSource): Promise<boolean> {
  for (const key of USER_DATA_KEYS) {
    if ((await data.get(key)) !== undefined) return true;
  }
  return false;
}

/**
 * Brings `data` up to `targetVersion`, one step at a time.
 *
 * Unversioned data is treated as version 1 when it holds anything (every
 * install before schema versions existed) and simply stamped with the
 * current version when it is empty (a fresh install has nothing to
 * migrate).
 */
export async function runMigrations(
  data: MigrationDataSource = storageDataSource,
  options: { migrations?: Record<number, Migration>; targetVersion?: number; snapshot?: boolean } = {}
): Promise<MigrationResult> {
  const migrations = options.migrations ?? MIGRATIONS;
  const takeSnapshots = options.snapshot ?? true;
  const target = options.targetVersion ?? CURRENT_SCHEMA_VERSION;

  let version = await data.get<number>(STORAGE_KEYS.SCHEMA_VERSION);
  if (typeof version !== 'number' || !Number.isFinite(version)) {
    version = (await hasAnyUserData(data)) ? 1 : target;
    await data.set(STORAGE_KEYS.SCHEMA_VERSION, version);
  }
  const from = version;
  const applied: number[] = [];

  for (let next = version + 1; next <= target; next++) {
    const migrate = migrations[next];
    if (!migrate) throw new Error(`No migration registered for schema version ${next}`);

    // Another tab may have completed this step in the meantime.
    const latest = await data.get<number>(STORAGE_KEYS.SCHEMA_VERSION);
    if (typeof latest === 'number' && latest >= next) {
      version = latest;
      next = latest;
      continue;
    }

    if (takeSnapshots) {
      const snapshot: Record<string, any> = {};
      for (const key of USER_DATA_KEYS) {
        const value = await data.get(key);
        if (value !== undefined) snapshot[key] = value;
      }
      await data.set(`backup_before_v${next}`, { takenAt: Date.now(), fromVersion: version, data: snapshot });
    }

    await migrate(data);
    // Commit this step — without moving backwards if another tab got
    // further while we were working.
    const afterRun = await data.get<number>(STORAGE_KEYS.SCHEMA_VERSION);
    version = Math.max(typeof afterRun === 'number' ? afterRun : 0, next);
    await data.set(STORAGE_KEYS.SCHEMA_VERSION, version);
    applied.push(next);
    next = version;
  }

  return { from, to: version, applied };
}
