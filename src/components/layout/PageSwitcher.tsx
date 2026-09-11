import React, { useState } from 'react';
import { Plus, X } from 'lucide-react';
import { useDashboardStore } from '../../store/useDashboardStore';
import { useTranslation } from '../../i18n/i18n';
import { cn } from '../../utils/cn';

/**
 * Lets the user split their dashboard into multiple independent pages
 * (separate widget groups/layouts), switchable like browser tabs. Mirrors
 * the QuickNotes tab-strip UX: click to switch, double-click to rename.
 */
export const PageSwitcher: React.FC = () => {
  const { pages, activePageId, switchPage, addPage, removePage, renamePage } = useDashboardStore();
  const { t } = useTranslation();
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');

  const commitRename = () => {
    if (renamingId) {
      const current = pages.find((p) => p.id === renamingId);
      renamePage(renamingId, renameValue.trim() || current?.name || '');
    }
    setRenamingId(null);
  };

  return (
    <div className="w-full px-4 sm:px-6 max-w-[1920px] mx-auto flex items-center gap-1.5 pb-2 overflow-x-auto custom-scrollbar select-none">
      {pages.map((page) => (
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
              ? 'bg-sky-500/20 text-sky-200 border-sky-400/30 shadow-sm'
              : 'bg-slate-900/30 text-slate-400 border-white/10 hover:text-white hover:bg-slate-900/50'
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
              className="w-20 bg-transparent border-b border-sky-400/50 text-white focus:outline-none"
            />
          ) : (
            <span className="max-w-[8rem] truncate">{page.name}</span>
          )}
          {pages.length > 1 && renamingId !== page.id && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                removePage(page.id);
              }}
              title={t.pages.remove}
              className="opacity-0 group-hover:opacity-100 hover:text-rose-400 transition-opacity"
            >
              <X size={11} />
            </button>
          )}
        </div>
      ))}
      <button
        type="button"
        onClick={() => addPage()}
        title={t.pages.add}
        className="flex-shrink-0 p-1.5 rounded-xl text-slate-500 hover:text-white hover:bg-white/10 border border-transparent hover:border-white/10 transition-colors"
      >
        <Plus size={13} />
      </button>
    </div>
  );
};
