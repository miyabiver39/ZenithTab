import { WeatherData } from '../types/weather';
import { storageGet, storageSet } from '../utils/storage';

const WEATHER_CACHE_KEY = 'zenith_weather_cache';
const CACHE_TTL_MS = 1000 * 60 * 30; // 30 mins

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

export const weatherService = {
  getConditionName(code: number): string {
    return WMO_CODES[code] || 'Clear';
  },

  async fetchWeather(lat = 35.6762, lon = 139.6503, city = 'Tokyo'): Promise<WeatherData> {
    const cacheKey = `${WEATHER_CACHE_KEY}_${lat}_${lon}`;
    const cached = await storageGet<WeatherData>(cacheKey);
    const now = Date.now();

    if (cached && now - cached.lastUpdated < CACHE_TTL_MS) {
      return cached;
    }

    try {
      const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,weather_code,wind_speed_10m&daily=weather_code,temperature_2m_max,temperature_2m_min&timezone=auto&forecast_days=4`;

      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Weather API error: ${response.status}`);
      }

      const data = await response.json();
      const current = data.current;
      const daily = data.daily;

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

      if (cached) return cached;

      // Fallback mock weather data
      return {
        city,
        current: {
          temperature: 22,
          apparentTemperature: 21,
          weatherCode: 0,
          condition: 'Clear sky',
          isDay: true,
          windSpeed: 8,
          humidity: 55,
          time: new Date().toISOString(),
        },
        forecast: [
          { date: 'Today', maxTemp: 24, minTemp: 18, weatherCode: 0, condition: 'Clear' },
          { date: 'Tomorrow', maxTemp: 25, minTemp: 19, weatherCode: 1, condition: 'Mainly clear' },
          { date: 'Day 3', maxTemp: 22, minTemp: 17, weatherCode: 2, condition: 'Partly cloudy' },
        ],
        lastUpdated: now,
      };
    }
  },
};
