import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { storageService } from '../../src/services/storageService';

describe('storageService', () => {
  beforeEach(async () => {
    await storageService.resetDashboard();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('初期ウィジェットを取得できること', async () => {
    const widgets = await storageService.getWidgets();
    expect(widgets).toBeDefined();
    expect(widgets.length).toBeGreaterThan(0);
  });

  it('ウィジェット配列を正常に保存・再取得できること', async () => {
    const customWidgets = [
      {
        id: 'widget-custom-1',
        type: 'clock' as const,
        title: 'Custom Clock',
        config: { style: 'analog' as const, showSeconds: false, showDate: true, is24Hour: true },
        layout: { i: 'widget-custom-1', x: 0, y: 0, w: 4, h: 2, minW: 2, minH: 2 },
      },
    ];

    await storageService.saveWidgets(customWidgets);
    const retrieved = await storageService.getWidgets();
    expect(retrieved).toHaveLength(1);
    expect(retrieved[0].title).toBe('Custom Clock');
  });

  it('ダッシュボード設定のエクスポートとインポートが機能すること', async () => {
    const exportData = await storageService.exportDashboardData();
    // 実行中の拡張機能のバージョンが記録されること（固定値ではない）
    expect(exportData.version).toMatch(/^\d+\.\d+\.\d+/);
    expect(exportData.widgets).toBeDefined();

    const jsonString = JSON.stringify(exportData);
    const importSuccess = await storageService.importDashboardData(jsonString);
    expect(importSuccess).toBe(true);
  });

  it('無効なJSONをインポートした場合にfalseを返すこと', async () => {
    // The rejection is logged on purpose in production; keep the test
    // output clean.
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const result = await storageService.importDashboardData('{ "invalid": true }');
    expect(result).toBe(false);
  });

  it('インポート時に危険なURLを除去すること', async () => {
    const malicious = {
      version: '1.0.0',
      exportedAt: new Date().toISOString(),
      widgets: [
        {
          id: 'widget-iframe-evil',
          type: 'iframe',
          title: 'Evil Embed',
          config: { url: 'javascript:alert(1)' },
          layout: { i: 'widget-iframe-evil', x: 0, y: 0, w: 4, h: 4 },
        },
        {
          id: 'widget-shortcuts-mixed',
          type: 'shortcuts',
          title: 'Shortcuts',
          config: {
            items: [
              { id: 'a', title: 'Safe', url: 'https://example.com' },
              { id: 'b', title: 'Unsafe', url: 'javascript:void(0)' },
            ],
          },
          layout: { i: 'widget-shortcuts-mixed', x: 0, y: 0, w: 4, h: 4 },
        },
      ],
    };

    const ok = await storageService.importDashboardData(JSON.stringify(malicious));
    expect(ok).toBe(true);

    const widgets = await storageService.getWidgets();
    const iframeWidget = widgets.find((w) => w.id === 'widget-iframe-evil');
    const shortcutsWidget = widgets.find((w) => w.id === 'widget-shortcuts-mixed');

    expect((iframeWidget?.config as any).url).toBeUndefined();
    expect((shortcutsWidget?.config as any).items).toHaveLength(1);
    expect((shortcutsWidget?.config as any).items[0].url).toBe('https://example.com');
  });

  it('ショートカット / タスク / メモの壊れた要素(null、URL なし、不正な iconUrl)を落とすこと', async () => {
    const layout = { i: 'x', x: 0, y: 0, w: 4, h: 4 };
    const dirty = {
      version: '1.11.1',
      exportedAt: new Date().toISOString(),
      widgets: [
        {
          id: 'w-shortcuts',
          type: 'shortcuts',
          title: 'S',
          layout,
          config: {
            items: [
              null,
              'string',
              { id: 'a', title: 'no url' },
              { id: 'b', title: 'ok', url: 'https://ok.example' },
              { id: 'c', title: 'bad url', url: 'file:///etc/passwd' },
              { id: 'd', title: 'bad icon', url: 'https://x.example', iconUrl: 'javascript:1' },
              { id: 'e', title: 'good icon', url: 'https://y.example', iconUrl: 'https://y.example/icon.png' },
            ],
          },
        },
        { id: 'w-todo', type: 'todo', title: 'T', layout, config: { items: [null, { id: '1' }, { id: '2', text: 'ok', completed: 'yes' }] } },
        { id: 'w-notes', type: 'notes', title: 'N', layout, config: { pages: [null, { id: 'p', title: 'x' }, { id: 'q', title: 'y', content: 'z' }], fontSize: 'base' } },
      ],
      layouts: { lg: [], md: [], sm: [], xs: [], xxs: [] },
      wallpaper: {},
      appearance: {},
    };
    expect(await storageService.importDashboardData(JSON.stringify(dirty))).toBe(true);
    const widgets = await storageService.getWidgets();
    const items = widgets.find((w) => w.id === 'w-shortcuts')!.config.items;
    expect(items.map((i: any) => i.id)).toEqual(['b', 'd', 'e']);
    expect(items[1].iconUrl).toBeUndefined();
    expect(items[2].iconUrl).toBe('https://y.example/icon.png');
    expect(widgets.find((w) => w.id === 'w-todo')!.config.items).toEqual([{ id: '2', text: 'ok', completed: true }]);
    expect(widgets.find((w) => w.id === 'w-notes')!.config.pages.map((p: any) => p.id)).toEqual(['q']);
  });

  it('ウィジェットを1件も含まないインポートを拒否すること', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const result = await storageService.importDashboardData('{ "widgets": [] }');
    expect(result).toBe(false);
  });
});

describe('storageService 防御的な読み込み・インポート', () => {
  beforeEach(async () => {
    await storageService.resetDashboard();
  });

  it('ドックが 0 件のエクスポートをインポートすると、以前のドックが消えること', async () => {
    await storageService.saveDockItems([{ id: 'd1', label: 'Old', url: 'https://old.example', icon: 'globe', openInNewTab: true }]);
    const exportData = await storageService.exportDashboardData();
    expect(exportData.dockItems).toHaveLength(1);

    const ok = await storageService.importDashboardData(JSON.stringify({ ...exportData, dockItems: [] }));
    expect(ok).toBe(true);
    expect(await storageService.getDockItems()).toEqual([]);
  });

  it('pageData に null や非オブジェクトのレコードがあっても getPagesState が落ちず、他のページは残ること', async () => {
    const { pages, pageData } = await storageService.getPagesState();
    const goodId = pages[0].id;
    await storageService.savePages([...pages, { id: 'page-broken', name: 'Broken' }, { id: 'page-str', name: 'Str' }]);
    // Write straight to storage: savePageData would filter these out itself.
    const { chromeStorageData } = await import('../helpers/chrome');
    chromeStorageData.dashboard_page_data = { ...pageData, 'page-broken': null, 'page-str': 'nope' };

    const state = await storageService.getPagesState();
    expect(state.activePageId).toBe(goodId);
    expect(Object.keys(state.pageData)).toEqual([goodId]);
    expect(state.pageData[goodId].widgets.length).toBeGreaterThan(0);
  });

  it('savePageData も不正なレコードを書き込まないこと', async () => {
    const { pageData } = await storageService.getPagesState();
    await storageService.savePageData({ ...pageData, 'page-broken': null as any });
    const { chromeStorageData } = await import('../helpers/chrome');
    expect(Object.keys(chromeStorageData.dashboard_page_data)).not.toContain('page-broken');
  });

  it('インポートでページの id / name を検証し、非文字列の名前・重複 id・予約語 id を保存しないこと (#79)', async () => {
    const clock = { id: 'w1', type: 'clock', title: 'c', config: {}, layout: { i: 'w1', x: 0, y: 0, w: 2, h: 2 } };
    const ok = await storageService.importDashboardData(JSON.stringify({
      pages: [
        { id: 'p1', name: { evil: 1 } },
        { id: 'p1', name: 'dup' },
        { id: '__proto__', name: 'proto' },
        { id: 42, name: 'numeric id' },
        null,
        { id: 'p2', name: 'x'.repeat(200) },
      ],
      pageData: { p1: { widgets: [clock], layouts: {} }, __proto__: { widgets: [clock], layouts: {} }, p2: { widgets: [clock], layouts: {} } },
    }));
    expect(ok).toBe(true);

    const { pages, activePageId } = await storageService.getPagesState();
    expect(pages).toEqual([
      { id: 'p1', name: '' },
      { id: 'p2', name: 'x'.repeat(60) },
    ]);
    expect(activePageId).toBe('p1');
  });

  it('保存済みの不正なページ一覧も読み込み時に正規化されること (#79)', async () => {
    const { pages } = await storageService.getPagesState();
    const { chromeStorageData } = await import('../helpers/chrome');
    chromeStorageData.dashboard_pages = [{ ...pages[0], name: { evil: 1 } }, { ...pages[0], name: 'dup' }, 'garbage'];

    const state = await storageService.getPagesState();
    expect(state.pages).toEqual([{ id: pages[0].id, name: '' }]);
  });

  it('インポートのページ数・ページあたりのウィジェット数・入力サイズに上限があること (#79)', async () => {
    const { MAX_IMPORT_PAGES, MAX_IMPORT_WIDGETS_PER_PAGE, MAX_IMPORT_BYTES } = await import('../../src/services/storageService');
    const widgets = Array.from({ length: MAX_IMPORT_WIDGETS_PER_PAGE + 5 }, (_, i) => ({ id: `w${i}`, type: 'clock', title: 'c', config: {}, layout: { i: `w${i}`, x: 0, y: 0, w: 2, h: 2 } }));
    const pages = Array.from({ length: MAX_IMPORT_PAGES + 5 }, (_, i) => ({ id: `p${i}`, name: `P${i}` }));
    const pageData = Object.fromEntries(pages.map((p, i) => [p.id, { widgets: i === 0 ? widgets : widgets.slice(0, 1), layouts: {} }]));

    expect(await storageService.importDashboardData(JSON.stringify({ pages, pageData }))).toBe(true);
    const state = await storageService.getPagesState();
    expect(state.pages).toHaveLength(MAX_IMPORT_PAGES);
    expect(state.pageData.p0.widgets).toHaveLength(MAX_IMPORT_WIDGETS_PER_PAGE);

    vi.spyOn(console, 'error').mockImplementation(() => {});
    const before = await storageService.getPagesState();
    const huge = JSON.stringify({ pages, pageData, padding: 'x'.repeat(MAX_IMPORT_BYTES) });
    expect(await storageService.importDashboardData(huge)).toBe(false);
    expect((await storageService.getPagesState()).pages).toEqual(before.pages);
  });
});
