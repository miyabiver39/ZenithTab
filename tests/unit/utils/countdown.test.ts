import { describe, it, expect } from 'vitest';
import { toDayKey, parseDayKey, daysBetween, nextOccurrence, daysUntil } from '../../../src/utils/countdown';

const d = (key: string) => parseDayKey(key)!;

describe('utils/countdown', () => {
  it('日付キーの往復変換と不正な日付の拒否', () => {
    expect(toDayKey(new Date(2026, 8, 20, 23, 59))).toBe('2026-09-20');
    expect(parseDayKey('2026-09-20')?.getDate()).toBe(20);
    expect(parseDayKey('2026-02-30')).toBeNull();
    expect(parseDayKey('20260920')).toBeNull();
    expect(parseDayKey('')).toBeNull();
  });

  it('日数差はローカル暦日で数え、時刻や DST の影響を受けないこと', () => {
    expect(daysBetween(new Date(2026, 8, 20, 23, 0), new Date(2026, 8, 21, 1, 0))).toBe(1);
    expect(daysBetween(d('2026-12-31'), d('2027-01-01'))).toBe(1);
    expect(daysBetween(d('2026-09-20'), d('2026-09-10'))).toBe(-10);
    // Across a spring DST change (Europe) the count must still be whole days.
    expect(daysBetween(d('2026-03-28'), d('2026-03-30'))).toBe(2);
  });

  it('一回限りのイベントはそのままの日付、毎年繰り返しは過ぎたら翌年へ', () => {
    const today = d('2026-09-20');
    expect(daysUntil({ date: '2026-12-31' }, today)).toBe(102);
    expect(daysUntil({ date: '2026-09-20' }, today)).toBe(0);
    expect(daysUntil({ date: '2026-09-01' }, today)).toBe(-19);
    // Yearly: Sep 1 already passed this year → next year's Sep 1.
    expect(toDayKey(nextOccurrence({ date: '2020-09-01', repeatYearly: true }, today)!)).toBe('2027-09-01');
    expect(daysUntil({ date: '2020-09-01', repeatYearly: true }, today)).toBe(346);
    // Yearly on the day itself counts as today, not next year.
    expect(daysUntil({ date: '1990-09-20', repeatYearly: true }, today)).toBe(0);
    expect(toDayKey(nextOccurrence({ date: '2020-12-25', repeatYearly: true }, today)!)).toBe('2026-12-25');
  });

  it('2/29 の記念日は平年では 2/28 に丸めること', () => {
    expect(toDayKey(nextOccurrence({ date: '2024-02-29', repeatYearly: true }, d('2026-01-10'))!)).toBe('2026-02-28');
    expect(toDayKey(nextOccurrence({ date: '2024-02-29', repeatYearly: true }, d('2027-12-01'))!)).toBe('2028-02-29');
  });

  it('壊れた日付は null を返すこと', () => {
    expect(nextOccurrence({ date: 'nope' })).toBeNull();
    expect(daysUntil({ date: '2026-13-01' })).toBeNull();
  });
});
