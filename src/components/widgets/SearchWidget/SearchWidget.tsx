import React, { useState, useEffect, useRef } from 'react';
import { Search, Globe, Code2, Video, Sparkles, Compass } from 'lucide-react';
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
  const { defaultEngine = 'google', openInNewTab = true } = config;
  const [selectedEngine, setSelectedEngine] = useState<SearchEngine>(defaultEngine);
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const { t } = useTranslation();

  // Keyboard shortcut '/' to focus search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === '/' && document.activeElement !== inputRef.current && !(document.activeElement instanceof HTMLInputElement || document.activeElement instanceof HTMLTextAreaElement)) {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

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
    <div className="w-full h-full flex flex-col justify-center select-none">
      <form onSubmit={handleSearch} className="w-full">
        {/* Search Bar Input */}
        <div className="relative flex items-center bg-slate-800/60 border border-white/10 hover:border-white/20 focus-within:border-sky-400/50 focus-within:ring-2 focus-within:ring-sky-400/20 rounded-2xl p-1.5 transition-all shadow-lg backdrop-blur-md">
          {/* Current Engine Badge */}
          <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-white/[0.06] border border-white/5 mr-2 flex-shrink-0">
            <CurrentIcon size={16} className={currentEngineObj.color} />
            <span className="text-xs font-semibold text-white tracking-wide">
              {currentEngineObj.name}
            </span>
          </div>

          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t.widgets.search.placeholder}
            className="flex-1 bg-transparent text-sm text-white placeholder-slate-400 focus:outline-none min-w-0"
          />

          <button
            type="submit"
            className="p-2 rounded-xl bg-sky-500 hover:bg-sky-400 text-white transition-colors flex-shrink-0 shadow-md shadow-sky-500/20 ml-1.5"
            title="Search"
          >
            <Search size={15} />
          </button>
        </div>

        {/* Engine Switcher Pills */}
        <div className="flex items-center gap-1.5 mt-2.5 overflow-x-auto py-0.5 custom-scrollbar">
          {(Object.keys(SEARCH_ENGINES) as SearchEngine[]).map((key) => {
            const eng = SEARCH_ENGINES[key];
            const Icon = eng.icon;
            const isSelected = selectedEngine === key;
            return (
              <button
                key={key}
                type="button"
                onClick={() => setSelectedEngine(key)}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                  isSelected
                    ? 'bg-sky-500/20 text-sky-200 border border-sky-400/30 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-white/5 border border-transparent'
                }`}
              >
                <Icon size={12} className={eng.color} />
                <span>{eng.name}</span>
              </button>
            );
          })}
        </div>
      </form>
    </div>
  );
};
