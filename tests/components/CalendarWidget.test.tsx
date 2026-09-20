import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, within, waitFor, act } from '@testing-library/react';
import { setupUser, literal } from '../helpers/user';
import { CalendarWidget } from '../../src/components/widgets/CalendarWidget/CalendarWidget';
import { prepareCalendarConfigForSave } from '../../src/components/widgets/CalendarWidget/CalendarConfig';
import { WidgetConfigModal } from '../../src/components/layout/WidgetConfigModal';
import { calendarService, CalendarPermissionRequired } from '../../src/services/calendarService';
import { parseIcal } from '../../src/utils/icalParser';
import { useDashboardStore } from '../../src/store/useDashboardStore';
import { resetDashboardStore } from '../helpers/store';
import { WidgetHarness } from '../helpers/WidgetHarness';
import { chromeMock } from '../helpers/chrome';

const WIDGET_ID = 'widget-calendar-test';
const FEED = { id: 'f1', url: 'https://cal.example.com/work.ics', label: 'Work', color: '#38bdf8' };
const config = () => useDashboardStore.getState().widgets.find((w) => w.id === WIDGET_ID)!.config;

const ICS = [
  'BEGIN:VCALENDAR',
  'BEGIN:VEVENT',
  'UID:1',
  'SUMMARY:Standup',
  'LOCATION:Room A',
  'DTSTART:20260920T100000',
  'DTEND:20260920T101500',
  'RRULE:FREQ=DAILY',
  'END:VEVENT',
  'BEGIN:VEVENT',
  'UID:2',
  'SUMMARY:Holiday',
  'DTSTART;VALUE=DATE:20260921',
  'END:VEVENT',
  'BEGIN:VEVENT',
  'UID:3',
  'SUMMARY:Far away',
  'DTSTART:20261001T100000',
  'END:VEVENT',
  'END:VCALENDAR',
].join('\r\n');

function renderCalendar(overrides: Record<string, any> = {}) {
  useDashboardStore.setState((s) => ({
    widgets: [
      ...s.widgets,
      {
        id: WIDGET_ID,
        type: 'calendar',
        title: 'Cal',
        config: { feeds: [FEED], daysAhead: 3, showLocation: true, ...overrides },
        layout: { i: WIDGET_ID, x: 0, y: 0, w: 4, h: 4 },
      },
    ],
  }));
  return render(<WidgetHarness widgetId={WIDGET_ID} render={(w) => <CalendarWidget widgetId={w.id} config={w.config as any} />} />);
}

describe('CalendarWidget', () => {
  beforeEach(() => {
    resetDashboardStore();
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date(2026, 8, 20, 9, 0));
    vi.spyOn(calendarService, 'fetchCalendar').mockResolvedValue(parseIcal(ICS));
  });
  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it('今日・明日・曜日ごとにグループ化し、繰り返しと終日を表示すること', async () => {
    renderCalendar();
    await waitFor(() => expect(screen.getByTestId('calendar-days')).toBeInTheDocument());
    const days = within(screen.getByTestId('calendar-days'));
    expect(days.getByText('Today')).toBeInTheDocument();
    expect(days.getByText('Tomorrow')).toBeInTheDocument();
    // Daily standup appears on all three days; the all-day holiday only tomorrow; Oct 1 is out of range.
    expect(days.getAllByText('Standup')).toHaveLength(3);
    expect(days.getByText('Holiday')).toBeInTheDocument();
    expect(days.getByText('All day')).toBeInTheDocument();
    expect(days.getAllByText('10:00–10:15')).toHaveLength(3);
    expect(days.getAllByText('Room A')).toHaveLength(3);
    expect(screen.queryByText('Far away')).not.toBeInTheDocument();
  });

  it('カレンダー未登録なら設定への誘導、権限が無ければ許可ボタンを出すこと', async () => {
    const user = setupUser();
    const { unmount } = renderCalendar({ feeds: [] });
    expect(await screen.findByText('Add a calendar link to see your upcoming events here.')).toBeInTheDocument();
    unmount();
    resetDashboardStore();

    (calendarService.fetchCalendar as any).mockRejectedValue(new CalendarPermissionRequired(FEED.url));
    renderCalendar();
    await user.click(await screen.findByText('Allow this calendar'));
    expect(chromeMock.permissions.request).toHaveBeenCalledWith({ origins: ['https://cal.example.com/*'] });
  });

  it('設定でカレンダーを追加でき、保存時に webcal を正規化して権限を求めること', async () => {
    const user = setupUser();
    renderCalendar({ feeds: [] });
    act(() => useDashboardStore.getState().openSettingsModal('editWidget', WIDGET_ID));
    render(<WidgetConfigModal />);

    await user.type(screen.getByLabelText('Name'), literal('Home'));
    await user.type(screen.getByLabelText('iCal URL'), literal('webcal://cal.example.com/home.ics'));
    await user.click(screen.getByRole('button', { name: 'Add' }));
    await user.click(screen.getByText('7 days'));
    await user.click(screen.getByText('Save Changes'));

    expect(config().feeds).toHaveLength(1);
    expect(config().feeds[0]).toMatchObject({ label: 'Home', url: 'https://cal.example.com/home.ics' });
    expect(config().daysAhead).toBe(7);
    expect(chromeMock.permissions.request).toHaveBeenCalledWith({ origins: ['https://cal.example.com/*'] });
  });

  it('prepareCalendarConfigForSave は http(s) 以外のフィードを落とすこと', () => {
    const out = prepareCalendarConfigForSave({
      feeds: [
        { id: 'a', url: 'webcal://x.example/a.ics', label: 'A', color: '#fff' },
        { id: 'b', url: 'javascript:alert(1)', label: 'B', color: '#fff' },
      ],
    });
    expect(out.feeds.map((f: any) => f.url)).toEqual(['https://x.example/a.ics']);
  });
});
