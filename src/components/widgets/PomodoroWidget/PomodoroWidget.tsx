import React, { useState, useEffect } from 'react';
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
  const [isActive, setIsActive] = useState(false);
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

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;

    if (isActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (isActive && timeLeft === 0) {
      // Completed session
      setIsActive(false);
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
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isActive, timeLeft, mode, sessionsCompleted, focusDurationMinutes, shortBreakDurationMinutes, longBreakDurationMinutes]);

  const handleModeChange = (newMode: PomodoroMode) => {
    setMode(newMode);
    setIsActive(false);
    setTimeLeft(getDurationSeconds(newMode));
  };

  const handleReset = () => {
    setIsActive(false);
    setTimeLeft(getDurationSeconds(mode));
  };

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const timeFormatted = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  const progressPercent = Math.min(100, Math.max(0, ((currentTotal - timeLeft) / currentTotal) * 100));

  return (
    <div className="w-full h-full flex flex-col justify-between items-center text-center select-none py-1">
      {/* Mode Switcher */}
      <div className="flex items-center gap-1 bg-white/[0.05] p-1 rounded-xl border border-white/5">
        {[
          { key: 'focus', label: t.widgets.pomodoro.focus },
          { key: 'shortBreak', label: t.widgets.pomodoro.shortBreak },
          { key: 'longBreak', label: t.widgets.pomodoro.longBreak },
        ].map((item) => (
          <button
            key={item.key}
            onClick={() => handleModeChange(item.key as PomodoroMode)}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
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
      <div className="relative my-2 flex items-center justify-center">
        <div className="text-4xl font-extrabold font-mono tracking-tight text-white drop-shadow">
          {timeFormatted}
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full max-w-[200px] h-1.5 bg-white/10 rounded-full overflow-hidden mb-2">
        <div
          className="h-full bg-sky-400 rounded-full transition-all duration-300"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      {/* Controls */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => setIsActive(!isActive)}
          className={`flex items-center gap-1.5 px-4 py-1.5 rounded-xl font-semibold text-xs transition-all shadow-md active:scale-95 ${
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
          className="p-2 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] text-slate-300 hover:text-white transition-all active:scale-95"
          title={t.widgets.pomodoro.reset}
        >
          <RotateCcw size={14} />
        </button>
      </div>

      <div className="text-[10px] text-slate-400 mt-1">
        {t.widgets.pomodoro.sessionsCompleted}: <span className="text-sky-300 font-bold">{sessionsCompleted}</span>
      </div>
    </div>
  );
};
