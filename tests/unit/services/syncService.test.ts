import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { syncService, SYNC_QUOTA_BYTES_PER_ITEM, syncItemBytes } from '../../../src/services/syncService';
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
    expect(syncItemBytes('zenith_sync_appearance', chromeSyncData.zenith_sync_appearance)).toBeLessThan(SYNC_QUOTA_BYTES_PER_ITEM);
    expect(await syncService.getLastStamp()).toBe(1000);

    const pulled = await syncService.pull();
    expect(pulled.updatedAt).toBe(1000);
    expect(pulled.settings).toEqual({ appearance: DEFAULT_APPEARANCE, keyboardShortcuts: [] });
  });

  it('サイズは UTF-8 バイト数(キー込み)で判定し、日本語のラベルで上限をすり抜けないこと', async () => {
    // 2,700 chars of 3-byte kana: 2,700 UTF-16 units but ~8,100 UTF-8 bytes — over quota with the wrapper and key.
    const label = 'あ'.repeat(2700);
    const heavy = [{ id: 'd', label, url: 'https://x.example', icon: 'globe', openInNewTab: true }];
    expect(JSON.stringify({ updatedAt: 1, value: heavy }).length).toBeLessThan(SYNC_QUOTA_BYTES_PER_ITEM);
    expect(syncItemBytes('zenith_sync_dockItems', { updatedAt: 1, value: heavy })).toBeGreaterThan(SYNC_QUOTA_BYTES_PER_ITEM);

    const result = await syncService.push({ dockItems: heavy, keyboardShortcuts: [] }, 5);
    expect(result).toEqual({ pushed: ['keyboardShortcuts'], skipped: ['dockItems'] });
    expect(chromeSyncData.zenith_sync_dockItems).toBeUndefined();
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

  it('旧バージョンが送った appearance に無いフィールドは、この端末の現在値を保つこと', async () => {
    // A device that predates adaptiveTextColor pushes appearance without it.
    useDashboardStore.setState((s) => ({ appearance: { ...s.appearance, adaptiveTextColor: false, glassBlur: 22 } }));
    renderHook(() => useSettingsSync());
    await vi.advanceTimersByTimeAsync(10);

    const { adaptiveTextColor: _adaptiveTextColor, glassBlur: _glassBlur, ...withoutNewFields } = { ...DEFAULT_APPEARANCE, language: 'de' as const };
    await chromeMock.storage.sync.set({ zenith_sync_appearance: { updatedAt: Date.now() + 5000, value: withoutNewFields } });
    await vi.advanceTimersByTimeAsync(10);

    expect(state().appearance.language).toBe('de');
    // Not wiped by the remote value's absence — this device's own setting survives.
    expect(state().appearance.adaptiveTextColor).toBe(false);
    expect(state().appearance.glassBlur).toBe(22);
  });

  it('不正な形状の dockItems / keyboardShortcuts を受け取っても、壊れた要素だけを落として反映すること', async () => {
    renderHook(() => useSettingsSync());
    await vi.advanceTimersByTimeAsync(10);

    await chromeMock.storage.sync.set({
      zenith_sync_dockItems: {
        updatedAt: Date.now() + 5000,
        value: [null, { id: 'a', label: 'OK', url: 'https://ok.example', icon: 'globe' }, { id: 'b', label: 'Bad', url: 'javascript:1', icon: 'globe' }],
      },
      zenith_sync_keyboardShortcuts: {
        updatedAt: Date.now() + 5000,
        value: [{ id: 'k1', combo: 'Ctrl+Alt+G', label: 'GH', url: 'https://github.com' }, { id: 'k2', combo: 'Ctrl+Alt+X', label: 'Bad', url: 'data:text/html,x' }],
      },
    });
    await vi.advanceTimersByTimeAsync(10);

    expect(state().dockItems.map((d) => d.id)).toEqual(['a']);
    expect(state().keyboardShortcuts.map((k) => k.id)).toEqual(['k1']);
    // Written back to local storage sanitized too, not the raw remote value.
    expect(chromeStorageData[STORAGE_KEYS.DOCK_ITEMS].map((d: any) => d.id)).toEqual(['a']);
  });

  it('appearance が文字列などまったく別の形で届いても、既定値にフォールバックしてクラッシュしないこと', async () => {
    renderHook(() => useSettingsSync());
    await vi.advanceTimersByTimeAsync(10);
    await chromeMock.storage.sync.set({ zenith_sync_appearance: { updatedAt: Date.now() + 5000, value: 'not-an-object' } });
    await vi.advanceTimersByTimeAsync(10);
    expect(state().appearance.theme).toBe(DEFAULT_APPEARANCE.theme);
  });
});
