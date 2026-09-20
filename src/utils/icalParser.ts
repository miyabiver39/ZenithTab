/**
 * A small iCalendar (RFC 5545) reader: enough of VEVENT to show "what's on
 * today" from a Google/Outlook/Apple calendar export URL. Handles line
 * unfolding, all-day and timed events, UTC / floating / TZID times (TZID
 * is treated as the user's local zone — the common single-zone case),
 * DURATION, the everyday RRULE shapes (DAILY / WEEKLY with BYDAY /
 * MONTHLY / YEARLY with INTERVAL, COUNT, UNTIL), EXDATE and
 * RECURRENCE-ID overrides. Anything more exotic is shown as a one-off.
 */

export interface ICalEvent {
  uid: string;
  summary: string;
  location?: string;
  start: Date;
  end: Date;
  allDay: boolean;
  rrule?: RecurrenceRule;
  /** Start times of occurrences to skip (as epoch ms). */
  exdates: number[];
  /** For an override of one occurrence of a recurring event: the original start it replaces. */
  recurrenceId?: Date;
}

export interface RecurrenceRule {
  freq: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY';
  interval: number;
  count?: number;
  until?: Date;
  /** Weekday numbers (0 = Sunday) for WEEKLY rules with BYDAY. */
  byDay?: number[];
}

/** One concrete occurrence, after recurrence expansion. */
export interface CalendarOccurrence {
  uid: string;
  summary: string;
  location?: string;
  start: Date;
  end: Date;
  allDay: boolean;
}

const WEEKDAYS: Record<string, number> = { SU: 0, MO: 1, TU: 2, WE: 3, TH: 4, FR: 5, SA: 6 };
const DAY_MS = 86_400_000;
/** Safety cap so a runaway rule can't spin forever. */
const MAX_OCCURRENCES = 1000;

interface Property {
  name: string;
  params: Record<string, string>;
  value: string;
}

function unfold(text: string): string[] {
  return text
    .replace(/\r\n?/g, '\n')
    .replace(/\n[ \t]/g, '')
    .split('\n')
    .filter((line) => line.length > 0);
}

function parseProperty(line: string): Property | null {
  // NAME;PARAM=a;PARAM2="x:y":value — the first ':' outside quotes ends the parameter list.
  let inQuotes = false;
  let colon = -1;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') inQuotes = !inQuotes;
    else if (ch === ':' && !inQuotes) {
      colon = i;
      break;
    }
  }
  if (colon <= 0) return null;
  const head = line.slice(0, colon).split(';');
  const name = head[0].toUpperCase();
  const params: Record<string, string> = {};
  for (const param of head.slice(1)) {
    const eq = param.indexOf('=');
    if (eq > 0) params[param.slice(0, eq).toUpperCase()] = param.slice(eq + 1).replace(/^"|"$/g, '');
  }
  return { name, params, value: line.slice(colon + 1) };
}

/** `\,` `\;` `\n` `\\` → the characters they stand for. */
export function unescapeText(value: string): string {
  return value.replace(/\\([\\;,nN])/g, (_, ch: string) => (ch === 'n' || ch === 'N' ? '\n' : ch));
}

/**
 * Parses an iCalendar date or date-time. Returns null for anything
 * unreadable. `allDay` is true for VALUE=DATE (or a bare 8-digit date).
 */
export function parseICalDate(value: string, params: Record<string, string> = {}): { date: Date; allDay: boolean } | null {
  const v = value.trim();
  const dateOnly = /^(\d{4})(\d{2})(\d{2})$/.exec(v);
  if (dateOnly || params.VALUE === 'DATE') {
    const m = dateOnly || /^(\d{4})(\d{2})(\d{2})/.exec(v);
    if (!m) return null;
    return { date: new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3])), allDay: true };
  }
  const m = /^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})?(Z)?$/.exec(v);
  if (!m) return null;
  const [y, mo, d, h, mi] = [Number(m[1]), Number(m[2]), Number(m[3]), Number(m[4]), Number(m[5])];
  const s = m[6] ? Number(m[6]) : 0;
  const date = m[7] ? new Date(Date.UTC(y, mo - 1, d, h, mi, s)) : new Date(y, mo - 1, d, h, mi, s);
  return Number.isNaN(date.getTime()) ? null : { date, allDay: false };
}

/** ISO 8601 duration as used by iCalendar (P1D, PT1H30M, P1W, -PT15M) → milliseconds. */
export function parseDuration(value: string): number | null {
  const m = /^([+-])?P(?:(\d+)W)?(?:(\d+)D)?(?:T(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?)?$/.exec(value.trim());
  if (!m) return null;
  const sign = m[1] === '-' ? -1 : 1;
  const [w, d, h, mi, s] = [m[2], m[3], m[4], m[5], m[6]].map((x) => Number(x || 0));
  return sign * (((w * 7 + d) * 24 * 3600 + h * 3600 + mi * 60 + s) * 1000);
}

export function parseRRule(value: string): RecurrenceRule | null {
  const parts: Record<string, string> = {};
  for (const kv of value.split(';')) {
    const eq = kv.indexOf('=');
    if (eq > 0) parts[kv.slice(0, eq).toUpperCase()] = kv.slice(eq + 1);
  }
  const freq = parts.FREQ as RecurrenceRule['freq'];
  if (!['DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY'].includes(freq)) return null;
  const rule: RecurrenceRule = { freq, interval: Math.max(1, parseInt(parts.INTERVAL || '1', 10) || 1) };
  if (parts.COUNT) rule.count = parseInt(parts.COUNT, 10);
  if (parts.UNTIL) {
    const until = parseICalDate(parts.UNTIL);
    // An all-day UNTIL means "through that day".
    if (until) rule.until = until.allDay ? new Date(until.date.getTime() + DAY_MS - 1) : until.date;
  }
  if (parts.BYDAY && freq === 'WEEKLY') {
    const days = parts.BYDAY.split(',')
      .map((d) => WEEKDAYS[d.replace(/^[+-]?\d+/, '').toUpperCase()])
      .filter((d) => d !== undefined);
    if (days.length > 0) rule.byDay = days;
  }
  return rule;
}

/** All VEVENTs in an .ics document. Never throws; unreadable events are skipped. */
export function parseIcal(text: string): ICalEvent[] {
  const events: ICalEvent[] = [];
  let current: Property[] | null = null;

  for (const line of unfold(text)) {
    if (/^BEGIN:VEVENT$/i.test(line)) {
      current = [];
      continue;
    }
    if (/^END:VEVENT$/i.test(line)) {
      if (current) {
        const event = buildEvent(current);
        if (event) events.push(event);
      }
      current = null;
      continue;
    }
    if (current) {
      const prop = parseProperty(line);
      if (prop) current.push(prop);
    }
  }
  return events;
}

function buildEvent(props: Property[]): ICalEvent | null {
  const get = (name: string) => props.find((p) => p.name === name);
  const dtstart = get('DTSTART');
  if (!dtstart) return null;
  const start = parseICalDate(dtstart.value, dtstart.params);
  if (!start) return null;

  let end: Date | null = null;
  const dtend = get('DTEND');
  if (dtend) end = parseICalDate(dtend.value, dtend.params)?.date ?? null;
  if (!end) {
    const duration = get('DURATION');
    const ms = duration ? parseDuration(duration.value) : null;
    end = ms !== null ? new Date(start.date.getTime() + ms) : start.allDay ? new Date(start.date.getTime() + DAY_MS) : start.date;
  }

  const exdates: number[] = [];
  for (const ex of props.filter((p) => p.name === 'EXDATE')) {
    for (const v of ex.value.split(',')) {
      const parsed = parseICalDate(v, ex.params);
      if (parsed) exdates.push(parsed.date.getTime());
    }
  }

  const rruleProp = get('RRULE');
  const recurrenceIdProp = get('RECURRENCE-ID');
  const recurrenceId = recurrenceIdProp ? parseICalDate(recurrenceIdProp.value, recurrenceIdProp.params)?.date : undefined;

  return {
    uid: get('UID')?.value || `${start.date.getTime()}-${get('SUMMARY')?.value || ''}`,
    summary: unescapeText(get('SUMMARY')?.value || ''),
    location: get('LOCATION')?.value ? unescapeText(get('LOCATION')!.value) : undefined,
    start: start.date,
    end,
    allDay: start.allDay,
    rrule: rruleProp ? parseRRule(rruleProp.value) || undefined : undefined,
    exdates,
    recurrenceId,
  };
}

function addMonths(date: Date, months: number): Date {
  const d = new Date(date.getTime());
  const day = d.getDate();
  d.setDate(1);
  d.setMonth(d.getMonth() + months);
  // Keep the day-of-month; clamp when the target month is shorter (Jan 31 → Feb 28).
  d.setDate(Math.min(day, new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate()));
  return d;
}

function addDays(date: Date, days: number): Date {
  const d = new Date(date.getTime());
  d.setDate(d.getDate() + days);
  return d;
}

/** Start times (epoch ms) of a recurring event's occurrences up to `rangeEnd`, honouring COUNT/UNTIL. */
function* occurrenceStarts(event: ICalEvent, rule: RecurrenceRule, rangeEnd: Date): Generator<Date> {
  const limit = rule.until && rule.until < rangeEnd ? rule.until : rangeEnd;
  let produced = 0;
  const emit = function* (d: Date) {
    if (rule.count !== undefined && produced >= rule.count) return false;
    if (d > limit) return false;
    if (d >= event.start) {
      produced += 1;
      yield d;
    }
    return true;
  };

  if (rule.freq === 'WEEKLY' && rule.byDay && rule.byDay.length > 0) {
    // Walk week by week from the week containing DTSTART; within each
    // week emit the BYDAY days in order.
    const weekStart = addDays(event.start, -event.start.getDay());
    const days = [...rule.byDay].sort((a, b) => a - b);
    for (let week = 0; week < MAX_OCCURRENCES; week += rule.interval) {
      const base = addDays(weekStart, week * 7);
      if (base > limit) return;
      for (const day of days) {
        const d = addDays(base, day);
        d.setHours(event.start.getHours(), event.start.getMinutes(), event.start.getSeconds(), 0);
        const keepGoing = yield* emit(d);
        if (!keepGoing) return;
      }
    }
    return;
  }

  for (let i = 0; i < MAX_OCCURRENCES; i++) {
    const n = i * rule.interval;
    const d =
      rule.freq === 'DAILY' ? addDays(event.start, n) : rule.freq === 'WEEKLY' ? addDays(event.start, n * 7) : rule.freq === 'MONTHLY' ? addMonths(event.start, n) : addMonths(event.start, n * 12);
    const keepGoing = yield* emit(d);
    if (!keepGoing) return;
  }
}

/**
 * Concrete occurrences overlapping [rangeStart, rangeEnd), sorted by start.
 * Recurring events are expanded; EXDATEs and RECURRENCE-ID overrides are
 * honoured; all-day events sort before timed ones on the same day.
 */
export function expandOccurrences(events: ICalEvent[], rangeStart: Date, rangeEnd: Date): CalendarOccurrence[] {
  // Overrides replace the master's occurrence with the same original start.
  const overridden = new Set<string>();
  for (const event of events) {
    if (event.recurrenceId) overridden.add(`${event.uid}@${event.recurrenceId.getTime()}`);
  }

  const out: CalendarOccurrence[] = [];
  const push = (event: ICalEvent, start: Date, end: Date) => {
    if (end <= rangeStart || start >= rangeEnd) return;
    out.push({ uid: event.uid, summary: event.summary, location: event.location, start, end, allDay: event.allDay });
  };

  for (const event of events) {
    const duration = event.end.getTime() - event.start.getTime();
    if (!event.rrule || event.recurrenceId) {
      push(event, event.start, event.end);
      continue;
    }
    for (const start of occurrenceStarts(event, event.rrule, rangeEnd)) {
      const key = `${event.uid}@${start.getTime()}`;
      if (event.exdates.includes(start.getTime()) || overridden.has(key)) continue;
      push(event, start, new Date(start.getTime() + duration));
    }
  }

  return out.sort((a, b) => a.start.getTime() - b.start.getTime() || Number(b.allDay) - Number(a.allDay) || a.summary.localeCompare(b.summary));
}
