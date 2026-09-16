import { Layout } from 'react-grid-layout';
import { ResponsiveLayouts } from '../types/widget';

/**
 * Returns a valid non-negative finite integer, falling back to a default if the
 * value is missing, null, undefined, NaN, or non-finite (e.g. Infinity).
 */
export function toSafeInt(val: unknown, fallback: number = 0): number {
  if (typeof val !== 'number' || !Number.isFinite(val)) {
    return Math.max(0, Math.floor(fallback));
  }
  return Math.max(0, Math.floor(val));
}

/**
 * Sanitizes an individual Layout item so that it never contains null, NaN,
 * Infinity, or negative numbers that can cause react-grid-layout infinite loops.
 */
export function sanitizeLayout(layout: any): Layout {
  if (!layout || typeof layout !== 'object') {
    return {
      i: 'widget-unknown',
      x: 0,
      y: 0,
      w: 4,
      h: 3,
    };
  }

  const minW = layout.minW !== undefined ? toSafeInt(layout.minW, 1) : undefined;
  const minH = layout.minH !== undefined ? toSafeInt(layout.minH, 1) : undefined;
  const maxW = layout.maxW !== undefined ? toSafeInt(layout.maxW, 12) : undefined;
  const maxH = layout.maxH !== undefined ? toSafeInt(layout.maxH, 100) : undefined;

  const w = Math.max(1, toSafeInt(layout.w, 4));
  const h = Math.max(1, toSafeInt(layout.h, 3));

  return {
    i: typeof layout.i === 'string' && layout.i ? layout.i : 'widget-unknown',
    x: toSafeInt(layout.x, 0),
    y: toSafeInt(layout.y, 0),
    w,
    h,
    ...(minW !== undefined ? { minW } : {}),
    ...(minH !== undefined ? { minH } : {}),
    ...(maxW !== undefined ? { maxW } : {}),
    ...(maxH !== undefined ? { maxH } : {}),
    ...(layout.static !== undefined ? { static: Boolean(layout.static) } : {}),
    ...(layout.isDraggable !== undefined ? { isDraggable: Boolean(layout.isDraggable) } : {}),
    ...(layout.isResizable !== undefined ? { isResizable: Boolean(layout.isResizable) } : {}),
  };
}

/**
 * Calculates the next available bottom Y coordinate for a list of layouts.
 * Computes max(item.y + item.h). Guaranteed to return a finite non-negative integer.
 */
export function calculateBottomY(layouts: Layout[]): number {
  if (!Array.isArray(layouts) || layouts.length === 0) return 0;
  return layouts.reduce((maxY, item) => {
    const safeY = toSafeInt(item.y, 0);
    const safeH = Math.max(1, toSafeInt(item.h, 1));
    return Math.max(maxY, safeY + safeH);
  }, 0);
}

/**
 * Sanitizes all responsive layouts (lg, md, sm, xs, xxs).
 */
export function sanitizeResponsiveLayouts(layouts: any): ResponsiveLayouts {
  const sanitizeList = (list: any): Layout[] => {
    if (!Array.isArray(list)) return [];
    return list.map(sanitizeLayout);
  };

  if (!layouts || typeof layouts !== 'object') {
    return { lg: [], md: [], sm: [], xs: [], xxs: [] };
  }

  return {
    lg: sanitizeList(layouts.lg),
    md: sanitizeList(layouts.md),
    sm: sanitizeList(layouts.sm),
    xs: sanitizeList(layouts.xs),
    xxs: sanitizeList(layouts.xxs),
  };
}
