import { useEffect } from 'react';
import { useDashboardStore } from '../store/useDashboardStore';
import { getComboFromEvent, isEditableElement } from '../utils/keyboardShortcuts';

const PAGE_NEXT_COMBO = 'Ctrl+Alt+ArrowRight';
const PAGE_PREV_COMBO = 'Ctrl+Alt+ArrowLeft';

/**
 * Listens for two things anywhere on the dashboard:
 * 1. The built-in page-switch combos (next/previous dashboard page).
 * 2. The user's custom keyboard shortcuts, opening the bound URL on match.
 * Both are ignored while typing into any input/textarea/contentEditable
 * (including the shortcut recorder itself, which handles its own keydown
 * separately).
 */
export function useGlobalKeyboardShortcuts() {
  const keyboardShortcuts = useDashboardStore((s) => s.keyboardShortcuts);
  const pages = useDashboardStore((s) => s.pages);
  const activePageId = useDashboardStore((s) => s.activePageId);
  const switchPage = useDashboardStore((s) => s.switchPage);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isEditableElement(document.activeElement)) return;

      const combo = getComboFromEvent(e);
      if (!combo) return;

      if ((combo === PAGE_NEXT_COMBO || combo === PAGE_PREV_COMBO) && pages.length > 1) {
        const currentIndex = pages.findIndex((p) => p.id === activePageId);
        if (currentIndex !== -1) {
          const delta = combo === PAGE_NEXT_COMBO ? 1 : -1;
          const nextIndex = (currentIndex + delta + pages.length) % pages.length;
          e.preventDefault();
          switchPage(pages[nextIndex].id);
          return;
        }
      }

      if (keyboardShortcuts.length === 0) return;

      const match = keyboardShortcuts.find((s) => s.combo === combo);
      if (!match) return;

      e.preventDefault();
      if (match.openInNewTab) {
        window.open(match.url, '_blank');
      } else {
        window.location.href = match.url;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [keyboardShortcuts, pages, activePageId, switchPage]);
}
