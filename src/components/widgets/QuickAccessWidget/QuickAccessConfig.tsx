import React from 'react';
import { useTranslation } from '../../../i18n/i18n';
import type { ConfigFormProps } from '../configForm';

export const QuickAccessConfig: React.FC<ConfigFormProps> = ({ config, setConfig }) => {
  const { t } = useTranslation();
  return (
    <div className="space-y-4">
      <div>
        <label className="block text-xs font-medium text-slate-300 mb-1.5">{t.widgets.quickaccess.defaultView}</label>
        <div className="grid grid-cols-2 gap-2">
          {(['topSites', 'recentlyClosed'] as const).map((view) => (
            <button
              key={view}
              type="button"
              onClick={() => setConfig({ ...config, defaultView: view })}
              className={`py-2 px-3 rounded-lg text-xs font-medium border transition-all ${
                (config.defaultView || 'topSites') === view
                  ? 'bg-sky-500/20 border-sky-400 text-sky-200'
                  : 'bg-slate-800/50 border-white/10 text-slate-300 hover:bg-slate-800'
              }`}
            >
              {t.widgets.quickaccess[view]}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-xs font-medium text-slate-300 mb-1.5">{t.widgets.quickaccess.maxItems}</label>
        <div className="grid grid-cols-3 gap-2">
          {([5, 8, 12] as const).map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => setConfig({ ...config, maxItems: n })}
              className={`py-2 px-3 rounded-lg text-xs font-medium border transition-all ${
                (config.maxItems || 8) === n
                  ? 'bg-sky-500/20 border-sky-400 text-sky-200'
                  : 'bg-slate-800/50 border-white/10 text-slate-300 hover:bg-slate-800'
              }`}
            >
              {n}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-xs font-medium text-slate-300 mb-1.5">{t.widgets.quickaccess.viewMode}</label>
        <div className="grid grid-cols-2 gap-2">
          {(['list', 'grid'] as const).map((mode) => (
            <button
              key={mode}
              type="button"
              onClick={() => setConfig({ ...config, viewMode: mode })}
              className={`py-2 px-3 rounded-lg text-xs font-medium border transition-all ${
                (config.viewMode || 'list') === mode
                  ? 'bg-sky-500/20 border-sky-400 text-sky-200'
                  : 'bg-slate-800/50 border-white/10 text-slate-300 hover:bg-slate-800'
              }`}
            >
              {t.widgets.quickaccess[mode]}
            </button>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-between py-1">
        <span className="text-xs text-slate-300">{t.widgets.quickaccess.openInNewTab}</span>
        <input
          type="checkbox"
          checked={config.openInNewTab !== false}
          onChange={(e) => setConfig({ ...config, openInNewTab: e.target.checked })}
          className="w-4 h-4 rounded text-sky-500 bg-slate-800 border-white/20"
        />
      </div>
    </div>
  );
};
