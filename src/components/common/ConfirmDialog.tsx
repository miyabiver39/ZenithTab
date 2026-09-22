import React, { useRef } from 'react';
import { AlertTriangle } from 'lucide-react';
import { Button } from './Button';
import { useTranslation } from '../../i18n/i18n';
import { useFocusTrap } from '../../hooks/useFocusTrap';
import { cn } from '../../utils/cn';

export interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  body: string;
  /** Defaults to the localized "Confirm". */
  confirmLabel?: string;
  /** Red confirm button for irreversible actions. */
  danger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

/**
 * In-app replacement for window.confirm, used only for bulk or
 * irreversible operations (removing a page with widgets, reset, import,
 * emptying the trash). Everything reversible goes through the undo toast
 * instead — a dialog people click through by habit protects nobody.
 *
 * Focus starts on Cancel so a stray Enter never confirms; Escape cancels,
 * and Tab is trapped inside the dialog (shared with Modal/AppDrawerModal
 * via useFocusTrap, which also means an underlying Modal never reacts to
 * the same keypress while this is open).
 */
export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  title,
  body,
  confirmLabel,
  danger = false,
  onConfirm,
  onCancel,
}) => {
  const { t } = useTranslation();
  const dialogRef = useRef<HTMLDivElement>(null);
  const cancelRef = useRef<HTMLButtonElement>(null);

  useFocusTrap(dialogRef, { isOpen, onEscape: onCancel, initialFocusRef: cancelRef });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 animate-fade-in">
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={onCancel} />
      <div
        ref={dialogRef}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-title"
        aria-describedby="confirm-dialog-body"
        className="relative w-full max-w-sm bg-slate-900/95 border border-white/15 text-slate-100 rounded-2xl shadow-2xl shadow-black/80 backdrop-blur-2xl p-5 space-y-4"
      >
        <div className="flex items-start gap-3">
          <div
            className={cn(
              'flex-shrink-0 p-2 rounded-xl',
              danger ? 'bg-rose-500/15 text-rose-300' : 'bg-sky-500/15 text-sky-300'
            )}
          >
            <AlertTriangle size={18} />
          </div>
          <div className="space-y-1.5 min-w-0">
            <h2 id="confirm-dialog-title" className="text-sm font-semibold text-white">
              {title}
            </h2>
            <p id="confirm-dialog-body" className="text-xs text-slate-300 leading-relaxed">
              {body}
            </p>
          </div>
        </div>
        <div className="flex justify-end gap-2">
          <Button ref={cancelRef} variant="ghost" size="sm" onClick={onCancel}>
            {t.common.cancel}
          </Button>
          <Button variant={danger ? 'danger' : 'primary'} size="sm" onClick={onConfirm}>
            {confirmLabel || t.confirm.confirm}
          </Button>
        </div>
      </div>
    </div>
  );
};
