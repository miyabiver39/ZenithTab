import React, { useState, useEffect } from 'react';
import { MapPin, Plus, Trash2 } from 'lucide-react';
import { Modal } from '../common/Modal';
import { Input } from '../common/Input';
import { Button } from '../common/Button';
import { useDashboardStore } from '../../store/useDashboardStore';
import { rssService, GOOGLE_NEWS_TOPICS } from '../../services/rssService';
import { weatherService, GeolocationFailure } from '../../services/weatherService';
import { requestHostPermission } from '../../utils/permissions';
import { normalizeHttpUrl } from '../../utils/url';
import { getLocalizedWidgetTitle } from '../../utils/widgetTitle';
import { useTranslation } from '../../i18n/i18n';
import { CustomSearchEngine, SearchEngine, GoogleNewsMode, GoogleNewsTopic } from '../../types/widget';
import { SEARCH_ENGINE_PRESETS, guessSearchUrlTemplate } from '../../utils/searchEnginePresets';
import { uniqueId } from '../../utils/id';

const BUILTIN_ENGINE_LABELS: Record<SearchEngine, string> = {
  google: 'Google',
  duckduckgo: 'DuckDuckGo',
  bing: 'Bing',
  github: 'GitHub',
  youtube: 'YouTube',
  chatgpt: 'ChatGPT',
};
const BUILTIN_ENGINE_KEYS = Object.keys(BUILTIN_ENGINE_LABELS) as SearchEngine[];

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
  const [newEngineName, setNewEngineName] = useState('');
  const [newEngineUrl, setNewEngineUrl] = useState('');
  const [newEngineIcon, setNewEngineIcon] = useState('');

  useEffect(() => {
    if (targetWidget) {
      // Show (and, if left untouched, re-save) the stock title in the
      // current language so the field never looks stale after a language switch.
      setTitle(getLocalizedWidgetTitle(targetWidget, t));
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
    if (targetWidget.type === 'rss' && config.isGoogleNews) {
      config.searchQuery = (config.searchQuery || '').trim();
      config.googleNewsMode = rssService.resolveGoogleNewsMode(config);
      config.feedUrl = rssService.buildGoogleNewsUrlForConfig(config, activeLanguageCode);
    }

    // Hand-typed embed URLs: assume https:// when the scheme is missing and
    // drop anything that still isn't http(s) rather than letting it reach
    // an <iframe src>.
    if (targetWidget.type === 'iframe' && typeof config.url === 'string') {
      config.url = normalizeHttpUrl(config.url) || '';
    }

    // A custom feed lives outside our granted hosts. Ask for its origin right
    // here, while the submit gesture is still in scope — Chrome refuses to show
    // the prompt from anywhere else.
    if (targetWidget.type === 'rss' && !config.isGoogleNews && config.feedUrl) {
      void requestHostPermission(config.feedUrl);
    }

    updateWidgetConfig(editingWidgetId, config, title);
  };

  const addCustomEngine = (name: string, urlTemplate: string, icon?: string) => {
    if (!name || !urlTemplate.includes('{query}')) return;
    const newEngine: CustomSearchEngine = {
      id: uniqueId('custom'),
      name,
      urlTemplate,
      icon: icon || undefined,
    };
    const customEngines: CustomSearchEngine[] = [...(config.customEngines || []), newEngine];
    setConfig({ ...config, customEngines });
  };

  const handleAddCustomEngine = () => {
    addCustomEngine(newEngineName.trim(), newEngineUrl.trim(), newEngineIcon.trim());
    setNewEngineName('');
    setNewEngineUrl('');
    setNewEngineIcon('');
  };

  // Most people paste a real search-results URL copied from their address
  // bar rather than hand-authoring a {query} template — auto-detect that on
  // blur and rewrite the field so the Add button lights up on its own,
  // instead of silently staying disabled with no explanation.
  const handleEngineUrlBlur = () => {
    const guess = guessSearchUrlTemplate(newEngineUrl);
    if (guess) setNewEngineUrl(guess);
  };

  const handleAddPresetEngine = (presetId: string) => {
    const preset = SEARCH_ENGINE_PRESETS.find((p) => p.id === presetId);
    if (preset) addCustomEngine(preset.name, preset.urlTemplate, preset.icon);
  };

  // The default engine may point at whichever engine just got removed —
  // fall back to whatever's left instead of a hardcoded key that might
  // itself have been removed too.
  const pickFallbackEngine = (
    visibleBuiltins: SearchEngine[],
    customEngines: CustomSearchEngine[]
  ): string | undefined => visibleBuiltins[0] || customEngines[0]?.id;

  const handleRemoveCustomEngine = (id: string) => {
    const customEngines = (config.customEngines || []).filter((e: CustomSearchEngine) => e.id !== id);
    const visibleBuiltins = BUILTIN_ENGINE_KEYS.filter(
      (k) => !(config.hiddenBuiltinEngines || []).includes(k)
    );
    const updated: Record<string, any> = { ...config, customEngines };
    if (config.defaultEngine === id) {
      updated.defaultEngine = pickFallbackEngine(visibleBuiltins, customEngines);
    }
    setConfig(updated);
  };

  const handleRemoveBuiltinEngine = (key: SearchEngine) => {
    const hiddenBuiltinEngines: SearchEngine[] = [...(config.hiddenBuiltinEngines || []), key];
    const visibleBuiltins = BUILTIN_ENGINE_KEYS.filter((k) => !hiddenBuiltinEngines.includes(k));
    const customEngines: CustomSearchEngine[] = config.customEngines || [];

    // Always keep at least one engine total — the widget has nothing to
    // search with otherwise.
    if (visibleBuiltins.length === 0 && customEngines.length === 0) return;

    const updated: Record<string, any> = { ...config, hiddenBuiltinEngines };
    if (config.defaultEngine === key) {
      updated.defaultEngine = pickFallbackEngine(visibleBuiltins, customEngines);
    }
    setConfig(updated);
  };

  const handleRestoreBuiltinEngine = (key: SearchEngine) => {
    const hiddenBuiltinEngines = (config.hiddenBuiltinEngines || []).filter((k: SearchEngine) => k !== key);
    setConfig({ ...config, hiddenBuiltinEngines });
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

      case 'search': {
        const customEngines: CustomSearchEngine[] = config.customEngines || [];
        const hiddenBuiltinEngines: SearchEngine[] = config.hiddenBuiltinEngines || [];
        const visibleBuiltins = BUILTIN_ENGINE_KEYS.filter((k) => !hiddenBuiltinEngines.includes(k));
        const totalEngineCount = visibleBuiltins.length + customEngines.length;
        const allEngineOptions = [
          ...visibleBuiltins.map((id) => ({ id, label: BUILTIN_ENGINE_LABELS[id] })),
          ...customEngines.map((e) => ({ id: e.id, label: e.name })),
        ];
        const urlMissingQuery = newEngineUrl.trim().length > 0 && !newEngineUrl.includes('{query}');

        return (
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">Default Search Engine</label>
              <div className="grid grid-cols-3 gap-2">
                {allEngineOptions.map((eng) => (
                  <button
                    key={eng.id}
                    type="button"
                    onClick={() => setConfig({ ...config, defaultEngine: eng.id })}
                    className={`py-2 px-3 rounded-lg text-xs font-medium border capitalize truncate transition-all ${
                      config.defaultEngine === eng.id
                        ? 'bg-sky-500/20 border-sky-400 text-sky-200 shadow'
                        : 'bg-slate-800/50 border-white/10 text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    {eng.label}
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

            <div className="pt-3 border-t border-white/10 space-y-3">
              <label className="block text-xs font-medium text-slate-300">{t.widgets.search.customEngines}</label>

              {/* Built-ins and custom engines are managed the same way: both
                  show up in one list, both get a remove button. Built-ins
                  aren't gone for good — removing one just hides it, with a
                  one-click "restore" chip below. */}
              {(visibleBuiltins.length > 0 || customEngines.length > 0) && (
                <div className="space-y-1.5">
                  {visibleBuiltins.map((key) => (
                    <div
                      key={key}
                      className="flex items-center gap-2 p-2 rounded-lg bg-slate-800/50 border border-white/10"
                    >
                      <span className="text-sm leading-none w-4 text-center">🔎</span>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-semibold text-white truncate">{BUILTIN_ENGINE_LABELS[key]}</div>
                        <div className="text-[10px] text-slate-500 truncate">{t.widgets.search.builtinEngine}</div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveBuiltinEngine(key)}
                        disabled={totalEngineCount <= 1}
                        title={totalEngineCount <= 1 ? t.widgets.search.lastEngineHint : undefined}
                        className="p-1.5 rounded-md text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-slate-400 transition-colors"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  ))}
                  {customEngines.map((e) => (
                    <div
                      key={e.id}
                      className="flex items-center gap-2 p-2 rounded-lg bg-slate-800/50 border border-white/10"
                    >
                      <span className="text-sm leading-none w-4 text-center">{e.icon || '🔍'}</span>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-semibold text-white truncate">{e.name}</div>
                        <div className="text-[10px] text-slate-500 truncate">{e.urlTemplate}</div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveCustomEngine(e.id)}
                        disabled={totalEngineCount <= 1}
                        title={totalEngineCount <= 1 ? t.widgets.search.lastEngineHint : undefined}
                        className="p-1.5 rounded-md text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-slate-400 transition-colors"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {hiddenBuiltinEngines.length > 0 && (
                <div>
                  <p className="text-[11px] text-slate-400 mb-1.5">{t.widgets.search.hiddenEngines}</p>
                  <div className="flex flex-wrap gap-1.5">
                    {hiddenBuiltinEngines.map((key) => (
                      <button
                        key={key}
                        type="button"
                        onClick={() => handleRestoreBuiltinEngine(key)}
                        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-slate-800/50 border border-white/10 text-slate-300 hover:bg-slate-800 hover:border-white/20 transition-colors"
                      >
                        <span>{BUILTIN_ENGINE_LABELS[key]}</span>
                        <Plus size={11} className="text-slate-500" />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {(() => {
                const addedTemplates = new Set(customEngines.map((e) => e.urlTemplate));
                const availablePresets = SEARCH_ENGINE_PRESETS.filter((p) => !addedTemplates.has(p.urlTemplate));
                if (availablePresets.length === 0) return null;
                return (
                  <div>
                    <p className="text-[11px] text-slate-400 mb-1.5">{t.widgets.search.popularEngines}</p>
                    <div className="flex flex-wrap gap-1.5">
                      {availablePresets.map((preset) => (
                        <button
                          key={preset.id}
                          type="button"
                          onClick={() => handleAddPresetEngine(preset.id)}
                          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-slate-800/50 border border-white/10 text-slate-300 hover:bg-slate-800 hover:border-white/20 transition-colors"
                        >
                          <span className="text-sm leading-none">{preset.icon}</span>
                          <span>{preset.name}</span>
                          <Plus size={11} className="text-slate-500" />
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })()}

              <div className="grid grid-cols-1 sm:grid-cols-[1fr_1fr_56px] gap-2">
                <Input
                  value={newEngineName}
                  onChange={(e) => setNewEngineName(e.target.value)}
                  placeholder={t.widgets.search.customEngineName}
                />
                <Input
                  value={newEngineUrl}
                  onChange={(e) => setNewEngineUrl(e.target.value)}
                  onBlur={handleEngineUrlBlur}
                  placeholder="https://example.com/search?q={query}"
                />
                <Input
                  value={newEngineIcon}
                  onChange={(e) => setNewEngineIcon(e.target.value)}
                  placeholder="🔍"
                  maxLength={4}
                />
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">{t.widgets.search.customEngineHint}</p>
              {urlMissingQuery && (
                <p className="text-[11px] text-amber-400 leading-relaxed">{t.widgets.search.customEngineMissingQuery}</p>
              )}
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={handleAddCustomEngine}
                disabled={!newEngineName.trim() || !newEngineUrl.includes('{query}')}
                className="gap-1.5"
              >
                <Plus size={14} />
                <span>{t.widgets.search.customEngineAdd}</span>
              </Button>
            </div>
          </div>
        );
      }

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

      case 'rss': {
        // What the user picked in this dialog, before the save-time
        // normalisation (an empty keyword only becomes 'headlines' on save,
        // so choosing 'Keyword search' doesn't snap straight back).
        const uiNewsMode: GoogleNewsMode = config.googleNewsMode || rssService.resolveGoogleNewsMode(config);
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
              <div className="space-y-3">
                {/* Three ways to use Google News: the front page (needs no
                    input at all), a topic section, or a free keyword. */}
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">{t.widgets.rss.mode}</label>
                  <div className="grid grid-cols-3 gap-2">
                    {(
                      [
                        { key: 'headlines', label: t.widgets.rss.modeHeadlines },
                        { key: 'topic', label: t.widgets.rss.modeTopic },
                        { key: 'search', label: t.widgets.rss.modeSearch },
                      ] as { key: GoogleNewsMode; label: string }[]
                    ).map((m) => (
                      <button
                        key={m.key}
                        type="button"
                        onClick={() =>
                          setConfig({
                            ...config,
                            googleNewsMode: m.key,
                            googleNewsTopic: m.key === 'topic' ? config.googleNewsTopic || 'TECHNOLOGY' : config.googleNewsTopic,
                          })
                        }
                        className={`py-2 px-2 rounded-lg text-xs font-medium border truncate transition-all ${
                          uiNewsMode === m.key
                            ? 'bg-sky-500/20 border-sky-400 text-sky-200 shadow'
                            : 'bg-slate-800/50 border-white/10 text-slate-300 hover:bg-slate-800'
                        }`}
                      >
                        {m.label}
                      </button>
                    ))}
                  </div>
                </div>

                {uiNewsMode === 'topic' && (
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1.5">{t.widgets.rss.topicLabel}</label>
                    <select
                      value={config.googleNewsTopic || 'TECHNOLOGY'}
                      onChange={(e) => setConfig({ ...config, googleNewsTopic: e.target.value as GoogleNewsTopic })}
                      className="w-full px-3 py-2 rounded-xl bg-slate-800/50 border border-white/10 text-sm text-white focus:outline-none focus:ring-2 focus:ring-sky-400/50"
                    >
                      {GOOGLE_NEWS_TOPICS.map((topic) => (
                        <option key={topic} value={topic} className="bg-slate-900">
                          {t.widgets.rss.topics[topic]}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {uiNewsMode === 'search' && (
                  <div className="space-y-1.5">
                    <Input
                      label={t.widgets.rss.searchPlaceholder}
                      value={config.searchQuery || ''}
                      onChange={(e) => setConfig({ ...config, searchQuery: e.target.value })}
                      placeholder="e.g. artificial intelligence, technology, web dev"
                    />
                    <p className="text-[11px] text-slate-400 leading-relaxed">{t.widgets.rss.searchHint}</p>
                  </div>
                )}
              </div>
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
      }

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

      case 'quickaccess':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">{t.widgets.quickaccess.defaultView}</label>
              <div className="grid grid-cols-2 gap-2">
                {(['topSites', 'recentlyClosed'] as const).map((view) => (
                  <button
                    key={view}
                    type="button"
                    onClick={() => setConfig({ ...config, defaultView: view })}
                    className={`py-2 px-3 rounded-lg text-xs font-medium border transition-all ${
                      (config.defaultView || 'topSites') === view
                        ? 'bg-sky-500/20 border-sky-400 text-sky-200'
                        : 'bg-slate-800/50 border-white/10 text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    {t.widgets.quickaccess[view]}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">{t.widgets.quickaccess.maxItems}</label>
              <div className="grid grid-cols-3 gap-2">
                {([5, 8, 12] as const).map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setConfig({ ...config, maxItems: n })}
                    className={`py-2 px-3 rounded-lg text-xs font-medium border transition-all ${
                      (config.maxItems || 8) === n
                        ? 'bg-sky-500/20 border-sky-400 text-sky-200'
                        : 'bg-slate-800/50 border-white/10 text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">{t.widgets.quickaccess.viewMode}</label>
              <div className="grid grid-cols-2 gap-2">
                {(['list', 'grid'] as const).map((mode) => (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => setConfig({ ...config, viewMode: mode })}
                    className={`py-2 px-3 rounded-lg text-xs font-medium border transition-all ${
                      (config.viewMode || 'list') === mode
                        ? 'bg-sky-500/20 border-sky-400 text-sky-200'
                        : 'bg-slate-800/50 border-white/10 text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    {t.widgets.quickaccess[mode]}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between py-1">
              <span className="text-xs text-slate-300">{t.widgets.quickaccess.openInNewTab}</span>
              <input
                type="checkbox"
                checked={config.openInNewTab !== false}
                onChange={(e) => setConfig({ ...config, openInNewTab: e.target.checked })}
                className="w-4 h-4 rounded text-sky-500 bg-slate-800 border-white/20"
              />
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={closeSettingsModal} title={`Configure ${getLocalizedWidgetTitle(targetWidget, t)}`} maxWidth="md">
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
