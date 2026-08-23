import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { Input } from '../common/Input';
import { Button } from '../common/Button';
import { useDashboardStore } from '../../store/useDashboardStore';
import { rssService } from '../../services/rssService';

export const WidgetConfigModal: React.FC = () => {
  const {
    activeSettingsModal,
    editingWidgetId,
    widgets,
    closeSettingsModal,
    updateWidgetConfig,
  } = useDashboardStore();

  const isOpen = activeSettingsModal === 'editWidget' && !!editingWidgetId;
  const targetWidget = widgets.find((w) => w.id === editingWidgetId);

  const [title, setTitle] = useState('');
  const [config, setConfig] = useState<Record<string, any>>({});

  useEffect(() => {
    if (targetWidget) {
      setTitle(targetWidget.title);
      setConfig({ ...targetWidget.config });
    }
  }, [targetWidget]);

  if (!targetWidget) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingWidgetId) return;

    // Custom formatting for Google News
    if (targetWidget.type === 'rss' && config.isGoogleNews && config.searchQuery) {
      config.feedUrl = rssService.buildGoogleNewsRssUrl(config.searchQuery);
    }

    updateWidgetConfig(editingWidgetId, config, title);
  };

  const renderConfigFields = () => {
    switch (targetWidget.type) {
      case 'clock':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">Clock Style</label>
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
              <span className="text-xs text-slate-300">24-Hour Format</span>
              <input
                type="checkbox"
                checked={!!config.is24Hour}
                onChange={(e) => setConfig({ ...config, is24Hour: e.target.checked })}
                className="w-4 h-4 rounded text-sky-500 bg-slate-800 border-white/20"
              />
            </div>

            <div className="flex items-center justify-between py-1">
              <span className="text-xs text-slate-300">Show Seconds</span>
              <input
                type="checkbox"
                checked={!!config.showSeconds}
                onChange={(e) => setConfig({ ...config, showSeconds: e.target.checked })}
                className="w-4 h-4 rounded text-sky-500 bg-slate-800 border-white/20"
              />
            </div>

            <div className="flex items-center justify-between py-1">
              <span className="text-xs text-slate-300">Show Date</span>
              <input
                type="checkbox"
                checked={!!config.showDate}
                onChange={(e) => setConfig({ ...config, showDate: e.target.checked })}
                className="w-4 h-4 rounded text-sky-500 bg-slate-800 border-white/20"
              />
            </div>

            <Input
              label="Timezone (Optional)"
              value={config.timezone || ''}
              onChange={(e) => setConfig({ ...config, timezone: e.target.value })}
              placeholder="e.g. Asia/Tokyo, America/New_York, UTC"
            />
          </div>
        );

      case 'weather':
        return (
          <div className="space-y-4">
            <Input
              label="City Name"
              value={config.city || ''}
              onChange={(e) => setConfig({ ...config, city: e.target.value })}
              placeholder="e.g. Tokyo, San Francisco, London"
            />

            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Latitude (Optional)"
                type="number"
                step="any"
                value={config.latitude || ''}
                onChange={(e) => setConfig({ ...config, latitude: parseFloat(e.target.value) || 0 })}
                placeholder="35.6762"
              />
              <Input
                label="Longitude (Optional)"
                type="number"
                step="any"
                value={config.longitude || ''}
                onChange={(e) => setConfig({ ...config, longitude: parseFloat(e.target.value) || 0 })}
                placeholder="139.6503"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">Temperature Unit</label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { key: 'celsius', label: 'Celsius (°C)' },
                  { key: 'fahrenheit', label: 'Fahrenheit (°F)' },
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
              <span className="text-xs text-slate-300">Show 3-Day Forecast</span>
              <input
                type="checkbox"
                checked={!!config.showForecast}
                onChange={(e) => setConfig({ ...config, showForecast: e.target.checked })}
                className="w-4 h-4 rounded text-sky-500 bg-slate-800 border-white/20"
              />
            </div>
          </div>
        );

      case 'bookmarks':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">View Mode</label>
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
              <span className="text-xs text-slate-300">Show Favicons</span>
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
                <div className="text-xs font-medium text-slate-200">Google News Keyword Feed</div>
                <div className="text-[11px] text-slate-400">Search keywords to generate auto RSS feed</div>
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
                label="Google News Search Query"
                value={config.searchQuery || ''}
                onChange={(e) => setConfig({ ...config, searchQuery: e.target.value })}
                placeholder="e.g. artificial intelligence, technology, web dev"
              />
            ) : (
              <Input
                label="Custom RSS/Atom Feed URL"
                value={config.feedUrl || ''}
                onChange={(e) => setConfig({ ...config, feedUrl: e.target.value })}
                placeholder="https://example.com/feed.xml"
              />
            )}

            <Input
              label="Max Articles to Display"
              type="number"
              min="3"
              max="25"
              value={config.maxItems || 8}
              onChange={(e) => setConfig({ ...config, maxItems: parseInt(e.target.value) || 8 })}
            />

            <div className="flex items-center justify-between py-1">
              <span className="text-xs text-slate-300">Show Article Thumbnail</span>
              <input
                type="checkbox"
                checked={!!config.showThumbnail}
                onChange={(e) => setConfig({ ...config, showThumbnail: e.target.checked })}
                className="w-4 h-4 rounded text-sky-500 bg-slate-800 border-white/20"
              />
            </div>

            <div className="flex items-center justify-between py-1">
              <span className="text-xs text-slate-300">Show Article Snippet</span>
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
              label="Target Website URL"
              value={config.url || ''}
              onChange={(e) => setConfig({ ...config, url: e.target.value })}
              placeholder="https://example.com"
            />
            <div className="flex items-center justify-between py-1">
              <span className="text-xs text-slate-300">Allow Scroll inside Frame</span>
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
              <label className="block text-xs font-medium text-slate-300 mb-1.5">Font Size</label>
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
              <label className="block text-xs font-medium text-slate-300 mb-1.5">Font Style</label>
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
            Cancel
          </Button>
          <Button type="submit" variant="primary" size="sm">
            Save Changes
          </Button>
        </div>
      </form>
    </Modal>
  );
};
