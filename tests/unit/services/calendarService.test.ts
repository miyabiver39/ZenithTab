import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';
import { calendarService, CalendarPermissionRequired } from '../../../src/services/calendarService';
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

  it('取得して解析し、生テキストをキャッシュすること', async () => {
    const fetchSpy = mockFetch();
    const events = await calendarService.fetchCalendar(CAL_URL);
    expect(fetchSpy).toHaveBeenCalledWith(CAL_URL, expect.objectContaining({ headers: expect.any(Object) }));
    expect(events).toHaveLength(1);
    expect(events[0].summary).toBe('Dentist');
    expect(chromeStorageData.zenith_calendar_cache[CAL_URL].text).toContain('Dentist');
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
    await expect(calendarService.fetchCalendar(CAL_URL)).rejects.toThrow('Not an iCalendar');
    mockFetch(ICS, false, 500);
    await expect(calendarService.fetchCalendar(CAL_URL)).rejects.toThrow('HTTP error 500');

    mockFetch();
    await calendarService.fetchCalendar(CAL_URL);
    mockFetch(ICS, false, 500);
    expect(await calendarService.fetchCalendar(CAL_URL, true)).toHaveLength(1);
  });
});
