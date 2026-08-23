import { useState, useEffect, useCallback } from 'react';
import { WeatherData } from '../types/weather';
import { weatherService } from '../services/weatherService';

export function useWeather(lat = 35.6762, lon = 139.6503, city = 'Tokyo') {
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
      setError(err?.message || 'Failed to fetch weather');
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
