import React, { useEffect, useMemo, useState } from 'react';
import { Plus, Trash2, Check, Flame } from 'lucide-react';
import { HabitWidgetConfig, HabitItem } from '../../../types/widget';
import { useDashboardStore } from '../../../store/useDashboardStore';
import { useTranslation } from '../../../i18n/i18n';
import { uniqueId } from '../../../utils/id';
import { cn } from '../../../utils/cn';
import { currentStreak, lastNDays, toDayKey, toggleDay } from '../../../utils/habits';

interface HabitWidgetProps {
  widgetId: string;
  config: HabitWidgetConfig;
}

/**
 * Daily habits with a streak counter: tick today, watch the 🔥 grow.
 * Unlike the todo list nothing is ever "done for good" — every day is a
 * fresh row of checkboxes, which is what makes it fit a page you open
 * every morning.
 */
export const HabitWidget: React.FC<HabitWidgetProps> = ({ widgetId, config }) => {
  const { habits = [], showWeek = true } = config;
  const { updateWidgetConfig, updateWidgetConfigUndoable } = useDashboardStore();
  const { t } = useTranslation();
  const [name, setName] = useState('');
  const [emoji, setEmoji] = useState('');

  // Re-evaluate "today" when the tab comes back into view past midnight.
  const [todayKey, setTodayKey] = useState(() => toDayKey(new Date()));
  useEffect(() => {
    const refresh = () => {
      if (!document.hidden) {
        const key = toDayKey(new Date());
        if (key !== todayKey) setTodayKey(key);
      }
    };
    document.addEventListener('visibilitychange', refresh);
    window.addEventListener('focus', refresh);
    return () => {
      document.removeEventListener('visibilitychange', refresh);
      window.removeEventListener('focus', refresh);
    };
  }, [todayKey]);

  const today = useMemo(() => new Date(), [todayKey]); // eslint-disable-line react-hooks/exhaustive-deps
  const week = useMemo(() => lastNDays(today, 7), [today]);
  const doneToday = habits.filter((h) => h.history?.includes(todayKey)).length;

  const handleToggle = (habit: HabitItem) => {
    updateWidgetConfig(widgetId, {
      habits: habits.map((h) => (h.id === habit.id ? { ...h, history: toggleDay(h.history || [], todayKey) } : h)),
    });
  };

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    const next: HabitItem = { id: uniqueId('habit'), name: name.trim(), emoji: emoji.trim() || undefined, history: [], createdAt: Date.now() };
    updateWidgetConfig(widgetId, { habits: [...habits, next] });
    setName('');
    setEmoji('');
  };

  const handleRemove = (habit: HabitItem) => {
    updateWidgetConfigUndoable(widgetId, { habits: habits.filter((h) => h.id !== habit.id) }, t.undo.removedHabit.replace('{name}', habit.name));
  };

  return (
    <div className="w-full h-full flex flex-col min-h-0 select-none">
      <div className="flex items-center justify-between pb-2 border-b border-white/5 text-[11px] text-slate-400">
        <span>{t.widgets.habits.todayProgress.replace('{done}', String(doneToday)).replace('{total}', String(habits.length))}</span>
        {habits.length > 0 && (
          <div className="w-20 h-1.5 rounded-full bg-white/10 overflow-hidden" aria-hidden>
            <div className="h-full bg-lime-400 transition-all" style={{ width: `${habits.length ? (doneToday / habits.length) * 100 : 0}%` }} />
          </div>
        )}
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar mt-2 pr-1">
        {habits.length === 0 ? (
          <div className="h-full flex items-center justify-center text-xs text-slate-400 text-center px-4">{t.widgets.habits.empty}</div>
        ) : (
          <ul className="space-y-1" data-testid="habit-list">
            {habits.map((habit) => {
              const history = habit.history || [];
              const done = history.includes(todayKey);
              const streak = currentStreak(history, today);
              return (
                <li
                  key={habit.id}
                  className={cn(
                    'group flex items-center gap-2 px-2 py-1.5 rounded-xl border transition-colors',
                    done ? 'bg-lime-400/10 border-lime-400/20' : 'bg-white/[0.03] border-white/5 hover:bg-white/[0.06]'
                  )}
                >
                  <button
                    type="button"
                    onClick={() => handleToggle(habit)}
                    aria-label={`${done ? t.widgets.habits.uncheck : t.widgets.habits.check}: ${habit.name}`}
                    aria-pressed={done}
                    className={cn(
                      'w-6 h-6 rounded-lg border flex items-center justify-center flex-shrink-0 transition-all active:scale-90',
                      done ? 'bg-lime-400 border-lime-300 text-slate-900' : 'border-white/20 text-transparent hover:border-lime-400/60'
                    )}
                  >
                    <Check size={14} strokeWidth={3} />
                  </button>
                  <span className="text-sm leading-none flex-shrink-0">{habit.emoji || '✅'}</span>
                  <span className={cn('flex-1 min-w-0 text-xs truncate', done ? 'text-lime-100' : 'text-slate-200')}>{habit.name}</span>
                  {showWeek && (
                    <div className="hidden sm:flex items-center gap-0.5 flex-shrink-0" data-testid="habit-week" aria-hidden>
                      {week.map((day) => (
                        <span
                          key={day}
                          className={cn(
                            'w-1.5 h-1.5 rounded-full',
                            history.includes(day) ? 'bg-lime-400' : 'bg-white/10',
                            day === todayKey && !history.includes(day) && 'ring-1 ring-white/30'
                          )}
                        />
                      ))}
                    </div>
                  )}
                  <span
                    className={cn('flex items-center gap-0.5 text-[11px] font-semibold tabular-nums flex-shrink-0 w-9 justify-end', streak > 0 ? 'text-orange-300' : 'text-slate-600')}
                    title={t.widgets.habits.streak.replace('{n}', String(streak))}
                  >
                    <Flame size={11} />
                    {streak}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleRemove(habit)}
                    title={t.common.delete}
                    className="opacity-0 group-hover:opacity-100 p-1 text-slate-500 hover:text-rose-400 rounded transition-all"
                  >
                    <Trash2 size={12} />
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <form onSubmit={handleAdd} className="mt-2 pt-2 border-t border-white/5 flex items-center gap-1.5 flex-shrink-0">
        <input
          type="text"
          value={emoji}
          onChange={(e) => setEmoji(e.target.value)}
          placeholder="✨"
          aria-label={t.widgets.habits.emojiField}
          maxLength={4}
          className="w-9 px-1 py-1.5 rounded-lg bg-slate-900/60 border border-white/10 text-xs text-white text-center placeholder-slate-600 focus:outline-none focus:border-sky-400/50"
        />
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={t.widgets.habits.placeholder}
          aria-label={t.widgets.habits.nameField}
          className="flex-1 min-w-0 px-2.5 py-1.5 rounded-lg bg-slate-900/60 border border-white/10 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-400/50"
        />
        <button
          type="submit"
          disabled={!name.trim()}
          title={t.widgets.habits.add}
          className="p-1.5 rounded-lg bg-sky-500 hover:bg-sky-400 disabled:opacity-50 text-white transition-colors"
        >
          <Plus size={14} />
        </button>
      </form>
    </div>
  );
};
