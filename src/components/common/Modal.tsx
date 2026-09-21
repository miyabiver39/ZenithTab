import React, { useEffect, useId, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { cn } from '../../utils/cn';
import { useTranslation } from '../../i18n/i18n';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '4xl';
}

const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

// Open dialogs, oldest first. A dialog opened from inside another (the
// catalog picker inside a widget's settings) must be the only one that
// reacts to Escape / Tab, otherwise one keypress closes both.
const openStack: symbol[] = [];

// No layout-based visibility check (offsetParent) on purpose: it is always
// null under jsdom, and everything inside an open modal is rendered anyway.
function focusableIn(root: HTMLElement): HTMLElement[] {
  return Array.from(root.querySelectorAll<HTMLElement>(FOCUSABLE)).filter((el) => !el.hidden && el.getAttribute('aria-hidden') !== 'true');
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
  // Callers pass inline arrows; keeping the latest one in a ref means the
  // focus/trap effect runs once per open, not on every parent re-render
  // (which would keep yanking focus back to the first control while typing).
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (!isOpen) return;
    const card = cardRef.current;
    const previouslyFocused = document.activeElement as HTMLElement | null;
    const token = Symbol('modal');
    openStack.push(token);
    const isTopmost = () => openStack[openStack.length - 1] === token;

    // Focus lands inside the dialog: the first control in the body, or the
    // close button when there is none, so keyboard users start where the
    // content is rather than on the page behind it.
    const body = card?.querySelector<HTMLElement>('[data-modal-body]');
    const first = (body && focusableIn(body)[0]) || card?.querySelector<HTMLElement>('[data-modal-close]');
    first?.focus();

    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isTopmost()) return;
      if (e.key === 'Escape') {
        onCloseRef.current();
        return;
      }
      // Trap Tab / Shift+Tab inside the card so focus can't leak to the
      // (inert-looking but still tabbable) dashboard behind the backdrop.
      if (e.key === 'Tab' && card) {
        const items = focusableIn(card);
        if (items.length === 0) {
          e.preventDefault();
          return;
        }
        const firstItem = items[0];
        const lastItem = items[items.length - 1];
        const active = document.activeElement;
        if (e.shiftKey && (active === firstItem || !card.contains(active))) {
          e.preventDefault();
          lastItem.focus();
        } else if (!e.shiftKey && (active === lastItem || !card.contains(active))) {
          e.preventDefault();
          firstItem.focus();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      openStack.splice(openStack.indexOf(token), 1);
      // The page scrolls again only once the last dialog is gone.
      if (openStack.length === 0) document.body.style.overflow = '';
      // Give focus back to whatever opened the dialog.
      if (previouslyFocused && document.contains(previouslyFocused)) previouslyFocused.focus();
    };
  }, [isOpen]);

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
