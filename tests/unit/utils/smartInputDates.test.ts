import { describe, it, expect } from 'vitest';
import { evaluateSmartInput, addToDate } from '../../../src/utils/smartInput';
import { findCityTimeZone, formatInTimeZone } from '../../../src/utils/worldClock';
import { describe as describeResult } from '../../../src/components/widgets/SearchWidget/SmartResultCard';
import { en } from '../../../src/i18n/locales/en';

// 2026-09-20 (Sunday) 12:00 local.
const now = new Date(2026, 8, 20, 12, 0);
const evalAt = (q: string) => evaluateSmartInput(q, { now });

describe('smart input: dates and world time', () => {
  it('「N 日後 / in N days / ago」を日付にすること(多言語)', () => {
    expect(evalAt('in 30 days')).toEqual({ kind: 'dateadd', date: '2026-10-20', days: 30 });
    expect(evalAt('2 weeks ago')).toEqual({ kind: 'dateadd', date: '2026-09-06', days: -14 });
    expect(evalAt('3 months from now')).toEqual({ kind: 'dateadd', date: '2026-12-20', days: 91 });
    expect(evalAt('1 year later')).toMatchObject({ kind: 'dateadd', date: '2027-09-20' });
    expect(evalAt('30日後')).toEqual({ kind: 'dateadd', date: '2026-10-20', days: 30 });
    expect(evalAt('3週間前')).toEqual({ kind: 'dateadd', date: '2026-08-30', days: -21 });
    expect(evalAt('2ヶ月後')).toMatchObject({ date: '2026-11-20' });
    expect(evalAt('10天后')).toMatchObject({ date: '2026-09-30' });
    expect(evalAt('2주 뒤')).toMatchObject({ date: '2026-10-04' });
    expect(evalAt('dentro de 5 días')).toMatchObject({ date: '2026-09-25' });
    expect(evalAt('hace 5 días')).toMatchObject({ date: '2026-09-15' });
    expect(evalAt('dans 3 semaines')).toMatchObject({ date: '2026-10-11' });
    expect(evalAt('vor 2 Wochen')).toMatchObject({ date: '2026-09-06' });
    expect(evalAt('in 1 Monat')).toMatchObject({ date: '2026-10-20' });
  });

  it('月・年の加算は月末に丸め、翌月へ繰り越さないこと', () => {
    const key = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    expect(key(addToDate(new Date(2026, 2, 31), 1, 'month'))).toBe('2026-04-30');
    expect(key(addToDate(new Date(2026, 0, 31), 1, 'month'))).toBe('2026-02-28');
    expect(key(addToDate(new Date(2024, 0, 31), 1, 'month'))).toBe('2024-02-29');
    expect(key(addToDate(new Date(2026, 2, 31), -1, 'month'))).toBe('2026-02-28');
    expect(key(addToDate(new Date(2026, 9, 31), 13, 'month'))).toBe('2027-11-30');
    expect(key(addToDate(new Date(2024, 1, 29), 1, 'year'))).toBe('2025-02-28');
    expect(key(addToDate(new Date(2024, 1, 29), 4, 'year'))).toBe('2028-02-29');
    // Day / week steps still roll over normally.
    expect(key(addToDate(new Date(2026, 0, 31), 1, 'day'))).toBe('2026-02-01');
    expect(key(addToDate(new Date(2026, 11, 25), 1, 'week'))).toBe('2027-01-01');

    expect(evaluateSmartInput('1ヶ月後', { now: new Date(2026, 2, 31) })).toMatchObject({ kind: 'dateadd', date: '2026-04-30', days: 30 });
    expect(evaluateSmartInput('1 year later', { now: new Date(2024, 1, 29) })).toMatchObject({ date: '2025-02-28' });
  });

  it('英語の「30 days」だけ(in / ago なし)は検索として扱うこと', () => {
    expect(evalAt('30 days')).toBeNull();
    expect(evalAt('0日後')).toBeNull();
  });

  it('日付の曜日を答え、曜日語がない日付は「あと何日」のままにすること', () => {
    expect(evalAt('what day is 2026-12-25')).toEqual({ kind: 'weekday', date: '2026-12-25' });
    expect(evalAt('2026-12-25 は何曜日')).toEqual({ kind: 'weekday', date: '2026-12-25' });
    expect(evalAt('2026年12月25日は何曜日?')).toEqual({ kind: 'weekday', date: '2026-12-25' });
    expect(evalAt('2026-12-25 요일')).toEqual({ kind: 'weekday', date: '2026-12-25' });
    expect(evalAt('2026/12/25 星期几')).toEqual({ kind: 'weekday', date: '2026-12-25' });
    expect(evalAt('2026-02-30 は何曜日')).toBeNull();
    expect(evalAt('2026-12-25')).toMatchObject({ kind: 'days' });
  });

  it('都市名から世界の時刻を出し、知らない都市には反応しないこと', () => {
    const london = evalAt('time in London');
    expect(london).toMatchObject({ kind: 'time', city: 'London', timeZone: 'Europe/London' });
    expect((london as any).time).toMatch(/^\d{2}:\d{2}$/);
    expect(evalAt('tokyo time')).toMatchObject({ kind: 'time', city: 'Tokyo' });
    expect(evalAt('ニューヨークの時間')).toMatchObject({ city: 'New York', timeZone: 'America/New_York' });
    expect(evalAt('パリは今何時?')).toMatchObject({ city: 'Paris' });
    expect(evalAt('北京时间')).toMatchObject({ city: 'Shanghai' });
    expect(evalAt('서울 시간')).toMatchObject({ city: 'Seoul' });
    expect(evalAt('hora en Madrid')).toMatchObject({ city: 'Madrid' });
    expect(evalAt('quelle heure est-il à Montréal')).toMatchObject({ timeZone: 'America/New_York' });
    expect(evalAt('wie spät ist es in Berlin')).toMatchObject({ city: 'Berlin' });
    expect(evalAt('iphone time')).toBeNull();
    expect(evalAt('time in atlantis')).toBeNull();
  });

  it('worldClock: 正規化して一致し、時刻をゾーンで整形すること', () => {
    expect(findCityTimeZone('  Sao Paulo ')).toEqual({ city: 'São Paulo', timeZone: 'America/Sao_Paulo' });
    expect(findCityTimeZone('ZÜRICH')).toEqual({ city: 'Zurich', timeZone: 'Europe/Zurich' });
    expect(findCityTimeZone('nowhere')).toBeNull();
    const utcNoon = new Date(Date.UTC(2026, 0, 15, 12, 0));
    expect(formatInTimeZone(utcNoon, 'Asia/Tokyo')).toEqual({ time: '21:00', date: '2026-01-15', offset: 'UTC+9' });
    expect(formatInTimeZone(utcNoon, 'America/New_York')).toEqual({ time: '07:00', date: '2026-01-15', offset: 'UTC-5' });
    expect(formatInTimeZone(new Date(Date.UTC(2026, 0, 15, 0, 0)), 'UTC').time).toBe('00:00');
  });

  it('カードの文言: 日付は UI 言語で整形し、時刻は都市とオフセットを添えること', () => {
    const labels = en.widgets.search.smart;
    const dateadd = describeResult({ kind: 'dateadd', date: '2026-10-20', days: 30 }, labels, 'en-US');
    expect(dateadd.primary).toBe('Tuesday, October 20, 2026');
    expect(dateadd.secondary).toBe('2026-10-20 · in 30 days');
    expect(dateadd.copyText).toBe('2026-10-20');
    expect(describeResult({ kind: 'dateadd', date: '2026-09-06', days: -14 }, labels, 'en-US').secondary).toContain('14 days ago');

    const weekday = describeResult({ kind: 'weekday', date: '2026-12-25' }, labels, 'ja-JP');
    expect(weekday.primary).toBe('金曜日');
    expect(weekday.copyText).toBe('金曜日');

    const time = describeResult({ kind: 'time', city: 'London', timeZone: 'Europe/London', time: '13:05', date: '2026-01-15', offset: 'UTC' }, labels);
    expect(time.primary).toBe('13:05');
    expect(time.secondary).toBe('Time in London · UTC · 2026-01-15');
  });
});
