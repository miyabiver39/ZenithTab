import { describe, it, expect } from 'vitest';
import { allWidgets, calendarFeedUrls, computeTodaySummary, countTodayEvents, isEmptySummary } from '../../../src/utils/todaySummary';
import { parseIcal } from '../../../src/utils/icalParser';
import type { DashboardWidget } from '../../../src/types/widget';

const now = new Date(2026, 8, 22, 9, 0);
const widget = (type: string, config: Record<string, any>, id = `w-${type}`): DashboardWidget =>
  ({ id, type: type as any, title: type, config, layout: { i: id, x: 0, y: 0, w: 1, h: 1 } });

const ICS = `BEGIN:VCALENDAR
BEGIN:VEVENT
UID:a
DTSTART:20260922T100000
DTEND:20260922T110000
SUMMARY:Stand-up
END:VEVENT
BEGIN:VEVENT
UID:b
DTSTART;VALUE=DATE:20260922
DTEND;VALUE=DATE:20260923
SUMMARY:All day
END:VEVENT
BEGIN:VEVENT
UID:c
DTSTART:20260923T100000
DTEND:20260923T110000
SUMMARY:Tomorrow
END:VEVENT
END:VCALENDAR`;

describe('todaySummary', () => {
  it('全ページのウィジェットを集め、アクティブページはライブの配列を使うこと', () => {
    const active = [widget('todo', { items: [] }, 'live')];
    const all = allWidgets({ p1: { widgets: [widget('clock', {}, 'stale')], layouts: {} as any }, p2: { widgets: [widget('notes', {}, 'n')], layouts: {} as any } }, 'p1', active);
    expect(all.map((w) => w.id)).toEqual(['n', 'live']);
  });

  it('未完了タスクと最も近いカウントダウンを数えること', () => {
    const summary = computeTodaySummary(
      [
        widget('todo', { items: [{ id: '1', text: 'a', completed: false }, { id: '2', text: 'b', completed: true }] }, 't1'),
        widget('todo', { items: [{ id: '3', text: 'c', completed: false }] }, 't2'),
        widget('countdown', {
          events: [
            { id: 'e1', name: 'Past', date: '2026-01-01' },
            { id: 'e2', name: 'Trip', date: '2026-09-27' },
            { id: 'e3', name: 'New Year', date: '2026-01-01', repeatYearly: true },
          ],
        }),
      ],
      null,
      now
    );
    expect(summary).toEqual({ openTasks: 2, nextCountdown: { name: 'Trip', days: 5 } });
    expect(isEmptySummary(summary)).toBe(false);
  });

  it('カレンダーは今日に重なる予定だけ数え、ウィジェットが無ければ項目自体を出さないこと', () => {
    const events = parseIcal(ICS);
    expect(countTodayEvents(events, now)).toBe(2);
    const withCalendar = computeTodaySummary([widget('calendar', { feeds: [{ id: 'f', url: 'https://x/a.ics' }] })], events, now);
    expect(withCalendar.events).toBe(2);
    const without = computeTodaySummary([widget('clock', {})], events, now);
    expect(without.events).toBeUndefined();
    expect(isEmptySummary(without)).toBe(true);
    // Zero of everything is "nothing to say".
    expect(isEmptySummary(computeTodaySummary([widget('todo', { items: [] })], null, now))).toBe(true);
  });

  it('フィード URL を重複なく集めること', () => {
    const urls = calendarFeedUrls([
      widget('calendar', { feeds: [{ url: 'https://a' }, { url: 'https://b' }] }, 'c1'),
      widget('calendar', { feeds: [{ url: 'https://a' }] }, 'c2'),
      widget('clock', {}),
    ]);
    expect(urls).toEqual(['https://a', 'https://b']);
  });
});
