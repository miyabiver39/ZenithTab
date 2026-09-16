import React, { useState } from 'react';
import { MapPin } from 'lucide-react';
import { Input } from '../../common/Input';
import { Button } from '../../common/Button';
import { useTranslation } from '../../../i18n/i18n';
import { weatherService, GeolocationFailure } from '../../../services/weatherService';
import type { ConfigFormProps } from '../configForm';

/** City / coordinates, "detect location", unit and forecast toggle. */
export const WeatherConfig: React.FC<ConfigFormProps> = ({ config, setConfig }) => {
  const { t } = useTranslation();
  const [isLocating, setIsLocating] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);

  const handleDetectLocation = async () => {
    setIsLocating(true);
    setLocationError(null);
    try {
      const location = await weatherService.detectUserLocation();
      setConfig((prev) => ({
        ...prev,
        city: location.city,
        latitude: location.latitude,
        longitude: location.longitude,
      }));
    } catch (err) {
      const reason = err instanceof GeolocationFailure ? err.reason : 'unavailable';
      setLocationError(reason === 'denied' ? t.widgets.weather.locationDenied : t.widgets.weather.locationFailed);
    } finally {
      setIsLocating(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-end gap-2">
        <div className="flex-1">
          <Input
            label={t.widgets.weather.city}
            value={config.city || ''}
            onChange={(e) => setConfig({ ...config, city: e.target.value })}
            placeholder="e.g. Tokyo, Shinjuku, San Francisco, London"
          />
        </div>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={handleDetectLocation}
          disabled={isLocating}
          className="gap-1.5 text-xs whitespace-nowrap mb-0.5"
        >
          <MapPin size={13} className={isLocating ? 'animate-bounce text-sky-400' : ''} />
          <span>{isLocating ? t.widgets.weather.detecting : t.widgets.weather.detectLocation}</span>
        </Button>
      </div>

      {locationError && (
        <p className="text-[11px] text-amber-300/90 leading-relaxed -mt-1">{locationError}</p>
      )}

      <div className="grid grid-cols-2 gap-3">
        <Input
          label={t.widgets.weather.latitude}
          type="number"
          step="any"
          value={config.latitude || ''}
          onChange={(e) => setConfig({ ...config, latitude: parseFloat(e.target.value) || 0 })}
          placeholder="35.6762"
        />
        <Input
          label={t.widgets.weather.longitude}
          type="number"
          step="any"
          value={config.longitude || ''}
          onChange={(e) => setConfig({ ...config, longitude: parseFloat(e.target.value) || 0 })}
          placeholder="139.6503"
        />
      </div>

      <div>
        <label className="block text-xs font-medium text-slate-300 mb-1.5">{t.widgets.weather.unit}</label>
        <div className="grid grid-cols-2 gap-2">
          {[
            { key: 'celsius', label: t.widgets.weather.celsius },
            { key: 'fahrenheit', label: t.widgets.weather.fahrenheit },
          ].map((unit) => (
            <button
              key={unit.key}
              type="button"
              onClick={() => setConfig({ ...config, unit: unit.key })}
              className={`py-2 px-3 rounded-lg text-xs font-medium border transition-all ${
                config.unit === unit.key
                  ? 'bg-sky-500/20 border-sky-400 text-sky-200 shadow'
                  : 'bg-slate-800/50 border-white/10 text-slate-300 hover:bg-slate-800'
              }`}
            >
              {unit.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-between py-1">
        <span className="text-xs text-slate-300">{t.widgets.weather.showForecast}</span>
        <input
          type="checkbox"
          aria-label={t.widgets.weather.showForecast}
          checked={!!config.showForecast}
          onChange={(e) => setConfig({ ...config, showForecast: e.target.checked })}
          className="w-4 h-4 rounded text-sky-500 bg-slate-800 border-white/20"
        />
      </div>
    </div>
  );
};
