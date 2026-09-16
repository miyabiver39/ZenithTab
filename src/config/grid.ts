import type { GridBreakpoint } from '../types/widget';

/** Column count per breakpoint — the single source for the grid and for anything placing widgets. */
export const GRID_COLS: Record<GridBreakpoint, number> = { lg: 12, md: 10, sm: 6, xs: 4, xxs: 2 };

/** Viewport width (px) at which each breakpoint starts. */
export const GRID_BREAKPOINTS: Record<GridBreakpoint, number> = { lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 };

export const GRID_BREAKPOINT_KEYS: GridBreakpoint[] = ['lg', 'md', 'sm', 'xs', 'xxs'];
