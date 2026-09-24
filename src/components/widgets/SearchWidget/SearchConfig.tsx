import React, { useState } from 'react';
import { ChevronDown, LayoutGrid, Link2, Plus, Star, Trash2 } from 'lucide-react';
import { Input } from '../../common/Input';
import { Button } from '../../common/Button';
import { useTranslation } from '../../../i18n/i18n';
import { CustomSearchEngine, SearchEngine } from '../../../types/widget';
import { guessSearchUrlTemplate } from '../../../utils/searchEnginePresets';
import {
  BUILTIN_SEARCH_KEYS,
  BUILTIN_SEARCH_LABELS,
  BUILTIN_SEARCH_TEMPLATES,
  builtinForTemplate,
} from '../../../config/catalog/searchEngineCatalog';
import { CatalogPicker, Favicon, originOf, urlKey, type PickedItem } from '../../common/CatalogPicker';
import { uniqueId } from '../../../utils/id';
import { cn } from '../../../utils/cn';
import type { ConfigFormProps } from '../configForm';
import { isSafeHttpUrl } from '../../../utils/url';
import { SmartInputExamples } from './SmartInputExamples';

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

/** One row of the engine list: built-in and custom engines look and behave the same. */
interface EngineRow {
  id: string;
  name: string;
  subtitle: string;
  urlTemplate: string;
  emoji?: string;
  onRemove: () => void;
}

/**
 * Engine list (star = default, bin = remove), adding from the catalog or
 * by URL, and the smart-answer switch.
 *
 * What used to be spread over three places — the default-engine grid, the
 * "removed built-ins" chips and the popular-engine chips — now goes through
 * the list and the catalog: a removed built-in simply shows up in the
 * catalog again, ready to be added back.
 */
export const SearchConfig: React.FC<ConfigFormProps> = ({ config, setConfig }) => {
  const { t } = useTranslation();
  const [newEngineName, setNewEngineName] = useState('');
  const [newEngineUrl, setNewEngineUrl] = useState('');
  const [newEngineIcon, setNewEngineIcon] = useState('');
  const [isCatalogOpen, setIsCatalogOpen] = useState(false);
  const [isManualOpen, setIsManualOpen] = useState(false);
  // The cheat sheet is long; it's there to look things up, not to scroll
  // past every time the settings open.
  const [showExamples, setShowExamples] = useState(false);

  const customEngines: CustomSearchEngine[] = config.customEngines || [];
  const hiddenBuiltinEngines: SearchEngine[] = config.hiddenBuiltinEngines || [];
  const visibleBuiltins = BUILTIN_SEARCH_KEYS.filter((k) => !hiddenBuiltinEngines.includes(k));
  const totalEngineCount = visibleBuiltins.length + customEngines.length;

  const handleAddCustomEngine = () => {
    const safeTemplate = normalizeSearchUrlTemplate(newEngineUrl);
    const name = newEngineName.trim();
    if (!name || !safeTemplate) return;
    const icon = newEngineIcon.trim();
    const newEngine: CustomSearchEngine = { id: uniqueId('custom'), name, urlTemplate: safeTemplate, icon: icon || undefined };
    setConfig({ ...config, customEngines: [...customEngines, newEngine] });
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

  // A built-in picked from the catalog comes back (un-hidden) instead of
  // being duplicated as a custom engine; everything else becomes one.
  const handleAddFromCatalog = (items: PickedItem[]) => {
    let hidden = hiddenBuiltinEngines;
    const added: CustomSearchEngine[] = [];
    const known = new Set(customEngines.map((e) => urlKey(e.urlTemplate)));
    for (const item of items) {
      const key = builtinForTemplate(item.url);
      if (key) {
        hidden = hidden.filter((k) => k !== key);
      } else if (!known.has(urlKey(item.url)) && normalizeSearchUrlTemplate(item.url)) {
        known.add(urlKey(item.url));
        added.push({ id: uniqueId('custom'), name: item.title, urlTemplate: item.url });
      }
    }
    setConfig({ ...config, hiddenBuiltinEngines: hidden, customEngines: [...customEngines, ...added] });
  };

  // The default engine may point at whichever engine just got removed —
  // fall back to whatever's left instead of a hardcoded key that might
  // itself have been removed too.
  const pickFallbackEngine = (builtins: SearchEngine[], customs: CustomSearchEngine[]): string | undefined =>
    builtins[0] || customs[0]?.id;

  const handleRemoveCustomEngine = (id: string) => {
    const remaining = customEngines.filter((e) => e.id !== id);
    const updated: Record<string, any> = { ...config, customEngines: remaining };
    if (config.defaultEngine === id) {
      updated.defaultEngine = pickFallbackEngine(visibleBuiltins, remaining);
    }
    setConfig(updated);
  };

  const handleRemoveBuiltinEngine = (key: SearchEngine) => {
    const hidden: SearchEngine[] = [...hiddenBuiltinEngines, key];
    const builtins = BUILTIN_SEARCH_KEYS.filter((k) => !hidden.includes(k));

    // Always keep at least one engine total — the widget has nothing to
    // search with otherwise.
    if (builtins.length === 0 && customEngines.length === 0) return;

    const updated: Record<string, any> = { ...config, hiddenBuiltinEngines: hidden };
    if (config.defaultEngine === key) {
      updated.defaultEngine = pickFallbackEngine(builtins, customEngines);
    }
    setConfig(updated);
  };

  const rows: EngineRow[] = [
    ...visibleBuiltins.map((key) => ({
      id: key,
      name: BUILTIN_SEARCH_LABELS[key],
      subtitle: t.widgets.search.builtinEngine,
      urlTemplate: BUILTIN_SEARCH_TEMPLATES[key],
      onRemove: () => handleRemoveBuiltinEngine(key),
    })),
    ...customEngines.map((e) => ({
      id: e.id,
      name: e.name,
      subtitle: e.urlTemplate,
      urlTemplate: e.urlTemplate,
      emoji: e.icon,
      onRemove: () => handleRemoveCustomEngine(e.id),
    })),
  ];
  // Mirrors the widget: a default that no longer exists falls back to
  // Google, or else the first engine left.
  const effectiveDefault = rows.some((r) => r.id === config.defaultEngine)
    ? config.defaultEngine
    : (rows.find((r) => r.id === 'google') || rows[0])?.id;

  const urlMissingQuery = newEngineUrl.trim().length > 0 && !newEngineUrl.includes('{query}');
  // Only http(s) may ever reach window.open / location.href.
  const urlUnsafe = newEngineUrl.includes('{query}') && normalizeSearchUrlTemplate(newEngineUrl) === null;

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <div>
          <label className="block text-xs font-medium text-slate-300">{t.widgets.search.customEngines}</label>
          <p className="text-[11px] text-slate-500 mt-0.5">{t.widgets.search.engineListHint}</p>
        </div>

        <ul className="space-y-1.5" aria-label={t.widgets.search.customEngines}>
          {rows.map((row) => {
            const isDefault = row.id === effectiveDefault;
            return (
              <li
                key={row.id}
                className={cn(
                  'flex items-center gap-2 p-2 rounded-lg border',
                  isDefault ? 'bg-sky-500/10 border-sky-400/40' : 'bg-slate-800/50 border-white/10'
                )}
              >
                <button
                  type="button"
                  onClick={() => setConfig({ ...config, defaultEngine: row.id })}
                  aria-pressed={isDefault}
                  aria-label={`${t.widgets.search.setDefault}: ${row.name}`}
                  title={t.widgets.search.setDefault}
                  className={cn(
                    'p-1 rounded-md transition-colors',
                    isDefault ? 'text-amber-300' : 'text-slate-500 hover:text-amber-200 hover:bg-white/5'
                  )}
                >
                  <Star size={14} fill={isDefault ? 'currentColor' : 'none'} />
                </button>
                <span className="w-5 h-5 flex items-center justify-center flex-shrink-0">
                  {row.emoji ? (
                    <span className="text-sm leading-none">{row.emoji}</span>
                  ) : (
                    <Favicon url={originOf(row.urlTemplate)} isFeed={false} />
                  )}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className="text-xs font-semibold text-white truncate">{row.name}</span>
                    {isDefault && (
                      <span className="px-1.5 py-px rounded text-[9px] font-semibold bg-sky-500/20 text-sky-200 flex-shrink-0">
                        {t.widgets.search.defaultBadge}
                      </span>
                    )}
                  </div>
                  <div className="text-[10px] text-slate-500 truncate">{row.subtitle}</div>
                </div>
                <button
                  type="button"
                  onClick={row.onRemove}
                  aria-label={`${t.common.delete}: ${row.name}`}
                  disabled={totalEngineCount <= 1}
                  title={totalEngineCount <= 1 ? t.widgets.search.lastEngineHint : undefined}
                  className="p-1.5 rounded-md text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-slate-400 transition-colors"
                >
                  <Trash2 size={13} />
                </button>
              </li>
            );
          })}
        </ul>

        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="secondary" size="sm" onClick={() => setIsCatalogOpen(true)} className="gap-1.5">
            <LayoutGrid size={14} />
            <span>{t.widgets.search.fromCatalog}</span>
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setIsManualOpen((open) => !open)}
            aria-expanded={isManualOpen}
            className="gap-1.5"
          >
            <Link2 size={14} />
            <span>{t.widgets.search.manualAdd}</span>
            <ChevronDown size={12} className={cn('transition-transform', isManualOpen && 'rotate-180')} />
          </Button>
        </div>

        {isManualOpen && (
          <div className="p-3 rounded-xl bg-white/[0.03] border border-white/10 space-y-2">
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
        )}
      </div>

      <div className="flex items-center justify-between py-1 pt-3 border-t border-white/10">
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
        <div className="rounded-xl bg-white/[0.03] border border-white/10">
          <button
            type="button"
            onClick={() => setShowExamples((open) => !open)}
            aria-expanded={showExamples}
            className="w-full flex items-center justify-between gap-2 px-3 py-2 text-xs font-medium text-slate-300 hover:text-white transition-colors"
          >
            <span>{showExamples ? t.widgets.search.smart.hideExamples : t.widgets.search.smart.showExamples}</span>
            <ChevronDown size={13} className={cn('text-slate-500 transition-transform', showExamples && 'rotate-180')} />
          </button>
          {showExamples && (
            <div className="px-3 pb-3 space-y-2">
              <div className="text-[11px] text-slate-400">{t.widgets.search.smart.examplesDesc}</div>
              <SmartInputExamples />
            </div>
          )}
        </div>
      )}

      <CatalogPicker
        isOpen={isCatalogOpen}
        onClose={() => setIsCatalogOpen(false)}
        kind="searchEngines"
        existingUrls={rows.map((r) => r.urlTemplate)}
        onAdd={handleAddFromCatalog}
      />
    </div>
  );
};
