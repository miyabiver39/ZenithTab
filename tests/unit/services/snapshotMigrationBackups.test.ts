import { describe, it, expect, beforeEach, vi } from 'vitest';

// Pretend the schema has moved to version 2 with a no-op migration, so the
// `backup_before_v2` key the pipeline would have written can be exercised.
vi.mock('../../../src/services/migrations', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../../src/services/migrations')>();
  return { ...actual, CURRENT_SCHEMA_VERSION: 2, MIGRATIONS: { 2: async () => {} } };
});

import { snapshotService } from '../../../src/services/snapshotService';
import { storageService, STORAGE_KEYS, DEFAULT_WIDGETS, DEFAULT_LAYOUTS, DEFAULT_PAGE_ID } from '../../../src/services/storageService';
import { chromeStorageData } from '../../helpers/chrome';
import { resetDashboardStore } from '../../helpers/store';

describe('snapshotService: pre-migration backups', () => {
  beforeEach(() => {
    resetDashboardStore();
    chromeStorageData['backup_before_v2'] = {
      takenAt: 1_700_000_000_000,
      fromVersion: 1,
      data: {
        [STORAGE_KEYS.WIDGETS]: DEFAULT_WIDGETS.slice(0, 3),
        [STORAGE_KEYS.LAYOUTS]: DEFAULT_LAYOUTS,
        [STORAGE_KEYS.PAGES]: [{ id: DEFAULT_PAGE_ID, name: '' }],
        [STORAGE_KEYS.PAGE_DATA]: { [DEFAULT_PAGE_ID]: { widgets: DEFAULT_WIDGETS.slice(0, 3), layouts: DEFAULT_LAYOUTS } },
        [STORAGE_KEYS.TRASH]: [{ id: 'should-not-be-restored' }],
        unrelated_key: 1,
      },
    };
  });

  it('一覧に「アップデート前」として載り、ごみ箱や無関係なキーは含めないこと', async () => {
    const list = await snapshotService.list();
    expect(list).toHaveLength(1);
    expect(list[0]).toMatchObject({ id: 'migration-v2', reason: 'before-migration', schemaVersion: 1 });
    expect(list[0].summary.widgets).toBe(3);

    const full = await snapshotService.get('migration-v2');
    expect(full?.data[STORAGE_KEYS.TRASH]).toBeUndefined();
    expect(full?.data.unrelated_key).toBeUndefined();
  });

  it('復元するとマイグレーションを通って現在の形になること', async () => {
    const full = (await snapshotService.get('migration-v2'))!;
    expect(await snapshotService.restore(full, {})).toBe(true);
    const { pageData } = await storageService.getPagesState();
    expect(pageData[DEFAULT_PAGE_ID].widgets).toHaveLength(3);
    expect(chromeStorageData[STORAGE_KEYS.SCHEMA_VERSION]).toBe(2);
  });

  it('削除すると backup_before_v キーが消えること', async () => {
    await snapshotService.remove('migration-v2');
    expect(chromeStorageData['backup_before_v2']).toBeUndefined();
    expect(await snapshotService.list()).toEqual([]);
  });
});
