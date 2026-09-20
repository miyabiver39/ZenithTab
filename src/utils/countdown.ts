/**
 * Date arithmetic for the countdown widget. Everything works on local
 * calendar days ("YYYY-MM-DD"): a birthday is the same day for everyone
 * in that timezone, and "3 days left" must not flip at 09:00 because of
 * a UTC boundary.
 */

export interface CountdownTarget {
  /** ISO calendar date, "YYYY-MM-DD". */
  date: string;
  /** Roll over to the next year's occurrence once the date has passed. */
  repeatYearly?: boolean;
}

const DAY_MS = 86_400_000;

/** Local calendar date → "YYYY-MM-DD". */
export function toDayKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/** "YYYY-MM-DD" → local midnight Date, or null when it isn't a real date. */
export function parseDayKey(key: string): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(key || '');
  if (!m) return null;
  const [y, mo, d] = [Number(m[1]), Number(m[2]), Number(m[3])];
  const date = new Date(y, mo - 1, d);
  if (date.getFullYear() !== y || date.getMonth() !== mo - 1 || date.getDate() !== d) return null;
  return date;
}

/** Whole calendar days from `today` to `target` (negative when in the past). DST-safe via UTC day numbers. */
export function daysBetween(today: Date, target: Date): number {
  const a = Date.UTC(today.getFullYear(), today.getMonth(), today.getDate());
  const b = Date.UTC(target.getFullYear(), target.getMonth(), target.getDate());
  return Math.round((b - a) / DAY_MS);
}

/**
 * The occurrence the widget should count towards. A yearly event that has
 * already passed this year moves to next year; Feb 29 falls back to Feb 28
 * in non-leap years so the anniversary never silently disappears.
 */
export function nextOccurrence(target: CountdownTarget, today: Date = new Date()): Date | null {
  const base = parseDayKey(target.date);
  if (!base) return null;
  if (!target.repeatYearly) return base;

  const month = base.getMonth();
  const day = base.getDate();
  const candidate = (year: number) => {
    const d = new Date(year, month, day);
    // Feb 29 in a non-leap year overflows into March 1: clamp to Feb 28.
    if (d.getMonth() !== month) return new Date(year, month + 1, 0);
    return d;
  };
  const thisYear = candidate(today.getFullYear());
  return daysBetween(today, thisYear) >= 0 ? thisYear : candidate(today.getFullYear() + 1);
}

/** Days remaining until the counted occurrence (0 = today, negative = past for one-off events). */
export function daysUntil(target: CountdownTarget, today: Date = new Date()): number | null {
  const next = nextOccurrence(target, today);
  return next ? daysBetween(today, next) : null;
}
