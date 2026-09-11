import type { KeyboardEvent as ReactKeyboardEvent } from 'react';

/**
 * Normalizes a KeyboardEvent into a combo string like "Ctrl+Alt+G", or
 * `null` while only modifier keys are held (not yet a complete combo).
 * Shared between the shortcut recorder input and the global listener so
 * both sides always agree on the same string for the same physical keys.
 */
export function getComboFromEvent(e: KeyboardEvent | ReactKeyboardEvent): string | null {
  const key = e.key;
  if (key === 'Control' || key === 'Alt' || key === 'Shift' || key === 'Meta') {
    return null;
  }

  const parts: string[] = [];
  if (e.ctrlKey) parts.push('Ctrl');
  if (e.altKey) parts.push('Alt');
  if (e.shiftKey) parts.push('Shift');
  if (e.metaKey) parts.push('Meta');

  // A bare, unmodified single letter/number is too easy to collide with
  // normal typing (and with the existing "/" search-focus shortcut), so
  // require at least one modifier.
  if (parts.length === 0) return null;

  const label = key.length === 1 ? key.toUpperCase() : key;
  parts.push(label);
  return parts.join('+');
}

/** True while focus is on something the user is actively typing into. */
export function isEditableElement(el: Element | null): boolean {
  if (!el) return false;
  if (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement) return true;
  return (el as HTMLElement).isContentEditable === true;
}
