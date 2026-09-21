import { describe, it, expect } from 'vitest';
import {
  buildSharePayload,
  encodeShareCode,
  decodeShareCode,
  pageFromPayload,
  stripWidgetsForShare,
  InvalidShareCode,
  SHARE_PREFIX,
} from '../../../src/services/shareService';
import type { DashboardWidget, ResponsiveLayouts } from '../../../src/types/widget';

const w = (type: string, config: Record<string, any>, id = `w-${type}`): DashboardWidget =>
  ({ id, type: type as any, title: type, config, layout: { i: id, x: 0, y: 0, w: 4, h: 2 } });

const layouts = (widgets: DashboardWidget[]): ResponsiveLayouts =>
  ({ lg: widgets.map((x) => x.layout), md: widgets.map((x) => x.layout), sm: [], xs: [], xxs: [] });

describe('shareService', () => {
  it('個人データ(メモ本文・タスク・習慣履歴・カレンダー URL・座標・QR)を取り除くこと', () => {
    const stripped = stripWidgetsForShare([
      w('notes', { content: 'secret', pages: [{ id: 'p', title: 'x', content: 'y' }], activePageId: 'p', fontSize: 'lg', fontFamily: 'mono' }),
      w('todo', { items: [{ id: '1', text: 'buy milk', completed: false }] }),
      w('habits', { habits: [{ id: 'h', name: 'Run', history: ['2026-01-01'], createdAt: 1 }], showWeek: true }),
      w('calendar', { feeds: [{ id: 'f', url: 'https://calendar.google.com/private-abc/basic.ics', label: 'me', color: '#fff' }], daysAhead: 3 }),
      w('countdown', { events: [{ id: 'e', name: 'Anniversary', date: '2026-10-01' }] }),
      w('weather', { city: 'Kawaguchi', latitude: 35.87, longitude: 139.74, unit: 'celsius', showForecast: true, locationPrompted: true }),
      w('qrcode', { mode: 'text', value: 'wifi password' }),
      w('shortcuts', { items: [{ id: 's', title: 'GitHub', url: 'https://github.com' }], columns: 4 }),
      w('mystery' as any, { x: 1 }),
    ]);
    const by = (type: string) => stripped.find((x) => x.type === type)!.config;
    expect(by('notes')).toEqual({ content: '', fontSize: 'lg', fontFamily: 'mono' });
    expect(by('todo').items).toEqual([]);
    expect(by('habits').habits).toEqual([{ id: 'h', name: 'Run', history: [], createdAt: 1 }]);
    expect(by('calendar').feeds).toEqual([]);
    expect(by('countdown').events).toEqual([]);
    expect(by('weather')).toEqual({ unit: 'celsius', showForecast: true });
    expect(by('qrcode').value).toBe('');
    expect(by('shortcuts').items).toHaveLength(1);
    expect(stripped.some((x) => x.type === ('mystery' as any))).toBe(false);
  });

  it('エンコード → デコードで往復し、レイアウトは残ったウィジェットの分だけになること', async () => {
    const widgets = [w('clock', { style: 'digital' }), w('notes', { content: 'x' }), w('mystery' as any, {})];
    const payload = buildSharePayload(
      { pageName: 'My page', widgets, layouts: layouts(widgets), dockItems: [{ id: 'd', label: 'G', url: 'https://google.com', icon: 'globe', openInNewTab: true }] },
      { includeDock: true }
    );
    expect(payload.page.layouts.lg.map((l) => l.i)).toEqual(['w-clock', 'w-notes']);

    const code = await encodeShareCode(payload);
    expect(code.startsWith(SHARE_PREFIX)).toBe(true);
    expect(code).toMatch(/^zt1\.[A-Za-z0-9_-]+$/);

    const decoded = await decodeShareCode(`  ${code}\n`);
    expect(decoded.page.name).toBe('My page');
    expect(decoded.page.widgets.map((x) => x.type)).toEqual(['clock', 'notes']);
    expect(decoded.dock).toEqual(payload.dock);
    expect(decoded.app).toBe(payload.app);
  });

  it('壊れたコードや別物の文字列は InvalidShareCode になること', async () => {
    await expect(decodeShareCode('hello')).rejects.toBeInstanceOf(InvalidShareCode);
    await expect(decodeShareCode('zt1.!!!notbase64')).rejects.toBeInstanceOf(InvalidShareCode);
    await expect(decodeShareCode('zt1r.' + btoa('{"v":2}'))).rejects.toBeInstanceOf(InvalidShareCode);
    await expect(decodeShareCode('zt1r.' + btoa('{"v":1,"page":{"widgets":"nope"}}'))).rejects.toBeInstanceOf(InvalidShareCode);
  });

  it('受け取り側では危険な URL を落とし、id を振り直してページにすること', async () => {
    const raw = {
      v: 1,
      app: 'x',
      page: {
        name: 'n'.repeat(100),
        widgets: [
          { id: 'a', type: 'iframe', title: 'Evil', config: { url: 'javascript:alert(1)' }, layout: { i: 'a', x: 0, y: 0, w: 4, h: 2 } },
          { id: 'b', type: 'clock', title: 'Clock', config: {}, layout: { i: 'b', x: 4, y: 0, w: 4, h: 2 } },
          { id: 'c', type: 'nope', title: 'Unknown', config: {}, layout: { i: 'c', x: 0, y: 2, w: 1, h: 1 } },
        ],
        layouts: { lg: [{ i: 'a', x: 0, y: 0, w: 4, h: 2 }, { i: 'b', x: 4, y: 0, w: 4, h: 2 }] },
      },
      dock: [{ id: 'd', label: 'ok', url: 'https://ok.example', icon: 'globe', openInNewTab: true }, { id: 'e', label: 'bad', url: 'javascript:1', icon: 'globe', openInNewTab: true }],
    };
    const decoded = await decodeShareCode('zt1r.' + btoa(JSON.stringify(raw)).replace(/=+$/, ''));
    expect(decoded.page.name).toHaveLength(60);
    expect(decoded.page.widgets.map((x) => x.type)).toEqual(['iframe', 'clock']);
    expect(decoded.page.widgets[0].config.url).toBeUndefined();
    expect(decoded.dock!.map((d) => d.label)).toEqual(['ok']);

    const page = pageFromPayload(decoded);
    expect(page.widgets.map((x) => x.id)).not.toEqual(['a', 'b']);
    expect(page.layouts.lg.map((l) => l.i)).toEqual(page.widgets.map((x) => x.id));
    // Breakpoints the sender didn't include fall back to the widgets' own layout.
    expect(page.layouts.sm).toHaveLength(2);
    expect(page.layouts.lg.some((l) => l.i === 'c')).toBe(false);
  });
});
