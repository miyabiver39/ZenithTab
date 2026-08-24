import React, { useState, useEffect } from 'react';
import { MapPin } from 'lucide-react';
import { Modal } from '../common/Modal';
import { Input } from '../common/Input';
import { Button } from '../common/Button';
import { useDashboardStore } from '../../store/useDashboardStore';
import { rssService } from '../../services/rssService';
import { weatherService, GeolocationFailure } from '../../services/weatherService';
import { requestHostPermission } from '../../utils/permissions';
import { useTranslation } from '../../i18n/i18n';

export const WidgetConfigModal: React.FC = () => {
  const {
    activeSettingsModal,
    editingWidgetId,
    widgets,
    closeSettingsModal,
    updateWidgetConfig,
  } = useDashboardStore();

  const { t, activeLanguageCode } = useTranslation();
  const isOpen = activeSettingsModal === 'editWidget' && !!editingWidgetId;
  const targetWidget = widgets.find((w) => w.id === editingWidgetId);

  const [title, setTitle] = useState('');
  const [config, setConfig] = useState<Record<string, any>>({});
  const [isLocating, setIsLocating] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);

  useEffect(() => {
    if (targetWidget) {
      setTitle(targetWidget.title);
      setConfig({ ...targetWidget.config });
    }
  }, [targetWidget]);

  if (!targetWidget) return null;

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

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingWidgetId) return;

    // Custom formatting for Google News
    if (targetWidget.type === 'rss' && config.isGoogleNews && config.searchQuery) {
      config.feedUrl = rssService.buildGoogleNewsRssUrl(config.searchQuery, activeLanguageCode, activeLanguageCode === 'ja' ? 'JP' : 'US');
    }

    // A custom feed lives outside our granted hosts. Ask for its origin right
    // here, while the submit gesture is still in scope — Chrome refuses to show
    // the prompt from anywhere else.
    if (targetWidget.type === 'rss' && !config.isGoogleNews && config.feedUrl) {
      void requestHostPermission(config.feedUrl);
    }

    updateWidgetConfig(editingWidgetId, config, title);
  };

  const renderConfigFields = () => {
    switch (targetWidget.type) {
      case 'shortcuts':
        return (
          <div className="space-y-4">
            <div className="flex items-center justify-between py-1">
              <span className="text-xs text-slate-300">{t.widgets.shortcuts.openInNewTab}</span>
              <input
                type="checkbox"
                checked={config.openInNewTab !== false}
                onChange={(e) => setConfig({ ...config, openInNewTab: e.target.checked })}
                className="w-4 h-4 rounded text-sky-500 bg-slate-800 border-white/20"
              />
            </div>
            <Input
              label={t.widgets.shortcuts.columns}
              type="number"
              min="2"
              max="8"
              value={config.columns || 4}
              onChange={(e) => setConfig({ ...config, columns: parseInt(e.target.value) || 4 })}
            />
          </div>
        );

      case 'search':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">Default Search Engine</label>
              <div className="grid grid-cols-3 gap-2">
                {['google', 'duckduckgo', 'bing', 'github', 'youtube', 'chatgpt'].map((eng) => (
                  <button
                    key={eng}
                    type="button"
                    onClick={() => setConfig({ ...config, defaultEngine: eng })}
                    className={`py-2 px-3 rounded-lg text-xs font-medium border capitalize transition-all ${
                      config.defaultEngine === eng
                        ? 'bg-sky-500/20 border-sky-400 text-sky-200 shadow'
                        : 'bg-slate-800/50 border-white/10 text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    {eng}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between py-1">
              <span className="text-xs text-slate-300">Open Search Results in New Tab</span>
              <input
                type="checkbox"
                checked={config.openInNewTab !== false}
                onChange={(e) => setConfig({ ...config, openInNewTab: e.target.checked })}
                className="w-4 h-4 rounded text-sky-500 bg-slate-800 border-white/20"
              />
            </div>
          </div>
        );

      case 'clock':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">{t.widgets.clock.style}</label>
              <div className="grid grid-cols-3 gap-2">
                {['digital', 'analog', 'minimal'].map((st) => (
                  <button
                    key={st}
                    type="button"
                    onClick={() => setConfig({ ...config, style: st })}
                    className={`py-2 px-3 rounded-lg text-xs font-medium border capitalize transition-all ${
                      config.style === st
                        ? 'bg-sky-500/20 border-sky-400 text-sky-200 shadow'
                        : 'bg-slate-800/50 border-white/10 text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between py-1">
              <span className="text-xs text-slate-300">{t.widgets.clock.is24Hour}</span>
              <input
                type="checkbox"
                checked={!!config.is24Hour}
                onChange={(e) => setConfig({ ...config, is24Hour: e.target.checked })}
                className="w-4 h-4 rounded text-sky-500 bg-slate-800 border-white/20"
              />
            </div>

            <div className="flex items-center justify-between py-1">
              <span className="text-xs text-slate-300">{t.widgets.clock.showSeconds}</span>
              <input
                type="checkbox"
                checked={!!config.showSeconds}
                onChange={(e) => setConfig({ ...config, showSeconds: e.target.checked })}
                className="w-4 h-4 rounded text-sky-500 bg-slate-800 border-white/20"
              />
            </div>

            <div className="flex items-center justify-between py-1">
              <span className="text-xs text-slate-300">{t.widgets.clock.showDate}</span>
              <input
                type="checkbox"
                checked={!!config.showDate}
                onChange={(e) => setConfig({ ...config, showDate: e.target.checked })}
                className="w-4 h-4 rounded text-sky-500 bg-slate-800 border-white/20"
              />
            </div>

            <Input
              label={t.widgets.clock.timezone}
              value={config.timezone || ''}
              onChange={(e) => setConfig({ ...config, timezone: e.target.value })}
              placeholder="e.g. Asia/Tokyo, America/New_York, UTC"
            />
          </div>
        );

      case 'weather':
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
                checked={!!config.showForecast}
                onChange={(e) => setConfig({ ...config, showForecast: e.target.checked })}
                className="w-4 h-4 rounded text-sky-500 bg-slate-800 border-white/20"
              />
            </div>
          </div>
        );

      case 'pomodoro':
        return (
          <div className="space-y-4">
            <Input
              label="Focus Duration (Minutes)"
              type="number"
              min="1"
              max="120"
              value={config.focusDurationMinutes || 25}
              onChange={(e) => setConfig({ ...config, focusDurationMinutes: parseInt(e.target.value) || 25 })}
            />
            <Input
              label="Short Break Duration (Minutes)"
              type="number"
              min="1"
              max="30"
              value={config.shortBreakDurationMinutes || 5}
              onChange={(e) => setConfig({ ...config, shortBreakDurationMinutes: parseInt(e.target.value) || 5 })}
            />
            <Input
              label="Long Break Duration (Minutes)"
              type="number"
              min="1"
              max="60"
              value={config.longBreakDurationMinutes || 15}
              onChange={(e) => setConfig({ ...config, longBreakDurationMinutes: parseInt(e.target.value) || 15 })}
            />
          </div>
        );

      case 'bookmarks':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">{t.widgets.bookmarks.viewMode}</label>
              <div className="grid grid-cols-2 gap-2">
                {['grid', 'list'].map((mode) => (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => setConfig({ ...config, viewMode: mode })}
                    className={`py-2 px-3 rounded-lg text-xs font-medium border capitalize transition-all ${
                      config.viewMode === mode
                        ? 'bg-sky-500/20 border-sky-400 text-sky-200 shadow'
                        : 'bg-slate-800/50 border-white/10 text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    {mode}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between py-1">
              <span className="text-xs text-slate-300">{t.widgets.bookmarks.showFavicons}</span>
              <input
                type="checkbox"
                checked={!!config.showFavicons}
                onChange={(e) => setConfig({ ...config, showFavicons: e.target.checked })}
                className="w-4 h-4 rounded text-sky-500 bg-slate-800 border-white/20"
              />
            </div>
          </div>
        );

      case 'rss':
        return (
          <div className="space-y-4">
            <div className="flex items-center justify-between py-1">
              <div>
                <div className="text-xs font-medium text-slate-200">{t.widgets.rss.googleNewsFeed}</div>
                <div className="text-[11px] text-slate-400">{t.widgets.rss.googleNewsSub}</div>
              </div>
              <input
                type="checkbox"
                checked={!!config.isGoogleNews}
                onChange={(e) => setConfig({ ...config, isGoogleNews: e.target.checked })}
                className="w-4 h-4 rounded text-sky-500 bg-slate-800 border-white/20"
              />
            </div>

            {config.isGoogleNews ? (
              <Input
                label={t.widgets.rss.searchPlaceholder}
                value={config.searchQuery || ''}
                onChange={(e) => setConfig({ ...config, searchQuery: e.target.value })}
                placeholder="e.g. artificial intelligence, technology, web dev"
              />
            ) : (
              <div className="space-y-1.5">
                <Input
                  label={t.widgets.rss.customUrl}
                  value={config.feedUrl || ''}
                  onChange={(e) => setConfig({ ...config, feedUrl: e.target.value })}
                  placeholder="https://example.com/feed.xml"
                />
                <p className="text-[11px] text-slate-400 leading-relaxed">{t.widgets.rss.permissionHint}</p>
              </div>
            )}

            <Input
              label={t.widgets.rss.maxItems}
              type="number"
              min="3"
              max="25"
              value={config.maxItems || 8}
              onChange={(e) => setConfig({ ...config, maxItems: parseInt(e.target.value) || 8 })}
            />

            <div className="flex items-center justify-between py-1">
              <span className="text-xs text-slate-300">{t.widgets.rss.showThumbnails}</span>
              <input
                type="checkbox"
                checked={!!config.showThumbnail}
                onChange={(e) => setConfig({ ...config, showThumbnail: e.target.checked })}
                className="w-4 h-4 rounded text-sky-500 bg-slate-800 border-white/20"
              />
            </div>

            <div className="flex items-center justify-between py-1">
              <span className="text-xs text-slate-300">{t.widgets.rss.showSnippet}</span>
              <input
                type="checkbox"
                checked={!!config.showDescription}
                onChange={(e) => setConfig({ ...config, showDescription: e.target.checked })}
                className="w-4 h-4 rounded text-sky-500 bg-slate-800 border-white/20"
              />
            </div>
          </div>
        );

      case 'iframe':
        return (
          <div className="space-y-4">
            <Input
              label={t.widgets.iframe.targetUrl}
              value={config.url || ''}
              onChange={(e) => setConfig({ ...config, url: e.target.value })}
              placeholder="https://example.com"
            />
            <div className="flex items-center justify-between py-1">
              <span className="text-xs text-slate-300">{t.widgets.iframe.allowScroll}</span>
              <input
                type="checkbox"
                checked={!!config.allowScroll}
                onChange={(e) => setConfig({ ...config, allowScroll: e.target.checked })}
                className="w-4 h-4 rounded text-sky-500 bg-slate-800 border-white/20"
              />
            </div>
          </div>
        );

      case 'notes':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">{t.widgets.notes.fontSize}</label>
              <div className="grid grid-cols-3 gap-2">
                {['sm', 'base', 'lg'].map((sz) => (
                  <button
                    key={sz}
                    type="button"
                    onClick={() => setConfig({ ...config, fontSize: sz })}
                    className={`py-2 px-3 rounded-lg text-xs font-medium border capitalize transition-all ${
                      config.fontSize === sz
                        ? 'bg-sky-500/20 border-sky-400 text-sky-200 shadow'
                        : 'bg-slate-800/50 border-white/10 text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    {sz}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">{t.widgets.notes.fontStyle}</label>
              <div className="grid grid-cols-3 gap-2">
                {['sans', 'mono', 'serif'].map((fam) => (
                  <button
                    key={fam}
                    type="button"
                    onClick={() => setConfig({ ...config, fontFamily: fam })}
                    className={`py-2 px-3 rounded-lg text-xs font-medium border capitalize transition-all ${
                      config.fontFamily === fam
                        ? 'bg-sky-500/20 border-sky-400 text-sky-200 shadow'
                        : 'bg-slate-800/50 border-white/10 text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    {fam}
                  </button>
                ))}
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={closeSettingsModal} title={`Configure ${targetWidget.title}`} maxWidth="md">
      <form onSubmit={handleSave} className="space-y-5">
        <Input
          label="Widget Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Custom Widget Name"
        />

        {renderConfigFields()}

        <div className="flex items-center justify-end gap-2 pt-4 border-t border-white/10">
          <Button type="button" variant="ghost" size="sm" onClick={closeSettingsModal}>
            {t.common.cancel}
          </Button>
          <Button type="submit" variant="primary" size="sm">
            {t.common.saveChanges}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
