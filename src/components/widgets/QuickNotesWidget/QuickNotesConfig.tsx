import React from 'react';
import { useTranslation } from '../../../i18n/i18n';
import type { ConfigFormProps } from '../configForm';

export const QuickNotesConfig: React.FC<ConfigFormProps> = ({ config, setConfig }) => {
  const { t } = useTranslation();
  return (
    <div className="space-y-4">
      <div>
        <label className="block text-xs font-medium text-slate-300 mb-1.5">{t.widgets.notes.fontSize}</label>
        <div className="grid grid-cols-3 gap-2">
          {['sm', 'base', 'lg'].map((sz) => (
            <button
              key={sz}
              type="button"
              onClick={() => setConfig({ ...config, fontSize: sz })}
              className={`py-2 px-3 rounded-lg text-xs font-medium border capitalize transition-all ${
                config.fontSize === sz
                  ? 'bg-sky-500/20 border-sky-400 text-sky-200 shadow'
                  : 'bg-slate-800/50 border-white/10 text-slate-300 hover:bg-slate-800'
              }`}
            >
              {sz}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-xs font-medium text-slate-300 mb-1.5">{t.widgets.notes.fontStyle}</label>
        <div className="grid grid-cols-3 gap-2">
          {['sans', 'mono', 'serif'].map((fam) => (
            <button
              key={fam}
              type="button"
              onClick={() => setConfig({ ...config, fontFamily: fam })}
              className={`py-2 px-3 rounded-lg text-xs font-medium border capitalize transition-all ${
                config.fontFamily === fam
                  ? 'bg-sky-500/20 border-sky-400 text-sky-200 shadow'
                  : 'bg-slate-800/50 border-white/10 text-slate-300 hover:bg-slate-800'
              }`}
            >
              {fam}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
