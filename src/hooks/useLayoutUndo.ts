import { useCallback, useRef } from 'react';
import { useDashboardStore } from '../store/useDashboardStore';
import { useUndoStore } from '../store/useUndoStore';
import { useTranslation } from '../i18n/i18n';
import { ResponsiveLayouts } from '../types/widget';

const clone = (layouts: ResponsiveLayouts): ResponsiveLayouts => JSON.parse(JSON.stringify(layouts));
const same = (a: ResponsiveLayouts, b: ResponsiveLayouts) => JSON.stringify(a) === JSON.stringify(b);

/**
 * Turns one drag or resize gesture into a single undo entry.
 *
 * react-grid-layout reports `onLayoutChange` continuously while an item is
 * being dragged (every displaced neighbour is a change), so registering
 * undo there would produce dozens of entries per gesture. Instead the
 * layouts are snapshotted when the gesture starts and compared once it
 * ends; the entry restores the whole pre-gesture layout, neighbours that
 * were pushed aside included.
 */
export function useLayoutUndo() {
  const { t } = useTranslation();
  const before = useRef<ResponsiveLayouts | null>(null);

  const onStart = useCallback(() => {
    before.current = clone(useDashboardStore.getState().layouts);
  }, []);

  const finish = useCallback(
    (label: string) => {
      const snapshot = before.current;
      before.current = null;
      if (!snapshot) return;
      // The store's onLayoutChange for the drop fires right after the
      // stop handler; compare once it has had a chance to run.
      setTimeout(() => {
        const after = clone(useDashboardStore.getState().layouts);
        if (same(snapshot, after)) return;
        const apply = (layouts: ResponsiveLayouts) => {
          const state = useDashboardStore.getState();
          state.updateLayouts(layouts.lg || [], clone(layouts));
        };
        useUndoStore.getState().pushUndo({
          label,
          undo: () => apply(snapshot),
          redo: () => apply(after),
        });
      }, 0);
    },
    []
  );

  const onDragStop = useCallback(() => finish(t.undo.movedWidget), [finish, t]);
  const onResizeStop = useCallback(() => finish(t.undo.resizedWidget), [finish, t]);

  return { onDragStart: onStart, onDragStop, onResizeStart: onStart, onResizeStop };
}
