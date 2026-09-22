import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';
import { calendarService, CalendarPermissionRequired, NotAnICalDocument } from '../../../src/services/calendarService';
import { chromeMock, chromeStorageData } from '../../helpers/chrome';

const CAL_URL = 'https://calendar.example.com/private/basic.ics';

const ICS = ['BEGIN:VCALENDAR', 'BEGIN:VEVENT', 'UID:1', 'SUMMARY:Dentist', 'DTSTART:20260921T090000', 'END:VEVENT', 'END:VCALENDAR'].join('\r\n');
const ICS_NEWER = ICS.replace('Dentist', 'Doctor');

function mockFetch(body = ICS, ok = true, status = 200) {
  return vi.spyOn(globalThis, 'fetch').mockClear().mockResolvedValue({
    ok,
    status,
    statusText: ok ? 'OK' : 'Error',
    text: async () => body,
  } as Response);
}

describe('calendarService', () => {
  beforeEach(() => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it('webcal:// を https:// に直し、http(s) 以外は拒否すること', () => {
    expect(calendarService.normalizeCalendarUrl('webcal://cal.example.com/x.ics')).toBe('https://cal.example.com/x.ics');
    expect(calendarService.normalizeCalendarUrl('  https://cal.example.com/x.ics ')).toBe('https://cal.example.com/x.ics');
    expect(calendarService.normalizeCalendarUrl('javascript:alert(1)')).toBeNull();
    expect(calendarService.normalizeCalendarUrl('')).toBeNull();
  });

  it('Google カレンダーの「URL で追加」リンクと埋め込みページ URL を .ics に変換すること', () => {
    expect(calendarService.normalizeCalendarUrl('https://calendar.google.com/calendar/u/0/r?cid=https://bestcalendar.jp/ical/2026/holidays.ics')).toBe(
      'https://bestcalendar.jp/ical/2026/holidays.ics'
    );
    expect(calendarService.normalizeCalendarUrl('https://calendar.google.com/calendar/r?cid=webcal%3A%2F%2Fx.example%2Fa.ics')).toBe('https://x.example/a.ics');
    expect(calendarService.normalizeCalendarUrl('https://calendar.google.com/calendar/embed?src=ja.japanese%23holiday%40group.v.calendar.google.com&ctz=Asia%2FTokyo')).toBe(
      'https://calendar.google.com/calendar/ical/ja.japanese%23holiday%40group.v.calendar.google.com/public/basic.ics'
    );
    // Real iCal links and other hosts pass through untouched.
    expect(calendarService.normalizeCalendarUrl('https://calendar.google.com/calendar/ical/abc/private-123/basic.ics')).toBe('https://calendar.google.com/calendar/ical/abc/private-123/basic.ics');
    expect(calendarService.normalizeCalendarUrl('https://example.com/page?cid=https://evil.example/x')).toBe('https://example.com/page?cid=https://evil.example/x');
    expect(calendarService.looksLikeICalUrl('https://calendar.google.com/calendar/embed?src=x')).toBe(false);
    expect(calendarService.looksLikeICalUrl('https://x.example/feed.ics?token=1')).toBe(true);
    expect(calendarService.looksLikeICalUrl('https://outlook.live.com/owa/calendar/abc/calendar.ics')).toBe(true);
  });

  it('取得して解析し、生テキストをキャッシュすること', async () => {
    const fetchSpy = mockFetch();
    const events = await calendarService.fetchCalendar(CAL_URL);
    expect(fetchSpy).toHaveBeenCalledWith(CAL_URL, expect.objectContaining({ headers: expect.any(Object) }));
    expect(events).toHaveLength(1);
    expect(events[0].summary).toBe('Dentist');
    expect(chromeStorageData.zenith_calendar_cache[CAL_URL].text).toContain('Dentist');
  });

  it('複数フィードを並列取得しても、互いのキャッシュを上書きして消さないこと (#49)', async () => {
    const urls = ['https://a.example/a.ics', 'https://b.example/b.ics', 'https://c.example/c.ics'];
    // Responses resolve in reverse order so the slowest fetch writes last.
    const gates: Array<() => void> = [];
    vi.spyOn(globalThis, 'fetch').mockImplementation((input) =>
      new Promise((resolve) => {
        gates.push(() =>
          resolve({ ok: true, status: 200, statusText: 'OK', text: async () => ICS.replace('Dentist', String(input)) } as Response)
        );
      })
    );
    const all = Promise.all(urls.map((u) => calendarService.fetchCalendar(u)));
    await vi.waitFor(() => expect(gates).toHaveLength(3));
    [...gates].reverse().forEach((open) => open());
    await all;

    expect(Object.keys(chromeStorageData.zenith_calendar_cache).sort()).toEqual([...urls].sort());
    // And every entry is served from cache now.
    const fetchSpy = mockFetch(ICS_NEWER);
    for (const u of urls) expect((await calendarService.fetchCalendar(u))[0].summary).toBe(u);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('TTL 内はキャッシュを使い、bypassCache で再取得すること', async () => {
    mockFetch();
    await calendarService.fetchCalendar(CAL_URL);
    const fetchSpy = mockFetch(ICS_NEWER);
    expect((await calendarService.fetchCalendar(CAL_URL))[0].summary).toBe('Dentist');
    expect(fetchSpy).not.toHaveBeenCalled();
    expect((await calendarService.fetchCalendar(CAL_URL, true))[0].summary).toBe('Doctor');
  });

  it('ホスト権限が無ければ CalendarPermissionRequired、キャッシュがあればそれを返すこと', async () => {
    chromeMock.permissions.contains.mockResolvedValue(false);
    const fetchSpy = mockFetch();
    await expect(calendarService.fetchCalendar(CAL_URL)).rejects.toBeInstanceOf(CalendarPermissionRequired);
    expect(fetchSpy).not.toHaveBeenCalled();

    chromeMock.permissions.contains.mockResolvedValue(true);
    await calendarService.fetchCalendar(CAL_URL);
    chromeMock.permissions.contains.mockResolvedValue(false);
    expect(await calendarService.fetchCalendar(CAL_URL, true)).toHaveLength(1);
  });

  it('HTTP エラーや iCalendar でない応答はキャッシュが無ければ例外、あれば古いデータを返すこと', async () => {
    mockFetch('<html>nope</html>');
    await expect(calendarService.fetchCalendar(CAL_URL)).rejects.toBeInstanceOf(NotAnICalDocument);
    mockFetch(ICS, false, 500);
    await expect(calendarService.fetchCalendar(CAL_URL)).rejects.toThrow('HTTP error 500');

    mockFetch();
    await calendarService.fetchCalendar(CAL_URL);
    mockFetch(ICS, false, 500);
    expect(await calendarService.fetchCalendar(CAL_URL, true)).toHaveLength(1);
  });

  it('応答が大きすぎる場合はキャッシュが無ければ例外、あれば古いデータを返すこと', async () => {
    const tooBig = {
      ok: true,
      status: 200,
      statusText: 'OK',
      url: CAL_URL,
      headers: { get: (name: string) => (name === 'content-length' ? String(20 * 1024 * 1024) : null) },
      text: async () => {
        throw new Error('should not read the body when Content-Length already exceeds the limit');
      },
    } as unknown as Response;
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(tooBig);
    await expect(calendarService.fetchCalendar(CAL_URL)).rejects.toThrow(/exceeds the .*-byte limit/);

    mockFetch();
    await calendarService.fetchCalendar(CAL_URL);
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(tooBig);
    expect(await calendarService.fetchCalendar(CAL_URL, true)).toHaveLength(1);
  });

  it('readCached はキャッシュだけを読み、無ければ空、壊れていれば空で、決して fetch しないこと', async () => {
    const fetchSpy = mockFetch();
    expect(await calendarService.readCached(CAL_URL)).toEqual([]);

    chromeStorageData.zenith_calendar_cache = { [CAL_URL]: { text: ICS, lastUpdated: 1 } };
    const events = await calendarService.readCached(CAL_URL);
    expect(events).toHaveLength(1);
    expect(events[0].summary).toBe('Dentist');
    // Even a stale entry is served as-is; freshness is the widget's business.
    expect(fetchSpy).not.toHaveBeenCalled();

    chromeStorageData.zenith_calendar_cache = { [CAL_URL]: { text: 42 as unknown as string, lastUpdated: 1 } };
    expect(await calendarService.readCached(CAL_URL)).toEqual([]);
    chromeStorageData.zenith_calendar_cache = 'not an object' as unknown as Record<string, never>;
    expect(await calendarService.readCached(CAL_URL)).toEqual([]);
    expect(fetchSpy).not.toHaveBeenCalled();
  });
});
