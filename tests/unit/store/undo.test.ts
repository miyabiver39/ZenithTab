import { describe, it, expect, beforeEach } from 'vitest';
import { useDashboardStore } from '../../../src/store/useDashboardStore';
import { useUndoStore, MAX_UNDO_ENTRIES } from '../../../src/store/useUndoStore';
import { STORAGE_KEYS, DEFAULT_PAGE_ID } from '../../../src/services/storageService';
import { chromeStorageData } from '../../helpers/chrome';
import { resetDashboardStore, flushPromises } from '../../helpers/store';

const state = () => useDashboardStore.getState();
const undoState = () => useUndoStore.getState();
const BREAKPOINTS = ['lg', 'md', 'sm', 'xs', 'xxs'] as const;

describe('useUndoStore', () => {
  beforeEach(() => undoState().clear());

  it('pushUndo でトーストが出て、undo でエントリの undo が実行されること', () => {
    const calls: string[] = [];
    undoState().pushUndo({ label: 'first', undo: () => calls.push('undo-1'), redo: () => calls.push('redo-1') });
    expect(undoState().toast).toMatchObject({ label: 'first', undoable: true });

    expect(undoState().undo()).toBe(true);
    expect(calls).toEqual(['undo-1']);
    expect(undoState().undoStack).toHaveLength(0);
    expect(undoState().redoStack).toHaveLength(1);
    expect(undoState().toast).toMatchObject({ undoable: false });

    expect(undoState().redo()).toBe(true);
    expect(calls).toEqual(['undo-1', 'redo-1']);
    expect(undoState().undoStack).toHaveLength(1);
    expect(undoState().redoStack).toHaveLength(0);
  });

  it('空のスタックでは undo / redo が false を返すこと', () => {
    expect(undoState().undo()).toBe(false);
    expect(undoState().redo()).toBe(false);
  });

  it('新しい操作で redo スタックが消え、スタックは上限で古いものから捨てられること', () => {
    undoState().pushUndo({ label: 'a', undo: () => {}, redo: () => {} });
    undoState().undo();
    expect(undoState().redoStack).toHaveLength(1);
    undoState().pushUndo({ label: 'b', undo: () => {} });
    expect(undoState().redoStack).toHaveLength(0);

    for (let i = 0; i < MAX_UNDO_ENTRIES + 5; i++) {
      undoState().pushUndo({ label: `n${i}`, undo: () => {} });
    }
    expect(undoState().undoStack).toHaveLength(MAX_UNDO_ENTRIES);
    expect(undoState().undoStack[MAX_UNDO_ENTRIES - 1].label).toBe(`n${MAX_UNDO_ENTRIES + 4}`);
  });

  it('undoEntry は指定したエントリだけを戻し、失敗してもスタックに残らないこと', () => {
    const calls: string[] = [];
    undoState().pushUndo({ label: 'a', undo: () => calls.push('a') });
    undoState().pushUndo({ label: 'b', undo: () => calls.push('b') });
    const first = undoState().undoStack[0].id;
    expect(undoState().undoEntry(first)).toBe(true);
    expect(calls).toEqual(['a']);
    expect(undoState().undoStack.map((e) => e.label)).toEqual(['b']);

    undoState().pushUndo({ label: 'boom', undo: () => { throw new Error('nope'); } });
    expect(undoState().undo()).toBe(false);
    expect(undoState().undoStack.map((e) => e.label)).toEqual(['b']);
  });
});

describe('useDashboardStore undo integration', () => {
  beforeEach(() => resetDashboardStore());

  it('ウィジェット削除を undo すると全ブレークポイントのレイアウトごと元の位置に戻ること', async () => {
    const target = state().widgets[2];
    const before = JSON.parse(JSON.stringify(state().layouts));
    const beforeWidgets = state().widgets.map((w) => w.id);

    state().removeWidget(target.id);
    expect(state().widgets.some((w) => w.id === target.id)).toBe(false);
    for (const bp of BREAKPOINTS) {
      expect(state().layouts[bp].some((l) => l.i === target.id)).toBe(false);
    }
    expect(undoState().toast?.label).toContain(target.title);

    expect(undoState().undo()).toBe(true);
    await flushPromises();

    expect(state().widgets.map((w) => w.id)).toEqual(beforeWidgets);
    for (const bp of BREAKPOINTS) {
      const restored = state().layouts[bp].find((l) => l.i === target.id);
      const original = before[bp].find((l: any) => l.i === target.id);
      expect(restored).toEqual(original);
    }
    expect(chromeStorageData[STORAGE_KEYS.PAGE_DATA][DEFAULT_PAGE_ID].widgets.map((w: any) => w.id)).toEqual(beforeWidgets);

    // Redo removes it again.
    expect(undoState().redo()).toBe(true);
    expect(state().widgets.some((w) => w.id === target.id)).toBe(false);
  });

  it('他タブで追加されたウィジェットを undo が消さないこと(差分復元)', () => {
    const target = state().widgets[0];
    state().removeWidget(target.id);

    // Simulate another tab adding a widget in the meantime.
    state().addWidget('clock', 'Other tab');
    const otherId = state().widgets.find((w) => w.title === 'Other tab')!.id;

    undoState().undo();
    expect(state().widgets.some((w) => w.id === target.id)).toBe(true);
    expect(state().widgets.some((w) => w.id === otherId)).toBe(true);
  });

  it('ウィジェットが既に戻されていれば undo は何もしないこと', () => {
    const target = state().widgets[0];
    state().removeWidget(target.id);
    // Restored by "someone else" (another tab, the trash…) before the undo.
    useDashboardStore.setState({ widgets: [target, ...state().widgets] });
    undoState().undo();
    expect(state().widgets.filter((w) => w.id === target.id)).toHaveLength(1);
  });

  it('別ページに切り替えた後でも、削除したウィジェットは元のページに戻ること', () => {
    const target = state().widgets[0];
    state().removeWidget(target.id);
    state().addPage({ name: 'Other' });
    expect(state().activePageId).not.toBe(DEFAULT_PAGE_ID);

    undoState().undo();
    expect(state().widgets.some((w) => w.id === target.id)).toBe(false);
    expect(state().pageData[DEFAULT_PAGE_ID].widgets.some((w) => w.id === target.id)).toBe(true);
    expect(state().pageData[DEFAULT_PAGE_ID].layouts.lg.some((l) => l.i === target.id)).toBe(true);
  });

  it('アクティブページの削除を undo すると元の位置に戻り、再びアクティブになること', async () => {
    state().addPage({ name: 'Second' });
    state().addPage({ name: 'Third' });
    const ids = state().pages.map((p) => p.id);
    state().switchPage(ids[1]);
    state().addWidget('clock', 'On second');
    const secondData = state().pageData;

    state().removePage(ids[1]);
    expect(state().pages.map((p) => p.id)).toEqual([ids[0], ids[2]]);
    expect(state().activePageId).toBe(ids[0]);
    expect(undoState().toast?.label).toContain('Second');

    undoState().undo();
    await flushPromises();
    expect(state().pages.map((p) => p.id)).toEqual(ids);
    expect(state().activePageId).toBe(ids[1]);
    expect(state().widgets.some((w) => w.title === 'On second')).toBe(true);
    expect(state().pageData[ids[1]]).toEqual(secondData[ids[1]] ?? { widgets: state().widgets, layouts: state().layouts });
    expect(chromeStorageData[STORAGE_KEYS.PAGES].map((p: any) => p.id)).toEqual(ids);
  });

  it('非アクティブページの削除を undo しても表示中のページは変わらないこと', () => {
    state().addPage({ name: 'Second' });
    const ids = state().pages.map((p) => p.id);
    state().switchPage(ids[0]);

    state().removePage(ids[1]);
    undoState().undo();
    expect(state().pages.map((p) => p.id)).toEqual(ids);
    expect(state().activePageId).toBe(ids[0]);
  });

  it('最後の1ページは削除できず、undo エントリも積まれないこと', () => {
    state().removePage(DEFAULT_PAGE_ID);
    expect(state().pages).toHaveLength(1);
    expect(undoState().undoStack).toHaveLength(0);
  });

  it('ドックアイテムの削除・並べ替えを undo できること', async () => {
    const before = state().dockItems.map((d) => d.id);
    state().removeDockItem(before[1]);
    expect(state().dockItems.map((d) => d.id)).toEqual(before.filter((id) => id !== before[1]));
    undoState().undo();
    expect(state().dockItems.map((d) => d.id)).toEqual(before);

    state().moveDockItem(before[0], 'down');
    expect(state().dockItems.map((d) => d.id)[1]).toBe(before[0]);
    undoState().undo();
    expect(state().dockItems.map((d) => d.id)).toEqual(before);

    state().reorderDockItem(before[0], before.length - 1);
    expect(state().dockItems.map((d) => d.id).at(-1)).toBe(before[0]);
    undoState().undo();
    expect(state().dockItems.map((d) => d.id)).toEqual(before);
    await flushPromises();
    expect(chromeStorageData[STORAGE_KEYS.DOCK_ITEMS].map((d: any) => d.id)).toEqual(before);
  });

  it('キーボードショートカットの削除を undo できること', () => {
    state().addKeyboardShortcut({ combo: 'Ctrl+Shift+G', label: 'GitHub', url: 'https://github.com', openInNewTab: true });
    state().addKeyboardShortcut({ combo: 'Ctrl+Shift+H', label: 'Home', url: 'https://example.com', openInNewTab: true });
    const ids = state().keyboardShortcuts.map((k) => k.id);
    state().removeKeyboardShortcut(ids[0]);
    expect(state().keyboardShortcuts).toHaveLength(1);
    expect(undoState().toast?.label).toContain('GitHub');
    undoState().undo();
    expect(state().keyboardShortcuts.map((k) => k.id)).toEqual(ids);
  });

  it('updateWidgetConfigUndoable はパッチしたキーの以前の値だけを戻すこと', () => {
    const todo = state().widgets.find((w) => w.type === 'todo')!;
    const originalItems = todo.config.items;
    state().updateWidgetConfigUndoable(todo.id, { items: [] }, 'cleared');
    expect(state().widgets.find((w) => w.id === todo.id)!.config.items).toEqual([]);
    expect(undoState().toast?.label).toBe('cleared');

    // An unrelated change made in between survives the undo.
    state().updateWidgetConfig(todo.id, { extra: 'kept' });

    undoState().undo();
    const after = state().widgets.find((w) => w.id === todo.id)!.config;
    expect(after.items).toEqual(originalItems);
    expect(after.extra).toBe('kept');

    undoState().redo();
    expect(state().widgets.find((w) => w.id === todo.id)!.config.items).toEqual([]);
  });

  it('updateWidgetConfigUndoable は存在しないウィジェットには何もしないこと', () => {
    state().updateWidgetConfigUndoable('ghost', { items: [] }, 'x');
    expect(undoState().undoStack).toHaveLength(0);
  });

  it('言語設定に応じたラベルになること', () => {
    state().updateAppearance({ language: 'ja' });
    const target = state().widgets.find((w) => w.type === 'clock')!;
    state().removeWidget(target.id);
    expect(undoState().toast?.label).toBe('ウィジェット「時計」を削除しました');
  });
});
