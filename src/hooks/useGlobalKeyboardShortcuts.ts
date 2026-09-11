import { useEffect } from 'react';
import { useDashboardStore } from '../store/useDashboardStore';
import { getComboFromEvent, isEditableElement } from '../utils/keyboardShortcuts';

/**
 * Listens for the user's custom keyboard shortcuts anywhere on the
 * dashboard and opens the bound URL when one matches. Ignored while
 * typing into any input/textarea/contentEditable (including the shortcut
 * recorder itself, which handles its own keydown separately).
 */
export function useGlobalKeyboardShortcuts() {
  const keyboardShortcuts = useDashboardStore((s) => s.keyboardShortcuts);

  useEffect(() => {
    if (keyboardShortcuts.length === 0) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (isEditableElement(document.activeElement)) return;

      const combo = getComboFromEvent(e);
      if (!combo) return;

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
  }, [keyboardShortcuts]);
}
