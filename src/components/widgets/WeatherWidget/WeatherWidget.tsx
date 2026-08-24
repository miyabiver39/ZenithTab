import React, { useState } from 'react';
import { Cloud, CloudRain, CloudSun, Sun, Snowflake, Wind, Droplets, MapPin, RefreshCw } from 'lucide-react';
import { WeatherWidgetConfig } from '../../../types/widget';
import { useWeather } from '../../../hooks/useWeather';
import { weatherService, GeolocationFailure } from '../../../services/weatherService';
import { useDashboardStore } from '../../../store/useDashboardStore';
import { useTranslation } from '../../../i18n/i18n';

interface WeatherWidgetProps {
  widgetId?: string;
  config: WeatherWidgetConfig;
}

export const WeatherWidget: React.FC<WeatherWidgetProps> = ({ widgetId, config }) => {
  const { city = 'Tokyo', latitude = 35.6762, longitude = 139.6503, unit = 'celsius', showForecast = true } = config;
  const { weather, isLoading, error, refresh } = useWeather(latitude, longitude, city);
  const { updateWidgetConfig } = useDashboardStore();
  const { t } = useTranslation();
  const [isLocating, setIsLocating] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);

  const handleDetectLocation = async () => {
    setIsLocating(true);
    setLocationError(null);
    try {
      const location = await weatherService.detectUserLocation();
      if (widgetId) {
        updateWidgetConfig(widgetId, {
          city: location.city,
          latitude: location.latitude,
          longitude: location.longitude,
        });
      }
      refresh();
    } catch (err) {
      const reason = err instanceof GeolocationFailure ? err.reason : 'unavailable';
      setLocationError(reason === 'denied' ? t.widgets.weather.locationDenied : t.widgets.weather.locationFailed);
    } finally {
      setIsLocating(false);
    }
  };

  const getWeatherIcon = (code: number, isDay = true, size = 28) => {
    if (code === 0) {
      return isDay ? <Sun size={size} className="text-amber-400 animate-pulse-subtle" /> : <CloudSun size={size} className="text-slate-300" />;
    }
    if (code <= 3) {
      return <CloudSun size={size} className="text-amber-300" />;
    }
    if (code >= 51 && code <= 67) {
      return <CloudRain size={size} className="text-sky-400" />;
    }
    if (code >= 71 && code <= 86) {
      return <Snowflake size={size} className="text-sky-200" />;
    }
    return <Cloud size={size} className="text-slate-300" />;
  };

  const convertTemp = (tempC: number) => {
    if (unit === 'fahrenheit') {
      return Math.round((tempC * 9) / 5 + 32);
    }
    return tempC;
  };

  const unitSymbol = unit === 'fahrenheit' ? '°F' : '°C';

  if (isLoading && !weather) {
    return (
      <div className="w-full h-full flex items-center justify-center text-slate-400 text-xs animate-pulse">
        {t.widgets.weather.loading}
      </div>
    );
  }

  if (error && !weather) {
    return (
      <div className="w-full h-full flex items-center justify-center text-rose-400 text-xs text-center p-2">
        {t.widgets.weather.unavailable}
      </div>
    );
  }

  const current = weather?.current;

  return (
    <div className="w-full h-full flex flex-col justify-between select-none">
      {/* Top Main Section */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {current && getWeatherIcon(current.weatherCode, current.isDay, 36)}
          <div>
            <div className="flex items-baseline gap-0.5">
              <span className="text-3xl font-extrabold text-white">
                {current ? convertTemp(current.temperature) : '--'}
              </span>
              <span className="text-sm font-semibold text-slate-300">{unitSymbol}</span>
            </div>
            <div className="flex items-center gap-1 text-xs font-medium text-slate-300">
              <button
                onClick={handleDetectLocation}
                disabled={isLocating}
                className="flex items-center gap-1 hover:text-sky-300 transition-colors group"
                title={t.widgets.weather.detectLocation}
              >
                <MapPin size={12} className={`text-sky-400 ${isLocating ? 'animate-bounce' : ''}`} />
                <span className="truncate max-w-[120px]">{isLocating ? t.widgets.weather.detecting : (weather?.city || city)}</span>
              </button>
            </div>
            {locationError && (
              <div className="text-[10px] text-amber-300/90 mt-0.5 max-w-[160px] leading-tight">{locationError}</div>
            )}
          </div>
        </div>

        {/* Details */}
        {current && (
          <div className="text-right text-[11px] text-slate-300 space-y-0.5">
            <div className="flex items-center justify-end gap-1.5 font-medium text-slate-200">
              <span>{current.condition}</span>
              <button
                onClick={refresh}
                className="text-slate-400 hover:text-white p-0.5 rounded transition-colors"
                title="Refresh"
              >
                <RefreshCw size={11} className={isLoading ? 'animate-spin' : ''} />
              </button>
            </div>
            <div className="flex items-center justify-end gap-1 text-slate-400">
              <Wind size={12} />
              <span>{current.windSpeed} km/h</span>
            </div>
            {current.humidity !== undefined && (
              <div className="flex items-center justify-end gap-1 text-slate-400">
                <Droplets size={12} />
                <span>{current.humidity}%</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Forecast Section */}
      {showForecast && weather?.forecast && weather.forecast.length > 0 && (
        <div className="grid grid-cols-3 gap-1.5 pt-2 mt-1 border-t border-white/10 text-center">
          {weather.forecast.slice(1, 4).map((f, idx) => (
            <div key={idx} className="flex flex-col items-center bg-white/[0.03] p-1 rounded-lg">
              <span className="text-[10px] text-slate-400">
                {new Date(f.date).toLocaleDateString(undefined, { weekday: 'short' })}
              </span>
              <div className="my-0.5">{getWeatherIcon(f.weatherCode, true, 16)}</div>
              <span className="text-xs font-semibold text-slate-200">
                {convertTemp(f.maxTemp)}°
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
