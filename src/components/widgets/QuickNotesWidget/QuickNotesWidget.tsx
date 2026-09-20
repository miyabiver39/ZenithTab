import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Plus, X } from 'lucide-react';
import { QuickNotesWidgetConfig, NotePage } from '../../../types/widget';
import { useDashboardStore } from '../../../store/useDashboardStore';
import { useTranslation } from '../../../i18n/i18n';
import { cn } from '../../../utils/cn';
import { uniqueId } from '../../../utils/id';

interface QuickNotesWidgetProps {
  widgetId: string;
  config: QuickNotesWidgetConfig;
}

const MAX_PAGES = 8;

export const QuickNotesWidget: React.FC<QuickNotesWidgetProps> = ({ widgetId, config }) => {
  const { content, pages: configPages, activePageId, fontSize = 'base', fontFamily = 'sans' } = config;
  const updateWidgetConfig = useDashboardStore((s) => s.updateWidgetConfig);
  const updateWidgetConfigUndoable = useDashboardStore((s) => s.updateWidgetConfigUndoable);
  const { t } = useTranslation();
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');

  // Migrate the legacy single-`content` shape into `pages` on first render.
  const pages: NotePage[] = useMemo(() => {
    if (configPages && configPages.length > 0) return configPages;
    return [{ id: 'page-1', title: t.widgets.notes.pageLabel + ' 1', content: content ?? '' }];
  }, [configPages, content, t]);

  const activeId = activePageId && pages.some((p) => p.id === activePageId) ? activePageId : pages[0].id;
  const activePage = pages.find((p) => p.id === activeId) || pages[0];

  const [text, setText] = useState(activePage.content);

  useEffect(() => {
    setText(activePage.content);
  }, [activePage.id, activePage.content]);

  const persistPages = (nextPages: NotePage[], nextActiveId: string) => {
    updateWidgetConfig(widgetId, { pages: nextPages, activePageId: nextActiveId, content: undefined });
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setText(val);

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      const nextPages = pages.map((p) => (p.id === activeId ? { ...p, content: val } : p));
      persistPages(nextPages, activeId);
    }, 400);
  };

  const handleAddPage = () => {
    if (pages.length >= MAX_PAGES) return;
    const newPage: NotePage = {
      id: uniqueId('page'),
      title: `${t.widgets.notes.pageLabel} ${pages.length + 1}`,
      content: '',
    };
    persistPages([...pages, newPage], newPage.id);
  };

  const handleClosePage = (id: string) => {
    if (pages.length <= 1) return;
    const closing = pages.find((p) => p.id === id);
    const nextPages = pages.filter((p) => p.id !== id);
    const nextActive = id === activeId ? nextPages[0].id : activeId;
    // Closing a page discards its text, so it goes through the undoable
    // path (a plain rename/switch doesn't need to).
    updateWidgetConfigUndoable(
      widgetId,
      { pages: nextPages, activePageId: nextActive, content: undefined },
      t.undo.closedNotePage.replace('{name}', closing?.title || '')
    );
  };

  const commitRename = () => {
    if (renamingId) {
      const title = renameValue.trim() || activePage.title;
      const nextPages = pages.map((p) => (p.id === renamingId ? { ...p, title } : p));
      persistPages(nextPages, activeId);
    }
    setRenamingId(null);
  };

  const fontSizes = {
    sm: 'text-xs leading-relaxed',
    base: 'text-sm leading-relaxed',
    lg: 'text-base leading-relaxed',
  }[fontSize || 'base'];

  const fontFamilies = {
    sans: 'font-sans',
    mono: 'font-mono',
    serif: 'font-serif',
  }[fontFamily || 'sans'];

  return (
    <div className="w-full h-full flex flex-col min-h-0">
      {/* Page tabs */}
      <div className="flex items-center gap-1 px-1 pt-1 overflow-x-auto custom-scrollbar flex-shrink-0">
        {pages.map((page) => (
          <div
            key={page.id}
            onClick={() => activeId !== page.id && persistPages(pages, page.id)}
            onDoubleClick={() => {
              setRenamingId(page.id);
              setRenameValue(page.title);
            }}
            className={cn(
              'group flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-medium whitespace-nowrap cursor-pointer transition-colors flex-shrink-0',
              activeId === page.id
                ? 'bg-sky-500/20 text-sky-200 border border-sky-400/30'
                : 'bg-white/5 text-slate-400 hover:text-white hover:bg-white/10 border border-transparent'
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
                className="w-16 bg-transparent border-b border-sky-400/50 text-white focus:outline-none"
              />
            ) : (
              <span className="max-w-[6rem] truncate">{page.title}</span>
            )}
            {pages.length > 1 && renamingId !== page.id && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleClosePage(page.id);
                }}
                title={t.widgets.notes.deletePage}
                className="opacity-0 group-hover:opacity-100 hover:text-rose-400 transition-opacity"
              >
                <X size={10} />
              </button>
            )}
          </div>
        ))}
        {pages.length < MAX_PAGES && (
          <button
            type="button"
            onClick={handleAddPage}
            title={t.widgets.notes.newPage}
            className="flex-shrink-0 p-1 rounded-lg text-slate-500 hover:text-white hover:bg-white/10 transition-colors"
          >
            <Plus size={12} />
          </button>
        )}
      </div>

      <textarea
        key={activeId}
        value={text}
        onChange={handleChange}
        placeholder={t.widgets.notes.placeholder}
        className={cn(
          'w-full h-full p-2 bg-transparent resize-none focus:outline-none text-slate-100 placeholder-slate-500 custom-scrollbar',
          fontSizes,
          fontFamilies
        )}
      />
    </div>
  );
};
