import { describe, it, expect, beforeEach } from 'vitest';
import { storageService } from '../../src/services/storageService';

describe('storageService', () => {
  beforeEach(async () => {
    await storageService.resetDashboard();
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

  it('ウィジェットを1件も含まないインポートを拒否すること', async () => {
    const result = await storageService.importDashboardData('{ "widgets": [] }');
    expect(result).toBe(false);
  });
});
