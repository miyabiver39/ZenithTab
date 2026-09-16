import React, { useEffect, useRef, useState } from 'react';
import { Undo2, X } from 'lucide-react';
import { useUndoStore } from '../../store/useUndoStore';
import { useDashboardStore } from '../../store/useDashboardStore';
import { useTranslation } from '../../i18n/i18n';
import { cn } from '../../utils/cn';

/** How long an actionable toast stays up; the "restored" note is shorter. */
export const UNDO_TOAST_MS = 8000;
export const UNDONE_TOAST_MS = 2000;

/**
 * Bottom-centre notice shown after any reversible action ("Removed widget
 * X" + an Undo button). It only ever shows the latest action — older ones
 * remain reachable through Ctrl+Z. Hovering pauses the auto-dismiss so a
 * user reading the text isn't raced by the timer.
 */
export const UndoToast: React.FC = () => {
  const toast = useUndoStore((s) => s.toast);
  const undoEntry = useUndoStore((s) => s.undoEntry);
  const dismissToast = useUndoStore((s) => s.dismissToast);
  const dockPosition = useDashboardStore((s) => s.appearance.dockPosition);
  const { t } = useTranslation();
  const [paused, setPaused] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!toast || paused) return;
    timerRef.current = setTimeout(dismissToast, toast.undoable ? UNDO_TOAST_MS : UNDONE_TOAST_MS);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [toast, paused, dismissToast]);

  useEffect(() => {
    if (!toast) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') dismissToast();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [toast, dismissToast]);

  if (!toast) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      data-testid="undo-toast"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      className={cn(
        'fixed left-1/2 -translate-x-1/2 z-40 flex items-center gap-3 pl-4 pr-2 py-2.5 rounded-2xl',
        'bg-slate-900/90 border border-white/15 text-slate-100 text-xs shadow-2xl shadow-black/60 backdrop-blur-xl',
        'animate-fade-in max-w-[calc(100vw-2rem)]',
        dockPosition === 'bottom' ? 'bottom-28' : 'bottom-6'
      )}
    >
      <span className="truncate">{toast.undoable ? toast.label : t.undo.undone}</span>
      {toast.undoable && (
        <button
          type="button"
          onClick={() => undoEntry(toast.id)}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-sky-500/20 text-sky-200 border border-sky-400/30 hover:bg-sky-500/30 font-semibold whitespace-nowrap transition-colors"
        >
          <Undo2 size={13} />
          <span>{t.undo.undoBtn}</span>
        </button>
      )}
      <button
        type="button"
        onClick={dismissToast}
        aria-label={t.common.close}
        className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
      >
        <X size={13} />
      </button>
    </div>
  );
};
