import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, act, fireEvent } from '@testing-library/react';
import { setupUser } from '../helpers/user';
import { UndoToast, UNDO_TOAST_MS, UNDONE_TOAST_MS } from '../../src/components/common/UndoToast';
import { useUndoStore } from '../../src/store/useUndoStore';
import { resetDashboardStore } from '../helpers/store';

describe('UndoToast', () => {
  beforeEach(() => {
    resetDashboardStore();
    vi.useFakeTimers();
  });
  afterEach(() => vi.useRealTimers());

  it('何もなければ描画しないこと', () => {
    render(<UndoToast />);
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });

  it('操作後にラベルと「元に戻す」を出し、押すと undo が走って確認表示に変わること', async () => {
    const user = setupUser();
    const undo = vi.fn();
    render(<UndoToast />);
    act(() => useUndoStore.getState().pushUndo({ label: 'Removed widget "Clock"', undo }));

    expect(screen.getByRole('status')).toHaveTextContent('Removed widget "Clock"');
    await user.click(screen.getByRole('button', { name: 'Undo' }));
    expect(undo).toHaveBeenCalledTimes(1);
    expect(screen.getByRole('status')).toHaveTextContent('Restored');
    expect(screen.queryByRole('button', { name: 'Undo' })).not.toBeInTheDocument();

    // The click left the pointer over the toast (paused); move it away.
    fireEvent.mouseLeave(screen.getByRole('status'));
    act(() => vi.advanceTimersByTime(UNDONE_TOAST_MS));
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });

  it('8秒で自動的に消え、ホバー中はタイマーが止まること', () => {
    render(<UndoToast />);
    act(() => useUndoStore.getState().pushUndo({ label: 'x', undo: () => {} }));

    // Hover is a pointer-position state user-event can't hold across timer
    // advances; the raw events are enough to flip the pause flag.
    fireEvent.mouseEnter(screen.getByRole('status'));
    act(() => vi.advanceTimersByTime(UNDO_TOAST_MS * 2));
    expect(screen.getByRole('status')).toBeInTheDocument();

    fireEvent.mouseLeave(screen.getByRole('status'));
    act(() => vi.advanceTimersByTime(UNDO_TOAST_MS - 1));
    expect(screen.getByRole('status')).toBeInTheDocument();
    act(() => vi.advanceTimersByTime(1));
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
    // The undo entry itself survives the toast (still reachable via Ctrl+Z).
    expect(useUndoStore.getState().undoStack).toHaveLength(1);
  });

  it('Escape と × で閉じられること', async () => {
    const user = setupUser();
    render(<UndoToast />);
    act(() => useUndoStore.getState().pushUndo({ label: 'x', undo: () => {} }));
    await user.keyboard('{Escape}');
    expect(screen.queryByRole('status')).not.toBeInTheDocument();

    act(() => useUndoStore.getState().pushUndo({ label: 'y', undo: () => {} }));
    await user.click(screen.getByRole('button', { name: 'Close' }));
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });

  it('連続操作では最新の1件だけを表示すること', () => {
    render(<UndoToast />);
    act(() => useUndoStore.getState().pushUndo({ label: 'first', undo: () => {} }));
    act(() => useUndoStore.getState().pushUndo({ label: 'second', undo: () => {} }));
    expect(screen.getAllByRole('status')).toHaveLength(1);
    expect(screen.getByRole('status')).toHaveTextContent('second');
  });
});
