import React, { useState, useEffect } from 'react';
import { ClockWidgetConfig } from '../../../types/widget';
import { formatDate, formatTime } from '../../../utils/date';
import { useTranslation } from '../../../i18n/i18n';

interface ClockWidgetProps {
  config: ClockWidgetConfig;
}

export const ClockWidget: React.FC<ClockWidgetProps> = ({ config }) => {
  const [time, setTime] = useState(new Date());
  const { activeLanguageCode } = useTranslation();

  const {
    style = 'digital',
    showSeconds = true,
    showDate = true,
    is24Hour = true,
    timezone,
  } = config;

  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  if (style === 'analog') {
    const seconds = time.getSeconds();
    const minutes = time.getMinutes();
    const hours = time.getHours();

    const secDeg = (seconds / 60) * 360;
    const minDeg = ((minutes + seconds / 60) / 60) * 360;
    const hourDeg = (((hours % 12) + minutes / 60) / 12) * 360;

    return (
      <div className="w-full h-full flex flex-col items-center justify-center relative p-2 select-none" data-widget-type="clock">
        <div className="relative w-28 h-28 sm:w-32 sm:h-32 rounded-full border-2 border-white/20 bg-slate-900/40 shadow-inner flex items-center justify-center">
          {/* Hour hand */}
          <div
            className="absolute w-1 bg-white rounded-full origin-bottom"
            style={{
              height: '30%',
              top: '20%',
              transform: `rotate(${hourDeg}deg)`,
              transformOrigin: '50% 100%',
            }}
          />
          {/* Minute hand */}
          <div
            className="absolute w-0.5 bg-sky-400 rounded-full origin-bottom"
            style={{
              height: '40%',
              top: '10%',
              transform: `rotate(${minDeg}deg)`,
              transformOrigin: '50% 100%',
            }}
          />
          {/* Second hand */}
          {showSeconds && (
            <div
              className="absolute w-0.5 bg-rose-500 rounded-full origin-bottom"
              style={{
                height: '45%',
                top: '5%',
                transform: `rotate(${secDeg}deg)`,
                transformOrigin: '50% 100%',
              }}
            />
          )}
          {/* Center pin */}
          <div className="w-2.5 h-2.5 rounded-full bg-white z-10 shadow-sm" />
        </div>

        {showDate && (
          <div className="mt-2 text-xs font-medium text-slate-300">
            {formatDate(time, timezone, activeLanguageCode)}
          </div>
        )}
      </div>
    );
  }

  // Digital or Minimal
  const timeFormatted = formatTime(time, is24Hour, showSeconds, timezone, activeLanguageCode);
  const dateFormatted = formatDate(time, timezone, activeLanguageCode);

  return (
    <div
      className="w-full h-full flex flex-col items-center justify-center text-center select-none"
      data-widget-type="clock"
    >
      <div className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-white drop-shadow-md font-mono">
        {timeFormatted}
      </div>
      {showDate && (
        <div className="text-xs sm:text-sm font-medium text-slate-300 mt-1.5 drop-shadow">
          {dateFormatted}
        </div>
      )}
      {timezone && (
        <div className="text-[10px] text-sky-400/80 font-mono mt-0.5 uppercase tracking-wider">
          {timezone}
        </div>
      )}
    </div>
  );
};
