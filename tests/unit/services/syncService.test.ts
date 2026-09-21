import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { syncService, SYNC_ITEM_LIMIT } from '../../../src/services/syncService';
import { useSettingsSync } from '../../../src/hooks/useSettingsSync';
import { useDashboardStore } from '../../../src/store/useDashboardStore';
import { DEFAULT_APPEARANCE, STORAGE_KEYS } from '../../../src/services/storageService';
import { chromeMock, chromeSyncData, chromeStorageData } from '../../helpers/chrome';
import { resetDashboardStore } from '../../helpers/store';

const state = () => useDashboardStore.getState();
const dock = (n: number) => Array.from({ length: n }, (_, i) => ({ id: `d${i}`, label: `Site ${i}`, url: `https://s${i}.example`, icon: 'globe', openInNewTab: true }));

describe('syncService', () => {
  it('設定を sync 領域に書き、8KB を超える項目はスキップして報告すること', async () => {
    const result = await syncService.push({ appearance: DEFAULT_APPEARANCE, dockItems: dock(200), keyboardShortcuts: [] }, 1000);
    expect(result.pushed).toEqual(['appearance', 'keyboardShortcuts']);
    expect(result.skipped).toEqual(['dockItems']);
    expect(chromeSyncData.zenith_sync_appearance).toEqual({ updatedAt: 1000, value: DEFAULT_APPEARANCE });
    expect(JSON.stringify(chromeSyncData.zenith_sync_appearance).length).toBeLessThan(SYNC_ITEM_LIMIT);
    expect(await syncService.getLastStamp()).toBe(1000);

    const pulled = await syncService.pull();
    expect(pulled.updatedAt).toBe(1000);
    expect(pulled.settings).toEqual({ appearance: DEFAULT_APPEARANCE, keyboardShortcuts: [] });
  });

  it('壊れた項目は無視し、clear で自分の項目だけ消すこと', async () => {
    chromeSyncData.zenith_sync_appearance = 'garbage';
    chromeSyncData.zenith_sync_dockItems = { updatedAt: 5, value: dock(1) };
    chromeSyncData.other_extension_key = 1;
    expect(await syncService.pull()).toEqual({ settings: { dockItems: dock(1) }, updatedAt: 5 });
    await syncService.clear();
    expect(Object.keys(chromeSyncData)).toEqual(['other_extension_key']);
  });

  it('sync 領域が無い環境では何もせず、利用不可を返すこと', async () => {
    const original = chromeMock.storage.sync;
    (chromeMock.storage as any).sync = undefined;
    try {
      expect(syncService.isAvailable()).toBe(false);
      expect(await syncService.push({ appearance: DEFAULT_APPEARANCE })).toEqual({ pushed: [], skipped: [] });
      expect(await syncService.pull()).toEqual({ settings: {}, updatedAt: 0 });
    } finally {
      (chromeMock.storage as any).sync = original;
    }
  });

  it('subscribe は sync 領域の変更だけを解釈して届けること', () => {
    const onRemote = vi.fn();
    const unsubscribe = syncService.subscribe(onRemote);
    chromeMock.storage.onChanged.addListener.mock.calls[0][0]({ zenith_sync_appearance: { newValue: { updatedAt: 7, value: DEFAULT_APPEARANCE } } }, 'local');
    expect(onRemote).not.toHaveBeenCalled();
    chromeMock.storage.onChanged.addListener.mock.calls[0][0]({ zenith_sync_appearance: { newValue: { updatedAt: 7, value: DEFAULT_APPEARANCE } }, unrelated: { newValue: 1 } }, 'sync');
    expect(onRemote).toHaveBeenCalledWith({ settings: { appearance: DEFAULT_APPEARANCE }, updatedAt: 7 });
    unsubscribe();
    expect(chromeMock.storage.onChanged.removeListener).toHaveBeenCalled();
  });
});

describe('useSettingsSync', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    resetDashboardStore({ backupSettings: { autoSnapshot: true, syncSettings: true } });
  });
  afterEach(() => vi.useRealTimers());

  it('リモートが空なら今の設定を送り、ローカルの変更は少し待ってから送ること', async () => {
    renderHook(() => useSettingsSync());
    await vi.advanceTimersByTimeAsync(10);
    expect(chromeSyncData.zenith_sync_appearance.value).toEqual(state().appearance);

    state().updateAppearance({ theme: 'light' });
    expect(chromeSyncData.zenith_sync_appearance.value.theme).toBe('dark');
    await vi.advanceTimersByTimeAsync(1000);
    expect(chromeSyncData.zenith_sync_appearance.value.theme).toBe('light');
  });

  it('リモートの方が新しければ取り込み、取り込んだ値を送り返さないこと', async () => {
    chromeSyncData.zenith_sync_appearance = { updatedAt: Date.now() + 1, value: { ...DEFAULT_APPEARANCE, language: 'de' } };
    chromeSyncData.zenith_sync_dockItems = { updatedAt: Date.now() + 1, value: dock(2) };
    renderHook(() => useSettingsSync());
    await vi.advanceTimersByTimeAsync(10);
    expect(state().appearance.language).toBe('de');
    expect(state().dockItems.map((d) => d.label)).toEqual(['Site 0', 'Site 1']);
    expect(chromeStorageData[STORAGE_KEYS.APPEARANCE].language).toBe('de');

    const setCalls = chromeMock.storage.sync.set.mock.calls.length;
    await vi.advanceTimersByTimeAsync(2000);
    expect(chromeMock.storage.sync.set.mock.calls.length).toBe(setCalls);

    // Another device writes: applied live.
    await chromeMock.storage.sync.set({ zenith_sync_appearance: { updatedAt: Date.now() + 5000, value: { ...DEFAULT_APPEARANCE, language: 'fr' } } });
    await vi.advanceTimersByTimeAsync(10);
    expect(state().appearance.language).toBe('fr');
    // Our own (older-stamped) echo is ignored.
    await chromeMock.storage.sync.set({ zenith_sync_appearance: { updatedAt: 1, value: { ...DEFAULT_APPEARANCE, language: 'ko' } } });
    await vi.advanceTimersByTimeAsync(10);
    expect(state().appearance.language).toBe('fr');
  });

  it('無効のときは何もしないこと', async () => {
    resetDashboardStore({ backupSettings: { autoSnapshot: true, syncSettings: false } });
    renderHook(() => useSettingsSync());
    await vi.advanceTimersByTimeAsync(10);
    expect(Object.keys(chromeSyncData)).toHaveLength(0);
  });

  it('大きすぎる項目はスキップとしてストアに残ること', async () => {
    useDashboardStore.setState({ dockItems: dock(200) });
    renderHook(() => useSettingsSync());
    await vi.advanceTimersByTimeAsync(10);
    expect(state().syncSkipped).toEqual(['dockItems']);
  });
});
