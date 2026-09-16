import { describe, it, expect } from 'vitest';
import { uniqueId } from '../../../src/utils/id';
import { useDashboardStore } from '../../../src/store/useDashboardStore';
import { resetDashboardStore } from '../../helpers/store';

describe('uniqueId', () => {
  it('同一ミリ秒内に大量生成しても衝突しないこと', () => {
    const ids = new Set(Array.from({ length: 5000 }, () => uniqueId('page')));
    expect(ids.size).toBe(5000);
    expect([...ids][0]).toMatch(/^page-[a-z0-9]+$/);
  });

  it('ページ・ウィジェットを連続追加しても ID が重複しないこと', () => {
    resetDashboardStore();
    const s = useDashboardStore.getState();
    s.addPage();
    s.addPage();
    s.addPage();
    const pageIds = useDashboardStore.getState().pages.map((p) => p.id);
    expect(new Set(pageIds).size).toBe(pageIds.length);

    useDashboardStore.getState().addWidget('clock');
    useDashboardStore.getState().addWidget('clock');
    const widgetIds = useDashboardStore.getState().widgets.map((w) => w.id);
    expect(new Set(widgetIds).size).toBe(widgetIds.length);
  });
});
