import React from 'react';
import { LayoutGrid, Plus, ArrowLeft } from 'lucide-react';
import { useDashboardStore } from '../../store/useDashboardStore';
import { useTranslation } from '../../i18n/i18n';
import { getPageDisplayName } from '../../utils/pageName';
import { Button } from '../common/Button';

/**
 * Shown in place of the grid when the active page has no widgets. A bare
 * wallpaper here was indistinguishable from data loss ("my widgets are
 * gone"), so this says what happened and offers the two ways out: add a
 * widget, or hop back to the page you came from.
 */
export const EmptyPage: React.FC = () => {
  const { pages, activePageId, switchPage, setEditMode, openSettingsModal } = useDashboardStore();
  const { t } = useTranslation();

  // "Back" targets the nearest page to the left (or the first page when the
  // empty one is leftmost) — for the common case of a freshly appended page
  // that's exactly the page the user was on a moment ago.
  const activeIndex = pages.findIndex((p) => p.id === activePageId);
  const backIndex = activeIndex > 0 ? activeIndex - 1 : pages.findIndex((p) => p.id !== activePageId);
  const backPage = backIndex >= 0 ? pages[backIndex] : null;

  const handleAddWidget = () => {
    setEditMode(true);
    openSettingsModal('addWidget');
  };

  return (
    <div className="w-full flex items-center justify-center py-16 sm:py-24">
      <div className="max-w-md w-full flex flex-col items-center text-center gap-4 px-6 py-8 rounded-2xl bg-slate-900/40 backdrop-blur-md border border-white/10 shadow-xl">
        <div className="w-12 h-12 rounded-2xl bg-sky-500/15 border border-sky-400/20 flex items-center justify-center text-sky-300">
          <LayoutGrid size={22} />
        </div>
        <div className="space-y-1.5">
          <h2 className="text-base font-semibold text-white">{t.pages.emptyTitle}</h2>
          {pages.length > 1 && (
            <p className="text-xs text-slate-300 leading-relaxed">{t.pages.emptyDesc}</p>
          )}
        </div>
        <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
          <Button variant="primary" size="sm" onClick={handleAddWidget}>
            <Plus size={14} />
            <span>{t.common.addWidget}</span>
          </Button>
          {backPage && (
            <Button variant="glass" size="sm" onClick={() => switchPage(backPage.id)}>
              <ArrowLeft size={14} />
              <span>{t.pages.backTo.replace('{name}', getPageDisplayName(backPage, backIndex, t))}</span>
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};
