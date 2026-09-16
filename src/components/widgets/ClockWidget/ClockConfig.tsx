import React from 'react';
import { Input } from '../../common/Input';
import { useTranslation } from '../../../i18n/i18n';
import type { ConfigFormProps } from '../configForm';

export const ClockConfig: React.FC<ConfigFormProps> = ({ config, setConfig }) => {
  const { t } = useTranslation();
  return (
    <div className="space-y-4">
      <div>
        <label className="block text-xs font-medium text-slate-300 mb-1.5">{t.widgets.clock.style}</label>
        <div className="grid grid-cols-3 gap-2">
          {['digital', 'analog', 'minimal'].map((st) => (
            <button
              key={st}
              type="button"
              onClick={() => setConfig({ ...config, style: st })}
              className={`py-2 px-3 rounded-lg text-xs font-medium border capitalize transition-all ${
                config.style === st
                  ? 'bg-sky-500/20 border-sky-400 text-sky-200 shadow'
                  : 'bg-slate-800/50 border-white/10 text-slate-300 hover:bg-slate-800'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-between py-1">
        <span className="text-xs text-slate-300">{t.widgets.clock.is24Hour}</span>
        <input
          type="checkbox"
          aria-label={t.widgets.clock.is24Hour}
          checked={!!config.is24Hour}
          onChange={(e) => setConfig({ ...config, is24Hour: e.target.checked })}
          className="w-4 h-4 rounded text-sky-500 bg-slate-800 border-white/20"
        />
      </div>

      <div className="flex items-center justify-between py-1">
        <span className="text-xs text-slate-300">{t.widgets.clock.showSeconds}</span>
        <input
          type="checkbox"
          aria-label={t.widgets.clock.showSeconds}
          checked={!!config.showSeconds}
          onChange={(e) => setConfig({ ...config, showSeconds: e.target.checked })}
          className="w-4 h-4 rounded text-sky-500 bg-slate-800 border-white/20"
        />
      </div>

      <div className="flex items-center justify-between py-1">
        <span className="text-xs text-slate-300">{t.widgets.clock.showDate}</span>
        <input
          type="checkbox"
          aria-label={t.widgets.clock.showDate}
          checked={!!config.showDate}
          onChange={(e) => setConfig({ ...config, showDate: e.target.checked })}
          className="w-4 h-4 rounded text-sky-500 bg-slate-800 border-white/20"
        />
      </div>

      <Input
        label={t.widgets.clock.timezone}
        value={config.timezone || ''}
        onChange={(e) => setConfig({ ...config, timezone: e.target.value })}
        placeholder="e.g. Asia/Tokyo, America/New_York, UTC"
      />
    </div>
  );
};
