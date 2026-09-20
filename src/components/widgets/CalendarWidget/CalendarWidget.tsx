import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { RefreshCw, ShieldCheck, MapPin, CalendarPlus, Settings } from 'lucide-react';
import { CalendarWidgetConfig, CalendarFeed } from '../../../types/widget';
import { useDashboardStore } from '../../../store/useDashboardStore';
import { useTranslation } from '../../../i18n/i18n';
import { calendarService, CalendarPermissionRequired } from '../../../services/calendarService';
import { expandOccurrences, CalendarOccurrence, ICalEvent } from '../../../utils/icalParser';
import { requestHostPermissions } from '../../../utils/permissions';
import { formatTime, getIntlLocale } from '../../../utils/date';
import { toDayKey } from '../../../utils/countdown';
import { cn } from '../../../utils/cn';

interface CalendarWidgetProps {
  widgetId: string;
  config: CalendarWidgetConfig;
}

interface FeedEvents {
  feed: CalendarFeed;
  events: ICalEvent[];
}

interface DayGroup {
  key: string;
  date: Date;
  items: (CalendarOccurrence & { color: string })[];
}

/**
 * "What's on today": every .ics feed's events for the next few days,
 * grouped by day. Fetching goes through calendarService (host permission
 * + 15-minute cache); recurrence expansion is done locally.
 */
export const CalendarWidget: React.FC<CalendarWidgetProps> = ({ widgetId, config }) => {
  const { feeds = [], daysAhead = 3, showLocation = true } = config;
  const { t, activeLanguageCode } = useTranslation();
  const openSettingsModal = useDashboardStore((s) => s.openSettingsModal);
  const [loaded, setLoaded] = useState<FeedEvents[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [blockedUrls, setBlockedUrls] = useState<string[]>([]);
  const [failed, setFailed] = useState(false);
  const [now, setNow] = useState(() => new Date());

  const feedKey = feeds.map((f) => `${f.id}:${f.url}`).join('|');

  const load = useCallback(
    async (bypassCache = false) => {
      setIsLoading(true);
      const results: FeedEvents[] = [];
      const blocked: string[] = [];
      let anyFailed = false;
      await Promise.all(
        feeds.map(async (feed) => {
          try {
            results.push({ feed, events: await calendarService.fetchCalendar(feed.url, bypassCache) });
          } catch (err) {
            if (err instanceof CalendarPermissionRequired) blocked.push(feed.url);
            else anyFailed = true;
          }
        })
      );
      setLoaded(results);
      setBlockedUrls(blocked);
      setFailed(anyFailed);
      setNow(new Date());
      setIsLoading(false);
    },
    // Re-run when the set of feeds changes, not on every config object identity.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [feedKey]
  );

  useEffect(() => {
    void load();
  }, [load]);

  // Refresh the "today" boundary when the tab is shown again (no interval).
  useEffect(() => {
    const refresh = () => {
      if (!document.hidden && toDayKey(new Date()) !== toDayKey(now)) void load();
    };
    document.addEventListener('visibilitychange', refresh);
    window.addEventListener('focus', refresh);
    return () => {
      document.removeEventListener('visibilitychange', refresh);
      window.removeEventListener('focus', refresh);
    };
  }, [now, load]);

  // Must stay a direct click handler for Chrome's permission prompt.
  const grantAccess = async () => {
    if (await requestHostPermissions(blockedUrls)) void load(true);
  };

  const groups = useMemo<DayGroup[]>(() => {
    const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const end = new Date(start.getFullYear(), start.getMonth(), start.getDate() + daysAhead);
    const items = loaded.flatMap(({ feed, events }) => expandOccurrences(events, start, end).map((o) => ({ ...o, color: feed.color })));
    items.sort((a, b) => a.start.getTime() - b.start.getTime() || Number(b.allDay) - Number(a.allDay));

    const byDay = new Map<string, DayGroup>();
    for (let i = 0; i < daysAhead; i++) {
      const date = new Date(start.getFullYear(), start.getMonth(), start.getDate() + i);
      byDay.set(toDayKey(date), { key: toDayKey(date), date, items: [] });
    }
    for (const item of items) {
      // A multi-day event shows on every day it covers within the window.
      for (const group of byDay.values()) {
        const dayEnd = new Date(group.date.getFullYear(), group.date.getMonth(), group.date.getDate() + 1);
        if (item.start < dayEnd && item.end > group.date) group.items.push(item);
      }
    }
    return Array.from(byDay.values()).filter((g) => g.items.length > 0);
  }, [loaded, now, daysAhead]);

  const locale = getIntlLocale(activeLanguageCode);
  const dayFormatter = useMemo(() => new Intl.DateTimeFormat(locale, { weekday: 'short', month: 'short', day: 'numeric' }), [locale]);
  const todayKey = toDayKey(now);
  const tomorrowKey = toDayKey(new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1));
  const dayLabel = (group: DayGroup) =>
    group.key === todayKey ? t.widgets.calendar.today : group.key === tomorrowKey ? t.widgets.calendar.tomorrow : dayFormatter.format(group.date);

  const timeLabel = (item: CalendarOccurrence, day: Date) => {
    if (item.allDay) return t.widgets.calendar.allDay;
    // Spilling over from a previous day: show as "…–10:00".
    const startsToday = item.start >= day;
    const startText = startsToday ? formatTime(item.start, true, false, undefined, activeLanguageCode) : '…';
    const endText = item.end.getTime() !== item.start.getTime() ? `–${formatTime(item.end, true, false, undefined, activeLanguageCode)}` : '';
    return `${startText}${endText}`;
  };

  const isPast = (item: CalendarOccurrence) => item.end <= now && !item.allDay;

  return (
    <div className="w-full h-full flex flex-col min-h-0 select-none">
      <div className="flex items-center justify-between pb-2 border-b border-white/5">
        <div className="flex items-center gap-1.5 text-[11px] text-slate-400 min-w-0">
          {feeds.map((feed) => (
            <span key={feed.id} className="flex items-center gap-1 truncate" title={feed.url}>
              <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: feed.color }} />
              <span className="truncate max-w-[6rem]">{feed.label}</span>
            </span>
          ))}
        </div>
        <button
          type="button"
          onClick={() => void load(true)}
          disabled={isLoading || feeds.length === 0}
          title={t.common.refresh}
          className="p-1 text-slate-400 hover:text-white rounded hover:bg-white/10 transition-colors disabled:opacity-50"
        >
          <RefreshCw size={13} className={isLoading ? 'animate-spin' : ''} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto mt-2 pr-1 custom-scrollbar">
        {feeds.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-4 gap-2">
            <CalendarPlus size={20} className="text-sky-400" />
            <p className="text-[11px] text-slate-300 leading-relaxed">{t.widgets.calendar.noFeeds}</p>
            <button
              type="button"
              onClick={() => openSettingsModal('editWidget', widgetId)}
              className="flex items-center gap-1 text-xs px-3 py-1.5 bg-sky-500 hover:bg-sky-400 text-white rounded-lg transition-colors font-medium"
            >
              <Settings size={12} />
              {t.widgets.calendar.addFeed}
            </button>
          </div>
        ) : blockedUrls.length > 0 && loaded.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-4 gap-2">
            <ShieldCheck size={20} className="text-sky-400" />
            <p className="text-[11px] text-slate-300 leading-relaxed">{t.widgets.calendar.permissionNeeded}</p>
            <button
              type="button"
              onClick={() => void grantAccess()}
              className="text-xs px-3 py-1.5 bg-sky-500 hover:bg-sky-400 text-white rounded-lg transition-colors font-medium"
            >
              {t.widgets.calendar.grantAccess}
            </button>
          </div>
        ) : isLoading && loaded.length === 0 ? (
          <div className="h-full flex items-center justify-center text-xs text-slate-400 animate-pulse">{t.common.loading}</div>
        ) : failed && loaded.length === 0 ? (
          <div className="h-full flex items-center justify-center text-xs text-rose-400 text-center p-4">{t.widgets.calendar.failed}</div>
        ) : groups.length === 0 ? (
          <div className="h-full flex items-center justify-center text-xs text-slate-400 text-center p-4">{t.widgets.calendar.empty}</div>
        ) : (
          <div className="space-y-3" data-testid="calendar-days">
            {groups.map((group) => (
              <section key={group.key}>
                <h4 className={cn('text-[10px] font-semibold uppercase tracking-wider mb-1', group.key === todayKey ? 'text-sky-300' : 'text-slate-400')}>
                  {dayLabel(group)}
                </h4>
                <ul className="space-y-1">
                  {group.items.map((item, index) => (
                    <li
                      key={`${item.uid}-${item.start.getTime()}-${index}`}
                      className={cn('flex items-start gap-2 px-2 py-1.5 rounded-lg bg-white/[0.03] border border-white/5', isPast(item) && 'opacity-50')}
                    >
                      <span className="w-1 self-stretch rounded-full flex-shrink-0 mt-0.5" style={{ backgroundColor: item.color }} />
                      <div className="flex-1 min-w-0">
                        <div className="text-xs text-slate-100 truncate">{item.summary || t.widgets.calendar.untitled}</div>
                        <div className="text-[10px] text-slate-400 flex items-center gap-2 min-w-0">
                          <span className="tabular-nums flex-shrink-0">{timeLabel(item, group.date)}</span>
                          {showLocation && item.location && (
                            <span className="flex items-center gap-0.5 truncate">
                              <MapPin size={9} className="flex-shrink-0" />
                              <span className="truncate">{item.location}</span>
                            </span>
                          )}
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </section>
            ))}
            {blockedUrls.length > 0 && (
              <button type="button" onClick={() => void grantAccess()} className="w-full text-[10px] text-sky-300 hover:text-sky-200 text-center py-1">
                {t.widgets.calendar.someBlocked}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
