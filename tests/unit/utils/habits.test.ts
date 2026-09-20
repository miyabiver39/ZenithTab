import { describe, it, expect } from 'vitest';
import { currentStreak, longestStreak, lastNDays, toggleDay } from '../../../src/utils/habits';

const today = new Date(2026, 8, 20);

describe('utils/habits', () => {
  it('今日未達成でも昨日まで続いていればストリークを維持すること', () => {
    expect(currentStreak(['2026-09-17', '2026-09-18', '2026-09-19'], today)).toBe(3);
    expect(currentStreak(['2026-09-17', '2026-09-18', '2026-09-19', '2026-09-20'], today)).toBe(4);
  });

  it('途切れたら途切れ以降だけ数え、何もなければ 0', () => {
    expect(currentStreak(['2026-09-15', '2026-09-16', '2026-09-18', '2026-09-20'], today)).toBe(1);
    expect(currentStreak(['2026-09-15', '2026-09-16'], today)).toBe(0);
    expect(currentStreak([], today)).toBe(0);
    // Duplicates and order don't matter.
    expect(currentStreak(['2026-09-20', '2026-09-19', '2026-09-19'], today)).toBe(2);
  });

  it('最長ストリークは履歴全体から求めること', () => {
    expect(longestStreak(['2026-01-01', '2026-01-02', '2026-01-03', '2026-03-01', '2026-03-02'])).toBe(3);
    expect(longestStreak(['bad', '2026-01-01'])).toBe(1);
    expect(longestStreak([])).toBe(0);
  });

  it('直近 N 日は古い順で今日で終わり、月をまたいでも連続すること', () => {
    expect(lastNDays(new Date(2026, 9, 2), 4)).toEqual(['2026-09-29', '2026-09-30', '2026-10-01', '2026-10-02']);
  });

  it('toggleDay は追加と削除を切り替えること', () => {
    expect(toggleDay([], '2026-09-20')).toEqual(['2026-09-20']);
    expect(toggleDay(['2026-09-19', '2026-09-20'], '2026-09-20')).toEqual(['2026-09-19']);
  });
});
