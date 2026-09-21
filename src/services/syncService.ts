import type { AppearanceSettings, DockItem, KeyboardShortcutBinding } from '../types/settings';
import { storageGet, storageSet } from '../utils/storage';

/**
 * Opt-in sync of the *settings* (appearance incl. language, Dock,
 * keyboard shortcuts) through chrome.storage.sync, so a second Chrome
 * signed into the same account looks the same. Widgets and pages stay
 * local: sync storage allows ~100 KB in total and 8 KB per item, which
 * a dashboard would blow through immediately.
 *
 * Every item is written as { updatedAt, value }. Whoever has the newer
 * stamp wins; a device only applies remote values whose stamp is newer
 * than the last one it wrote or applied (kept locally), so the tab that
 * just pushed never re-applies its own write.
 */

export type SyncedKey = 'appearance' | 'dockItems' | 'keyboardShortcuts';
export const SYNCED_KEYS: SyncedKey[] = ['appearance', 'dockItems', 'keyboardShortcuts'];

export interface SyncedSettings {
  appearance: AppearanceSettings;
  dockItems: DockItem[];
  keyboardShortcuts: KeyboardShortcutBinding[];
}

interface SyncItem<T> {
  updatedAt: number;
  value: T;
}

/**
 * chrome.storage.sync.QUOTA_BYTES_PER_ITEM. Chrome counts UTF-8 bytes of
 * the key plus the JSON-serialised value, so that is what we measure —
 * a `.length` check would let a Dock full of Japanese labels through and
 * have the whole set() rejected.
 */
export const SYNC_QUOTA_BYTES_PER_ITEM = 8192;
const SYNC_KEY_PREFIX = 'zenith_sync_';

const utf8Length = (s: string) => new TextEncoder().encode(s).length;

/** Bytes Chrome will charge for storing `value` under `key` in sync storage. */
export function syncItemBytes(key: string, value: unknown): number {
  return utf8Length(key) + utf8Length(JSON.stringify(value));
}
/** Local: the stamp of the newest remote state this device wrote or applied. */
const LAST_SYNC_STAMP_KEY = 'sync_last_stamp';

interface SyncArea {
  get(keys: string[]): Promise<Record<string, any>>;
  set(items: Record<string, any>): Promise<void>;
  remove(keys: string[]): Promise<void>;
}

function syncArea(): SyncArea | undefined {
  if (typeof chrome === 'undefined') return undefined;
  const area = (chrome as any).storage?.sync;
  return area && typeof area.get === 'function' ? (area as SyncArea) : undefined;
}

const remoteKey = (key: SyncedKey) => SYNC_KEY_PREFIX + key;

export const syncService = {
  isAvailable(): boolean {
    return syncArea() !== undefined;
  },

  async getLastStamp(): Promise<number> {
    return (await storageGet<number>(LAST_SYNC_STAMP_KEY, 0)) || 0;
  },

  async setLastStamp(stamp: number): Promise<void> {
    await storageSet(LAST_SYNC_STAMP_KEY, stamp);
  },

  /**
   * Writes the given settings to sync storage. Items over the per-item
   * quota are skipped and reported so the UI can say which (a Dock with
   * dozens of entries is the realistic case).
   */
  async push(settings: Partial<SyncedSettings>, now = Date.now()): Promise<{ pushed: SyncedKey[]; skipped: SyncedKey[] }> {
    const area = syncArea();
    const pushed: SyncedKey[] = [];
    const skipped: SyncedKey[] = [];
    if (!area) return { pushed, skipped };

    const items: Record<string, SyncItem<unknown>> = {};
    for (const key of SYNCED_KEYS) {
      const value = settings[key];
      if (value === undefined) continue;
      const item: SyncItem<unknown> = { updatedAt: now, value };
      if (syncItemBytes(remoteKey(key), item) > SYNC_QUOTA_BYTES_PER_ITEM) {
        skipped.push(key);
        continue;
      }
      items[remoteKey(key)] = item;
      pushed.push(key);
    }
    if (pushed.length > 0) {
      try {
        await area.set(items);
        await this.setLastStamp(now);
      } catch (err) {
        console.warn('[ZenithTab] chrome.storage.sync.set failed:', err);
        return { pushed: [], skipped: [...skipped, ...pushed] };
      }
    }
    return { pushed, skipped };
  },

  /** Everything currently in sync storage, with the newest stamp across items. */
  async pull(): Promise<{ settings: Partial<SyncedSettings>; updatedAt: number }> {
    const area = syncArea();
    if (!area) return { settings: {}, updatedAt: 0 };
    try {
      const raw = await area.get(SYNCED_KEYS.map(remoteKey));
      return this.parse(raw);
    } catch (err) {
      console.warn('[ZenithTab] chrome.storage.sync.get failed:', err);
      return { settings: {}, updatedAt: 0 };
    }
  },

  /** Shapes a raw sync-area object (from get() or an onChanged payload) into settings. */
  parse(raw: Record<string, any>): { settings: Partial<SyncedSettings>; updatedAt: number } {
    const settings: Partial<SyncedSettings> = {};
    let updatedAt = 0;
    for (const key of SYNCED_KEYS) {
      const item = raw[remoteKey(key)] as SyncItem<unknown> | undefined;
      if (!item || typeof item !== 'object' || typeof item.updatedAt !== 'number' || item.value === undefined) continue;
      (settings as any)[key] = item.value;
      updatedAt = Math.max(updatedAt, item.updatedAt);
    }
    return { settings, updatedAt };
  },

  /** Removes this extension's items from sync storage (when the user turns sync off). */
  async clear(): Promise<void> {
    const area = syncArea();
    if (!area) return;
    try {
      await area.remove(SYNCED_KEYS.map(remoteKey));
    } catch (err) {
      console.warn('[ZenithTab] chrome.storage.sync.remove failed:', err);
    }
    await this.setLastStamp(0);
  },

  /**
   * Calls `onRemote` with the settings another device wrote. Returns the
   * unsubscribe function. Changes this device wrote itself come through
   * too; the caller filters them out with the stamp rule.
   */
  subscribe(onRemote: (payload: { settings: Partial<SyncedSettings>; updatedAt: number }) => void): () => void {
    if (typeof chrome === 'undefined' || !(chrome as any).storage?.onChanged?.addListener) return () => {};
    const listener = (changes: Record<string, { newValue?: unknown }>, area: string) => {
      if (area !== 'sync') return;
      const raw: Record<string, unknown> = {};
      for (const [key, change] of Object.entries(changes)) {
        if (key.startsWith(SYNC_KEY_PREFIX) && change.newValue !== undefined) raw[key] = change.newValue;
      }
      if (Object.keys(raw).length === 0) return;
      onRemote(this.parse(raw));
    };
    chrome.storage.onChanged.addListener(listener);
    return () => chrome.storage.onChanged.removeListener(listener);
  },
};
