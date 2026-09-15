import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useGlobalKeyboardShortcuts } from '../../../src/hooks/useGlobalKeyboardShortcuts';
import { useStorageSync } from '../../../src/hooks/useStorageSync';
import { useRssFeed } from '../../../src/hooks/useRssFeed';
import { useBookmarks } from '../../../src/hooks/useBookmarks';
import { useDashboardStore } from '../../../src/store/useDashboardStore';
import { storageService, STORAGE_KEYS, DEFAULT_PAGE_ID } from '../../../src/services/storageService';
import { rssService } from '../../../src/services/rssService';
import { bookmarkService } from '../../../src/services/bookmarkService';
import { resetDashboardStore } from '../../helpers/store';
import { chromeMock, emitStorageChange, installChromeMock, uninstallChromeMock } from '../../helpers/chrome';

const state = () => useDashboardStore.getState();
const keydown = (init: KeyboardEventInit) => window.dispatchEvent(new KeyboardEvent('keydown', { cancelable: true, ...init }));

describe('useGlobalKeyboardShortcuts', () => {
  beforeEach(() => resetDashboardStore());
  afterEach(() => vi.restoreAllMocks());

  it('Ctrl+Alt+←/→ でページを循環すること', () => {
    state().addPage();
    state().addPage();
    state().switchPage(DEFAULT_PAGE_ID);
    const ids = state().pages.map((p) => p.id);
    renderHook(() => useGlobalKeyboardShortcuts());

    act(() => keydown({ key: 'ArrowRight', ctrlKey: true, altKey: true }));
    expect(state().activePageId).toBe(ids[1]);
    act(() => keydown({ key: 'ArrowLeft', ctrlKey: true, altKey: true }));
    expect(state().activePageId).toBe(ids[0]);
    act(() => keydown({ key: 'ArrowLeft', ctrlKey: true, altKey: true }));
    expect(state().activePageId).toBe(ids[2]);
  });

  it('ページが1つなら切り替えず、登録済みショートカットでURLを開くこと', () => {
    const open = vi.spyOn(window, 'open').mockImplementation(() => null);
    state().addKeyboardShortcut({ combo: 'Ctrl+Shift+G', label: 'GitHub', url: 'https://github.com', openInNewTab: true });
    renderHook(() => useGlobalKeyboardShortcuts());

    act(() => keydown({ key: 'ArrowRight', ctrlKey: true, altKey: true }));
    expect(state().activePageId).toBe(DEFAULT_PAGE_ID);

    act(() => keydown({ key: 'g', ctrlKey: true, shiftKey: true }));
    expect(open).toHaveBeenCalledWith('https://github.com', '_blank');

    act(() => keydown({ key: 'x', ctrlKey: true }));
    expect(open).toHaveBeenCalledTimes(1);
  });

  it('入力中は無視すること', () => {
    const open = vi.spyOn(window, 'open').mockImplementation(() => null);
    state().addKeyboardShortcut({ combo: 'Ctrl+Shift+G', label: 'GitHub', url: 'https://github.com', openInNewTab: true });
    renderHook(() => useGlobalKeyboardShortcuts());
    const input = document.createElement('input');
    document.body.appendChild(input);
    input.focus();
    act(() => keydown({ key: 'g', ctrlKey: true, shiftKey: true }));
    expect(open).not.toHaveBeenCalled();
    input.remove();
  });
});

describe('useStorageSync', () => {
  beforeEach(() => {
    resetDashboardStore();
    vi.useFakeTimers();
    Object.defineProperty(document, 'hidden', { configurable: true, value: false });
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
    installChromeMock();
  });

  it('chrome.storage.onChanged を購読し、変更を400ms後に取り込むこと', async () => {
    renderHook(() => useStorageSync());
    expect(chromeMock.storage.onChanged.addListener).toHaveBeenCalled();

    await storageService.savePages([{ id: DEFAULT_PAGE_ID, name: 'Renamed elsewhere' }]);
    await storageService.savePageData(state().pageData);
    emitStorageChange({ [STORAGE_KEYS.PAGES]: { newValue: [] } });

    expect(state().pages[0].name).toBe('');
    await act(async () => {
      await vi.advanceTimersByTimeAsync(400);
    });
    expect(state().pages[0].name).toBe('Renamed elsewhere');
  });

  it('無関係なキーや別エリアの変更は無視すること', async () => {
    const sync = vi.spyOn(state(), 'syncFromStorage');
    renderHook(() => useStorageSync());
    emitStorageChange({ zenith_rss_cache: { newValue: {} } });
    emitStorageChange({ [STORAGE_KEYS.PAGES]: { newValue: [] } }, 'sync');
    await act(async () => {
      await vi.advanceTimersByTimeAsync(1000);
    });
    expect(sync).not.toHaveBeenCalled();
  });

  it('可視タブの編集モード中は保留し、編集終了で適用すること', async () => {
    renderHook(() => useStorageSync());
    act(() => state().setEditMode(true));

    await storageService.savePages([{ id: DEFAULT_PAGE_ID, name: 'Held' }]);
    await storageService.savePageData(state().pageData);
    emitStorageChange({ [STORAGE_KEYS.PAGES]: { newValue: [] } });
    await act(async () => {
      await vi.advanceTimersByTimeAsync(400);
    });
    expect(state().pages[0].name).toBe('');

    act(() => state().setEditMode(false));
    await act(async () => {
      await vi.advanceTimersByTimeAsync(0);
    });
    expect(state().pages[0].name).toBe('Held');
  });

  it('タブが再表示されたら再読込すること', async () => {
    renderHook(() => useStorageSync());
    await storageService.savePages([{ id: DEFAULT_PAGE_ID, name: 'Visible again' }]);
    await storageService.savePageData(state().pageData);

    Object.defineProperty(document, 'hidden', { configurable: true, value: false });
    await act(async () => {
      document.dispatchEvent(new Event('visibilitychange'));
      await vi.advanceTimersByTimeAsync(0);
    });
    expect(state().pages[0].name).toBe('Visible again');
  });

  it('アンマウントで購読を解除すること', () => {
    const { unmount } = renderHook(() => useStorageSync());
    unmount();
    expect(chromeMock.storage.onChanged.removeListener).toHaveBeenCalled();
  });

  it('拡張コンテキスト外では localStorage の storage イベントで同期すること', async () => {
    uninstallChromeMock();
    renderHook(() => useStorageSync());
    localStorage.setItem(`zenith_${STORAGE_KEYS.PAGES}`, JSON.stringify([{ id: DEFAULT_PAGE_ID, name: 'From LS' }]));
    localStorage.setItem(`zenith_${STORAGE_KEYS.PAGE_DATA}`, JSON.stringify(state().pageData));

    window.dispatchEvent(new StorageEvent('storage', { key: `zenith_${STORAGE_KEYS.PAGES}` }));
    await act(async () => {
      await vi.advanceTimersByTimeAsync(400);
    });
    expect(state().pages[0].name).toBe('From LS');
  });
});

describe('useRssFeed', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it('refreshInterval ごとに強制再取得すること', async () => {
    vi.useFakeTimers();
    const fetchSpy = vi.spyOn(rssService, 'fetchFeed').mockResolvedValue({ title: 't', lastUpdated: 0, items: [] });
    renderHook(() => useRssFeed('https://example.com/feed', 1));
    await act(async () => {
      await vi.advanceTimersByTimeAsync(0);
    });
    expect(fetchSpy).toHaveBeenCalledWith('https://example.com/feed', false);
    await act(async () => {
      await vi.advanceTimersByTimeAsync(60 * 1000);
    });
    expect(fetchSpy).toHaveBeenLastCalledWith('https://example.com/feed', true);
  });

  it('Error 以外の reject でも既定メッセージになること', async () => {
    vi.spyOn(rssService, 'fetchFeed').mockRejectedValue('nope');
    const { result } = renderHook(() => useRssFeed('https://example.com/feed', 0));
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.error).toBe('Failed to fetch RSS feed');
  });
});

describe('useBookmarks', () => {
  afterEach(() => vi.restoreAllMocks());

  it('読み込み失敗時もローディングが終わり、検索失敗をログすること', async () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.spyOn(bookmarkService, 'getBookmarkTree').mockRejectedValue(new Error('x'));
    vi.spyOn(bookmarkService, 'searchBookmarks').mockRejectedValue(new Error('y'));

    const { result } = renderHook(() => useBookmarks());
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.bookmarks).toEqual([]);

    await act(async () => {
      await result.current.searchBookmarks('q');
    });
    expect(error).toHaveBeenCalledTimes(2);
  });
});
