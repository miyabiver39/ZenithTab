import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  runMigrations,
  exportDataSource,
  storageDataSource,
  CURRENT_SCHEMA_VERSION,
  MIGRATIONS,
  Migration,
} from '../../src/services/migrations';
import { STORAGE_KEYS } from '../../src/services/storageKeys';
import { storageService } from '../../src/services/storageService';
import { useDashboardStore } from '../../src/store/useDashboardStore';
import { chromeStorageData } from '../helpers/chrome';
import { resetDashboardStore } from '../helpers/store';
import v133 from '../fixtures/export-v1.3.3.json';

describe('schema migrations', () => {
  beforeEach(() => resetDashboardStore());
  afterEach(() => vi.restoreAllMocks());

  it('現在のスキーマは 1 で、登録済みマイグレーションは無いこと', () => {
    expect(CURRENT_SCHEMA_VERSION).toBe(1);
    expect(Object.keys(MIGRATIONS)).toEqual([]);
  });

  it('新規インストール（データなし）は現在バージョンをそのまま記録すること', async () => {
    const result = await runMigrations();
    expect(result).toEqual({ from: CURRENT_SCHEMA_VERSION, to: CURRENT_SCHEMA_VERSION, applied: [] });
    expect(chromeStorageData[STORAGE_KEYS.SCHEMA_VERSION]).toBe(CURRENT_SCHEMA_VERSION);
  });

  it('バージョン未記録の既存データは 1 とみなして記録すること', async () => {
    chromeStorageData[STORAGE_KEYS.WIDGETS] = [];
    const result = await runMigrations();
    expect(result.from).toBe(1);
    expect(chromeStorageData[STORAGE_KEYS.SCHEMA_VERSION]).toBe(1);
  });

  it('initialize() の先頭で実行され、schema_version が記録されること', async () => {
    chromeStorageData[STORAGE_KEYS.WALLPAPER] = { source: 'gradient' };
    await useDashboardStore.getState().initialize();
    expect(chromeStorageData[STORAGE_KEYS.SCHEMA_VERSION]).toBe(1);
    expect(useDashboardStore.getState().isInitialized).toBe(true);
  });

  it('マイグレーションが失敗しても起動は続くこと', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const original = chromeStorageData;
    chromeStorageData[STORAGE_KEYS.SCHEMA_VERSION] = 99; // ahead of this build → "no migration registered"
    await useDashboardStore.getState().initialize();
    expect(useDashboardStore.getState().isInitialized).toBe(true);
    expect(original[STORAGE_KEYS.SCHEMA_VERSION]).toBe(99);
  });

  describe('将来の v1 → v2 → v3 を模擬', () => {
    const rename: Migration = async (data) => {
      const wallpaper = await data.get(STORAGE_KEYS.WALLPAPER);
      if (wallpaper && 'category' in wallpaper) {
        const { category, ...rest } = wallpaper;
        await data.set(STORAGE_KEYS.WALLPAPER, { ...rest, theme: category });
      }
    };
    const addFlag: Migration = async (data) => {
      const appearance = (await data.get(STORAGE_KEYS.APPEARANCE)) || {};
      await data.set(STORAGE_KEYS.APPEARANCE, { ...appearance, migratedFlag: true });
    };
    const fake = { 2: vi.fn(rename), 3: vi.fn(addFlag) };

    beforeEach(() => {
      fake[2].mockClear();
      fake[3].mockClear();
      chromeStorageData[STORAGE_KEYS.WALLPAPER] = { source: 'unsplash', category: 'nature' };
      chromeStorageData[STORAGE_KEYS.APPEARANCE] = { theme: 'dark' };
    });

    it('順番に適用し、各ステップの直前にスナップショットを残すこと', async () => {
      const result = await runMigrations(storageDataSource, { migrations: fake, targetVersion: 3 });

      expect(result).toEqual({ from: 1, to: 3, applied: [2, 3] });
      expect(fake[2].mock.invocationCallOrder[0]).toBeLessThan(fake[3].mock.invocationCallOrder[0]);
      expect(chromeStorageData[STORAGE_KEYS.SCHEMA_VERSION]).toBe(3);
      expect(chromeStorageData[STORAGE_KEYS.WALLPAPER]).toEqual({ source: 'unsplash', theme: 'nature' });
      expect(chromeStorageData[STORAGE_KEYS.APPEARANCE]).toEqual({ theme: 'dark', migratedFlag: true });

      expect(chromeStorageData.backup_before_v2.fromVersion).toBe(1);
      expect(chromeStorageData.backup_before_v2.data[STORAGE_KEYS.WALLPAPER]).toEqual({ source: 'unsplash', category: 'nature' });
      expect(chromeStorageData.backup_before_v3.fromVersion).toBe(2);
      expect(chromeStorageData.backup_before_v3.data[STORAGE_KEYS.WALLPAPER]).toEqual({ source: 'unsplash', theme: 'nature' });
    });

    it('2回目の実行では何もしないこと（冪等）', async () => {
      await runMigrations(storageDataSource, { migrations: fake, targetVersion: 3 });
      const again = await runMigrations(storageDataSource, { migrations: fake, targetVersion: 3 });
      expect(again).toEqual({ from: 3, to: 3, applied: [] });
      expect(fake[2]).toHaveBeenCalledTimes(1);
    });

    it('途中で失敗したら完了済みのステップまで記録され、次回はそこから再開すること', async () => {
      const failing = { 2: vi.fn(rename), 3: vi.fn(async () => { throw new Error('boom'); }) };
      await expect(runMigrations(storageDataSource, { migrations: failing, targetVersion: 3 })).rejects.toThrow('boom');
      expect(chromeStorageData[STORAGE_KEYS.SCHEMA_VERSION]).toBe(2);

      const result = await runMigrations(storageDataSource, { migrations: fake, targetVersion: 3 });
      expect(result).toEqual({ from: 2, to: 3, applied: [3] });
      expect(fake[2]).not.toHaveBeenCalled();
    });

    it('他のタブが先に進めていたらそのステップを飛ばすこと', async () => {
      const racing = {
        2: vi.fn(async (data) => {
          await rename(data);
          // Simulate another tab finishing steps 2 and 3 meanwhile.
          await data.set(STORAGE_KEYS.SCHEMA_VERSION, 3);
        }),
        3: vi.fn(addFlag),
      };
      const result = await runMigrations(storageDataSource, { migrations: racing, targetVersion: 3 });
      expect(racing[3]).not.toHaveBeenCalled();
      expect(result.to).toBe(3);
    });

    it('未登録のバージョンに到達したら明示的に失敗すること', async () => {
      await expect(runMigrations(storageDataSource, { migrations: { 2: rename }, targetVersion: 3 })).rejects.toThrow(
        'No migration registered for schema version 3'
      );
    });

    it('エクスポート JSON に対しても同じマイグレーションが走ること', async () => {
      const file: Record<string, any> = { version: '1.3.3', wallpaper: { source: 'unsplash', category: 'space' }, appearance: {} };
      const result = await runMigrations(exportDataSource(file), { migrations: fake, targetVersion: 3, snapshot: false });
      expect(result.applied).toEqual([2, 3]);
      expect(file.wallpaper).toEqual({ source: 'unsplash', theme: 'space' });
      expect(file.schemaVersion).toBe(3);
      expect(file.backup_before_v2).toBeUndefined();
    });
  });

  it('エクスポートに schemaVersion が入り、インポートで記録されること', async () => {
    const json = await storageService.exportDashboardData();
    expect(json.schemaVersion).toBe(CURRENT_SCHEMA_VERSION);

    const ok = await storageService.importDashboardData(JSON.stringify(v133));
    expect(ok).toBe(true);
    expect(chromeStorageData[STORAGE_KEYS.SCHEMA_VERSION]).toBe(CURRENT_SCHEMA_VERSION);
  });
});
