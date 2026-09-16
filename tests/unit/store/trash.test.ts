import { describe, it, expect, beforeEach } from 'vitest';
import { useDashboardStore } from '../../../src/store/useDashboardStore';
import { useUndoStore } from '../../../src/store/useUndoStore';
import { storageService, STORAGE_KEYS, DEFAULT_PAGE_ID } from '../../../src/services/storageService';
import { createTrashedWidget, TRASH_RETENTION_MS } from '../../../src/services/trashService';
import { chromeStorageData } from '../../helpers/chrome';
import { resetDashboardStore, flushPromises } from '../../helpers/store';

const state = () => useDashboardStore.getState();
const trash = () => state().trash;
const BREAKPOINTS = ['lg', 'md', 'sm', 'xs', 'xxs'] as const;

describe('useDashboardStore trash', () => {
  beforeEach(() => resetDashboardStore({ trash: [] }));

  it('ウィジェット削除でごみ箱に入り、undo で取り出されること', async () => {
    const target = state().widgets[1];
    state().removeWidget(target.id);
    await flushPromises();

    expect(trash()).toHaveLength(1);
    expect(trash()[0]).toMatchObject({ kind: 'widget', sourcePageId: DEFAULT_PAGE_ID, sourcePageName: 'Page 1' });
    expect(chromeStorageData[STORAGE_KEYS.TRASH]).toHaveLength(1);

    useUndoStore.getState().undo();
    await flushPromises();
    expect(trash()).toHaveLength(0);
    expect(chromeStorageData[STORAGE_KEYS.TRASH]).toHaveLength(0);

    useUndoStore.getState().redo();
    expect(trash()).toHaveLength(1);
  });

  it('ごみ箱から復元すると元のページの元の位置に戻ること', () => {
    const target = state().widgets[1];
    const originalLayouts = Object.fromEntries(
      BREAKPOINTS.map((bp) => [bp, state().layouts[bp].find((l) => l.i === target.id)])
    );
    state().removeWidget(target.id);
    useUndoStore.getState().clear();

    state().restoreFromTrash(trash()[0].id);
    expect(trash()).toHaveLength(0);
    expect(state().widgets.some((w) => w.id === target.id)).toBe(true);
    for (const bp of BREAKPOINTS) {
      expect(state().layouts[bp].find((l) => l.i === target.id)).toEqual(originalLayouts[bp]);
    }
    expect(useUndoStore.getState().toast?.label).toContain(target.title);

    // The restore itself can be undone: back into the trash.
    useUndoStore.getState().undo();
    expect(state().widgets.some((w) => w.id === target.id)).toBe(false);
    expect(trash()).toHaveLength(1);
  });

  it('元のページが消えていれば現在のページに復元すること', () => {
    state().addPage({ name: 'Second' });
    const secondId = state().activePageId;
    state().addWidget('clock', 'On second');
    const widgetId = state().widgets[0].id;
    state().removeWidget(widgetId);
    state().switchPage(DEFAULT_PAGE_ID);
    state().removePage(secondId);
    useUndoStore.getState().clear();

    const entry = trash().find((e) => e.kind === 'widget')!;
    state().restoreFromTrash(entry.id);
    expect(state().activePageId).toBe(DEFAULT_PAGE_ID);
    expect(state().widgets.some((w) => w.id === widgetId)).toBe(true);
  });

  it('元のページが別ページなら、そこに戻してそのページへ切り替えること', () => {
    const target = state().widgets[0];
    state().removeWidget(target.id);
    state().addPage({ name: 'Second' });
    expect(state().activePageId).not.toBe(DEFAULT_PAGE_ID);

    state().restoreFromTrash(trash()[0].id);
    expect(state().activePageId).toBe(DEFAULT_PAGE_ID);
    expect(state().widgets.some((w) => w.id === target.id)).toBe(true);
  });

  it('同じ id が既に存在するなら新しい id で復元すること', () => {
    const target = state().widgets[0];
    state().removeWidget(target.id);
    const entryId = trash()[0].id;
    useUndoStore.getState().undo(); // back on the page
    // Keep a copy of the entry in the trash as if it had come from another tab.
    useDashboardStore.setState({ trash: [createTrashedWidget(target, {}, DEFAULT_PAGE_ID, 'Page 1')] });
    const copyId = trash()[0].id;
    expect(copyId).not.toBe(entryId);

    state().restoreFromTrash(copyId);
    const copies = state().widgets.filter((w) => w.type === target.type && w.title === target.title);
    expect(copies).toHaveLength(2);
    expect(new Set(copies.map((w) => w.id)).size).toBe(2);
    expect(state().layouts.lg.filter((l) => copies.some((c) => c.id === l.i))).toHaveLength(2);
  });

  it('ページ削除でごみ箱に入り、復元すると末尾に追加されてアクティブになること', async () => {
    state().addPage({ name: 'Work' });
    const workId = state().activePageId;
    state().addWidget('clock', 'Work clock');
    state().removePage(workId);
    useUndoStore.getState().clear();
    expect(trash()[0]).toMatchObject({ kind: 'page', pageMeta: { id: workId, name: 'Work' } });

    state().restoreFromTrash(trash()[0].id);
    await flushPromises();
    expect(state().pages.map((p) => p.name)).toEqual(['', 'Work']);
    expect(state().activePageId).toBe(workId);
    expect(state().widgets[0].title).toBe('Work clock');
    expect(trash()).toHaveLength(0);
    expect(chromeStorageData[STORAGE_KEYS.PAGES]).toHaveLength(2);

    useUndoStore.getState().undo();
    expect(state().pages).toHaveLength(1);
    expect(trash()).toHaveLength(1);
  });

  it('ページ id が既に使われていれば新しい id で復元すること', () => {
    state().addPage({ name: 'Work' });
    const workId = state().activePageId;
    state().removePage(workId);
    useUndoStore.getState().undo(); // page is back
    // A stale copy of the same page, as another tab could have left behind.
    useDashboardStore.setState({
      trash: [
        {
          id: 'trash-copy',
          kind: 'page',
          deletedAt: Date.now(),
          pageMeta: { id: workId, name: 'Work' },
          pageData: { widgets: [], layouts: { lg: [], md: [], sm: [], xs: [], xxs: [] } },
        },
      ],
    });
    state().restoreFromTrash('trash-copy');
    expect(state().pages).toHaveLength(3);
    expect(new Set(state().pages.map((p) => p.id)).size).toBe(3);
  });

  it('完全削除と空にするが動き、リセットしてもごみ箱は残ること', async () => {
    state().removeWidget(state().widgets[0].id);
    state().removeWidget(state().widgets[0].id);
    expect(trash()).toHaveLength(2);

    state().deleteFromTrash(trash()[0].id);
    expect(trash()).toHaveLength(1);

    await state().resetToDefault();
    expect(trash()).toHaveLength(1);
    expect(chromeStorageData[STORAGE_KEYS.TRASH]).toHaveLength(1);

    state().emptyTrash();
    await flushPromises();
    expect(trash()).toHaveLength(0);
    expect(chromeStorageData[STORAGE_KEYS.TRASH]).toEqual([]);
  });

  it('起動時に期限切れのエントリを掃除して書き戻すこと', async () => {
    const fresh = createTrashedWidget(state().widgets[0], {}, DEFAULT_PAGE_ID, 'Page 1', Date.now());
    const stale = createTrashedWidget(state().widgets[1], {}, DEFAULT_PAGE_ID, 'Page 1', Date.now() - TRASH_RETENTION_MS - 1);
    await storageService.saveTrash([fresh, stale]);
    useDashboardStore.setState({ isInitialized: false });

    await state().initialize();
    await flushPromises();
    expect(trash().map((e) => e.id)).toEqual([fresh.id]);
    expect(chromeStorageData[STORAGE_KEYS.TRASH].map((e: any) => e.id)).toEqual([fresh.id]);
  });

  it('エクスポートにごみ箱が含まれ、インポートで復元されること', async () => {
    state().removeWidget(state().widgets[0].id);
    await flushPromises();
    const json = await state().exportConfig();
    expect(JSON.parse(json).trash).toHaveLength(1);

    state().emptyTrash();
    await flushPromises();
    expect(await state().importConfig(json)).toBe(true);
    expect(trash()).toHaveLength(1);
    expect(useUndoStore.getState().undoStack).toHaveLength(0);
  });

  it('インポート時にごみ箱内の危険な URL も除去されること', async () => {
    const json = JSON.stringify({
      version: '1.8.0',
      exportedAt: new Date().toISOString(),
      widgets: [{ id: 'w1', type: 'clock', title: 'Clock', config: {}, layout: { i: 'w1', x: 0, y: 0, w: 4, h: 2 } }],
      layouts: { lg: [], md: [], sm: [], xs: [], xxs: [] },
      trash: [
        {
          id: 't1',
          kind: 'widget',
          deletedAt: Date.now(),
          sourcePageId: 'page-1',
          sourcePageName: 'Page 1',
          widget: { id: 'w2', type: 'iframe', title: 'Bad', config: { url: 'javascript:alert(1)' }, layout: { i: 'w2', x: 0, y: 0, w: 4, h: 2 } },
          layouts: {},
        },
        { id: 'broken' },
      ],
    });
    expect(await state().importConfig(json)).toBe(true);
    expect(trash()).toHaveLength(1);
    expect((trash()[0] as any).widget.config.url).toBeUndefined();
  });

  it('syncFromStorage で他タブのごみ箱を取り込むこと', async () => {
    const entry = createTrashedWidget(state().widgets[0], {}, DEFAULT_PAGE_ID, 'Page 1');
    await storageService.saveTrash([entry]);
    await state().syncFromStorage();
    expect(trash().map((e) => e.id)).toEqual([entry.id]);
  });
});
