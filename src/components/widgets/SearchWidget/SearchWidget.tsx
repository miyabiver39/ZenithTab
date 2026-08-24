import React, { useState, useEffect, useRef } from 'react';
import { Search, Globe, Code2, Video, Sparkles, Compass, ChevronDown } from 'lucide-react';
import { SearchWidgetConfig, SearchEngine } from '../../../types/widget';
import { useTranslation } from '../../../i18n/i18n';

interface SearchWidgetProps {
  config: SearchWidgetConfig;
}

const SEARCH_ENGINES: Record<
  SearchEngine,
  { name: string; icon: React.ElementType; url: (q: string) => string; color: string }
> = {
  google: {
    name: 'Google',
    icon: Globe,
    url: (q) => `https://www.google.com/search?q=${encodeURIComponent(q)}`,
    color: 'text-sky-400',
  },
  duckduckgo: {
    name: 'DuckDuckGo',
    icon: Compass,
    url: (q) => `https://duckduckgo.com/?q=${encodeURIComponent(q)}`,
    color: 'text-amber-400',
  },
  bing: {
    name: 'Bing',
    icon: Globe,
    url: (q) => `https://www.bing.com/search?q=${encodeURIComponent(q)}`,
    color: 'text-blue-400',
  },
  github: {
    name: 'GitHub',
    icon: Code2,
    url: (q) => `https://github.com/search?q=${encodeURIComponent(q)}`,
    color: 'text-purple-300',
  },
  youtube: {
    name: 'YouTube',
    icon: Video,
    url: (q) => `https://www.youtube.com/results?search_query=${encodeURIComponent(q)}`,
    color: 'text-rose-400',
  },
  chatgpt: {
    name: 'ChatGPT',
    icon: Sparkles,
    url: (q) => `https://chatgpt.com/?q=${encodeURIComponent(q)}`,
    color: 'text-emerald-400',
  },
};

export const SearchWidget: React.FC<SearchWidgetProps> = ({ config }) => {
  const { defaultEngine = 'google', openInNewTab = true, showEngineSelector = true } = config;
  const [selectedEngine, setSelectedEngine] = useState<SearchEngine>(defaultEngine);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { t } = useTranslation();

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

  // Close dropdown on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    if (isDropdownOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
    }
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [isDropdownOpen]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    const engine = SEARCH_ENGINES[selectedEngine] || SEARCH_ENGINES.google;
    const targetUrl = engine.url(query.trim());

    if (openInNewTab) {
      window.open(targetUrl, '_blank');
    } else {
      window.location.href = targetUrl;
    }
  };

  const currentEngineObj = SEARCH_ENGINES[selectedEngine] || SEARCH_ENGINES.google;
  const CurrentIcon = currentEngineObj.icon;

  return (
    <div className="w-full h-full flex flex-col justify-center select-none py-1">
      <form onSubmit={handleSearch} className="w-full relative">
        {/* Search Bar Input Container */}
        <div className="relative flex items-center bg-slate-900/60 border border-white/10 hover:border-white/20 focus-within:border-sky-400/50 focus-within:ring-2 focus-within:ring-sky-400/20 rounded-2xl p-1.5 transition-all shadow-lg backdrop-blur-md">
          {/* Current Engine Selector Button / Dropdown Toggle */}
          <div className="relative" ref={dropdownRef}>
            <button
              type="button"
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] border border-white/10 text-white transition-all mr-2 flex-shrink-0 active:scale-95"
              title="Switch Search Engine"
            >
              <CurrentIcon size={15} className={currentEngineObj.color} />
              <span className="text-xs font-semibold tracking-wide hidden sm:inline">
                {currentEngineObj.name}
              </span>
              <ChevronDown size={12} className="text-slate-400" />
            </button>

            {/* Dropdown Menu */}
            {isDropdownOpen && (
              <div className="absolute top-full left-0 mt-2 w-44 bg-slate-900/95 border border-white/15 rounded-2xl shadow-2xl backdrop-blur-2xl py-1.5 z-50 animate-fade-in">
                {(Object.keys(SEARCH_ENGINES) as SearchEngine[]).map((key) => {
                  const eng = SEARCH_ENGINES[key];
                  const Icon = eng.icon;
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
                      <Icon size={14} className={eng.color} />
                      <span className="flex-1">{eng.name}</span>
                    </button>
                  );
                })}
              </div>
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

          <button
            type="submit"
            className="p-2 rounded-xl bg-sky-500 hover:bg-sky-400 text-white transition-colors flex-shrink-0 shadow-md shadow-sky-500/20 ml-1.5 active:scale-95"
            title="Search"
          >
            <Search size={15} />
          </button>
        </div>

        {/* Optional Pill Switchers (only rendered when showEngineSelector is true) */}
        {showEngineSelector && (
          <div className="hidden lg:flex items-center gap-1.5 mt-2 overflow-x-auto py-0.5 custom-scrollbar">
            {(Object.keys(SEARCH_ENGINES) as SearchEngine[]).map((key) => {
              const eng = SEARCH_ENGINES[key];
              const Icon = eng.icon;
              const isSelected = selectedEngine === key;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => setSelectedEngine(key)}
                  className={`flex items-center gap-1.5 px-2 py-0.5 rounded-lg text-[11px] font-medium transition-all ${
                    isSelected
                      ? 'bg-sky-500/20 text-sky-200 border border-sky-400/30 shadow-sm'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-white/5 border border-transparent'
                  }`}
                >
                  <Icon size={11} className={eng.color} />
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
