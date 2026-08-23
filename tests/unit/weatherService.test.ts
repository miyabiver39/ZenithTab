import { describe, it, expect } from 'vitest';
import { weatherService } from '../../src/services/weatherService';

describe('weatherService', () => {
  it('WMOコードから天候テキストを正しく解決できること', () => {
    expect(weatherService.getConditionName(0)).toBe('Clear sky');
    expect(weatherService.getConditionName(61)).toBe('Slight rain');
    expect(weatherService.getConditionName(95)).toBe('Thunderstorm');
  });

  it('都市名検索が配列を返すこと', async () => {
    const results = await weatherService.searchCities('');
    expect(results).toEqual([]);
  });

  it('天気予報データを取得またはフォールバックできること', async () => {
    const weather = await weatherService.fetchWeather(35.6762, 139.6503, 'Tokyo');
    expect(weather).toBeDefined();
    expect(weather.city).toBe('Tokyo');
    expect(weather.current).toBeDefined();
    expect(typeof weather.current.temperature).toBe('number');
  });
});
