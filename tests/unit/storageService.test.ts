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
    expect(exportData.version).toBe('1.0.0');
    expect(exportData.widgets).toBeDefined();

    const jsonString = JSON.stringify(exportData);
    const importSuccess = await storageService.importDashboardData(jsonString);
    expect(importSuccess).toBe(true);
  });

  it('無効なJSONをインポートした場合にfalseを返すこと', async () => {
    const result = await storageService.importDashboardData('{ "invalid": true }');
    expect(result).toBe(false);
  });
});
