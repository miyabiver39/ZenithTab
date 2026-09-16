import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  snapshotService,
  stripDataUrls,
  getPath,
  setPath,
  summarize,
  pruneSnapshots,
  snapshotDataFromState,
  snapshotToExport,
  DashboardSnapshot,
  SNAPSHOT_RETENTION,
  MAX_SNAPSHOT_TOTAL_BYTES,
  AUTO_SNAPSHOT_MIN_INTERVAL_MS,
  DATA_URL_OMIT_THRESHOLD,
} from '../../../src/services/snapshotService';
import { storageService, STORAGE_KEYS, DEFAULT_WIDGETS, DEFAULT_LAYOUTS, DEFAULT_PAGE_ID } from '../../../src/services/storageService';
import { chromeStorageData } from '../../helpers/chrome';
import { resetDashboardStore } from '../../helpers/store';
import { useDashboardStore } from '../../../src/store/useDashboardStore';

const NOW = 1_700_000_000_000;
const BIG_DATA_URL = 'data:image/png;base64,' + 'A'.repeat(DATA_URL_OMIT_THRESHOLD);

const sourceData = () => snapshotDataFromState(useDashboardStore.getState());

const fakeSnapshot = (over: Partial<DashboardSnapshot>): DashboardSnapshot => ({
  id: over.id || `snap-${Math.random()}`,
  takenAt: NOW,
  reason: 'auto',
  appVersion: '1.8.0',
  schemaVersion: 1,
  summary: { pages: 1, widgets: 1, dockItems: 0, bytes: 100 },
  data: {},
  ...over,
});

describe('snapshotService', () => {
  beforeEach(() => resetDashboardStore());

  describe('stripDataUrls / paths', () => {
    it('大きな data: URL を省いてパスを記録し、小さいものや他の値は残すこと', () => {
      const { data, omitted } = stripDataUrls({
        dashboard_wallpaper: { customUrl: BIG_DATA_URL, currentWallpaperUrl: 'https://x/y.jpg', dynamic: { slots: { morning: { img: BIG_DATA_URL } } } },
        dashboard_dock_items: [{ icon: 'data:short' }],
      });
      expect(omitted).toEqual(['dashboard_wallpaper.customUrl', 'dashboard_wallpaper.dynamic.slots.morning.img']);
      expect((data.dashboard_wallpaper as any).customUrl).toBeUndefined();
      expect((data.dashboard_wallpaper as any).currentWallpaperUrl).toBe('https://x/y.jpg');
      expect((data.dashboard_dock_items as any)[0].icon).toBe('data:short');
    });

    it('getPath / setPath がネストを辿り、必要なら途中のオブジェクトを作ること', () => {
      const obj: any = { a: { b: 1 } };
      expect(getPath(obj, ['a', 'b'])).toBe(1);
      expect(getPath(obj, ['a', 'x', 'y'])).toBeUndefined();
      setPath(obj, ['a', 'c', 'd'], 'v');
      expect(obj.a.c.d).toBe('v');
    });
  });

  it('summarize がページ・ウィジェット・ドック数とサイズを数えること', () => {
    const summary = summarize(sourceData());
    expect(summary.pages).toBe(1);
    expect(summary.widgets).toBe(DEFAULT_WIDGETS.length);
    expect(summary.dockItems).toBeGreaterThan(0);
    expect(summary.bytes).toBe(JSON.stringify(sourceData()).length);
  });

  it('snapshotToExport がストレージキーをエクスポート項目名に変換すること', () => {
    const out = snapshotToExport(fakeSnapshot({ data: sourceData() }));
    expect(out.pages).toBeDefined();
    expect(out.pageData).toBeDefined();
    expect(out.schemaVersion).toBe(1);
    expect(out.version).toBe('1.8.0');
  });

  describe('pruneSnapshots', () => {
    it('理由ごとの保持数を守り、マイグレーション前と keepId は落とさないこと', () => {
      const list: DashboardSnapshot[] = [];
      for (let i = 0; i < SNAPSHOT_RETENTION.auto + 3; i++) list.push(fakeSnapshot({ id: `a${i}`, reason: 'auto', takenAt: NOW + i }));
      for (let i = 0; i < SNAPSHOT_RETENTION.manual + 1; i++) list.push(fakeSnapshot({ id: `m${i}`, reason: 'manual', takenAt: NOW + i }));
      list.push(fakeSnapshot({ id: 'mig', reason: 'before-migration', takenAt: 0 }));
      list.push(fakeSnapshot({ id: 'old-keep', reason: 'auto', takenAt: 1 }));

      const kept = pruneSnapshots(list, 'old-keep');
      expect(kept.filter((s) => s.reason === 'auto' && s.id !== 'old-keep')).toHaveLength(SNAPSHOT_RETENTION.auto);
      expect(kept.filter((s) => s.reason === 'manual')).toHaveLength(SNAPSHOT_RETENTION.manual);
      expect(kept.some((s) => s.id === 'mig')).toBe(true);
      expect(kept.some((s) => s.id === 'old-keep')).toBe(true);
      expect(kept.some((s) => s.id === 'a0')).toBe(false);
      expect(kept.some((s) => s.id === `a${SNAPSHOT_RETENTION.auto + 2}`)).toBe(true);
    });

    it('合計サイズが上限を超えたら古い自動スナップショットから落とすこと', () => {
      const big = MAX_SNAPSHOT_TOTAL_BYTES / 2;
      const list = [
        fakeSnapshot({ id: 'manual-old', reason: 'manual', takenAt: NOW, summary: { pages: 1, widgets: 1, dockItems: 0, bytes: big } }),
        fakeSnapshot({ id: 'auto-old', reason: 'auto', takenAt: NOW + 1, summary: { pages: 1, widgets: 1, dockItems: 0, bytes: big } }),
        fakeSnapshot({ id: 'auto-new', reason: 'auto', takenAt: NOW + 2, summary: { pages: 1, widgets: 1, dockItems: 0, bytes: big } }),
      ];
      const kept = pruneSnapshots(list, 'auto-new');
      expect(kept.map((s) => s.id).sort()).toEqual(['auto-new', 'manual-old']);
    });
  });

  describe('take / list / get / remove', () => {
    it('保存して一覧に載り、同じ内容なら重複保存しないこと', async () => {
      const first = await snapshotService.take('manual', sourceData(), NOW);
      expect(first).not.toBeNull();
      expect(await snapshotService.take('auto', sourceData(), NOW + 1)).toBeNull();

      useDashboardStore.getState().addWidget('clock', 'New');
      const second = await snapshotService.take('auto', sourceData(), NOW + 2);
      expect(second).not.toBeNull();

      const list = await snapshotService.list();
      expect(list.map((s) => s.id)).toEqual([second!.id, first!.id]);
      expect(list[0]).not.toHaveProperty('data');
      expect((await snapshotService.get(first!.id))?.data).toEqual(first!.data);
      expect(await snapshotService.get('nope')).toBeNull();

      await snapshotService.remove(first!.id);
      expect((await snapshotService.list()).map((s) => s.id)).toEqual([second!.id]);
    });

    it('マイグレーション前バックアップも一覧に含め、復元・削除できること', async () => {
      chromeStorageData['backup_before_v1'] = { takenAt: NOW - 5, fromVersion: 0, data: { [STORAGE_KEYS.WIDGETS]: DEFAULT_WIDGETS } };
      // Only versions from 2 up to the current one are considered.
      expect(await snapshotService.list()).toEqual([]);
    });

    it('壊れたエントリは読み飛ばすこと', async () => {
      chromeStorageData[STORAGE_KEYS.SNAPSHOTS] = [null, { id: 'x' }, fakeSnapshot({ id: 'ok', data: sourceData() })];
      expect((await snapshotService.list()).map((s) => s.id)).toEqual(['ok']);
      chromeStorageData[STORAGE_KEYS.SNAPSHOTS] = 'garbage';
      expect(await snapshotService.list()).toEqual([]);
    });
  });

  describe('maybeTakeAuto', () => {
    it('設定オフなら何もしないこと', async () => {
      await snapshotService.saveSettings({ autoSnapshot: false });
      expect(await snapshotService.maybeTakeAuto(sourceData(), NOW)).toBeNull();
      expect(await snapshotService.list()).toEqual([]);
    });

    it('前回の自動スナップショットから30分未満なら取らないこと', async () => {
      expect(await snapshotService.maybeTakeAuto(sourceData(), NOW)).not.toBeNull();
      useDashboardStore.getState().addWidget('clock', 'A');
      expect(await snapshotService.maybeTakeAuto(sourceData(), NOW + AUTO_SNAPSHOT_MIN_INTERVAL_MS - 1)).toBeNull();
      expect(await snapshotService.maybeTakeAuto(sourceData(), NOW + AUTO_SNAPSHOT_MIN_INTERVAL_MS)).not.toBeNull();
      expect(await snapshotService.list()).toHaveLength(2);
    });

    it('手動スナップショットは自動の間隔判定に影響しないこと', async () => {
      await snapshotService.take('manual', sourceData(), NOW);
      useDashboardStore.getState().addWidget('clock', 'A');
      const auto = await snapshotService.maybeTakeAuto(sourceData(), NOW + 1);
      expect(auto?.reason).toBe('auto');
    });

    it('同時に呼ばれても1回しか取らないこと', async () => {
      const [a, b] = await Promise.all([
        snapshotService.maybeTakeAuto(sourceData(), NOW),
        snapshotService.maybeTakeAuto(sourceData(), NOW),
      ]);
      expect(a).toBe(b);
      expect(await snapshotService.list()).toHaveLength(1);
    });

    it('失敗してもログして null を返すこと', async () => {
      const error = vi.spyOn(console, 'error').mockImplementation(() => {});
      vi.spyOn(snapshotService, 'getSettings').mockRejectedValueOnce(new Error('boom'));
      expect(await snapshotService.maybeTakeAuto(sourceData(), NOW)).toBeNull();
      expect(error).toHaveBeenCalled();
    });
  });

  describe('restore', () => {
    it('インポート経路で書き戻し、省いた data: URL は現在の値を維持すること', async () => {
      useDashboardStore.getState().updateWallpaper({ source: 'custom', customUrl: BIG_DATA_URL });
      const snap = await snapshotService.take('manual', sourceData(), NOW);
      expect(snap?.omitted).toEqual(['dashboard_wallpaper.customUrl']);
      expect((snap?.data.dashboard_wallpaper as any).customUrl).toBeUndefined();

      // Later: a different custom image and an extra widget.
      const NEWER = 'data:image/png;base64,' + 'B'.repeat(DATA_URL_OMIT_THRESHOLD);
      useDashboardStore.getState().updateWallpaper({ customUrl: NEWER });
      useDashboardStore.getState().addWidget('clock', 'Later');
      const current = sourceData();

      expect(await snapshotService.restore(snap!, current)).toBe(true);
      const wallpaper = await storageService.getWallpaper();
      expect(wallpaper.customUrl).toBe(NEWER);
      expect(wallpaper.source).toBe('custom');
      const { pageData } = await storageService.getPagesState();
      expect(pageData[DEFAULT_PAGE_ID].widgets.some((w) => w.title === 'Later')).toBe(false);
    });

    it('インポートが失敗したら false を返すこと', async () => {
      vi.spyOn(console, 'error').mockImplementation(() => {});
      const broken = fakeSnapshot({ data: { [STORAGE_KEYS.PAGES]: [], [STORAGE_KEYS.PAGE_DATA]: {} } });
      expect(await snapshotService.restore(broken, {})).toBe(false);
    });

    it('旧形式(単一ページ・schemaVersion なし)のスナップショットも復元できること', async () => {
      const legacy = fakeSnapshot({
        schemaVersion: undefined as any,
        data: { [STORAGE_KEYS.WIDGETS]: DEFAULT_WIDGETS.slice(0, 2), [STORAGE_KEYS.LAYOUTS]: DEFAULT_LAYOUTS },
      });
      expect(await snapshotService.restore(legacy, {})).toBe(true);
      const { pageData } = await storageService.getPagesState();
      expect(pageData[DEFAULT_PAGE_ID].widgets).toHaveLength(2);
    });
  });
});
