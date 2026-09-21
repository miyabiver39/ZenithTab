import { describe, it, expect } from 'vitest';
import { findCityTimeZone, formatInTimeZone } from '../../../src/utils/worldClock';

describe('worldClock › findCityTimeZone', () => {
  it('英語名・各言語の別名・国名から同じゾーンに解決すること', () => {
    for (const name of ['London', 'ロンドン', '伦敦', '런던', 'Londres', 'UK']) {
      expect(findCityTimeZone(name), name).toEqual({ city: 'London', timeZone: 'Europe/London' });
    }
    for (const name of ['New York', 'NYC', 'ニューヨーク', 'Boston', 'Toronto', '미국']) {
      expect(findCityTimeZone(name)?.timeZone, name).toBe('America/New_York');
    }
    expect(findCityTimeZone('Osaka')).toEqual({ city: 'Tokyo', timeZone: 'Asia/Tokyo' });
    expect(findCityTimeZone('Beijing')?.timeZone).toBe('Asia/Shanghai');
    expect(findCityTimeZone('gmt')).toEqual({ city: 'UTC', timeZone: 'UTC' });
  });

  it('大文字小文字・アクセント・前後の空白・区切り文字の違いを無視すること', () => {
    expect(findCityTimeZone('  são paulo ')?.city).toBe('São Paulo');
    expect(findCityTimeZone('SAO_PAULO')?.city).toBe('São Paulo');
    expect(findCityTimeZone('Zürich')?.city).toBe('Zurich');
    expect(findCityTimeZone('zurich')?.city).toBe('Zurich');
    expect(findCityTimeZone('Ciudad de Mexico')?.city).toBe('Mexico City');
    expect(findCityTimeZone('los-angeles')?.timeZone).toBe('America/Los_Angeles');
    expect(findCityTimeZone('Hong  Kong')?.timeZone).toBe('Asia/Hong_Kong');
  });

  it('知らない名前や空文字には null を返すこと', () => {
    expect(findCityTimeZone('')).toBeNull();
    expect(findCityTimeZone('Atlantis')).toBeNull();
    expect(findCityTimeZone('Londonderry')).toBeNull();
  });
});

describe('worldClock › formatInTimeZone', () => {
  const at = (iso: string) => new Date(iso);

  it('時刻・日付・オフセットをゾーンごとに整形すること', () => {
    const noon = at('2026-01-15T12:00:00Z');
    expect(formatInTimeZone(noon, 'UTC')).toEqual({ time: '12:00', date: '2026-01-15', offset: 'UTC' });
    expect(formatInTimeZone(noon, 'Asia/Tokyo')).toEqual({ time: '21:00', date: '2026-01-15', offset: 'UTC+9' });
    expect(formatInTimeZone(noon, 'Asia/Kolkata')).toEqual({ time: '17:30', date: '2026-01-15', offset: 'UTC+5:30' });
    expect(formatInTimeZone(noon, 'America/Los_Angeles')).toEqual({ time: '04:00', date: '2026-01-15', offset: 'UTC-8' });
  });

  it('日付をまたぐ場合はそのゾーンの日付になり、深夜 0 時は 00 で表すこと', () => {
    const late = at('2026-01-15T23:30:00Z');
    expect(formatInTimeZone(late, 'Asia/Tokyo')).toEqual({ time: '08:30', date: '2026-01-16', offset: 'UTC+9' });
    expect(formatInTimeZone(late, 'Pacific/Honolulu')).toEqual({ time: '13:30', date: '2026-01-15', offset: 'UTC-10' });
    expect(formatInTimeZone(at('2026-01-15T00:00:00Z'), 'UTC').time).toBe('00:00');
    expect(formatInTimeZone(at('2026-01-15T15:00:00Z'), 'Asia/Tokyo').time).toBe('00:00');
  });

  it('夏時間を反映すること', () => {
    expect(formatInTimeZone(at('2026-07-15T12:00:00Z'), 'Europe/London').offset).toBe('UTC+1');
    expect(formatInTimeZone(at('2026-01-15T12:00:00Z'), 'Europe/London').offset).toBe('UTC');
    expect(formatInTimeZone(at('2026-07-15T12:00:00Z'), 'America/New_York')).toEqual({ time: '08:00', date: '2026-07-15', offset: 'UTC-4' });
  });
});
