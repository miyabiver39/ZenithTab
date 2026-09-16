import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useAutoSnapshot } from '../../../src/hooks/useAutoSnapshot';
import { useDashboardStore } from '../../../src/store/useDashboardStore';
import { snapshotService } from '../../../src/services/snapshotService';
import { resetDashboardStore, flushPromises } from '../../helpers/store';

const state = () => useDashboardStore.getState();

describe('useAutoSnapshot', () => {
  beforeEach(() => resetDashboardStore());
  afterEach(() => vi.restoreAllMocks());

  it('最初の変更で「変更前」の状態を自動保存し、続く変更では保存しないこと', async () => {
    const before = state().widgets.length;
    renderHook(() => useAutoSnapshot());

    act(() => state().addWidget('clock', 'First'));
    await flushPromises();
    let list = await snapshotService.list();
    expect(list).toHaveLength(1);
    expect(list[0].reason).toBe('auto');
    expect(list[0].summary.widgets).toBe(before);

    act(() => state().addWidget('clock', 'Second'));
    await flushPromises();
    list = await snapshotService.list();
    expect(list).toHaveLength(1);
  });

  it('無関係な状態(編集モード等)の変化では呼ばれないこと', async () => {
    const spy = vi.spyOn(snapshotService, 'maybeTakeAuto');
    renderHook(() => useAutoSnapshot());
    act(() => state().setEditMode(true));
    act(() => state().openSettingsModal('settings'));
    expect(spy).not.toHaveBeenCalled();
  });

  it('設定オフなら呼ばれず、初期化前の変化も無視すること', async () => {
    const spy = vi.spyOn(snapshotService, 'maybeTakeAuto');
    useDashboardStore.setState({ backupSettings: { autoSnapshot: false } });
    renderHook(() => useAutoSnapshot());
    act(() => state().addWidget('clock', 'x'));
    expect(spy).not.toHaveBeenCalled();

    useDashboardStore.setState({ backupSettings: { autoSnapshot: true }, isInitialized: false });
    const { rerender } = renderHook(() => useAutoSnapshot());
    act(() => useDashboardStore.setState({ widgets: [] }));
    rerender();
    expect(spy).not.toHaveBeenCalled();
  });

  it('アンマウントで購読を解除すること', async () => {
    const spy = vi.spyOn(snapshotService, 'maybeTakeAuto').mockResolvedValue(null);
    const { unmount } = renderHook(() => useAutoSnapshot());
    unmount();
    act(() => state().addWidget('clock', 'x'));
    expect(spy).not.toHaveBeenCalled();
  });
});
