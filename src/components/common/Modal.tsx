import React, { useId, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { cn } from '../../utils/cn';
import { useTranslation } from '../../i18n/i18n';
import { useFocusTrap } from '../../hooks/useFocusTrap';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '4xl';
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  maxWidth = 'lg',
}) => {
  const { t } = useTranslation();
  const titleId = useId();
  const cardRef = useRef<HTMLDivElement>(null);

  useFocusTrap(cardRef, {
    isOpen,
    onEscape: onClose,
    // The first control in the body, or the close button when there is
    // none, so keyboard users start where the content is rather than on
    // the page behind it.
    getInitialFocus: () => {
      const card = cardRef.current;
      const body = card?.querySelector<HTMLElement>('[data-modal-body]');
      const firstInBody = body?.querySelector<HTMLElement>(
        'a[href], button:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
      );
      return firstInBody || card?.querySelector<HTMLElement>('[data-modal-close]');
    },
  });

  if (!isOpen) return null;

  const maxWidthClass = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
    '4xl': 'max-w-4xl',
  }[maxWidth];

  // Portaled to <body>: a dialog rendered inside another dialog's card
  // would otherwise be clipped by it (backdrop-filter makes the card the
  // containing block for position: fixed).
  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto animate-fade-in">
      {/* Backdrop */}
      <div
        data-testid="modal-backdrop"
        className="fixed inset-0 bg-black/60 backdrop-blur-md transition-opacity"
        onClick={onClose}
      />

      {/* Modal Card */}
      <div
        ref={cardRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className={cn(
          'relative w-full bg-slate-900/85 border border-white/15 text-slate-100 rounded-2xl shadow-2xl shadow-black/80 backdrop-blur-2xl z-10 overflow-hidden flex flex-col max-h-[90vh]',
          maxWidthClass
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
          <h2 id={titleId} className="text-lg font-semibold text-white tracking-wide">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label={t.common.close}
            title={t.common.close}
            data-modal-close
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div data-modal-body className="px-6 py-5 overflow-y-auto flex-1 custom-scrollbar">{children}</div>
      </div>
    </div>,
    document.body
  );
};
