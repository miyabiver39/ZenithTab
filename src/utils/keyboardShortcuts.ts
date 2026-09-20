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

export const PAGE_NEXT_COMBO = 'Ctrl+Alt+ArrowRight';
export const PAGE_PREV_COMBO = 'Ctrl+Alt+ArrowLeft';
// Ctrl on Windows/Linux, Cmd on macOS.
export const UNDO_COMBOS = ['Ctrl+Z', 'Meta+Z'];
export const REDO_COMBOS = ['Ctrl+Shift+Z', 'Meta+Shift+Z', 'Ctrl+Y'];

export type BuiltInShortcutId = 'focusSearch' | 'nextPage' | 'prevPage' | 'undo' | 'redo' | 'closeOverlay' | 'confirmRename';

export interface BuiltInShortcut {
  id: BuiltInShortcutId;
  /** Combos shown on Windows/Linux, in the same "Ctrl+Shift+Z" form the listener matches. */
  combos: string[];
  /** Shown instead of `combos` on macOS when the keys differ there. */
  macCombos?: string[];
}

/**
 * The shortcuts ZenithTab ships with, for the read-only list in settings.
 * The listeners (`useGlobalKeyboardShortcuts`, SearchWidget, Modal, …)
 * are the source of truth for behaviour; this table only has to agree
 * with them, which is why the combo constants above are shared.
 */
export const BUILT_IN_SHORTCUTS: BuiltInShortcut[] = [
  { id: 'focusSearch', combos: ['/'] },
  { id: 'nextPage', combos: [PAGE_NEXT_COMBO] },
  { id: 'prevPage', combos: [PAGE_PREV_COMBO] },
  { id: 'undo', combos: ['Ctrl+Z'], macCombos: ['Meta+Z'] },
  { id: 'redo', combos: ['Ctrl+Shift+Z', 'Ctrl+Y'], macCombos: ['Meta+Shift+Z'] },
  { id: 'closeOverlay', combos: ['Escape'] },
  { id: 'confirmRename', combos: ['Enter'] },
];

/** True on macOS, where Cmd takes Ctrl's place and Alt is shown as Option. */
export function isMacPlatform(nav: Pick<Navigator, 'platform' | 'userAgent'> | undefined = typeof navigator !== 'undefined' ? navigator : undefined): boolean {
  if (!nav) return false;
  return /mac/i.test(nav.platform || '') || /macintosh|mac os x/i.test(nav.userAgent || '');
}

const KEY_LABELS: Record<string, string> = {
  ArrowLeft: '←',
  ArrowRight: '→',
  ArrowUp: '↑',
  ArrowDown: '↓',
  Escape: 'Esc',
  Enter: 'Enter',
};

const MAC_KEY_LABELS: Record<string, string> = {
  Meta: '⌘',
  Alt: '⌥',
  Shift: '⇧',
  Ctrl: '⌃',
};

/** Splits a combo into the labels shown on its key caps ("Ctrl+ArrowLeft" → ["Ctrl", "←"]). */
export function comboToKeyLabels(combo: string, mac = isMacPlatform()): string[] {
  if (combo === '+') return ['+'];
  return combo.split('+').map((token) => (mac && MAC_KEY_LABELS[token]) || KEY_LABELS[token] || token);
}

/** The combos to show for a built-in shortcut on the current platform. */
export function displayCombos(shortcut: BuiltInShortcut, mac = isMacPlatform()): string[] {
  return mac && shortcut.macCombos ? shortcut.macCombos : shortcut.combos;
}
