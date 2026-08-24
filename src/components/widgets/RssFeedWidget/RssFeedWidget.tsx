import React, { useState } from 'react';
import { RefreshCw, ExternalLink, Newspaper, Search, ShieldCheck } from 'lucide-react';
import { RssFeedWidgetConfig } from '../../../types/widget';
import { useRssFeed } from '../../../hooks/useRssFeed';
import { formatRelativeTime } from '../../../utils/date';
import { rssService } from '../../../services/rssService';
import { useDashboardStore } from '../../../store/useDashboardStore';
import { useTranslation } from '../../../i18n/i18n';

interface RssFeedWidgetProps {
  widgetId: string;
  config: RssFeedWidgetConfig;
}

export const RssFeedWidget: React.FC<RssFeedWidgetProps> = ({ widgetId, config }) => {
  const {
    feedUrl,
    isGoogleNews = false,
    searchQuery = '',
    maxItems = 8,
    refreshIntervalMinutes = 30,
    showThumbnail = true,
    showDate = true,
    showDescription = true,
  } = config;

  const { updateWidgetConfig } = useDashboardStore();
  const { t, activeLanguageCode } = useTranslation();
  const [searchInput, setSearchInput] = useState(searchQuery);
  const [isSearching, setIsSearching] = useState(false);

  const effectiveFeedUrl =
    isGoogleNews && searchQuery
      ? rssService.buildGoogleNewsRssUrl(searchQuery, activeLanguageCode, activeLanguageCode === 'ja' ? 'JP' : 'US')
      : feedUrl;

  const { items, isLoading, error, needsPermission, grantAccess, refresh } = useRssFeed(
    effectiveFeedUrl,
    refreshIntervalMinutes
  );

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchInput.trim()) return;

    const newUrl = rssService.buildGoogleNewsRssUrl(searchInput.trim(), activeLanguageCode, activeLanguageCode === 'ja' ? 'JP' : 'US');
    updateWidgetConfig(
      widgetId,
      {
        feedUrl: newUrl,
        isGoogleNews: true,
        searchQuery: searchInput.trim(),
      },
      `${searchInput.trim()} News`
    );
    setIsSearching(false);
  };

  return (
    <div className="w-full h-full flex flex-col min-h-0 select-none">
      {/* Top Controls */}
      <div className="flex items-center justify-between gap-2 pb-2 border-b border-white/5">
        {isSearching ? (
          <form onSubmit={handleSearchSubmit} className="flex-1 flex items-center gap-1.5">
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder={t.widgets.rss.searchPlaceholder}
              autoFocus
              className="flex-1 px-2.5 py-1 bg-slate-800/40 border border-white/10 rounded-lg text-xs text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-sky-400"
            />
            <button
              type="submit"
              className="text-xs px-2 py-1 bg-sky-500 hover:bg-sky-400 text-white rounded-lg transition-colors"
            >
              {t.common.save}
            </button>
            <button
              type="button"
              onClick={() => setIsSearching(false)}
              className="text-xs px-2 py-1 text-slate-400 hover:text-white rounded-lg transition-colors"
            >
              {t.common.cancel}
            </button>
          </form>
        ) : (
          <>
            <div className="flex items-center gap-1.5 overflow-hidden">
              <Newspaper size={14} className="text-sky-400 flex-shrink-0" />
              <span className="text-[11px] text-slate-400 truncate">
                {isGoogleNews && searchQuery ? `Google News: "${searchQuery}"` : t.widgets.rss.liveFeed}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setIsSearching(true)}
                className="p-1 text-slate-400 hover:text-white rounded hover:bg-white/10 transition-colors"
                title="Search Google News"
              >
                <Search size={13} />
              </button>
              <button
                onClick={refresh}
                disabled={isLoading}
                className="p-1 text-slate-400 hover:text-white rounded hover:bg-white/10 transition-colors disabled:opacity-50"
                title="Refresh Feed"
              >
                <RefreshCw size={13} className={isLoading ? 'animate-spin' : ''} />
              </button>
            </div>
          </>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto mt-2 pr-1 custom-scrollbar">
        {needsPermission && items.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-4 gap-2">
            <ShieldCheck size={20} className="text-sky-400" />
            <p className="text-[11px] text-slate-300 leading-relaxed">{t.widgets.rss.permissionNeeded}</p>
            <button
              type="button"
              onClick={grantAccess}
              className="text-xs px-3 py-1.5 bg-sky-500 hover:bg-sky-400 text-white rounded-lg transition-colors font-medium"
            >
              {t.widgets.rss.grantAccess}
            </button>
          </div>
        ) : isLoading && items.length === 0 ? (
          <div className="h-full flex items-center justify-center text-xs text-slate-400 animate-pulse">
            {t.widgets.rss.fetching}
          </div>
        ) : error && items.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-4 text-xs text-slate-400">
            <p className="text-rose-400 font-medium mb-1">{t.widgets.rss.failed}</p>
            <p className="text-[11px] text-slate-400">{error}</p>
          </div>
        ) : items.length === 0 ? (
          <div className="h-full flex items-center justify-center text-xs text-slate-400">
            {t.widgets.rss.empty}
          </div>
        ) : (
          <div className="divide-y divide-white/5 space-y-2">
            {items.slice(0, maxItems).map((item) => (
              <a
                key={item.id}
                href={item.link}
                target="_blank"
                rel="noopener noreferrer"
                className="pt-2 block group hover:bg-white/[0.03] p-1.5 rounded-xl transition-all"
              >
                <div className="flex gap-2.5 items-start">
                  {showThumbnail && item.imageUrl && (
                    <img
                      src={item.imageUrl}
                      alt=""
                      className="w-14 h-14 object-cover rounded-lg flex-shrink-0 bg-slate-800 border border-white/5 group-hover:scale-105 transition-transform"
                      onError={(e) => {
                        (e.target as HTMLElement).style.display = 'none';
                      }}
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <h4 className="text-xs font-medium text-slate-200 group-hover:text-sky-300 transition-colors line-clamp-2 leading-snug">
                      {item.title}
                    </h4>

                    {showDescription && item.contentSnippet && (
                      <p className="text-[11px] text-slate-400 line-clamp-2 mt-0.5 leading-relaxed">
                        {item.contentSnippet}
                      </p>
                    )}

                    <div className="flex items-center gap-2 mt-1.5 text-[10px] text-slate-400">
                      {item.sourceTitle && (
                        <span className="font-medium text-slate-300 truncate max-w-[120px]">
                          {item.sourceTitle}
                        </span>
                      )}
                      {showDate && (item.pubDate || item.isoDate) && (
                        <span>{formatRelativeTime(item.isoDate || item.pubDate)}</span>
                      )}
                      <ExternalLink size={10} className="text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity ml-auto" />
                    </div>
                  </div>
                </div>
              </a>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
