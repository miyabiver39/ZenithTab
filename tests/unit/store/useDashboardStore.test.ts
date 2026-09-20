import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { useDashboardStore } from '../../../src/store/useDashboardStore';
import { storageService, STORAGE_KEYS, DEFAULT_PAGE_ID } from '../../../src/services/storageService';
import { chromeStorageData, failNextStorageCall } from '../../helpers/chrome';
import { resetDashboardStore, flushPromises } from '../../helpers/store';

const state = () => useDashboardStore.getState();

describe('useDashboardStore', () => {
  beforeEach(() => {
    resetDashboardStore();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  describe('initialize', () => {
    it('初回起動時はブラウザ言語のデフォルトで起動し、それを永続化しないこと', async () => {
      vi.spyOn(navigator, 'language', 'get').mockReturnValue('ja-JP');
      useDashboardStore.setState({ isInitialized: false });

      await state().initialize();

      expect(state().isInitialized).toBe(true);
      expect(state().pages).toHaveLength(1);
      expect(state().widgets.find((w) => w.type === 'clock')?.title).toBe('時計');
      // Nothing is written until the user changes something.
      expect(chromeStorageData[STORAGE_KEYS.PAGE_DATA]).toBeUndefined();
    });

    it('保存済みの状態を復元すること', async () => {
      await storageService.savePages([
        { id: 'p1', name: 'Work' },
        { id: 'p2', name: '' },
      ]);
      await storageService.savePageData({
        p1: { widgets: [], layouts: { lg: [], md: [], sm: [], xs: [], xxs: [] } },
        p2: { widgets: [], layouts: { lg: [], md: [], sm: [], xs: [], xxs: [] } },
      });
      await storageService.saveActivePageId('p2');
      await storageService.saveAppearance({ ...state().appearance, theme: 'light' });

      await state().initialize();

      expect(state().pages.map((p) => p.id)).toEqual(['p1', 'p2']);
      expect(state().activePageId).toBe('p2');
      expect(state().appearance.theme).toBe('light');
    });

    it('activePageId が存在しないページを指していても先頭ページで復帰すること', async () => {
      await storageService.savePages([{ id: 'p1', name: '' }]);
      await storageService.savePageData({
        p1: { widgets: [], layouts: { lg: [], md: [], sm: [], xs: [], xxs: [] } },
      });
      await storageService.saveActivePageId('ghost');

      await state().initialize();

      expect(state().activePageId).toBe('p1');
      expect(state().isInitialized).toBe(true);
    });

    it('ストレージ読み込みが例外を投げてもデフォルトで初期化されること', async () => {
      vi.spyOn(console, 'error').mockImplementation(() => {});
      vi.spyOn(storageService, 'getAppearance').mockRejectedValue(new Error('boom'));

      await state().initialize();

      expect(state().isInitialized).toBe(true);
      expect(state().widgets.length).toBeGreaterThan(0);
    });

    it('ストレージ読み込みがハングしてもタイムアウト後に初期化されること', async () => {
      vi.useFakeTimers();
      vi.spyOn(storageService, 'getPagesState').mockReturnValue(new Promise(() => {}));
      useDashboardStore.setState({ isInitialized: false });

      const pending = state().initialize();
      await vi.advanceTimersByTimeAsync(5000);
      await pending;

      expect(state().isInitialized).toBe(true);
      expect(state().pages[0].id).toBe(DEFAULT_PAGE_ID);
    });
  });

  describe('widgets', () => {
    it('addWidget がウィジェットと全ブレークポイントのレイアウトを追加し永続化すること', async () => {
      const before = state().widgets.length;

      state().addWidget('todo', 'My Tasks');
      await flushPromises();

      const added = state().widgets[state().widgets.length - 1];
      expect(state().widgets).toHaveLength(before + 1);
      expect(added.type).toBe('todo');
      expect(added.title).toBe('My Tasks');
      for (const bp of ['lg', 'md', 'sm', 'xs', 'xxs'] as const) {
        const item = state().layouts[bp].find((l) => l.i === added.id);
        expect(item).toBeDefined();
        expect(Number.isFinite(item?.y)).toBe(true);
        expect(item?.y).toBeGreaterThanOrEqual(0);
        expect(item?.y).not.toBe(Infinity);
      }
      expect(state().pageData[DEFAULT_PAGE_ID].widgets).toHaveLength(before + 1);
      expect(chromeStorageData[STORAGE_KEYS.WIDGETS]).toHaveLength(before + 1);
    });

    it('addWidget を連続で追加しても y 座標が有限な数値として正しく累積されること', () => {
      state().addWidget('clock');
      state().addWidget('weather');
      state().addWidget('todo');

      for (const widget of state().widgets) {
        for (const bp of ['lg', 'md', 'sm', 'xs', 'xxs'] as const) {
          const item = state().layouts[bp].find((l) => l.i === widget.id);
          expect(item).toBeDefined();
          expect(Number.isFinite(item?.y)).toBe(true);
          expect(item?.y).not.toBe(Infinity);
        }
      }
    });

    it('ストレージに破損したレイアウト (y: null/Infinity) があっても initialize で自己修復されること', async () => {
      await storageService.savePages([{ id: 'p1', name: '' }]);
      await storageService.savePageData({
        p1: {
          widgets: [
            {
              id: 'w-corrupt',
              type: 'clock',
              title: 'Clock',
              config: {},
              layout: { i: 'w-corrupt', x: 0, y: null as any, w: 4, h: 2 },
            },
          ],
          layouts: {
            lg: [{ i: 'w-corrupt', x: 0, y: null as any, w: 4, h: 2 }],
            md: [{ i: 'w-corrupt', x: 0, y: Infinity as any, w: 4, h: 2 }],
            sm: [{ i: 'w-corrupt', x: 0, y: NaN as any, w: 4, h: 2 }],
            xs: [],
            xxs: [],
          },
        },
      });
      await storageService.saveActivePageId('p1');

      await state().initialize();

      expect(state().isInitialized).toBe(true);
      const lgItem = state().layouts.lg.find((l) => l.i === 'w-corrupt');
      const mdItem = state().layouts.md.find((l) => l.i === 'w-corrupt');
      const smItem = state().layouts.sm.find((l) => l.i === 'w-corrupt');

      expect(lgItem?.y).toBe(0);
      expect(mdItem?.y).toBe(0);
      expect(smItem?.y).toBe(0);
      expect(Number.isFinite(lgItem?.y)).toBe(true);
      expect(Number.isFinite(mdItem?.y)).toBe(true);
      expect(Number.isFinite(smItem?.y)).toBe(true);
    });

    it('addWidget はタイトル省略時に型名をタイトルにし、初期設定をマージすること', () => {
      state().addWidget('clock', undefined, { is24Hour: false });
      const added = state().widgets[state().widgets.length - 1];
      expect(added.title).toBe('Clock');
      expect(added.config.is24Hour).toBe(false);
      expect(added.config.style).toBe('digital');
    });

    it('addWidget のメモ・タスクの初期文言が言語設定に従うこと', () => {
      state().updateAppearance({ language: 'ja' });
      state().addWidget('notes');
      state().addWidget('todo');
      const notes = state().widgets.find((w) => w.type === 'notes' && w.id !== 'widget-notes-1');
      const todo = state().widgets.filter((w) => w.type === 'todo').pop();
      expect(notes?.config.content).toContain('ZenithTab へようこそ');
      expect(todo?.config.items[0].text).toBe('ZenithTab の設定を見てみる');
    });

    it('removeWidget がウィジェットとレイアウトを削除すること', async () => {
      const target = state().widgets[0].id;

      state().removeWidget(target);
      await flushPromises();

      expect(state().widgets.some((w) => w.id === target)).toBe(false);
      for (const bp of ['lg', 'md', 'sm', 'xs', 'xxs'] as const) {
        expect(state().layouts[bp].some((l) => l.i === target)).toBe(false);
      }
      expect(chromeStorageData[STORAGE_KEYS.WIDGETS].some((w: any) => w.id === target)).toBe(false);
    });

    it('updateWidgetConfig が設定をマージし、タイトルを更新すること(モーダルは閉じない — #47)', () => {
      const target = state().widgets.find((w) => w.type === 'clock')!;
      state().openSettingsModal('editWidget', target.id);

      state().updateWidgetConfig(target.id, { showSeconds: false }, 'Wall Clock');

      const updated = state().widgets.find((w) => w.id === target.id)!;
      expect(updated.config.showSeconds).toBe(false);
      expect(updated.config.style).toBe('digital');
      expect(updated.title).toBe('Wall Clock');
      // Closing the dialog is WidgetConfigModal's job, not the store's.
      expect(state().activeSettingsModal).toBe('editWidget');
      expect(state().editingWidgetId).toBe(target.id);
    });

    it('updateWidgetConfig は開いている設定ダイアログを閉じないこと', () => {
      // Widgets save config from timers/debounces (weather location, QR
      // input); that must not dismiss a settings panel the user is using.
      state().openSettingsModal('settings');
      const target = state().widgets[0];
      state().updateWidgetConfig(target.id, { showSeconds: false });
      expect(state().activeSettingsModal).toBe('settings');

      state().openSettingsModal('editWidget', target.id);
      state().updateWidgetConfig(target.id, { showSeconds: true });
      expect(state().activeSettingsModal).toBe('editWidget');
      expect(state().editingWidgetId).toBe(target.id);
    });

    it('updateWidgetConfig はタイトル省略時に既存タイトルを保持すること', () => {
      const target = state().widgets[0];
      state().updateWidgetConfig(target.id, { foo: 'bar' });
      expect(state().widgets[0].title).toBe(target.title);
      expect(state().widgets[0].config.foo).toBe('bar');
    });
  });

  describe('updateLayouts', () => {
    it('新しいレイアウトを反映し、widget.layout も同期すること', () => {
      const first = state().widgets[0];
      const moved = { ...first.layout, x: 3, y: 5 };
      const lg = state().layouts.lg.map((l) => (l.i === first.id ? moved : l));
      const allLayouts = { ...state().layouts, lg };

      state().updateLayouts(lg, allLayouts);

      expect(state().layouts.lg.find((l) => l.i === first.id)).toMatchObject({ x: 3, y: 5 });
      expect(state().widgets[0].layout).toMatchObject({ x: 3, y: 5 });
    });

    it('同一レイアウトの再通知では何も書き込まないこと', () => {
      const save = vi.spyOn(storageService, 'saveLayouts');
      state().updateLayouts(state().layouts.lg, state().layouts);
      expect(save).not.toHaveBeenCalled();
    });

    it('空ページでは無視すること', () => {
      useDashboardStore.setState({ widgets: [], layouts: { lg: [], md: [], sm: [], xs: [], xxs: [] } });
      const save = vi.spyOn(storageService, 'saveLayouts');
      state().updateLayouts([{ i: 'x', x: 0, y: 0, w: 1, h: 1 }], { lg: [{ i: 'x', x: 0, y: 0, w: 1, h: 1 }] } as any);
      expect(save).not.toHaveBeenCalled();
    });
  });

  describe('pages', () => {
    it('addPage → switchPage で各ページの状態が独立して保持されること', async () => {
      const page1Widgets = state().widgets;

      state().addPage();
      const newId = state().activePageId;
      expect(state().widgets).toEqual([]);
      expect(state().isEditMode).toBe(true);

      state().addWidget('clock');
      expect(state().widgets).toHaveLength(1);

      state().switchPage(DEFAULT_PAGE_ID);
      expect(state().widgets).toEqual(page1Widgets);
      expect(state().isEditMode).toBe(false);

      state().switchPage(newId);
      expect(state().widgets).toHaveLength(1);
      await flushPromises();
      expect(chromeStorageData[STORAGE_KEYS.ACTIVE_PAGE_ID]).toBe(newId);
    });

    it('switchPage は存在しないページや同一ページを無視すること', () => {
      const save = vi.spyOn(storageService, 'saveActivePageId');
      state().switchPage('nope');
      state().switchPage(DEFAULT_PAGE_ID);
      expect(save).not.toHaveBeenCalled();
    });

    it('removePage はアクティブページを削除すると隣のページへ移ること', () => {
      state().addPage();
      const newId = state().activePageId;

      state().removePage(newId);

      expect(state().pages.map((p) => p.id)).toEqual([DEFAULT_PAGE_ID]);
      expect(state().widgets.length).toBeGreaterThan(0);
    });

    it('編集モード中にアクティブページを削除しても同期不整合やフリーズが発生しないこと', async () => {
      state().addPage();
      const pageId = state().activePageId;
      state().setEditMode(true);
      expect(state().isEditMode).toBe(true);

      state().removePage(pageId);

      expect(state().activePageId).toBe(DEFAULT_PAGE_ID);
      expect(state().isEditMode).toBe(false);
      expect(state().pageData[pageId]).toBeUndefined();

      // Ensure syncFromStorage doesn't revive the deleted page or wipe out the active page
      await state().syncFromStorage();
      expect(state().activePageId).toBe(DEFAULT_PAGE_ID);
      expect(state().widgets.length).toBeGreaterThan(0);
    });

    it('removePage は非アクティブページの削除で表示を変えないこと', () => {
      state().addPage();
      const newId = state().activePageId;
      state().switchPage(DEFAULT_PAGE_ID);
      const shown = state().widgets;

      state().removePage(newId);

      expect(state().widgets).toBe(shown);
      expect(state().activePageId).toBe(DEFAULT_PAGE_ID);
    });

    it('最後の1ページは削除できないこと', () => {
      state().removePage(DEFAULT_PAGE_ID);
      expect(state().pages).toHaveLength(1);
    });

    it('renamePage は名前を更新し、空文字で自動命名に戻すこと', () => {
      state().renamePage(DEFAULT_PAGE_ID, '  仕事  ');
      expect(state().pages[0].name).toBe('仕事');
      state().renamePage(DEFAULT_PAGE_ID, '   ');
      expect(state().pages[0].name).toBe('');
    });
  });

  describe('appearance & wallpaper', () => {
    it('updateAppearance が部分更新して永続化すること', async () => {
      state().updateAppearance({ theme: 'light', compactMode: true });
      await flushPromises();
      expect(state().appearance.theme).toBe('light');
      expect(state().appearance.compactMode).toBe(true);
      expect(state().appearance.language).toBe('auto');
      expect(chromeStorageData[STORAGE_KEYS.APPEARANCE].theme).toBe('light');
    });

    it('updateWallpaper が部分更新して永続化すること', async () => {
      state().updateWallpaper({ blur: 12 });
      await flushPromises();
      expect(state().wallpaper.blur).toBe(12);
      expect(chromeStorageData[STORAGE_KEYS.WALLPAPER].blur).toBe(12);
    });

    it('rotateWallpaper はコレクション時のみURLを差し替えること', () => {
      state().updateWallpaper({ source: 'unsplash', category: 'nature', currentWallpaperUrl: 'x' });
      state().rotateWallpaper();
      expect(state().wallpaper.currentWallpaperUrl).toMatch(/^https:\/\/images\.unsplash\.com/);
      expect(state().wallpaper.lastRefreshed).toBeTypeOf('number');

      state().updateWallpaper({ source: 'custom', currentWallpaperUrl: 'data:image/png;base64,abc' });
      state().rotateWallpaper();
      expect(state().wallpaper.currentWallpaperUrl).toBe('data:image/png;base64,abc');
    });
  });

  describe('UI state', () => {
    it('編集モード・アプリドロワー・設定モーダルのトグルが動作すること', () => {
      state().setEditMode(true);
      expect(state().isEditMode).toBe(true);

      state().toggleAppDrawer();
      expect(state().isAppDrawerOpen).toBe(true);
      state().toggleAppDrawer(false);
      expect(state().isAppDrawerOpen).toBe(false);

      state().openSettingsModal('editWidget', 'w1');
      expect(state().activeSettingsModal).toBe('editWidget');
      expect(state().editingWidgetId).toBe('w1');
      state().closeSettingsModal();
      expect(state().activeSettingsModal).toBeNull();
      expect(state().editingWidgetId).toBeNull();
    });
  });

  describe('dock items', () => {
    it('追加・更新・削除・上下移動・並べ替えが動作すること', async () => {
      const initial = state().dockItems.length;

      state().addDockItem({ label: 'Test', url: 'https://t.example', icon: 'star', openInNewTab: true });
      const added = state().dockItems[state().dockItems.length - 1];
      expect(state().dockItems).toHaveLength(initial + 1);

      state().updateDockItem(added.id, { label: 'Renamed' });
      expect(state().dockItems.find((d) => d.id === added.id)?.label).toBe('Renamed');

      state().moveDockItem(added.id, 'up');
      expect(state().dockItems[initial - 1].id).toBe(added.id);
      state().moveDockItem(added.id, 'down');
      expect(state().dockItems[initial].id).toBe(added.id);

      state().reorderDockItem(added.id, 0);
      expect(state().dockItems[0].id).toBe(added.id);
      state().reorderDockItem(added.id, 99); // out of range: no-op
      expect(state().dockItems[0].id).toBe(added.id);

      state().removeDockItem(added.id);
      expect(state().dockItems).toHaveLength(initial);
      await flushPromises();
      expect(chromeStorageData[STORAGE_KEYS.DOCK_ITEMS]).toHaveLength(initial);
    });

    it('moveDockItem は端では何もしないこと', () => {
      const first = state().dockItems[0].id;
      state().moveDockItem(first, 'up');
      expect(state().dockItems[0].id).toBe(first);
      state().moveDockItem('missing', 'down');
      expect(state().dockItems[0].id).toBe(first);
    });
  });

  describe('keyboard shortcuts', () => {
    it('追加と削除が永続化されること', async () => {
      state().addKeyboardShortcut({ combo: 'Ctrl+Shift+G', label: 'GitHub', url: 'https://github.com', openInNewTab: true });
      expect(state().keyboardShortcuts).toHaveLength(1);
      const id = state().keyboardShortcuts[0].id;
      await flushPromises();
      expect(chromeStorageData[STORAGE_KEYS.KEYBOARD_SHORTCUTS]).toHaveLength(1);

      state().removeKeyboardShortcut(id);
      expect(state().keyboardShortcuts).toHaveLength(0);
    });
  });

  describe('reset / export / import', () => {
    it('resetToDefault が現在の言語でデフォルトに戻すこと', async () => {
      state().updateAppearance({ language: 'ja' });
      state().addPage();
      state().setEditMode(true);

      await state().resetToDefault();

      expect(state().pages).toHaveLength(1);
      expect(state().isEditMode).toBe(false);
      expect(state().widgets.find((w) => w.type === 'notes')?.config.content).toContain('ようこそ');
      expect(state().appearance.language).toBe('auto');
    });

    it('exportConfig → importConfig でラウンドトリップできること', async () => {
      state().renamePage(DEFAULT_PAGE_ID, 'Exported');
      await flushPromises();
      // Export reads storage, so make sure the rename landed there.
      await storageService.savePages(state().pages);
      await storageService.savePageData(state().pageData);

      const json = await state().exportConfig();
      expect(JSON.parse(json).pages[0].name).toBe('Exported');

      resetDashboardStore();
      const ok = await state().importConfig(json);

      expect(ok).toBe(true);
      expect(state().pages[0].name).toBe('Exported');
      expect(state().activeSettingsModal).toBeNull();
    });

    it('importConfig は不正なデータで false を返し状態を変えないこと', async () => {
      vi.spyOn(console, 'error').mockImplementation(() => {});
      const before = state().widgets;
      const ok = await state().importConfig('not json');
      expect(ok).toBe(false);
      expect(state().widgets).toBe(before);
    });
  });

  describe('syncFromStorage', () => {
    it('他タブの書き込みを取り込み、変化のないスライスは触らないこと', async () => {
      const wallpaperBefore = state().wallpaper;
      await storageService.savePages([{ id: DEFAULT_PAGE_ID, name: '' }, { id: 'p2', name: 'Remote' }]);
      await storageService.savePageData({
        ...state().pageData,
        p2: { widgets: [], layouts: { lg: [], md: [], sm: [], xs: [], xxs: [] } },
      });
      await storageService.saveActivePageId('p2');
      await storageService.saveWallpaper(wallpaperBefore);

      await state().syncFromStorage();

      expect(state().pages.map((p) => p.id)).toEqual([DEFAULT_PAGE_ID, 'p2']);
      expect(state().activePageId).toBe('p2');
      expect(state().widgets).toEqual([]);
      expect(state().wallpaper).toBe(wallpaperBefore);
    });

    it('ストレージが空なら何も変更しないこと', async () => {
      const snapshot = state();
      await state().syncFromStorage();
      expect(state().widgets).toBe(snapshot.widgets);
      expect(state().pages).toBe(snapshot.pages);
    });
  });

  it('ストレージ書き込みが失敗してもメモリ上の状態は更新されること', async () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    failNextStorageCall();
    state().updateAppearance({ theme: 'light' });
    await flushPromises();
    expect(state().appearance.theme).toBe('light');
    // storageSet falls back to localStorage on a chrome.storage failure.
    expect(JSON.parse(localStorage.getItem(`zenith_${STORAGE_KEYS.APPEARANCE}`)!).theme).toBe('light');
  });
});
