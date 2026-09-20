import React, { useState } from 'react';
import { Plus, X, Layers } from 'lucide-react';
import { useDashboardStore } from '../../store/useDashboardStore';
import { useTranslation } from '../../i18n/i18n';
import { getPageDisplayName } from '../../utils/pageName';
import { AddPageMenu } from './AddPageMenu';
import { ConfirmDialog } from '../common/ConfirmDialog';
import { cn } from '../../utils/cn';

/**
 * Lets the user split their dashboard into multiple independent pages
 * (separate widget groups/layouts), switchable like browser tabs. Mirrors
 * the QuickNotes tab-strip UX: click to switch, double-click to rename.
 */
export const PageSwitcher: React.FC = () => {
  const pages = useDashboardStore((s) => s.pages);
  const activePageId = useDashboardStore((s) => s.activePageId);
  const switchPage = useDashboardStore((s) => s.switchPage);
  const removePage = useDashboardStore((s) => s.removePage);
  const renamePage = useDashboardStore((s) => s.renamePage);
  const pageData = useDashboardStore((s) => s.pageData);
  const widgets = useDashboardStore((s) => s.widgets);
  const { t } = useTranslation();
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const [confirmRemove, setConfirmRemove] = useState<{ id: string; name: string; count: number } | null>(null);

  // An empty page is gone with one click (the undo toast covers a slip);
  // one with widgets on it asks first, since it takes everything with it.
  const requestRemove = (id: string, name: string) => {
    const count = (id === activePageId ? widgets : pageData[id]?.widgets || []).length;
    if (count === 0) {
      removePage(id);
      return;
    }
    setConfirmRemove({ id, name, count });
  };

  const commitRename = () => {
    if (renamingId) renamePage(renamingId, renameValue);
    setRenamingId(null);
  };

  // Most installs only ever have one page. Don't spend a permanent row of
  // vertical space on a tab strip nobody is using yet — Header renders a
  // compact "add page" button instead while there's just the one. Once a
  // second page exists, this strip earns its keep.
  if (pages.length <= 1) return null;

  return (
    <div
      title={t.pages.shortcutHint}
      className="w-full px-4 sm:px-6 max-w-[1920px] mx-auto flex items-center gap-1.5 pb-2 overflow-x-auto custom-scrollbar select-none"
    >
      {/* A small glyph so the strip reads as "pages" at a glance rather
          than as two stray chips — kept muted so it doesn't compete with
          the tabs themselves. */}
      <Layers size={13} className="text-on-wallpaper-faint flex-shrink-0 mr-0.5" aria-hidden />
      {pages.map((page, index) => (
        <div
          key={page.id}
          onClick={() => activePageId !== page.id && switchPage(page.id)}
          onDoubleClick={() => {
            setRenamingId(page.id);
            setRenameValue(page.name);
          }}
          className={cn(
            'group flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap cursor-pointer transition-all border flex-shrink-0',
            activePageId === page.id
              ? 'bg-sky-500/20 text-sky-100 border-sky-400/40 shadow-sm'
              : 'bg-glass text-slate-300 border-white/10 hover:text-white hover:bg-slate-900/60'
          )}
        >
          {renamingId === page.id ? (
            <input
              autoFocus
              value={renameValue}
              onChange={(e) => setRenameValue(e.target.value)}
              onBlur={commitRename}
              onKeyDown={(e) => {
                if (e.key === 'Enter') commitRename();
                if (e.key === 'Escape') setRenamingId(null);
              }}
              onClick={(e) => e.stopPropagation()}
              placeholder={getPageDisplayName(page, index, t)}
              className="w-20 bg-transparent border-b border-sky-400/50 text-white placeholder-slate-500 focus:outline-none"
            />
          ) : (
            <span className="max-w-[8rem] truncate">{getPageDisplayName(page, index, t)}</span>
          )}
          {pages.length > 1 && renamingId !== page.id && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                requestRemove(page.id, getPageDisplayName(page, index, t));
              }}
              title={t.pages.remove}
              className="opacity-0 group-hover:opacity-100 hover:text-rose-400 transition-opacity"
            >
              <X size={11} />
            </button>
          )}
        </div>
      ))}
      <AddPageMenu>
        <button
          type="button"
          title={t.pages.add}
          className="flex-shrink-0 p-1.5 rounded-xl text-on-wallpaper-faint hover:text-on-wallpaper hover:bg-white/10 border border-transparent hover:border-white/10 transition-colors"
        >
          <Plus size={13} />
        </button>
      </AddPageMenu>
      <ConfirmDialog
        isOpen={confirmRemove !== null}
        title={t.confirm.removePageTitle.replace('{name}', confirmRemove?.name || '')}
        body={t.confirm.removePageBody.replace('{n}', String(confirmRemove?.count ?? 0))}
        confirmLabel={t.pages.remove}
        danger
        onConfirm={() => {
          if (confirmRemove) removePage(confirmRemove.id);
          setConfirmRemove(null);
        }}
        onCancel={() => setConfirmRemove(null)}
      />
    </div>
  );
};
