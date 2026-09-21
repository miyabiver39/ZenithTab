import { useEffect, useMemo, useState } from 'react';
import { useDashboardStore } from '../store/useDashboardStore';
import { calendarService } from '../services/calendarService';
import type { ICalEvent } from '../utils/icalParser';
import { allWidgets, calendarFeedUrls, computeTodaySummary, type TodaySummary } from '../utils/todaySummary';

/**
 * Today's digest for the header. Tasks and countdowns come straight from
 * the store; calendar events are read from the feeds' cache only (the
 * calendar widget is what fetches), so opening a tab never adds network
 * requests for a page that isn't even on screen.
 */
export function useTodaySummary(): TodaySummary {
  const pageData = useDashboardStore((s) => s.pageData);
  const activePageId = useDashboardStore((s) => s.activePageId);
  const widgets = useDashboardStore((s) => s.widgets);
  const [events, setEvents] = useState<ICalEvent[] | null>(null);

  const all = useMemo(() => allWidgets(pageData, activePageId, widgets), [pageData, activePageId, widgets]);
  const feedKey = useMemo(() => calendarFeedUrls(all).sort().join('\n'), [all]);

  useEffect(() => {
    const urls = feedKey ? feedKey.split('\n') : [];
    if (urls.length === 0) {
      setEvents(null);
      return;
    }
    let cancelled = false;
    void Promise.all(urls.map((url) => calendarService.readCached(url))).then((lists) => {
      if (!cancelled) setEvents(lists.flat());
    });
    return () => {
      cancelled = true;
    };
  }, [feedKey]);

  return useMemo(() => computeTodaySummary(all, events), [all, events]);
}
