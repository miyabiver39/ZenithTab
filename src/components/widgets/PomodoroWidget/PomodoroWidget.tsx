import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw } from 'lucide-react';
import { PomodoroWidgetConfig } from '../../../types/widget';
import { useTranslation } from '../../../i18n/i18n';

interface PomodoroWidgetProps {
  config: PomodoroWidgetConfig;
}

type PomodoroMode = 'focus' | 'shortBreak' | 'longBreak';

export const PomodoroWidget: React.FC<PomodoroWidgetProps> = ({ config }) => {
  const {
    focusDurationMinutes = 25,
    shortBreakDurationMinutes = 5,
    longBreakDurationMinutes = 15,
  } = config;

  const { t } = useTranslation();
  const [mode, setMode] = useState<PomodoroMode>('focus');
  const [timeLeft, setTimeLeft] = useState(focusDurationMinutes * 60);
  // While running, the wall-clock time the session ends at. Deriving the
  // remaining seconds from this — rather than decrementing once per tick —
  // keeps the timer honest in a background tab, where Chrome throttles
  // setInterval to about once a minute.
  const [endAt, setEndAt] = useState<number | null>(null);
  const isActive = endAt !== null;
  const [sessionsCompleted, setSessionsCompleted] = useState(0);

  const getDurationSeconds = (m: PomodoroMode) => {
    switch (m) {
      case 'focus':
        return focusDurationMinutes * 60;
      case 'shortBreak':
        return shortBreakDurationMinutes * 60;
      case 'longBreak':
        return longBreakDurationMinutes * 60;
    }
  };

  const currentTotal = getDurationSeconds(mode);

  // Re-sync from the clock every second and whenever the tab comes back,
  // so a throttled tab catches up the moment it is visible again.
  useEffect(() => {
    if (endAt === null) return;
    const sync = () => setTimeLeft(Math.max(0, Math.round((endAt - Date.now()) / 1000)));
    sync();
    const interval = setInterval(sync, 1000);
    document.addEventListener('visibilitychange', sync);
    window.addEventListener('focus', sync);
    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', sync);
      window.removeEventListener('focus', sync);
    };
  }, [endAt]);

  useEffect(() => {
    if (!isActive || timeLeft > 0) return;
    // Completed session
    setEndAt(null);
    if (mode === 'focus') {
      const nextSessions = sessionsCompleted + 1;
      setSessionsCompleted(nextSessions);
      if (nextSessions % 4 === 0) {
        setMode('longBreak');
        setTimeLeft(longBreakDurationMinutes * 60);
      } else {
        setMode('shortBreak');
        setTimeLeft(shortBreakDurationMinutes * 60);
      }
    } else {
      setMode('focus');
      setTimeLeft(focusDurationMinutes * 60);
    }
  }, [isActive, timeLeft, mode, sessionsCompleted, focusDurationMinutes, shortBreakDurationMinutes, longBreakDurationMinutes]);

  // A duration changed in the settings while the timer is idle: show the
  // new length instead of a stale count from the old one.
  const durationsRef = useRef([focusDurationMinutes, shortBreakDurationMinutes, longBreakDurationMinutes]);
  useEffect(() => {
    const next = [focusDurationMinutes, shortBreakDurationMinutes, longBreakDurationMinutes];
    const changed = next.some((v, i) => v !== durationsRef.current[i]);
    durationsRef.current = next;
    if (!changed || isActive) return;
    setTimeLeft(mode === 'focus' ? focusDurationMinutes * 60 : mode === 'shortBreak' ? shortBreakDurationMinutes * 60 : longBreakDurationMinutes * 60);
  }, [focusDurationMinutes, shortBreakDurationMinutes, longBreakDurationMinutes, mode, isActive]);

  const handleToggle = () => {
    if (isActive) {
      // Freeze the remaining time as of now.
      setTimeLeft(Math.max(0, Math.round((endAt - Date.now()) / 1000)));
      setEndAt(null);
    } else if (timeLeft > 0) {
      setEndAt(Date.now() + timeLeft * 1000);
    }
  };

  const handleModeChange = (newMode: PomodoroMode) => {
    setMode(newMode);
    setEndAt(null);
    setTimeLeft(getDurationSeconds(newMode));
  };

  const handleReset = () => {
    setEndAt(null);
    setTimeLeft(getDurationSeconds(mode));
  };

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const timeFormatted = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  const progressPercent = Math.min(100, Math.max(0, ((currentTotal - timeLeft) / currentTotal) * 100));

  return (
    <div className="w-full h-full flex flex-col justify-between items-center text-center select-none">
      {/* Mode Switcher */}
      <div className="flex items-center gap-1 bg-white/[0.05] p-0.5 rounded-xl border border-white/5 flex-shrink-0">
        {[
          { key: 'focus', label: t.widgets.pomodoro.focus },
          { key: 'shortBreak', label: t.widgets.pomodoro.shortBreak },
          { key: 'longBreak', label: t.widgets.pomodoro.longBreak },
        ].map((item) => (
          <button
            key={item.key}
            onClick={() => handleModeChange(item.key as PomodoroMode)}
            className={`px-2.5 py-0.5 rounded-lg text-xs font-medium transition-all ${
              mode === item.key
                ? 'bg-sky-500 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {/* Timer Display with circular bar indicator */}
      <div className="relative my-0.5 sm:my-1 flex items-center justify-center flex-shrink-0">
        <div className="text-3xl sm:text-4xl font-extrabold font-mono tracking-tight text-white drop-shadow leading-none">
          {timeFormatted}
        </div>
      </div>

      {/* Progress Bar */}
      <div
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(progressPercent)}
        className="w-full max-w-[200px] h-1.5 bg-white/10 rounded-full overflow-hidden mb-1 flex-shrink-0"
      >
        <div
          className="h-full bg-sky-400 rounded-full transition-all duration-300"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      {/* Controls */}
      <div className="flex items-center gap-2.5 flex-shrink-0">
        <button
          onClick={handleToggle}
          className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl font-semibold text-xs transition-all shadow-md active:scale-95 ${
            isActive
              ? 'bg-amber-500/80 hover:bg-amber-500 text-white shadow-amber-500/20'
              : 'bg-sky-500 hover:bg-sky-400 text-white shadow-sky-500/20'
          }`}
        >
          {isActive ? <Pause size={14} /> : <Play size={14} />}
          <span>{isActive ? t.widgets.pomodoro.pause : t.widgets.pomodoro.start}</span>
        </button>

        <button
          onClick={handleReset}
          className="p-1.5 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] text-slate-300 hover:text-white transition-all active:scale-95"
          title={t.widgets.pomodoro.reset}
        >
          <RotateCcw size={14} />
        </button>
      </div>

      <div className="text-[11px] text-slate-400 mt-0.5 leading-none flex-shrink-0">
        {t.widgets.pomodoro.sessionsCompleted}: <span className="text-sky-300 font-bold">{sessionsCompleted}</span>
      </div>
    </div>
  );
};
