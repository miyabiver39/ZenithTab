import React from 'react';
import { useDashboardStore } from '../../../store/useDashboardStore';
import { useTranslation } from '../../../i18n/i18n';

/** Dock position, corner radius, glass blur and adaptive text colour. */
export const AppearanceTab: React.FC = () => {
  const appearance = useDashboardStore((s) => s.appearance);
  const updateAppearance = useDashboardStore((s) => s.updateAppearance);
  const { t } = useTranslation();

  return (
    <div className="space-y-5">
      {/* Dock Position */}
      <div>
        <label className="block text-xs font-medium text-slate-300 mb-2">
          {t.settings.quickDockPos}
        </label>
        <div className="grid grid-cols-3 gap-2">
          {[
            { key: 'bottom', label: 'Bottom' },
            { key: 'top', label: 'Top' },
            { key: 'hidden', label: 'Hidden' },
          ].map((pos) => (
            <button
              key={pos.key}
              type="button"
              onClick={() => updateAppearance({ dockPosition: pos.key as any })}
              className={`py-2 px-3 rounded-xl text-xs font-medium border capitalize transition-all ${
                appearance.dockPosition === pos.key
                  ? 'bg-sky-500/20 border-sky-400 text-sky-200'
                  : 'bg-slate-800/40 border-white/10 text-slate-300 hover:bg-slate-800'
              }`}
            >
              {pos.label}
            </button>
          ))}
        </div>
      </div>

      {/* Corner Radius */}
      <div>
        <label className="block text-xs font-medium text-slate-300 mb-2">
          {t.settings.widgetCornerRounding}
        </label>
        <div className="grid grid-cols-4 gap-2">
          {[
            { key: 'none', label: 'Sharp' },
            { key: 'md', label: 'Medium' },
            { key: '2xl', label: 'Rounded' },
            { key: 'full', label: 'Ultra' },
          ].map((rad) => (
            <button
              key={rad.key}
              type="button"
              onClick={() => updateAppearance({ borderRadius: rad.key as any })}
              className={`py-2 px-3 rounded-xl text-xs font-medium border transition-all ${
                appearance.borderRadius === rad.key
                  ? 'bg-sky-500/20 border-sky-400 text-sky-200'
                  : 'bg-slate-800/40 border-white/10 text-slate-300 hover:bg-slate-800'
              }`}
            >
              {rad.label}
            </button>
          ))}
        </div>
      </div>

      {/* Glassmorphism Blur Slider */}
      <div>
        <div className="flex justify-between text-xs text-slate-300 mb-1">
          <span>{t.settings.glassBlur}</span>
          <span className="font-mono text-slate-400">{appearance.glassBlur}px</span>
        </div>
        <input
          type="range"
          min="0"
          max="32"
          value={appearance.glassBlur}
          onChange={(e) => updateAppearance({ glassBlur: parseInt(e.target.value) || 0 })}
          className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-sky-400"
        />
      </div>

      {/* Adaptive text colour on light wallpapers */}
      <label className="flex items-start gap-3 p-3 rounded-xl bg-slate-800/40 border border-white/10 cursor-pointer">
        <input
          type="checkbox"
          checked={appearance.adaptiveTextColor !== false}
          onChange={(e) => updateAppearance({ adaptiveTextColor: e.target.checked })}
          aria-label={t.settings.adaptiveTextColor}
          className="mt-0.5 w-4 h-4 rounded text-sky-500 bg-slate-800 border-white/20 flex-shrink-0"
        />
        <span>
          <span className="block text-xs font-medium text-slate-200">{t.settings.adaptiveTextColor}</span>
          <span className="block text-[11px] text-slate-400 mt-0.5">{t.settings.adaptiveTextColorDesc}</span>
        </span>
      </label>
    </div>
  );
};
