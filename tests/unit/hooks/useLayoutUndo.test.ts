import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useLayoutUndo } from '../../../src/hooks/useLayoutUndo';
import { useDashboardStore } from '../../../src/store/useDashboardStore';
import { useUndoStore } from '../../../src/store/useUndoStore';
import { resetDashboardStore } from '../../helpers/store';

const state = () => useDashboardStore.getState();

describe('useLayoutUndo', () => {
  beforeEach(() => {
    resetDashboardStore({ isEditMode: true });
    vi.useFakeTimers();
  });
  afterEach(() => vi.useRealTimers());

  const moveFirstWidget = () => {
    const layouts = JSON.parse(JSON.stringify(state().layouts));
    layouts.lg[0] = { ...layouts.lg[0], x: layouts.lg[0].x + 1, y: layouts.lg[0].y + 5 };
    // What react-grid-layout does between onDragStart and onDragStop.
    state().updateLayouts(layouts.lg, layouts);
    return layouts;
  };

  it('ドラッグ開始〜終了を1件の undo にまとめ、undo で移動前のレイアウトに戻ること', () => {
    const before = JSON.parse(JSON.stringify(state().layouts));
    const { result } = renderHook(() => useLayoutUndo());

    act(() => result.current.onDragStart());
    const after = moveFirstWidget();
    // A second intermediate change during the same gesture must not add
    // another entry.
    state().updateLayouts(after.lg, { ...after, lg: after.lg.map((l: any) => ({ ...l })) });
    act(() => result.current.onDragStop());
    act(() => vi.runAllTimers());

    expect(useUndoStore.getState().undoStack).toHaveLength(1);
    expect(useUndoStore.getState().toast?.label).toBe('Moved a widget');

    act(() => void useUndoStore.getState().undo());
    expect(state().layouts).toEqual(before);
    expect(state().widgets[0].layout).toEqual(before.lg[0]);

    act(() => void useUndoStore.getState().redo());
    expect(state().layouts).toEqual(after);
  });

  it('リサイズは別ラベルになること', () => {
    const { result } = renderHook(() => useLayoutUndo());
    act(() => result.current.onResizeStart());
    moveFirstWidget();
    act(() => result.current.onResizeStop());
    act(() => vi.runAllTimers());
    expect(useUndoStore.getState().toast?.label).toBe('Resized a widget');
  });

  it('レイアウトが変わらなければ undo を積まないこと', () => {
    const { result } = renderHook(() => useLayoutUndo());
    act(() => result.current.onDragStart());
    act(() => result.current.onDragStop());
    act(() => vi.runAllTimers());
    expect(useUndoStore.getState().undoStack).toHaveLength(0);
  });

  it('開始なしの終了は無視すること', () => {
    const { result } = renderHook(() => useLayoutUndo());
    moveFirstWidget();
    act(() => result.current.onDragStop());
    act(() => vi.runAllTimers());
    expect(useUndoStore.getState().undoStack).toHaveLength(0);
  });
});
