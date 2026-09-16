import { create } from 'zustand';
import { uniqueId } from '../utils/id';

/**
 * One reversible user action. `undo` re-applies the state the action
 * replaced; `redo` performs the action again. Both run against whatever
 * the dashboard store holds *now*, restoring only the part the action
 * touched, so an undo never clobbers changes another tab made meanwhile
 * (see useStorageSync).
 */
export interface UndoEntry {
  id: string;
  /** Localized, already-formatted description shown in the toast. */
  label: string;
  createdAt: number;
  undo: () => void;
  redo?: () => void;
}

export interface UndoToast {
  id: string;
  label: string;
  /** False for the "restored" confirmation, which has no button of its own. */
  undoable: boolean;
}

interface UndoState {
  undoStack: UndoEntry[];
  redoStack: UndoEntry[];
  toast: UndoToast | null;

  pushUndo: (entry: Omit<UndoEntry, 'id' | 'createdAt'>) => void;
  undo: () => boolean;
  redo: () => boolean;
  /** Undo one specific entry (the toast's button) rather than the latest. */
  undoEntry: (id: string) => boolean;
  dismissToast: () => void;
  /** A plain notice in the same toast, with no button (e.g. "backup restored"). */
  notify: (label: string) => void;
  /** Wipes both stacks — after anything that replaces the whole dashboard. */
  clear: () => void;
}

/** Older entries are dropped; the stack lives in memory only. */
export const MAX_UNDO_ENTRIES = 20;

export const useUndoStore = create<UndoState>((set, get) => ({
  undoStack: [],
  redoStack: [],
  toast: null,

  pushUndo: (entry) => {
    const full: UndoEntry = { ...entry, id: uniqueId('undo'), createdAt: Date.now() };
    set((state) => ({
      undoStack: [...state.undoStack, full].slice(-MAX_UNDO_ENTRIES),
      redoStack: [],
      toast: { id: full.id, label: full.label, undoable: true },
    }));
  },

  undo: () => {
    const { undoStack } = get();
    const entry = undoStack[undoStack.length - 1];
    if (!entry) return false;
    return get().undoEntry(entry.id);
  },

  undoEntry: (id) => {
    const { undoStack, redoStack } = get();
    const index = undoStack.findIndex((e) => e.id === id);
    if (index === -1) return false;
    const entry = undoStack[index];
    // Take the entry off first so a throwing undo can't be retried forever.
    set({ undoStack: undoStack.filter((e) => e.id !== id) });
    try {
      entry.undo();
    } catch (err) {
      console.error('Undo failed:', err);
      set({ toast: null });
      return false;
    }
    set({
      redoStack: entry.redo ? [...redoStack, entry].slice(-MAX_UNDO_ENTRIES) : redoStack,
      toast: { id: uniqueId('undo'), label: '', undoable: false },
    });
    return true;
  },

  redo: () => {
    const { redoStack, undoStack } = get();
    const entry = redoStack[redoStack.length - 1];
    if (!entry || !entry.redo) return false;
    set({ redoStack: redoStack.slice(0, -1) });
    try {
      entry.redo();
    } catch (err) {
      console.error('Redo failed:', err);
      return false;
    }
    set({
      undoStack: [...undoStack, entry].slice(-MAX_UNDO_ENTRIES),
      toast: { id: entry.id, label: entry.label, undoable: true },
    });
    return true;
  },

  dismissToast: () => set({ toast: null }),

  notify: (label) => set({ toast: { id: uniqueId('notice'), label, undoable: false } }),

  clear: () => set({ undoStack: [], redoStack: [], toast: null }),
}));
