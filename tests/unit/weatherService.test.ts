import { describe, it, expect, vi, afterEach } from 'vitest';
import { weatherService } from '../../src/services/weatherService';

const OPEN_METEO_PAYLOAD = {
  current: {
    temperature_2m: 21.4,
    apparent_temperature: 20.1,
    weather_code: 61,
    is_day: 1,
    wind_speed_10m: 12.6,
    relative_humidity_2m: 68,
    time: '2026-08-24T09:00',
  },
  daily: {
    time: ['2026-08-24', '2026-08-25', '2026-08-26', '2026-08-27'],
    weather_code: [61, 0, 2, 3],
    temperature_2m_max: [24.2, 27.8, 26.1, 23.4],
    temperature_2m_min: [18.9, 20.3, 19.7, 18.2],
  },
};

function mockFetchOnce(payload: unknown, ok = true) {
  return vi.spyOn(globalThis, 'fetch').mockResolvedValue({
    ok,
    status: ok ? 200 : 503,
    statusText: ok ? 'OK' : 'Service Unavailable',
    json: async () => payload,
  } as Response);
}

describe('weatherService', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('WMOコードから天候テキストを正しく解決できること', () => {
    expect(weatherService.getConditionName(0)).toBe('Clear sky');
    expect(weatherService.getConditionName(61)).toBe('Slight rain');
    expect(weatherService.getConditionName(95)).toBe('Thunderstorm');
  });

  it('都市名検索が空クエリで配列を返すこと', async () => {
    const results = await weatherService.searchCities('');
    expect(results).toEqual([]);
  });

  it('Open-Meteoのレスポンスを整形できること', async () => {
    mockFetchOnce(OPEN_METEO_PAYLOAD);

    // キャッシュに当たらないよう他のテストと異なる座標を使う
    const weather = await weatherService.fetchWeather(10.1234, 20.1234, 'Testville');

    expect(weather.city).toBe('Testville');
    expect(weather.current.temperature).toBe(21);
    expect(weather.current.condition).toBe('Slight rain');
    expect(weather.current.isDay).toBe(true);
    expect(weather.forecast).toHaveLength(4);
    expect(weather.forecast?.[1].maxTemp).toBe(28);
  });

  it('取得に失敗しキャッシュも無い場合はダミー値を返さず例外を投げること', async () => {
    mockFetchOnce(null, false);

    await expect(
      weatherService.fetchWeather(11.4321, 21.4321, 'Nowhere')
    ).rejects.toThrow();
  });
});
