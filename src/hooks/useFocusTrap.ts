import { useEffect, useRef } from 'react';

/**
 * Every currently-open dialog using this hook, oldest first. Only the
 * topmost one reacts to Escape/Tab, so a dialog opened from inside
 * another — the "add custom app" form inside the App Drawer, a confirm
 * dialog raised over the settings panel — is the only one a keypress
 * reaches; the one(s) underneath stay inert until it closes.
 */
const openStack: symbol[] = [];

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

// No layout-based visibility check (offsetParent) on purpose: it is
// always null under jsdom, and everything inside an open dialog is
// rendered anyway.
function focusableIn(root: HTMLElement): HTMLElement[] {
  return Array.from(root.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
    (el) => !el.hidden && el.getAttribute('aria-hidden') !== 'true'
  );
}

export interface UseFocusTrapOptions {
  isOpen: boolean;
  /** Called on Escape, only while this dialog is the topmost open one. */
  onEscape?: () => void;
  /** Focused first instead of the container's own first focusable child — e.g. Cancel, so a stray Enter never confirms. */
  initialFocusRef?: React.RefObject<HTMLElement | null>;
  /** For a more involved choice than `initialFocusRef` (e.g. "the body's first control, else the close button"). Takes precedence over `initialFocusRef` when given. */
  getInitialFocus?: () => HTMLElement | null | undefined;
}

/**
 * Shared accessibility plumbing for every modal-like overlay (Modal,
 * ConfirmDialog, AppDrawerModal): traps Tab inside the container so focus
 * can't leak to the page behind it, closes on Escape (topmost dialog
 * only), moves focus in when it opens and returns it to whatever
 * triggered the dialog when it closes, and locks page scroll for as long
 * as at least one trap is active.
 */
export function useFocusTrap<T extends HTMLElement>(
  containerRef: React.RefObject<T | null>,
  { isOpen, onEscape, initialFocusRef, getInitialFocus }: UseFocusTrapOptions
) {
  // Callers typically pass an inline arrow for onEscape; keeping the
  // latest one in a ref means the effect below runs once per open, not
  // on every parent re-render.
  const onEscapeRef = useRef(onEscape);
  useEffect(() => {
    onEscapeRef.current = onEscape;
  }, [onEscape]);

  useEffect(() => {
    if (!isOpen) return;
    const container = containerRef.current;
    const previouslyFocused = document.activeElement as HTMLElement | null;
    const token = Symbol('focus-trap');
    openStack.push(token);
    const isTopmost = () => openStack[openStack.length - 1] === token;

    const first = getInitialFocus?.() || initialFocusRef?.current || (container && focusableIn(container)[0]);
    first?.focus();

    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isTopmost()) return;
      if (e.key === 'Escape') {
        onEscapeRef.current?.();
        return;
      }
      if (e.key === 'Tab' && container) {
        const items = focusableIn(container);
        if (items.length === 0) {
          e.preventDefault();
          return;
        }
        const firstItem = items[0];
        const lastItem = items[items.length - 1];
        const active = document.activeElement;
        if (e.shiftKey && (active === firstItem || !container.contains(active))) {
          e.preventDefault();
          lastItem.focus();
        } else if (!e.shiftKey && (active === lastItem || !container.contains(active))) {
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
      // The page scrolls again only once the last trapped dialog is gone.
      if (openStack.length === 0) document.body.style.overflow = '';
      if (previouslyFocused && document.contains(previouslyFocused)) previouslyFocused.focus();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- containerRef/initialFocusRef are stable refs; onEscape is read via onEscapeRef.
  }, [isOpen]);
}
