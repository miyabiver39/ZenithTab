import { describe, it, expect } from 'vitest';
import { parseIcal, expandOccurrences, parseICalDate, parseDuration, parseRRule, unescapeText } from '../../../src/utils/icalParser';

const ics = (body: string) => `BEGIN:VCALENDAR\r\nVERSION:2.0\r\n${body.trim().replace(/\n/g, '\r\n')}\r\nEND:VCALENDAR\r\n`;
const d = (y: number, m: number, day: number, h = 0, mi = 0) => new Date(y, m - 1, day, h, mi);

describe('utils/icalParser', () => {
  it('日付・日時(ローカル / UTC)・DURATION を読めること', () => {
    expect(parseICalDate('20261225', {})).toEqual({ date: d(2026, 12, 25), allDay: true });
    expect(parseICalDate('20261225', { VALUE: 'DATE' })?.allDay).toBe(true);
    expect(parseICalDate('20261225T093000', { TZID: 'Asia/Tokyo' })).toEqual({ date: d(2026, 12, 25, 9, 30), allDay: false });
    expect(parseICalDate('20261225T003000Z')?.date.getTime()).toBe(Date.UTC(2026, 11, 25, 0, 30));
    expect(parseICalDate('garbage')).toBeNull();
    expect(parseDuration('PT1H30M')).toBe(5400000);
    expect(parseDuration('P1D')).toBe(86400000);
    expect(parseDuration('-PT15M')).toBe(-900000);
    expect(parseDuration('1H')).toBeNull();
    expect(unescapeText(String.raw`Lunch\, then\; work\nnext\\line`)).toBe('Lunch, then; work\nnext\\line');
  });

  it('折り返し行と複数イベントを解析し、DTEND 無しの終日は翌日終了になること', () => {
    const events = parseIcal(
      ics(`
BEGIN:VEVENT
UID:a@x
SUMMARY:A very long summary that
  continues on the next line
DTSTART;VALUE=DATE:20260921
LOCATION:Room\\, 3F
END:VEVENT
BEGIN:VEVENT
UID:b@x
SUMMARY:Standup
DTSTART;TZID=Asia/Tokyo:20260921T100000
DTEND;TZID=Asia/Tokyo:20260921T101500
END:VEVENT
BEGIN:VEVENT
SUMMARY:broken (no DTSTART)
END:VEVENT
`)
    );
    expect(events).toHaveLength(2);
    expect(events[0]).toMatchObject({ uid: 'a@x', summary: 'A very long summary that continues on the next line', location: 'Room, 3F', allDay: true });
    expect(events[0].end).toEqual(d(2026, 9, 22));
    expect(events[1]).toMatchObject({ summary: 'Standup', allDay: false, start: d(2026, 9, 21, 10, 0), end: d(2026, 9, 21, 10, 15) });
  });

  it('RRULE を解析すること', () => {
    expect(parseRRule('FREQ=WEEKLY;INTERVAL=2;BYDAY=MO,WE,FR;COUNT=10')).toEqual({ freq: 'WEEKLY', interval: 2, count: 10, byDay: [1, 3, 5] });
    expect(parseRRule('FREQ=YEARLY;UNTIL=20271231')?.until).toEqual(new Date(d(2028, 1, 1).getTime() - 1));
    expect(parseRRule('FREQ=HOURLY')).toBeNull();
  });

  it('毎日・毎週 BYDAY・毎月・毎年の繰り返しを期間内に展開すること', () => {
    const events = parseIcal(
      ics(`
BEGIN:VEVENT
UID:daily
SUMMARY:Daily
DTSTART:20260901T080000
DTEND:20260901T083000
RRULE:FREQ=DAILY;COUNT=30
END:VEVENT
BEGIN:VEVENT
UID:weekly
SUMMARY:Gym
DTSTART:20260901T190000
DTEND:20260901T200000
RRULE:FREQ=WEEKLY;BYDAY=TU,TH
END:VEVENT
BEGIN:VEVENT
UID:monthly
SUMMARY:Rent
DTSTART;VALUE=DATE:20260131
RRULE:FREQ=MONTHLY
END:VEVENT
BEGIN:VEVENT
UID:yearly
SUMMARY:Birthday
DTSTART;VALUE=DATE:19900922
RRULE:FREQ=YEARLY
END:VEVENT
`)
    );
    // Sep 20 (Sun) – Sep 26 (Sat) 2026
    const occ = expandOccurrences(events, d(2026, 9, 20), d(2026, 9, 27));
    const by = (uid: string) => occ.filter((o) => o.uid === uid).map((o) => `${o.start.getMonth() + 1}/${o.start.getDate()}`);
    expect(by('daily')).toEqual(['9/20', '9/21', '9/22', '9/23', '9/24', '9/25', '9/26']);
    expect(by('weekly')).toEqual(['9/22', '9/24']);
    expect(by('yearly')).toEqual(['9/22']);
    expect(by('monthly')).toEqual([]);
    // Monthly on the 31st clamps to the month's last day.
    expect(expandOccurrences(events, d(2026, 9, 30), d(2026, 10, 1)).filter((o) => o.uid === 'monthly')).toHaveLength(1);
    // COUNT: the daily one ends after 30 days (Sep 30 is the last).
    expect(expandOccurrences(events, d(2026, 10, 1), d(2026, 10, 3)).filter((o) => o.uid === 'daily')).toHaveLength(0);
  });

  it('EXDATE と RECURRENCE-ID による例外を反映し、UNTIL で止まること', () => {
    const events = parseIcal(
      ics(`
BEGIN:VEVENT
UID:standup
SUMMARY:Standup
DTSTART:20260901T100000
DTEND:20260901T101500
RRULE:FREQ=DAILY;UNTIL=20260923T235959
EXDATE:20260921T100000,20260922T100000
END:VEVENT
BEGIN:VEVENT
UID:standup
RECURRENCE-ID:20260923T100000
SUMMARY:Standup (moved)
DTSTART:20260923T140000
DTEND:20260923T141500
END:VEVENT
`)
    );
    const occ = expandOccurrences(events, d(2026, 9, 20), d(2026, 9, 27));
    expect(occ.map((o) => `${o.start.getDate()} ${o.start.getHours()}:00 ${o.summary}`)).toEqual(['20 10:00 Standup', '23 14:00 Standup (moved)']);
  });

  it('期間に重なる複数日イベントを含め、同日では終日を先に並べること', () => {
    const events = parseIcal(
      ics(`
BEGIN:VEVENT
UID:trip
SUMMARY:Trip
DTSTART;VALUE=DATE:20260918
DTEND;VALUE=DATE:20260922
END:VEVENT
BEGIN:VEVENT
UID:call
SUMMARY:Call
DTSTART:20260920T000000
DTEND:20260920T003000
END:VEVENT
BEGIN:VEVENT
UID:old
SUMMARY:Old
DTSTART;VALUE=DATE:20260901
END:VEVENT
`)
    );
    const occ = expandOccurrences(events, d(2026, 9, 20), d(2026, 9, 21));
    expect(occ.map((o) => o.summary)).toEqual(['Trip', 'Call']);
  });
});

describe('utils/icalParser — 何年も前に始まった繰り返し (#48)', () => {
  const ics2 = (body: string) => `BEGIN:VCALENDAR\r\n${body.trim().replace(/\n/g, '\r\n')}\r\nEND:VCALENDAR\r\n`;
  const d2 = (y: number, m: number, day: number, h = 0, mi = 0) => new Date(y, m - 1, day, h, mi);
  const week = [d2(2026, 9, 20), d2(2026, 9, 27)]; // Sun–Sat

  it('5 年前に始まった毎日・毎週(BYDAY)・毎月・毎年の予定が今週に表示されること', () => {
    const events = parseIcal(
      ics2(`
BEGIN:VEVENT
UID:daily
SUMMARY:Standup
DTSTART:20210104T090000
DTEND:20210104T091500
RRULE:FREQ=DAILY
END:VEVENT
BEGIN:VEVENT
UID:weekly
SUMMARY:Gym
DTSTART:20210105T190000
DTEND:20210105T200000
RRULE:FREQ=WEEKLY;BYDAY=TU,TH
END:VEVENT
BEGIN:VEVENT
UID:biweekly
SUMMARY:Sprint
DTSTART:20210105T100000
DTEND:20210105T110000
RRULE:FREQ=WEEKLY;INTERVAL=2
END:VEVENT
BEGIN:VEVENT
UID:monthly
SUMMARY:Rent
DTSTART;VALUE=DATE:20190125
RRULE:FREQ=MONTHLY
END:VEVENT
BEGIN:VEVENT
UID:yearly
SUMMARY:Birthday
DTSTART;VALUE=DATE:19850922
RRULE:FREQ=YEARLY
END:VEVENT
`)
    );
    const occ = expandOccurrences(events, week[0], week[1]);
    const by = (uid: string) => occ.filter((o) => o.uid === uid).map((o) => `${o.start.getMonth() + 1}/${o.start.getDate()}`);
    expect(by('daily')).toEqual(['9/20', '9/21', '9/22', '9/23', '9/24', '9/25', '9/26']);
    expect(by('weekly')).toEqual(['9/22', '9/24']);
    // 2021-01-05 is a Tuesday; every second Tuesday lands on 9/22 (299 weeks later... 300 weeks = even).
    expect(by('biweekly')).toEqual(['9/22']);
    expect(by('yearly')).toEqual(['9/22']);
    expect(by('monthly')).toEqual(['9/25']);
  });

  it('スキップした回数も COUNT に数え、既に終わった繰り返しは表示しないこと', () => {
    const events = parseIcal(
      ics2(`
BEGIN:VEVENT
UID:short
SUMMARY:Ten days only
DTSTART:20210104T090000
RRULE:FREQ=DAILY;COUNT=10
END:VEVENT
BEGIN:VEVENT
UID:until
SUMMARY:Ended last year
DTSTART:20210104T090000
RRULE:FREQ=DAILY;UNTIL=20251231T000000
END:VEVENT
BEGIN:VEVENT
UID:bydaycount
SUMMARY:Five gym sessions
DTSTART:20210105T190000
RRULE:FREQ=WEEKLY;BYDAY=TU,TH;COUNT=5
END:VEVENT
BEGIN:VEVENT
UID:bigcount
SUMMARY:Still running
DTSTART:20210104T090000
RRULE:FREQ=DAILY;COUNT=5000
END:VEVENT
`)
    );
    const occ = expandOccurrences(events, week[0], week[1]);
    expect(occ.map((o) => o.uid)).not.toContain('short');
    expect(occ.map((o) => o.uid)).not.toContain('until');
    expect(occ.map((o) => o.uid)).not.toContain('bydaycount');
    expect(occ.filter((o) => o.uid === 'bigcount')).toHaveLength(7);
  });

  it('COUNT の境界がちょうど表示範囲にかかる場合、正確な回数で止まること', () => {
    // Daily from 2026-09-01 with COUNT=22 → last occurrence 2026-09-22.
    const events = parseIcal(ics2(`
BEGIN:VEVENT
UID:edge
SUMMARY:Edge
DTSTART:20260901T090000
RRULE:FREQ=DAILY;COUNT=22
END:VEVENT
`));
    const occ = expandOccurrences(events, week[0], week[1]);
    expect(occ.map((o) => o.start.getDate())).toEqual([20, 21, 22]);
  });

  it('範囲より前に始まり範囲に食い込む複数日の繰り返しも拾うこと', () => {
    // A 3-day event every week from 2021, occurrence starting Sat 9/19 runs into Sun 9/20.
    const events = parseIcal(ics2(`
BEGIN:VEVENT
UID:long
SUMMARY:Weekend trip
DTSTART;VALUE=DATE:20210109
DTEND;VALUE=DATE:20210112
RRULE:FREQ=WEEKLY
END:VEVENT
`));
    const occ = expandOccurrences(events, d2(2026, 9, 20), d2(2026, 9, 21));
    expect(occ.map((o) => `${o.start.getMonth() + 1}/${o.start.getDate()}`)).toEqual(['9/19']);
  });
});
