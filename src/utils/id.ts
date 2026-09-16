let counter = 0;

/**
 * Collision-free id for user-created things (pages, widgets, dock items…).
 * A bare `Date.now()` is not enough: two creations in the same millisecond
 * (page duplication, a quick double-click, test setups) used to share an
 * id and silently corrupt the list they were added to.
 */
export function uniqueId(prefix: string): string {
  counter = (counter + 1) % 1000;
  return `${prefix}-${Date.now().toString(36)}${counter.toString(36).padStart(2, '0')}${Math.random().toString(36).slice(2, 6)}`;
}
