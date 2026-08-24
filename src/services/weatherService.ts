import { WeatherData } from '../types/weather';
import { storageGet, storageSet } from '../utils/storage';

const WEATHER_CACHE_KEY = 'zenith_weather_cache';
const GEOCODE_CACHE_KEY = 'zenith_reverse_geocode_cache';
const CACHE_TTL_MS = 1000 * 60 * 30; // 30 mins
// Reverse-geocoded place names effectively never change, so we cache them for a
// long time. This keeps us well inside the Nominatim usage policy (occasional,
// user-initiated single requests rather than systematic querying).
const GEOCODE_CACHE_TTL_MS = 1000 * 60 * 60 * 24 * 30; // 30 days
const REQUEST_TIMEOUT_MS = 10000;

// WMO Weather interpretation codes (WW)
const WMO_CODES: Record<number, string> = {
  0: 'Clear sky',
  1: 'Mainly clear',
  2: 'Partly cloudy',
  3: 'Overcast',
  45: 'Fog',
  48: 'Depositing rime fog',
  51: 'Light drizzle',
  53: 'Moderate drizzle',
  55: 'Dense drizzle',
  61: 'Slight rain',
  63: 'Moderate rain',
  65: 'Heavy rain',
  71: 'Slight snow',
  73: 'Moderate snow',
  75: 'Heavy snow',
  77: 'Snow grains',
  80: 'Slight rain showers',
  81: 'Moderate rain showers',
  82: 'Violent rain showers',
  85: 'Slight snow showers',
  86: 'Heavy snow showers',
  95: 'Thunderstorm',
  96: 'Thunderstorm with slight hail',
  99: 'Thunderstorm with heavy hail',
};

export interface GeolocationResult {
  latitude: number;
  longitude: number;
  city: string;
  country?: string;
}

export type GeolocationFailureReason = 'denied' | 'unavailable' | 'timeout' | 'unsupported';

export class GeolocationFailure extends Error {
  reason: GeolocationFailureReason;

  constructor(reason: GeolocationFailureReason, message: string) {
    super(message);
    this.name = 'GeolocationFailure';
    this.reason = reason;
  }
}

interface CachedPlaceName {
  city: string;
  country?: string;
  cachedAt: number;
}

function fetchWithTimeout(input: string, init: RequestInit = {}, timeoutMs = REQUEST_TIMEOUT_MS) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  return fetch(input, { ...init, signal: controller.signal }).finally(() => clearTimeout(timer));
}

/** Rounded to ~1km so nearby detections reuse the same cached place name. */
function placeCacheKey(lat: number, lon: number): string {
  return `${lat.toFixed(2)},${lon.toFixed(2)}`;
}

export const weatherService = {
  getConditionName(code: number): string {
    return WMO_CODES[code] || 'Clear';
  },

  /**
   * Resolves a coordinate pair to a human-readable place name.
   * Results are cached for 30 days so a given user hits the geocoding service
   * at most a handful of times, and only after an explicit click.
   */
  async reverseGeocode(lat: number, lon: number): Promise<{ city: string; country?: string }> {
    const key = placeCacheKey(lat, lon);
    const cacheStore = (await storageGet<Record<string, CachedPlaceName>>(GEOCODE_CACHE_KEY, {})) || {};
    const cached = cacheStore[key];

    if (cached && Date.now() - cached.cachedAt < GEOCODE_CACHE_TTL_MS) {
      return { city: cached.city, country: cached.country };
    }

    // NOTE: `User-Agent` is a forbidden header for fetch() and is silently
    // dropped by the browser, so we do not attempt to set it. Chrome sends the
    // extension origin, which is what identifies us upstream.
    const response = await fetchWithTimeout(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=10&addressdetails=1`,
      {
        headers: {
          'Accept-Language': navigator.language || 'en',
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Reverse geocoding failed: ${response.status}`);
    }

    const geoData = await response.json();
    const address = geoData.address || {};
    const city =
      address.city ||
      address.town ||
      address.village ||
      address.suburb ||
      address.county ||
      address.state ||
      'Current Location';

    cacheStore[key] = { city, country: address.country, cachedAt: Date.now() };
    await storageSet(GEOCODE_CACHE_KEY, cacheStore);

    return { city, country: address.country };
  },

  /**
   * Requests the user's coordinates. Requires the `geolocation` permission in
   * manifest.json — extension pages cannot show a permission prompt, so without
   * the declared permission Chrome rejects the request outright.
   */
  async detectUserLocation(): Promise<GeolocationResult> {
    const position = await new Promise<GeolocationPosition>((resolve, reject) => {
      if (typeof navigator === 'undefined' || !navigator.geolocation) {
        reject(new GeolocationFailure('unsupported', 'Geolocation is not supported in this context.'));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        resolve,
        (error) => {
          const reason: GeolocationFailureReason =
            error.code === error.PERMISSION_DENIED
              ? 'denied'
              : error.code === error.TIMEOUT
                ? 'timeout'
                : 'unavailable';
          reject(new GeolocationFailure(reason, error.message || 'Failed to determine location.'));
        },
        {
          timeout: REQUEST_TIMEOUT_MS,
          enableHighAccuracy: false,
          maximumAge: 1000 * 60 * 10,
        }
      );
    });

    const latitude = Number(position.coords.latitude.toFixed(4));
    const longitude = Number(position.coords.longitude.toFixed(4));

    try {
      const { city, country } = await this.reverseGeocode(latitude, longitude);
      return { latitude, longitude, city, country };
    } catch {
      // Coordinates alone are enough to show the forecast; the label is cosmetic.
      return { latitude, longitude, city: 'Current Location' };
    }
  },

  async searchCities(query: string): Promise<Array<{ name: string; latitude: number; longitude: number; country?: string; admin1?: string }>> {
    if (!query.trim()) return [];
    try {
      const res = await fetchWithTimeout(
        `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=5&language=${navigator.language || 'en'}&format=json`
      );
      if (!res.ok) return [];
      const data = await res.json();
      return (data.results || []).map((r: any) => ({
        name: r.name,
        latitude: r.latitude,
        longitude: r.longitude,
        country: r.country,
        admin1: r.admin1,
      }));
    } catch {
      return [];
    }
  },

  async fetchWeather(lat = 35.6762, lon = 139.6503, city = 'Tokyo'): Promise<WeatherData> {
    const cacheKey = `${WEATHER_CACHE_KEY}_${lat.toFixed(2)}_${lon.toFixed(2)}`;
    const cached = await storageGet<WeatherData>(cacheKey);
    const now = Date.now();

    if (cached && now - cached.lastUpdated < CACHE_TTL_MS) {
      return cached;
    }

    try {
      const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,weather_code,wind_speed_10m&daily=weather_code,temperature_2m_max,temperature_2m_min&timezone=auto&forecast_days=4`;

      const response = await fetchWithTimeout(url);
      if (!response.ok) {
        throw new Error(`Weather API error: ${response.status}`);
      }

      const data = await response.json();
      const current = data.current;
      const daily = data.daily;

      if (!current || !daily?.time) {
        throw new Error('Weather API returned an unexpected payload.');
      }

      const forecast = daily.time.map((date: string, i: number) => ({
        date,
        maxTemp: Math.round(daily.temperature_2m_max[i]),
        minTemp: Math.round(daily.temperature_2m_min[i]),
        weatherCode: daily.weather_code[i],
        condition: WMO_CODES[daily.weather_code[i]] || 'Clear',
      }));

      const weatherData: WeatherData = {
        city,
        current: {
          temperature: Math.round(current.temperature_2m),
          apparentTemperature: Math.round(current.apparent_temperature),
          weatherCode: current.weather_code,
          condition: WMO_CODES[current.weather_code] || 'Clear',
          isDay: current.is_day === 1,
          windSpeed: Math.round(current.wind_speed_10m),
          humidity: current.relative_humidity_2m,
          time: current.time,
        },
        forecast,
        lastUpdated: now,
      };

      await storageSet(cacheKey, weatherData);
      return weatherData;
    } catch (error) {
      console.error('Failed to fetch weather from Open-Meteo:', error);

      // A stale reading is still a real reading, so it is safe to show.
      if (cached) return cached;

      // Never fabricate a forecast: surface the failure so the widget can show
      // an explicit "unavailable" state instead of plausible-looking fiction.
      throw error instanceof Error ? error : new Error('Failed to fetch weather.');
    }
  },
};
