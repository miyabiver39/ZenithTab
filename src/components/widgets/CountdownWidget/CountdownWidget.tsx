import React, { useEffect, useMemo, useState } from 'react';
import { Plus, Trash2, Repeat, X } from 'lucide-react';
import { CountdownWidgetConfig, CountdownEvent } from '../../../types/widget';
import { useDashboardStore } from '../../../store/useDashboardStore';
import { useTranslation } from '../../../i18n/i18n';
import { uniqueId } from '../../../utils/id';
import { cn } from '../../../utils/cn';
import { daysUntil, nextOccurrence, parseDayKey, toDayKey } from '../../../utils/countdown';
import { getIntlLocale } from '../../../utils/date';

interface CountdownWidgetProps {
  widgetId: string;
  config: CountdownWidgetConfig;
}

interface Resolved {
  event: CountdownEvent;
  days: number;
  when: Date;
}

/**
 * "12 days until the exam" — a list of dates with the days remaining, the
 * nearest first. Events are managed inline (no settings form) because
 * adding one is a name and a date, nothing more.
 */
export const CountdownWidget: React.FC<CountdownWidgetProps> = ({ widgetId, config }) => {
  const { events = [] } = config;
  const updateWidgetConfig = useDashboardStore((s) => s.updateWidgetConfig);
  const updateWidgetConfigUndoable = useDashboardStore((s) => s.updateWidgetConfigUndoable);
  const { t, activeLanguageCode } = useTranslation();
  const [isAdding, setIsAdding] = useState(false);
  const [name, setName] = useState('');
  const [date, setDate] = useState('');
  const [emoji, setEmoji] = useState('');
  const [repeatYearly, setRepeatYearly] = useState(false);

  // The day key is the only thing that changes what's shown; re-check it
  // when the tab is shown again rather than ticking a timer.
  const [today, setToday] = useState(() => new Date());
  useEffect(() => {
    const refresh = () => {
      if (!document.hidden && toDayKey(new Date()) !== toDayKey(today)) setToday(new Date());
    };
    document.addEventListener('visibilitychange', refresh);
    window.addEventListener('focus', refresh);
    return () => {
      document.removeEventListener('visibilitychange', refresh);
      window.removeEventListener('focus', refresh);
    };
  }, [today]);

  const resolved = useMemo<Resolved[]>(
    () =>
      events
        .map((event) => {
          const when = nextOccurrence(event, today);
          const days = daysUntil(event, today);
          return when && days !== null ? { event, days, when } : null;
        })
        .filter((r): r is Resolved => r !== null)
        // Upcoming first (nearest on top); past one-offs sink to the bottom.
        .sort((a, b) => (a.days < 0 ? 1 : 0) - (b.days < 0 ? 1 : 0) || a.days - b.days),
    [events, today]
  );

  const dateFormatter = useMemo(
    () => new Intl.DateTimeFormat(getIntlLocale(activeLanguageCode), { month: 'short', day: 'numeric', year: 'numeric' }),
    [activeLanguageCode]
  );

  const resetForm = () => {
    setName('');
    setDate('');
    setEmoji('');
    setRepeatYearly(false);
    setIsAdding(false);
  };

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !parseDayKey(date)) return;
    const next: CountdownEvent = {
      id: uniqueId('countdown'),
      name: name.trim(),
      date,
      emoji: emoji.trim() || undefined,
      repeatYearly: repeatYearly || undefined,
    };
    updateWidgetConfig(widgetId, { events: [...events, next] });
    resetForm();
  };

  const handleRemove = (event: CountdownEvent) => {
    updateWidgetConfigUndoable(
      widgetId,
      { events: events.filter((ev) => ev.id !== event.id) },
      t.undo.removedCountdown.replace('{name}', event.name)
    );
  };

  const remainingLabel = (days: number) => {
    if (days === 0) return t.widgets.countdown.today;
    if (days === 1) return t.widgets.countdown.tomorrow;
    if (days < 0) return t.widgets.countdown.daysAgo.replace('{n}', String(-days));
    return t.widgets.countdown.daysLeft.replace('{n}', String(days));
  };

  const single = resolved.length === 1 && !isAdding;

  return (
    <div className="w-full h-full flex flex-col min-h-0 select-none">
      <div className={cn('flex-1 min-h-0 overflow-y-auto custom-scrollbar pr-1', single && 'flex items-center justify-center')}>
        {resolved.length === 0 && !isAdding ? (
          <div className="h-full flex items-center justify-center text-xs text-slate-400 text-center px-4">{t.widgets.countdown.empty}</div>
        ) : single ? (
          <HeroEvent
            item={resolved[0]}
            label={remainingLabel(resolved[0].days)}
            dateText={dateFormatter.format(resolved[0].when)}
            deleteTitle={t.common.delete}
            onRemove={() => handleRemove(resolved[0].event)}
          />
        ) : (
          <ul className="space-y-1.5" data-testid="countdown-list">
            {resolved.map((item) => (
              <li
                key={item.event.id}
                className={cn(
                  'group flex items-center gap-2.5 px-2.5 py-2 rounded-xl bg-white/[0.03] border border-white/5 hover:bg-white/[0.06] transition-colors',
                  item.days < 0 && 'opacity-60'
                )}
              >
                <span className="w-7 h-7 flex items-center justify-center rounded-lg bg-rose-500/10 text-base flex-shrink-0">
                  {item.event.emoji || '📅'}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-medium text-slate-200 truncate flex items-center gap-1">
                    {item.event.name}
                    {item.event.repeatYearly && <Repeat size={10} className="text-slate-500 flex-shrink-0" aria-label={t.widgets.countdown.repeatYearly} />}
                  </div>
                  <div className="text-[10px] text-slate-500 truncate">{dateFormatter.format(item.when)}</div>
                </div>
                <div className="text-right flex-shrink-0">
                  <div className={cn('text-lg font-bold leading-none tabular-nums', item.days === 0 ? 'text-rose-300' : 'text-white')}>
                    {item.days === 0 ? '🎉' : Math.abs(item.days)}
                  </div>
                  <div className="text-[10px] text-slate-400">{remainingLabel(item.days)}</div>
                </div>
                <button
                  type="button"
                  onClick={() => handleRemove(item.event)}
                  title={t.common.delete}
                  className="opacity-0 group-hover:opacity-100 p-1 text-slate-500 hover:text-rose-400 rounded transition-all"
                >
                  <Trash2 size={12} />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {isAdding ? (
        <form onSubmit={handleAdd} className="mt-2 pt-2 border-t border-white/5 space-y-1.5 flex-shrink-0" data-testid="countdown-form">
          <div className="flex items-center gap-1.5">
            <input
              type="text"
              value={emoji}
              onChange={(e) => setEmoji(e.target.value)}
              placeholder="🎂"
              aria-label={t.widgets.countdown.emojiField}
              maxLength={4}
              className="w-10 px-1.5 py-1.5 rounded-lg bg-slate-900/60 border border-white/10 text-xs text-white text-center placeholder-slate-600 focus:outline-none focus:border-sky-400/50"
            />
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t.widgets.countdown.namePlaceholder}
              aria-label={t.widgets.countdown.nameField}
              autoFocus
              className="flex-1 min-w-0 px-2.5 py-1.5 rounded-lg bg-slate-900/60 border border-white/10 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-400/50"
            />
          </div>
          <div className="flex items-center gap-1.5">
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              aria-label={t.widgets.countdown.dateField}
              className="flex-1 min-w-0 px-2.5 py-1.5 rounded-lg bg-slate-900/60 border border-white/10 text-xs text-white focus:outline-none focus:border-sky-400/50 [color-scheme:dark]"
            />
            <label className="flex items-center gap-1 text-[10px] text-slate-300 whitespace-nowrap cursor-pointer">
              <input
                type="checkbox"
                checked={repeatYearly}
                onChange={(e) => setRepeatYearly(e.target.checked)}
                aria-label={t.widgets.countdown.repeatYearly}
                className="w-3.5 h-3.5 rounded text-sky-500 bg-slate-800 border-white/20"
              />
              <Repeat size={10} />
              {t.widgets.countdown.repeatYearlyShort}
            </label>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              type="submit"
              disabled={!name.trim() || !parseDayKey(date)}
              className="flex-1 py-1 rounded-lg bg-sky-500 hover:bg-sky-400 disabled:opacity-50 text-white text-[11px] font-medium transition-colors"
            >
              {t.widgets.countdown.add}
            </button>
            <button type="button" onClick={resetForm} title={t.common.cancel} className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors">
              <X size={12} />
            </button>
          </div>
        </form>
      ) : (
        <button
          type="button"
          onClick={() => setIsAdding(true)}
          className="hide-when-short mt-2 flex items-center justify-center gap-1 py-1 rounded-lg text-[11px] text-slate-400 hover:text-white hover:bg-white/5 transition-colors flex-shrink-0"
        >
          <Plus size={12} />
          {t.widgets.countdown.add}
        </button>
      )}
    </div>
  );
};

const HeroEvent: React.FC<{ item: Resolved; label: string; dateText: string; deleteTitle: string; onRemove: () => void }> = ({
  item,
  label,
  dateText,
  deleteTitle,
  onRemove,
}) => (
  <div className="countdown-hero group relative flex flex-col items-center text-center gap-1 py-2" data-testid="countdown-hero">
    <span className="text-3xl leading-none">{item.event.emoji || '📅'}</span>
    <div className={cn('countdown-hero-number text-5xl font-black tabular-nums leading-none mt-1', item.days === 0 ? 'text-rose-300' : 'text-white')}>
      {item.days === 0 ? '🎉' : Math.abs(item.days)}
    </div>
    <div className="countdown-hero-label text-xs text-slate-300 font-medium">{label}</div>
    <div className="countdown-hero-name text-sm font-semibold text-white mt-1 truncate max-w-full px-4 flex items-center gap-1">
      {item.event.name}
      {item.event.repeatYearly && <Repeat size={11} className="text-slate-500" />}
    </div>
    <div className="hide-when-short text-[10px] text-slate-500">{dateText}</div>
    <button
      type="button"
      onClick={onRemove}
      className="absolute top-0 right-0 opacity-0 group-hover:opacity-100 p-1 text-slate-500 hover:text-rose-400 rounded transition-all"
      title={deleteTitle}
    >
      <Trash2 size={12} />
    </button>
  </div>
);
