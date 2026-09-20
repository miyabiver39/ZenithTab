import { toDayKey, parseDayKey, daysBetween } from './countdown';

export { toDayKey };

/**
 * Streak maths for the habit tracker. A habit's history is the list of
 * local calendar days ("YYYY-MM-DD") it was checked off on; order and
 * duplicates don't matter.
 */

function shiftDays(date: Date, days: number): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + days);
}

/**
 * Consecutive days ending today — or ending yesterday when today isn't
 * checked yet, so the number doesn't drop to 0 every morning before the
 * user has had a chance to tick it.
 */
export function currentStreak(history: string[], today: Date = new Date()): number {
  const done = new Set(history);
  let cursor = done.has(toDayKey(today)) ? today : shiftDays(today, -1);
  let streak = 0;
  while (done.has(toDayKey(cursor))) {
    streak += 1;
    cursor = shiftDays(cursor, -1);
  }
  return streak;
}

/** The longest run of consecutive checked days anywhere in the history. */
export function longestStreak(history: string[]): number {
  const days = Array.from(new Set(history))
    .map(parseDayKey)
    .filter((d): d is Date => d !== null)
    .sort((a, b) => a.getTime() - b.getTime());
  let best = 0;
  let run = 0;
  for (let i = 0; i < days.length; i++) {
    run = i > 0 && daysBetween(days[i - 1], days[i]) === 1 ? run + 1 : 1;
    best = Math.max(best, run);
  }
  return best;
}

/** Day keys for the last `n` days, oldest first, ending with today. */
export function lastNDays(today: Date, n: number): string[] {
  const keys: string[] = [];
  for (let i = n - 1; i >= 0; i--) keys.push(toDayKey(shiftDays(today, -i)));
  return keys;
}

/** History with `dayKey` added or removed. */
export function toggleDay(history: string[], dayKey: string): string[] {
  return history.includes(dayKey) ? history.filter((d) => d !== dayKey) : [...history, dayKey];
}
