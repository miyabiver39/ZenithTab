import { describe, it, expect, vi, afterEach } from 'vitest';
import { weatherService, GeolocationFailure } from '../../../src/services/weatherService';
import { chromeStorageData } from '../../helpers/chrome';

function mockFetchJson(payload: unknown, ok = true, status = 200) {
  return vi.spyOn(globalThis, 'fetch').mockResolvedValue({
    ok,
    status,
    statusText: ok ? 'OK' : 'Error',
    json: async () => payload,
  } as Response);
}

function mockGeolocation(impl: (success: PositionCallback, error?: PositionErrorCallback) => void) {
  Object.defineProperty(navigator, 'geolocation', {
    configurable: true,
    value: { getCurrentPosition: vi.fn(impl) },
  });
}

describe('weatherService (geocoding & cities)', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    Object.defineProperty(navigator, 'geolocation', { configurable: true, value: undefined });
  });

  describe('searchCities', () => {
    it('Open-Meteo の候補を整形して返すこと', async () => {
      mockFetchJson({ results: [{ name: 'Osaka', latitude: 34.69, longitude: 135.5, country: 'Japan', admin1: 'Osaka' }] });
      const results = await weatherService.searchCities('Osa');
      expect(results).toEqual([{ name: 'Osaka', latitude: 34.69, longitude: 135.5, country: 'Japan', admin1: 'Osaka' }]);
    });

    it('HTTPエラーやネットワーク例外では空配列を返すこと', async () => {
      mockFetchJson({}, false, 500);
      expect(await weatherService.searchCities('x')).toEqual([]);
      vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('offline'));
      expect(await weatherService.searchCities('x')).toEqual([]);
    });

    it('results が無いレスポンスでも空配列を返すこと', async () => {
      mockFetchJson({});
      expect(await weatherService.searchCities('x')).toEqual([]);
    });
  });

  describe('reverseGeocode', () => {
    it('住所から都市名を解決してキャッシュすること', async () => {
      const fetchSpy = mockFetchJson({ address: { town: 'Kamakura', country: 'Japan' } });

      const first = await weatherService.reverseGeocode(35.3192, 139.5467);
      expect(first).toEqual({ city: 'Kamakura', country: 'Japan' });
      expect(Object.keys(chromeStorageData).some((k) => k.includes('geocode'))).toBe(true);

      const second = await weatherService.reverseGeocode(35.3192, 139.5467);
      expect(second.city).toBe('Kamakura');
      expect(fetchSpy).toHaveBeenCalledTimes(1);
    });

    it('都市情報が無い場合は "Current Location" にフォールバックすること', async () => {
      mockFetchJson({ address: {} });
      const result = await weatherService.reverseGeocode(1.1, 2.2);
      expect(result.city).toBe('Current Location');
    });

    it('HTTPエラーは例外にすること', async () => {
      mockFetchJson({}, false, 429);
      await expect(weatherService.reverseGeocode(3.3, 4.4)).rejects.toThrow(/429/);
    });
  });

  describe('detectUserLocation', () => {
    it('geolocation 非対応なら unsupported で失敗すること', async () => {
      await expect(weatherService.detectUserLocation()).rejects.toMatchObject({ reason: 'unsupported' });
    });

    it('権限拒否は denied、タイムアウトは timeout、それ以外は unavailable に分類すること', async () => {
      const makeError = (code: number) => ({ code, message: 'err', PERMISSION_DENIED: 1, POSITION_UNAVAILABLE: 2, TIMEOUT: 3 });

      mockGeolocation((_ok, err) => err?.(makeError(1) as GeolocationPositionError));
      await expect(weatherService.detectUserLocation()).rejects.toMatchObject({ reason: 'denied' });

      mockGeolocation((_ok, err) => err?.(makeError(3) as GeolocationPositionError));
      await expect(weatherService.detectUserLocation()).rejects.toMatchObject({ reason: 'timeout' });

      mockGeolocation((_ok, err) => err?.(makeError(2) as GeolocationPositionError));
      const failure = await weatherService.detectUserLocation().catch((e) => e);
      expect(failure).toBeInstanceOf(GeolocationFailure);
      expect(failure.reason).toBe('unavailable');
    });

    it('座標を丸め、逆ジオコーディングの結果を添えて返すこと', async () => {
      mockGeolocation((ok) => ok({ coords: { latitude: 35.123456, longitude: 139.654321 } } as GeolocationPosition));
      mockFetchJson({ address: { city: 'Yokohama', country: 'Japan' } });

      const result = await weatherService.detectUserLocation();
      expect(result).toEqual({ latitude: 35.1235, longitude: 139.6543, city: 'Yokohama', country: 'Japan' });
    });

    it('逆ジオコーディングに失敗しても座標と仮の都市名を返すこと', async () => {
      mockGeolocation((ok) => ok({ coords: { latitude: 10, longitude: 20 } } as GeolocationPosition));
      vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('offline'));

      const result = await weatherService.detectUserLocation();
      expect(result).toEqual({ latitude: 10, longitude: 20, city: 'Current Location' });
    });
  });

  describe('fetchWeather', () => {
    it('不正なペイロードは例外にすること', async () => {
      vi.spyOn(console, 'error').mockImplementation(() => {});
      mockFetchJson({ current: null });
      await expect(weatherService.fetchWeather(50.5, 60.5, 'Nowhere')).rejects.toThrow();
    });

    it('TTL内はキャッシュを返すこと', async () => {
      const payload = {
        current: { temperature_2m: 10, apparent_temperature: 9, weather_code: 0, is_day: 1, wind_speed_10m: 1, relative_humidity_2m: 50, time: 't' },
        daily: { time: ['d1'], weather_code: [0], temperature_2m_max: [12], temperature_2m_min: [8] },
      };
      const fetchSpy = mockFetchJson(payload);
      await weatherService.fetchWeather(70.7, 80.8, 'Cachetown');
      await weatherService.fetchWeather(70.7, 80.8, 'Cachetown');
      expect(fetchSpy).toHaveBeenCalledTimes(1);
    });
  });
});
