import { describe, it, expect } from 'vitest';
import {
  pruneTrash,
  sanitizeTrash,
  placeRestoredLayout,
  layoutsWithRestoredWidget,
  withFreshWidgetId,
  createTrashedWidget,
  createTrashedPage,
  TRASH_RETENTION_MS,
  MAX_TRASH_ENTRIES,
} from '../../../src/services/trashService';
import { DashboardWidget, TrashEntry } from '../../../src/types/widget';

const widget = (id: string, layout = { x: 0, y: 0, w: 4, h: 2 }): DashboardWidget => ({
  id,
  type: 'clock',
  title: 'Clock',
  config: {},
  layout: { i: id, ...layout },
});

const NOW = 1_700_000_000_000;

describe('trashService', () => {
  describe('pruneTrash', () => {
    it('30日を過ぎたエントリを落とし、変化がなければ同じ配列を返すこと', () => {
      const fresh = createTrashedWidget(widget('a'), {}, 'p1', 'Page 1', NOW - 1000);
      const stale = createTrashedWidget(widget('b'), {}, 'p1', 'Page 1', NOW - TRASH_RETENTION_MS - 1);
      const list: TrashEntry[] = [fresh, stale];
      expect(pruneTrash(list, NOW)).toEqual([fresh]);

      const unchanged = [fresh];
      expect(pruneTrash(unchanged, NOW)).toBe(unchanged);
    });

    it('上限を超えたら古いものから捨てること', () => {
      const list: TrashEntry[] = [];
      for (let i = 0; i < MAX_TRASH_ENTRIES + 3; i++) {
        list.push(createTrashedWidget(widget(`w${i}`), {}, 'p1', '', NOW - i * 1000));
      }
      const kept = pruneTrash(list, NOW);
      expect(kept).toHaveLength(MAX_TRASH_ENTRIES);
      expect(kept.some((e) => e.kind === 'widget' && e.widget.id === `w${MAX_TRASH_ENTRIES + 2}`)).toBe(false);
      expect(kept.some((e) => e.kind === 'widget' && e.widget.id === 'w0')).toBe(true);
    });
  });

  describe('sanitizeTrash', () => {
    it('形の合わないエントリを除外すること', () => {
      const ok = createTrashedPage({ id: 'p9', name: 'X' }, { widgets: [], layouts: { lg: [], md: [], sm: [], xs: [], xxs: [] } }, NOW);
      const raw = [
        ok,
        null,
        { id: 'x', kind: 'widget', deletedAt: NOW }, // no widget
        { id: 'y', kind: 'page', deletedAt: NOW, pageMeta: { id: 'p' } }, // no pageData
        { id: 'z', kind: 'other', deletedAt: NOW },
        { id: 'n', kind: 'widget', deletedAt: 'yesterday', widget: widget('n'), sourcePageId: 'p' },
        createTrashedWidget(widget('w'), {}, 'p1', '', NOW),
      ];
      const result = sanitizeTrash(raw);
      expect(result.map((e) => e.id)).toEqual([ok.id, result[1].id]);
      expect(sanitizeTrash('nope')).toEqual([]);
    });
  });

  describe('placeRestoredLayout', () => {
    it('元の場所が空いていればそこに戻すこと', () => {
      const existing = [{ i: 'other', x: 6, y: 0, w: 4, h: 2 }];
      const saved = { i: 'a', x: 0, y: 0, w: 4, h: 2 };
      expect(placeRestoredLayout(existing, 'a', saved, widget('a').layout, 12)).toEqual(saved);
    });

    it('重なるなら最下段に置き、Infinity を使わないこと', () => {
      const existing = [
        { i: 'other', x: 0, y: 0, w: 4, h: 2 },
        { i: 'tall', x: 8, y: 1, w: 4, h: 5 },
      ];
      const saved = { i: 'a', x: 2, y: 1, w: 4, h: 2 };
      const placed = placeRestoredLayout(existing, 'a', saved, widget('a').layout, 12);
      expect(placed).toMatchObject({ i: 'a', x: 0, y: 6, w: 4, h: 2 });
      expect(Number.isFinite(placed.y)).toBe(true);
    });

    it('保存されたレイアウトが無ければ widget.layout を使い、幅を列数に収めること', () => {
      const placed = placeRestoredLayout([], 'a', undefined, { i: 'a', x: 10, y: 0, w: 4, h: 2 }, 6);
      expect(placed).toMatchObject({ i: 'a', x: 2, y: 0, w: 4 });
      const narrow = placeRestoredLayout([], 'a', undefined, { i: 'a', x: 0, y: 0, w: 8, h: 2 }, 2);
      expect(narrow).toMatchObject({ x: 0, w: 2 });
    });

    it('壊れた座標(null / Infinity)でも有限の位置に落ち着くこと', () => {
      const broken = { i: 'a', x: null, y: Infinity, w: 4, h: 2 } as any;
      const placed = placeRestoredLayout([{ i: 'o', x: 0, y: Infinity as any, w: 2, h: 2 }], 'a', broken, widget('a').layout, 12);
      expect(Number.isFinite(placed.x)).toBe(true);
      expect(Number.isFinite(placed.y)).toBe(true);
    });
  });

  it('layoutsWithRestoredWidget は全ブレークポイントに配置し、既存の同 id を置き換えること', () => {
    const layouts = {
      lg: [{ i: 'a', x: 9, y: 9, w: 1, h: 1 }],
      md: [],
      sm: [],
      xs: [],
      xxs: [],
    };
    const result = layoutsWithRestoredWidget(layouts, widget('a'), { lg: { i: 'a', x: 0, y: 0, w: 4, h: 2 } });
    expect(result.lg).toEqual([{ i: 'a', x: 0, y: 0, w: 4, h: 2 }]);
    for (const bp of ['md', 'sm', 'xs', 'xxs'] as const) {
      expect(result[bp]).toHaveLength(1);
      expect(result[bp][0].i).toBe('a');
    }
    expect(result.xxs[0].w).toBe(2);
  });

  it('withFreshWidgetId は widget とレイアウトの id をまとめて振り直すこと', () => {
    const entry = createTrashedWidget(widget('old'), { lg: { i: 'old', x: 0, y: 0, w: 4, h: 2 } }, 'p1', '', NOW);
    const fresh = withFreshWidgetId(entry, 'new');
    expect(fresh.widget.id).toBe('new');
    expect(fresh.widget.layout.i).toBe('new');
    expect(fresh.layouts.lg?.i).toBe('new');
    expect(entry.widget.id).toBe('old');
  });
});
