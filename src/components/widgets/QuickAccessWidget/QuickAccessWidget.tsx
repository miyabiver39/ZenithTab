import React, { useCallback, useEffect, useState } from 'react';
import { TrendingUp, History, RefreshCw, Globe } from 'lucide-react';
import { QuickAccessWidgetConfig, QuickAccessView } from '../../../types/widget';
import { quickAccessService, QuickAccessItem } from '../../../services/quickAccessService';
import { useTranslation } from '../../../i18n/i18n';
import { cn } from '../../../utils/cn';

interface QuickAccessWidgetProps {
  widgetId: string;
  config: QuickAccessWidgetConfig;
}

/**
 * One-click way back to what the browser already knows you use: Chrome's
 * most-visited list and the tabs you just closed. Chrome-internal APIs
 * only — nothing leaves the machine.
 */
export const QuickAccessWidget: React.FC<QuickAccessWidgetProps> = ({ config }) => {
  const { defaultView = 'topSites', maxItems = 8, viewMode = 'list', openInNewTab = true } = config;
  const { t } = useTranslation();
  const [view, setView] = useState<QuickAccessView>(defaultView);
  const [items, setItems] = useState<QuickAccessItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const load = useCallback(async () => {
    setIsLoading(true);
    const result =
      view === 'topSites' ? await quickAccessService.getTopSites(maxItems) : await quickAccessService.getRecentlyClosed(maxItems);
    setItems(result);
    setIsLoading(false);
  }, [view, maxItems]);

  useEffect(() => {
    void load();
  }, [load]);

  // Reopen a closed tab in place when Chrome lets us; otherwise the anchor's
  // own href does the job.
  const handleClick = async (item: QuickAccessItem, e: React.MouseEvent) => {
    if (!item.sessionId) return;
    if (await quickAccessService.restoreSession(item.sessionId)) {
      e.preventDefault();
      void load();
    }
  };

  const tabs: { key: QuickAccessView; label: string; icon: React.ElementType }[] = [
    { key: 'topSites', label: t.widgets.quickaccess.topSites, icon: TrendingUp },
    { key: 'recentlyClosed', label: t.widgets.quickaccess.recentlyClosed, icon: History },
  ];

  const emptyText = view === 'topSites' ? t.widgets.quickaccess.emptyTopSites : t.widgets.quickaccess.emptyRecentlyClosed;

  return (
    <div className="w-full h-full flex flex-col min-h-0 select-none">
      <div className="flex items-center justify-between gap-2 pb-2 border-b border-white/5">
        <div className="flex items-center gap-1 bg-white/[0.05] p-0.5 rounded-lg border border-white/5">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setView(tab.key)}
                className={cn(
                  'flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-medium transition-all',
                  view === tab.key ? 'bg-sky-500 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
                )}
              >
                <Icon size={11} />
                {tab.label}
              </button>
            );
          })}
        </div>
        <button
          type="button"
          onClick={() => void load()}
          disabled={isLoading}
          title={t.common.refresh}
          className="p-1 text-slate-400 hover:text-white rounded hover:bg-white/10 transition-colors disabled:opacity-50"
        >
          <RefreshCw size={13} className={isLoading ? 'animate-spin' : ''} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto mt-2 pr-1 custom-scrollbar">
        {isLoading && items.length === 0 ? (
          <div className="h-full flex items-center justify-center text-xs text-slate-400 animate-pulse">{t.common.loading}</div>
        ) : items.length === 0 ? (
          <div className="h-full flex items-center justify-center text-xs text-slate-400 text-center p-4">{emptyText}</div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2" data-testid="quickaccess-grid">
            {items.map((item) => (
              <a
                key={item.id}
                href={item.url}
                target={openInNewTab ? '_blank' : undefined}
                rel="noopener noreferrer"
                onClick={(e) => void handleClick(item, e)}
                title={item.url}
                className="flex flex-col items-center gap-1.5 p-2 rounded-xl bg-white/[0.03] hover:bg-white/[0.08] border border-white/5 hover:border-sky-400/30 transition-all group"
              >
                <Favicon item={item} size="w-7 h-7" />
                <span className="text-[11px] text-slate-200 group-hover:text-sky-300 truncate w-full text-center">{item.title}</span>
              </a>
            ))}
          </div>
        ) : (
          <div className="space-y-1" data-testid="quickaccess-list">
            {items.map((item) => (
              <a
                key={item.id}
                href={item.url}
                target={openInNewTab ? '_blank' : undefined}
                rel="noopener noreferrer"
                onClick={(e) => void handleClick(item, e)}
                title={item.url}
                className="flex items-center gap-2.5 px-2 py-1.5 rounded-lg hover:bg-white/[0.06] transition-colors group"
              >
                <Favicon item={item} size="w-5 h-5" />
                <div className="flex-1 min-w-0">
                  <div className="text-xs text-slate-200 group-hover:text-sky-300 truncate">{item.title}</div>
                  <div className="text-[10px] text-slate-500 truncate">{quickAccessService.hostnameOf(item.url)}</div>
                </div>
              </a>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

const Favicon: React.FC<{ item: QuickAccessItem; size: string }> = ({ item, size }) => {
  const [failed, setFailed] = useState(false);
  if (!item.faviconUrl || failed) {
    return (
      <span className={cn(size, 'flex items-center justify-center rounded-md bg-slate-800/80 text-slate-400 flex-shrink-0')}>
        <Globe size={12} />
      </span>
    );
  }
  return (
    <img
      src={item.faviconUrl}
      alt=""
      onError={() => setFailed(true)}
      className={cn(size, 'rounded-md bg-slate-800/60 p-0.5 object-contain flex-shrink-0')}
    />
  );
};
