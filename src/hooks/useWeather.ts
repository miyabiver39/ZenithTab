import { useState, useEffect, useCallback, useRef } from 'react';
import { WeatherData } from '../types/weather';
import { weatherService } from '../services/weatherService';
import { useTranslation } from '../i18n/i18n';

export function useWeather(lat = 35.6762, lon = 139.6503, city = 'Tokyo') {
  const { t } = useTranslation();
  // Read fresh inside the catch block without making fetchWeatherData's
  // identity depend on the language — a language switch shouldn't restart
  // this effect or trigger an extra fetch.
  const fallbackErrorRef = useRef(t.widgets.weather.unavailable);
  useEffect(() => {
    fallbackErrorRef.current = t.widgets.weather.unavailable;
  }, [t]);

  const [data, setData] = useState<WeatherData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchWeatherData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await weatherService.fetchWeather(lat, lon, city);
      setData(result);
    } catch (err: any) {
      setError(err?.message || fallbackErrorRef.current);
    } finally {
      setIsLoading(false);
    }
  }, [lat, lon, city]);

  useEffect(() => {
    fetchWeatherData();
  }, [fetchWeatherData]);

  return {
    weather: data,
    isLoading,
    error,
    refresh: fetchWeatherData,
  };
}
