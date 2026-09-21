import React from 'react';
import { Trash2, LayoutGrid, Layers, Undo2 } from 'lucide-react';
import { Button } from '../../common/Button';
import { getLocalizedWidgetTitle } from '../../../utils/widgetTitle';
import { formatDateTime } from '../../../utils/date';
import { useDashboardStore } from '../../../store/useDashboardStore';
import { useTranslation } from '../../../i18n/i18n';
import type { ConfirmApi } from './confirm';

/** Deleted widgets and pages, restorable for 30 days. */
export const TrashTab: React.FC<ConfirmApi> = ({ requestConfirm, closeConfirm }) => {
  const trash = useDashboardStore((s) => s.trash);
  const restoreFromTrash = useDashboardStore((s) => s.restoreFromTrash);
  const deleteFromTrash = useDashboardStore((s) => s.deleteFromTrash);
  const emptyTrash = useDashboardStore((s) => s.emptyTrash);
  const closeSettingsModal = useDashboardStore((s) => s.closeSettingsModal);
  const { t, activeLanguageCode } = useTranslation();

  const trashEntryName = (entry: (typeof trash)[number]) =>
    entry.kind === 'widget' ? getLocalizedWidgetTitle(entry.widget, t) : entry.pageMeta.name || t.trash.kindPage;

  return (
    <div className="space-y-4">
      <p className="text-xs text-slate-400">{t.trash.desc}</p>

      {trash.length === 0 ? (
        <p className="text-xs text-slate-500 italic">{t.trash.empty}</p>
      ) : (
        // Scrolls on its own so "empty trash" below never drifts out of view.
        <ul className="space-y-2 max-h-96 overflow-y-auto custom-scrollbar pr-1" aria-label={t.settings.tabs.trash}>
          {[...trash]
            .sort((a, b) => b.deletedAt - a.deletedAt)
            .map((entry) => {
              const Icon = entry.kind === 'widget' ? LayoutGrid : Layers;
              const name = trashEntryName(entry);
              return (
                <li
                  key={entry.id}
                  className="flex items-center gap-3 p-2.5 rounded-xl bg-slate-800/40 border border-white/10"
                >
                  <span className="p-1.5 rounded-lg bg-white/5 text-slate-300 flex-shrink-0" title={entry.kind === 'widget' ? t.trash.kindWidget : t.trash.kindPage}>
                    <Icon size={14} />
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-semibold text-white truncate">{name}</div>
                    <div className="text-[10px] text-slate-500 truncate">
                      {t.trash.deletedAt.replace('{date}', formatDateTime(new Date(entry.deletedAt), activeLanguageCode))}
                      {entry.kind === 'widget' && entry.sourcePageName
                        ? ' · ' + t.trash.fromPage.replace('{name}', entry.sourcePageName)
                        : ''}
                      {entry.kind === 'page'
                        ? ' · ' + t.trash.widgetsCount.replace('{n}', String(entry.pageData.widgets.length))
                        : ''}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      restoreFromTrash(entry.id);
                      closeSettingsModal();
                    }}
                    title={t.trash.restore}
                    aria-label={t.trash.restore + ': ' + name}
                    className="p-1.5 rounded-md text-slate-400 hover:text-sky-300 hover:bg-sky-500/10 transition-colors"
                  >
                    <Undo2 size={14} />
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      requestConfirm({
                        title: t.trash.deleteConfirmTitle,
                        body: t.trash.deleteConfirmBody.replace('{name}', name),
                        confirmLabel: t.trash.deleteForever,
                        danger: true,
                        onConfirm: () => {
                          closeConfirm();
                          deleteFromTrash(entry.id);
                        },
                      })
                    }
                    title={t.trash.deleteForever}
                    aria-label={t.trash.deleteForever + ': ' + name}
                    className="p-1.5 rounded-md text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                  >
                    <Trash2 size={14} />
                  </button>
                </li>
              );
            })}
        </ul>
      )}

      <div className="flex items-center justify-between gap-3 pt-2 border-t border-white/10">
        <p className="text-[11px] text-slate-500">{t.trash.retention}</p>
        {trash.length > 0 && (
          <Button
            variant="danger"
            size="sm"
            onClick={() =>
              requestConfirm({
                title: t.trash.emptyConfirmTitle,
                body: t.trash.emptyConfirmBody,
                confirmLabel: t.trash.emptyTrash,
                danger: true,
                onConfirm: () => {
                  closeConfirm();
                  emptyTrash();
                },
              })
            }
            className="gap-2 flex-shrink-0"
          >
            <Trash2 size={13} />
            <span>{t.trash.emptyTrash}</span>
          </Button>
        )}
      </div>
    </div>
  );
};
