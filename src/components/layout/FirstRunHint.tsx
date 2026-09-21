import React from 'react';
import { Lightbulb, X, Settings, LayoutGrid } from 'lucide-react';
import { useDashboardStore } from '../../store/useDashboardStore';
import { useTranslation } from '../../i18n/i18n';

/**
 * One line under the header for the first few new tabs after setup: where
 * a widget's settings live and how to rearrange things. The gear only
 * appears on hover, which newcomers kept missing.
 */
export const FirstRunHint: React.FC = () => {
  const show = useDashboardStore((s) => s.showFirstRunHint);
  const dismiss = useDashboardStore((s) => s.dismissFirstRunHint);
  const { t } = useTranslation();
  if (!show) return null;

  return (
    <div className="w-full px-4 sm:px-6 max-w-[1920px] mx-auto pb-2" role="status">
      <div className="flex items-center gap-2.5 px-3 py-2 rounded-xl bg-glass border border-white/10 backdrop-blur-md text-xs text-slate-200 shadow-md">
        <Lightbulb size={14} className="text-amber-300 flex-shrink-0" />
        <p className="flex-1 min-w-0 leading-snug">
          <span className="inline-flex items-center gap-1 align-middle">
            <Settings size={11} className="text-slate-400" />
            {t.setup.hintSettings}
          </span>
          <span className="mx-2 text-slate-500">·</span>
          <span className="inline-flex items-center gap-1 align-middle">
            <LayoutGrid size={11} className="text-slate-400" />
            {t.setup.hintLayout}
          </span>
        </p>
        <button
          type="button"
          onClick={dismiss}
          aria-label={t.setup.hintDismiss}
          title={t.setup.hintDismiss}
          className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-white/10 transition-colors flex-shrink-0"
        >
          <X size={13} />
        </button>
      </div>
    </div>
  );
};
