import { vi } from 'vitest';
import userEvent from '@testing-library/user-event';

/**
 * One user-event instance per test. `delay: null` removes the built-in
 * pause between keystrokes so the same instance works under both real and
 * fake timers (no timer to advance) and keeps the suite fast.
 *
 * Things user-event deliberately can't do — drag a range slider, HTML5
 * drag-and-drop, fire `load`/`error` on media — still use fireEvent, with
 * a comment at the call site.
 */
export function setupUser() {
  return userEvent.setup({
    delay: null,
    // Under fake timers user-event's internal waits would never resolve;
    // advance the clock for them (a no-op with real timers).
    advanceTimers: (ms) => {
      if (vi.isFakeTimers()) vi.advanceTimersByTime(ms);
    },
  });
}

/** user.type() treats `{` and `[` as key descriptors; escape literal ones. */
export function literal(text: string): string {
  return text.replace(/\{/g, '{{').replace(/\[/g, '[[');
}
