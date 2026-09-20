import { describe, it, expect } from 'vitest';
import { toSafeInt, sanitizeLayout, calculateBottomY, sanitizeResponsiveLayouts, applyRegistryMinimums } from '../../../src/utils/layout';

describe('layout utils', () => {
  describe('toSafeInt', () => {
    it('returns valid positive integers unchanged', () => {
      expect(toSafeInt(5)).toBe(5);
      expect(toSafeInt(0)).toBe(0);
      expect(toSafeInt(100.7)).toBe(100);
    });

    it('clamps negative numbers to 0', () => {
      expect(toSafeInt(-5)).toBe(0);
      expect(toSafeInt(-0.1)).toBe(0);
    });

    it('falls back to fallback or 0 for non-finite values and non-numbers', () => {
      expect(toSafeInt(Infinity)).toBe(0);
      expect(toSafeInt(-Infinity)).toBe(0);
      expect(toSafeInt(NaN)).toBe(0);
      expect(toSafeInt(null)).toBe(0);
      expect(toSafeInt(undefined)).toBe(0);
      expect(toSafeInt('5' as any)).toBe(0);
      expect(toSafeInt(Infinity, 4)).toBe(4);
      expect(toSafeInt(null, 10)).toBe(10);
    });
  });

  describe('sanitizeLayout', () => {
    it('replaces null, undefined, NaN, and Infinity with safe finite numbers', () => {
      const corrupt: any = {
        i: 'widget-1',
        x: null,
        y: Infinity,
        w: NaN,
        h: undefined,
      };

      const sanitized = sanitizeLayout(corrupt);
      expect(sanitized.i).toBe('widget-1');
      expect(sanitized.x).toBe(0);
      expect(sanitized.y).toBe(0);
      expect(sanitized.w).toBe(4);
      expect(sanitized.h).toBe(3);
      expect(Number.isFinite(sanitized.y)).toBe(true);
    });

    it('ensures width and height are at least 1', () => {
      const zeroSize: any = {
        i: 'w1',
        x: 0,
        y: 0,
        w: 0,
        h: -2,
      };

      const sanitized = sanitizeLayout(zeroSize);
      expect(sanitized.w).toBe(1);
      expect(sanitized.h).toBe(1);
    });

    it('preserves valid constraints and flags', () => {
      const valid = {
        i: 'widget-valid',
        x: 2,
        y: 3,
        w: 6,
        h: 4,
        minW: 2,
        minH: 2,
        maxW: 12,
        maxH: 20,
        isDraggable: false,
        isResizable: true,
        static: false,
      };

      const sanitized = sanitizeLayout(valid);
      expect(sanitized).toEqual(valid);
    });
  });

  describe('calculateBottomY', () => {
    it('returns 0 for empty layouts', () => {
      expect(calculateBottomY([])).toBe(0);
    });

    it('calculates the maximum y + h across layout items', () => {
      const items = [
        { i: '1', x: 0, y: 0, w: 4, h: 2 },
        { i: '2', x: 4, y: 1, w: 4, h: 4 }, // bottom is 5
        { i: '3', x: 8, y: 2, w: 4, h: 2 }, // bottom is 4
      ];
      expect(calculateBottomY(items)).toBe(5);
    });

    it('handles layouts containing Infinity or null gracefully without returning NaN/Infinity', () => {
      const items: any = [
        { i: '1', x: 0, y: 0, w: 4, h: 2 },
        { i: '2', x: 4, y: Infinity, w: 4, h: 4 }, // Infinity falls back to y: 0, bottom: 4
      ];
      const bottom = calculateBottomY(items);
      expect(Number.isFinite(bottom)).toBe(true);
      expect(bottom).toBe(4);
    });
  });

  describe('sanitizeResponsiveLayouts', () => {
    it('sanitizes all responsive breakpoints', () => {
      const corrupt = {
        lg: [{ i: 'w1', x: 0, y: Infinity, w: 4, h: 2 }],
        md: [{ i: 'w1', x: 0, y: null, w: 4, h: 2 }],
        sm: [{ i: 'w1', x: 0, y: NaN, w: 6, h: 2 }],
        xs: [],
        xxs: null,
      };

      const sanitized = sanitizeResponsiveLayouts(corrupt);
      expect(sanitized.lg[0].y).toBe(0);
      expect(sanitized.md[0].y).toBe(0);
      expect(sanitized.sm[0].y).toBe(0);
      expect(sanitized.xs).toEqual([]);
      expect(sanitized.xxs).toEqual([]);
    });
  });
});

describe('applyRegistryMinimums', () => {
  it('保存済みの minW / minH をレジストリの現在値で上書きし、未知の型はそのまま残すこと', () => {
    const layouts = {
      lg: [
        { i: 'clock', x: 0, y: 0, w: 4, h: 2, minW: 3, minH: 2 },
        { i: 'mystery', x: 4, y: 0, w: 4, h: 2, minW: 3, minH: 3 },
      ],
      md: [{ i: 'clock', x: 0, y: 0, w: 4, h: 2, minW: 3, minH: 2 }],
      sm: [],
      xs: [],
    };
    const out = applyRegistryMinimums(layouts, [
      { id: 'clock', type: 'clock' },
      { id: 'mystery', type: 'nope' },
    ]);
    expect(out.lg[0]).toMatchObject({ minW: 2, minH: 1, w: 4, h: 2 });
    expect(out.lg[1]).toMatchObject({ minW: 3, minH: 3 });
    expect(out.md[0]).toMatchObject({ minW: 2, minH: 1 });
    // Input untouched.
    expect(layouts.lg[0].minW).toBe(3);
  });
});
