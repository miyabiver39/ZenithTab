import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useDashboardStore } from '../../../src/store/useDashboardStore';
import { useUndoStore } from '../../../src/store/useUndoStore';
import { snapshotService } from '../../../src/services/snapshotService';
import { STORAGE_KEYS, DEFAULT_PAGE_ID } from '../../../src/services/storageService';
import { chromeStorageData } from '../../helpers/chrome';
import { resetDashboardStore } from '../../helpers/store';

const state = () => useDashboardStore.getState();

describe('useDashboardStore snapshots', () => {
  beforeEach(() => resetDashboardStore({ snapshots: null }));

  it('refreshSnapshots が一覧を読み込み、失敗時は空にすること', async () => {
    expect(state().snapshots).toBeNull();
    await state().refreshSnapshots();
    expect(state().snapshots).toEqual([]);

    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.spyOn(snapshotService, 'list').mockRejectedValueOnce(new Error('boom'));
    await state().refreshSnapshots();
    expect(state().snapshots).toEqual([]);
  });

  it('手動バックアップは変更がなければ false、あれば一覧に増えること', async () => {
    expect(await state().takeSnapshot()).toBe(true);
    expect(state().snapshots).toHaveLength(1);
    expect(state().snapshots?.[0].reason).toBe('manual');
    expect(await state().takeSnapshot()).toBe(false);
    expect(state().snapshots).toHaveLength(1);
  });

  it('リセットとインポートの直前にスナップショットが取られること', async () => {
    state().addWidget('clock', 'Mine');
    await state().resetToDefault();
    await state().refreshSnapshots();
    expect(state().snapshots?.map((s) => s.reason)).toEqual(['before-reset']);
    expect(state().widgets.some((w) => w.title === 'Mine')).toBe(false);

    const json = JSON.stringify({
      version: '1.0.0',
      exportedAt: new Date().toISOString(),
      widgets: [{ id: 'w1', type: 'clock', title: 'Imported', config: {}, layout: { i: 'w1', x: 0, y: 0, w: 4, h: 2 } }],
    });
    state().addWidget('clock', 'Before import');
    expect(await state().importConfig(json)).toBe(true);
    await state().refreshSnapshots();
    expect(state().snapshots?.map((s) => s.reason)).toEqual(['before-import', 'before-reset']);
    expect(state().widgets[0].title).toBe('Imported');
    expect(state().isEditMode).toBe(false);
  });

  it('スナップショットに戻すと直前の状態も保存され、それにも戻れること', async () => {
    const original = state().widgets.map((w) => w.id);
    expect(await state().takeSnapshot()).toBe(true);
    const manualId = state().snapshots![0].id;

    state().removeWidget(original[0]);
    state().addPage({ name: 'Extra' });
    expect(state().pages).toHaveLength(2);

    expect(await state().restoreSnapshot(manualId)).toBe(true);
    expect(state().pages).toHaveLength(1);
    expect(state().activePageId).toBe(DEFAULT_PAGE_ID);
    expect(state().widgets.map((w) => w.id)).toEqual(original);
    expect(state().activeSettingsModal).toBeNull();
    expect(useUndoStore.getState().undoStack).toHaveLength(0);
    // The trash is untouched by a restore.
    expect(state().trash).toHaveLength(1);

    const reasons = state().snapshots!.map((s) => s.reason);
    expect(reasons).toEqual(['before-restore', 'manual']);
    const beforeRestoreId = state().snapshots![0].id;
    expect(await state().restoreSnapshot(beforeRestoreId)).toBe(true);
    expect(state().pages.map((p) => p.name)).toEqual(['', 'Extra']);
    expect(state().widgets.some((w) => w.id === original[0])).toBe(false);
  });

  it('存在しない id は false、削除は一覧から消えること', async () => {
    expect(await state().restoreSnapshot('ghost')).toBe(false);
    await state().takeSnapshot();
    const id = state().snapshots![0].id;
    await state().deleteSnapshot(id);
    expect(state().snapshots).toEqual([]);
  });

  it('自動バックアップ設定が永続化され、初期化で読み戻されること', async () => {
    await state().updateBackupSettings({ autoSnapshot: false });
    expect(chromeStorageData[STORAGE_KEYS.BACKUP_SETTINGS]).toEqual({ autoSnapshot: false });

    useDashboardStore.setState({ isInitialized: false, backupSettings: { autoSnapshot: true } });
    await state().initialize();
    expect(state().backupSettings.autoSnapshot).toBe(false);
  });
});
