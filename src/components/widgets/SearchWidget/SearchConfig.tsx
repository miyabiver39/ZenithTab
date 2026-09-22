import React, { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { Input } from '../../common/Input';
import { Button } from '../../common/Button';
import { useTranslation } from '../../../i18n/i18n';
import { CustomSearchEngine, SearchEngine } from '../../../types/widget';
import { SEARCH_ENGINE_PRESETS, guessSearchUrlTemplate } from '../../../utils/searchEnginePresets';
import { uniqueId } from '../../../utils/id';
import type { ConfigFormProps } from '../configForm';
import { isSafeHttpUrl } from '../../../utils/url';
import { SmartInputExamples } from './SmartInputExamples';

const BUILTIN_ENGINE_LABELS: Record<SearchEngine, string> = {
  google: 'Google',
  duckduckgo: 'DuckDuckGo',
  bing: 'Bing',
  github: 'GitHub',
  youtube: 'YouTube',
  chatgpt: 'ChatGPT',
};
const BUILTIN_ENGINE_KEYS = Object.keys(BUILTIN_ENGINE_LABELS) as SearchEngine[];

/**
 * A custom engine's URL template, cleaned for use: trimmed, `https://`
 * assumed when no scheme was typed, and rejected (null) unless it holds
 * a `{query}` placeholder and is an http(s) URL once that is filled in.
 * The same rule runs on import (widgetDefinitions.sanitizeConfig); this
 * is the copy that guards the settings form and the save path.
 */
export function normalizeSearchUrlTemplate(input: string): string | null {
  const trimmed = input.trim();
  if (!trimmed.includes('{query}')) return null;
  const withScheme = /^[a-z][a-z0-9+.-]*:/i.test(trimmed) ? trimmed : `https://${trimmed}`;
  return isSafeHttpUrl(withScheme.replace('{query}', 'q')) ? withScheme : null;
}

/** Save-time double check: drop any custom engine whose template isn't a safe http(s) URL. */
export function prepareSearchConfigForSave(config: Record<string, any>): Record<string, any> {
  if (!Array.isArray(config.customEngines)) return config;
  const customEngines = config.customEngines
    .map((engine: CustomSearchEngine) => {
      const urlTemplate = typeof engine?.urlTemplate === 'string' ? normalizeSearchUrlTemplate(engine.urlTemplate) : null;
      return urlTemplate ? { ...engine, urlTemplate } : null;
    })
    .filter((engine: CustomSearchEngine | null): engine is CustomSearchEngine => engine !== null);
  return { ...config, customEngines };
}

/** Default engine, built-in/custom engine management, presets. */
export const SearchConfig: React.FC<ConfigFormProps> = ({ config, setConfig }) => {
  const { t } = useTranslation();
  const [newEngineName, setNewEngineName] = useState('');
  const [newEngineUrl, setNewEngineUrl] = useState('');
  const [newEngineIcon, setNewEngineIcon] = useState('');

  const addCustomEngine = (name: string, urlTemplate: string, icon?: string) => {
    const safeTemplate = normalizeSearchUrlTemplate(urlTemplate);
    if (!name || !safeTemplate) return;
    const newEngine: CustomSearchEngine = {
      id: uniqueId('custom'),
      name,
      urlTemplate: safeTemplate,
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

  const customEngines: CustomSearchEngine[] = config.customEngines || [];
  const hiddenBuiltinEngines: SearchEngine[] = config.hiddenBuiltinEngines || [];
  const visibleBuiltins = BUILTIN_ENGINE_KEYS.filter((k) => !hiddenBuiltinEngines.includes(k));
  const totalEngineCount = visibleBuiltins.length + customEngines.length;
  const allEngineOptions = [
    ...visibleBuiltins.map((id) => ({ id, label: BUILTIN_ENGINE_LABELS[id] })),
    ...customEngines.map((e) => ({ id: e.id, label: e.name })),
  ];
  const urlMissingQuery = newEngineUrl.trim().length > 0 && !newEngineUrl.includes('{query}');
  // Only http(s) may ever reach window.open / location.href.
  const urlUnsafe = newEngineUrl.includes('{query}') && normalizeSearchUrlTemplate(newEngineUrl) === null;

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
        <span className="text-xs text-slate-300">{t.widgets.search.openInNewTab}</span>
        <input
          type="checkbox"
          aria-label={t.widgets.search.openInNewTab}
          checked={config.openInNewTab !== false}
          onChange={(e) => setConfig({ ...config, openInNewTab: e.target.checked })}
          className="w-4 h-4 rounded text-sky-500 bg-slate-800 border-white/20"
        />
      </div>

      <div className="flex items-center justify-between py-1 gap-3">
        <div>
          <div className="text-xs text-slate-300">{t.widgets.search.smart.setting}</div>
          <div className="text-[11px] text-slate-500">{t.widgets.search.smart.settingDesc}</div>
        </div>
        <input
          type="checkbox"
          aria-label={t.widgets.search.smart.setting}
          checked={config.smartTools !== false}
          onChange={(e) => setConfig({ ...config, smartTools: e.target.checked })}
          className="w-4 h-4 rounded text-sky-500 bg-slate-800 border-white/20 flex-shrink-0"
        />
      </div>
      {config.smartTools !== false && (
        <div className="p-3 rounded-xl bg-white/[0.03] border border-white/10 space-y-2">
          <div className="text-[11px] text-slate-400">{t.widgets.search.smart.examplesDesc}</div>
          <SmartInputExamples />
        </div>
      )}

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
                  aria-label={`${t.common.delete}: ${BUILTIN_ENGINE_LABELS[key]}`}
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
                  aria-label={`${t.common.delete}: ${e.name}`}
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
        {urlUnsafe && <p className="text-[11px] text-rose-400 leading-relaxed">{t.widgets.search.customEngineUnsafeUrl}</p>}
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={handleAddCustomEngine}
          disabled={!newEngineName.trim() || normalizeSearchUrlTemplate(newEngineUrl) === null}
          className="gap-1.5"
        >
          <Plus size={14} />
          <span>{t.widgets.search.customEngineAdd}</span>
        </Button>
      </div>
    </div>
  );
};
