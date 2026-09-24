import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { Search, Globe, Code2, Video, Sparkles, Compass, ChevronDown, Settings } from 'lucide-react';
import { cn } from '../../../utils/cn';
import { SearchWidgetConfig, SearchEngine } from '../../../types/widget';
import { useTranslation } from '../../../i18n/i18n';
import { useDashboardStore } from '../../../store/useDashboardStore';
import { evaluateSmartInput, isHelpQuery } from '../../../utils/smartInput';
import { SmartResultCard, SmartHelpCard } from './SmartResultCard';
import { BUILTIN_SEARCH_LABELS, BUILTIN_SEARCH_TEMPLATES } from '../../../config/catalog/searchEngineCatalog';
import { Favicon, originOf } from '../../common/CatalogPicker';

interface SearchWidgetProps {
  widgetId: string;
  config: SearchWidgetConfig;
}

interface ResolvedEngine {
  key: string;
  name: string;
  icon: React.ElementType | null;
  emoji?: string;
  /** Site root, for the favicon of a custom engine without an emoji. */
  homeUrl?: string;
  url: (q: string) => string;
  color: string;
}

const fillTemplate = (template: string, q: string) => template.replace('{query}', encodeURIComponent(q));

const SEARCH_ENGINES: Record<SearchEngine, { icon: React.ElementType; color: string }> = {
  google: { icon: Globe, color: 'text-sky-400' },
  duckduckgo: { icon: Compass, color: 'text-amber-400' },
  bing: { icon: Globe, color: 'text-blue-400' },
  github: { icon: Code2, color: 'text-purple-300' },
  youtube: { icon: Video, color: 'text-rose-400' },
  chatgpt: { icon: Sparkles, color: 'text-emerald-400' },
};

/**
 * A custom engine's mark: the emoji the user chose, or else the site's
 * favicon (engines added from the catalog carry none) with a globe fallback.
 */
const EngineMark: React.FC<{ engine: ResolvedEngine; size: number }> = ({ engine, size }) => {
  const Icon = engine.icon;
  if (Icon) return <Icon size={size} className={engine.color} />;
  if (engine.emoji) return <span className="leading-none text-center" style={{ fontSize: size - 2, width: size }}>{engine.emoji}</span>;
  return (
    <span className="flex items-center justify-center flex-shrink-0 overflow-hidden [&>img]:w-full [&>img]:h-full [&>svg]:w-full [&>svg]:h-full" style={{ width: size, height: size }}>
      <Favicon url={engine.homeUrl || ''} isFeed={false} />
    </span>
  );
};

export const SearchWidget: React.FC<SearchWidgetProps> = ({ widgetId, config }) => {
  const {
    defaultEngine = 'google',
    openInNewTab = true,
    showEngineSelector = true,
    customEngines = [],
    hiddenBuiltinEngines = [],
    smartTools = true,
  } = config;
  const openSettingsModal = useDashboardStore((s) => s.openSettingsModal);

  // Built-in engines (minus any the user removed) plus any user-defined ones
  // (config.customEngines), merged into one lookup so the rest of the
  // component doesn't need to care which kind an engine key resolves to.
  const engines = useMemo<Record<string, ResolvedEngine>>(() => {
    const merged: Record<string, ResolvedEngine> = {};
    for (const key of Object.keys(SEARCH_ENGINES) as SearchEngine[]) {
      if (hiddenBuiltinEngines.includes(key)) continue;
      const eng = SEARCH_ENGINES[key];
      merged[key] = {
        key,
        name: BUILTIN_SEARCH_LABELS[key],
        icon: eng.icon,
        url: (q) => fillTemplate(BUILTIN_SEARCH_TEMPLATES[key], q),
        color: eng.color,
      };
    }
    for (const custom of customEngines) {
      merged[custom.id] = {
        key: custom.id,
        name: custom.name,
        icon: null,
        emoji: custom.icon,
        homeUrl: originOf(custom.urlTemplate),
        url: (q) => fillTemplate(custom.urlTemplate, q),
        color: 'text-slate-300',
      };
    }
    return merged;
  }, [customEngines, hiddenBuiltinEngines]);
  const engineKeys = useMemo(() => Object.keys(engines), [engines]);

  const [selectedEngine, setSelectedEngine] = useState<string>(defaultEngine);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [menuPosition, setMenuPosition] = useState<{ top: number; left: number } | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const triggerRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const barRef = useRef<HTMLDivElement>(null);
  const { t } = useTranslation();

  // Inline answer for "120*1.1", "10 km to mi", "dice"… `rollSeed` only
  // exists to force a fresh evaluation for the random kinds.
  const [rollSeed, setRollSeed] = useState(0);
  // The ✨ button next to the search field: a first-time user has no way to
  // guess that "?" exists, so the cheat sheet gets a visible entry point too.
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const smartResult = useMemo(
    () => (smartTools ? evaluateSmartInput(query) : null),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [query, smartTools, rollSeed]
  );

  // The dropdown is portaled to <body>, so its position must be tracked
  // manually — it can no longer rely on CSS `absolute` positioning relative
  // to the trigger once it escapes the widget's own stacking context.
  const updateMenuPosition = useCallback(() => {
    const rect = triggerRef.current?.getBoundingClientRect();
    if (rect) {
      setMenuPosition({ top: rect.bottom + 8, left: rect.left });
    }
  }, []);

  // Keyboard shortcut '/' to focus search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.key === '/' &&
        document.activeElement !== inputRef.current &&
        !(document.activeElement instanceof HTMLInputElement || document.activeElement instanceof HTMLTextAreaElement)
      ) {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Close dropdown on outside click (the menu itself lives in a portal, so
  // both the trigger and the portaled menu must be checked)
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        !triggerRef.current?.contains(target) &&
        !menuRef.current?.contains(target)
      ) {
        setIsDropdownOpen(false);
      }
    };
    if (isDropdownOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
    }
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [isDropdownOpen]);

  // Keep the portaled menu aligned with its trigger button
  useEffect(() => {
    if (!isDropdownOpen) return;
    updateMenuPosition();
    window.addEventListener('resize', updateMenuPosition);
    window.addEventListener('scroll', updateMenuPosition, true);
    return () => {
      window.removeEventListener('resize', updateMenuPosition);
      window.removeEventListener('scroll', updateMenuPosition, true);
    };
  }, [isDropdownOpen, updateMenuPosition]);

  // Google is the natural fallback, but the user can now remove built-in
  // engines too — fall back to whatever's actually left instead of a
  // hardcoded key that might itself be hidden.
  const fallbackEngineKey = engines.google ? 'google' : engineKeys[0];

  // If the selected engine (e.g. a custom one) got removed elsewhere, fall
  // back to the configured default rather than pointing at nothing.
  useEffect(() => {
    if (!engines[selectedEngine] && fallbackEngineKey) {
      setSelectedEngine(engines[defaultEngine] ? defaultEngine : fallbackEngineKey);
    }
  }, [engines, selectedEngine, defaultEngine, fallbackEngineKey]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    const engine = engines[selectedEngine] || engines[fallbackEngineKey];
    if (!engine) return;
    const targetUrl = engine.url(query.trim());

    if (openInNewTab) {
      window.open(targetUrl, '_blank');
    } else {
      window.location.href = targetUrl;
    }
  };

  // engineKeys can only be empty if the user removed every built-in engine
  // without adding a custom one — the settings UI prevents that, but this
  // keeps the widget from crashing if it ever happens anyway.
  const currentEngineObj: ResolvedEngine =
    engines[selectedEngine] || engines[fallbackEngineKey] || {
      key: '',
      name: t.widgets.search.title,
      icon: Search,
      url: () => '',
      color: 'text-slate-400',
    };

  return (
    <div className="w-full h-full flex flex-col justify-center select-none py-1">
      <form onSubmit={handleSearch} className="w-full relative">
        {/* Search Bar Input Container */}
        <div ref={barRef} className="relative flex items-center bg-slate-900/60 border border-white/10 hover:border-white/20 focus-within:border-sky-400/50 focus-within:ring-2 focus-within:ring-sky-400/20 rounded-2xl p-1.5 transition-all shadow-lg backdrop-blur-md">
          {/* Current Engine Selector Button / Dropdown Toggle */}
          <div className="relative" ref={triggerRef}>
            <button
              type="button"
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] border border-white/10 text-white transition-all mr-2 flex-shrink-0 active:scale-95"
              title={t.widgets.search.switchEngine}
              aria-label={t.widgets.search.switchEngine}
            >
              <EngineMark engine={currentEngineObj} size={15} />
              <span className="text-xs font-semibold tracking-wide hidden sm:inline">
                {currentEngineObj.name}
              </span>
              <ChevronDown size={12} className="text-slate-400" />
            </button>

            {/* Dropdown Menu — portaled to <body> so it can't be clipped by
                the widget card's overflow-hidden or trapped behind a
                neighboring grid item's stacking context */}
            {isDropdownOpen && menuPosition && createPortal(
              <div
                ref={menuRef}
                role="menu"
                style={{ position: 'fixed', top: menuPosition.top, left: menuPosition.left }}
                className="w-44 bg-slate-900/95 border border-white/15 rounded-2xl shadow-2xl backdrop-blur-2xl py-1.5 z-[9999] animate-fade-in"
              >
                {engineKeys.map((key) => {
                  const eng = engines[key];
                  const isSelected = selectedEngine === key;
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => {
                        setSelectedEngine(key);
                        setIsDropdownOpen(false);
                        inputRef.current?.focus();
                      }}
                      className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium transition-colors text-left ${
                        isSelected
                          ? 'bg-sky-500/20 text-sky-200 font-semibold'
                          : 'text-slate-300 hover:text-white hover:bg-white/10'
                      }`}
                    >
                      <EngineMark engine={eng} size={14} />
                      <span className="flex-1">{eng.name}</span>
                    </button>
                  );
                })}
                <div className="my-1 border-t border-white/10" />
                <button
                  type="button"
                  onClick={() => {
                    setIsDropdownOpen(false);
                    openSettingsModal('editWidget', widgetId);
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-sky-300 hover:text-white hover:bg-white/10 transition-colors text-left"
                >
                  <Settings size={14} />
                  <span className="flex-1">{t.widgets.search.manageEngines}</span>
                </button>
              </div>,
              document.body
            )}
          </div>

          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t.widgets.search.placeholder}
            className="flex-1 bg-transparent text-sm text-white placeholder-slate-400 focus:outline-none min-w-0 px-1"
          />

          {smartTools && (
            <button
              type="button"
              onClick={() => setIsHelpOpen((open) => !open)}
              title={t.widgets.search.smart.helpButton}
              aria-label={t.widgets.search.smart.helpButton}
              aria-expanded={isHelpOpen || isHelpQuery(query)}
              className={cn(
                'p-2 rounded-xl transition-colors flex-shrink-0',
                isHelpOpen || isHelpQuery(query) ? 'text-sky-300 bg-sky-500/15' : 'text-slate-400 hover:text-sky-300 hover:bg-white/10'
              )}
            >
              <Sparkles size={15} />
            </button>
          )}

          <button
            type="submit"
            className="p-2 rounded-xl bg-sky-500 hover:bg-sky-400 text-white transition-colors flex-shrink-0 shadow-md shadow-sky-500/20 ml-1.5 active:scale-95"
            title={t.common.search}
            aria-label={t.common.search}
          >
            <Search size={15} />
          </button>
        </div>

        {smartResult && <SmartResultCard result={smartResult} anchorRef={barRef} onReroll={() => setRollSeed((s) => s + 1)} />}
        {smartTools && !smartResult && (isHelpOpen || isHelpQuery(query)) && (
          <SmartHelpCard
            anchorRef={barRef}
            onClose={() => setIsHelpOpen(false)}
            onPick={(input) => {
              setQuery(input);
              setIsHelpOpen(false);
              inputRef.current?.focus();
            }}
          />
        )}

        {/* Optional Pill Switchers (only rendered when showEngineSelector is true) */}
        {showEngineSelector && (
          <div className="hidden lg:flex items-center gap-1.5 mt-2 overflow-x-auto py-0.5 custom-scrollbar">
            {engineKeys.map((key) => {
              const eng = engines[key];
              const isSelected = selectedEngine === key;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => setSelectedEngine(key)}
                  className={`flex items-center gap-1.5 px-2 py-0.5 rounded-lg text-[11px] font-medium transition-all ${
                    isSelected
                      ? 'bg-sky-500/20 text-on-wallpaper-accent border border-sky-400/30 shadow-sm'
                      : 'text-on-wallpaper-faint hover:text-on-wallpaper-muted hover:bg-white/5 border border-transparent'
                  }`}
                >
                  <EngineMark engine={eng} size={11} />
                  <span>{eng.name}</span>
                </button>
              );
            })}
          </div>
        )}
      </form>
    </div>
  );
};
