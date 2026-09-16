import React from 'react';
import { useTranslation } from '../../../i18n/i18n';
import type { ConfigFormProps } from '../configForm';

export const BookmarkConfig: React.FC<ConfigFormProps> = ({ config, setConfig }) => {
  const { t } = useTranslation();
  return (
    <div className="space-y-4">
      <div>
        <label className="block text-xs font-medium text-slate-300 mb-1.5">{t.widgets.bookmarks.viewMode}</label>
        <div className="grid grid-cols-2 gap-2">
          {['grid', 'list'].map((mode) => (
            <button
              key={mode}
              type="button"
              onClick={() => setConfig({ ...config, viewMode: mode })}
              className={`py-2 px-3 rounded-lg text-xs font-medium border capitalize transition-all ${
                config.viewMode === mode
                  ? 'bg-sky-500/20 border-sky-400 text-sky-200 shadow'
                  : 'bg-slate-800/50 border-white/10 text-slate-300 hover:bg-slate-800'
              }`}
            >
              {mode}
            </button>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-between py-1">
        <span className="text-xs text-slate-300">{t.widgets.bookmarks.showFavicons}</span>
        <input
          type="checkbox"
          checked={!!config.showFavicons}
          onChange={(e) => setConfig({ ...config, showFavicons: e.target.checked })}
          className="w-4 h-4 rounded text-sky-500 bg-slate-800 border-white/20"
        />
      </div>
    </div>
  );
};
