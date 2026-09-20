import React from 'react';
import { useTranslation } from '../../../i18n/i18n';
import type { ConfigFormProps } from '../configForm';

/** Habits themselves are managed inside the widget; this only holds display options. */
export const HabitConfig: React.FC<ConfigFormProps> = ({ config, setConfig }) => {
  const { t } = useTranslation();
  return (
    <div className="space-y-4">
      <label className="flex items-center justify-between py-1 cursor-pointer">
        <div>
          <div className="text-xs font-medium text-slate-200">{t.widgets.habits.showWeek}</div>
          <div className="text-[11px] text-slate-400">{t.widgets.habits.showWeekDesc}</div>
        </div>
        <input
          type="checkbox"
          checked={config.showWeek !== false}
          onChange={(e) => setConfig({ ...config, showWeek: e.target.checked })}
          aria-label={t.widgets.habits.showWeek}
          className="w-4 h-4 rounded text-sky-500 bg-slate-800 border-white/20"
        />
      </label>
    </div>
  );
};
