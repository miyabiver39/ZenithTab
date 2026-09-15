import { useEffect } from 'react';
import { useDashboardStore } from '../store/useDashboardStore';
import { STORAGE_KEYS } from '../services/storageService';
import { isChromeExtension } from '../utils/storage';

const WATCHED_KEYS = new Set<string>([
  STORAGE_KEYS.PAGES,
  STORAGE_KEYS.ACTIVE_PAGE_ID,
  STORAGE_KEYS.PAGE_DATA,
  STORAGE_KEYS.WIDGETS,
  STORAGE_KEYS.LAYOUTS,
  STORAGE_KEYS.WALLPAPER,
  STORAGE_KEYS.APPEARANCE,
  STORAGE_KEYS.DOCK_ITEMS,
  STORAGE_KEYS.KEYBOARD_SHORTCUTS,
]);

// A single user action fans out into several storage writes (widgets,
// layouts, pageData…). Waiting for the burst to settle before re-reading
// means we never observe a half-written state.
const SETTLE_MS = 400;

/**
 * Keeps this new-tab instance in step with writes made by other instances.
 *
 * Chrome users routinely have several new tabs open at once; each one loads
 * the dashboard from storage when it opens and, without this, never looks
 * again. Any change made in a stale tab then overwrites whatever a newer
 * tab had saved — adding a page in one tab and dragging a widget in another
 * could silently drop the new page's data.
 *
 * Changes are applied straight away except while the user is actively
 * editing the layout in a visible tab (a mid-drag re-render would fight
 * the drag); those are held until edit mode ends or the tab is hidden.
 * Coming back to a tab always triggers a re-read as a catch-all.
 */
export function useStorageSync() {
  const isInitialized = useDashboardStore((s) => s.isInitialized);

  useEffect(() => {
    if (!isInitialized) return;

    let timer: ReturnType<typeof setTimeout> | null = null;
    let pending = false;

    const canApplyNow = () => document.hidden || !useDashboardStore.getState().isEditMode;

    const flush = () => {
      if (!pending) return;
      if (!canApplyNow()) return;
      pending = false;
      void useDashboardStore.getState().syncFromStorage();
    };

    const schedule = () => {
      pending = true;
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => {
        timer = null;
        flush();
      }, SETTLE_MS);
    };

    const handleChromeChange = (
      changes: Record<string, chrome.storage.StorageChange>,
      area: string
    ) => {
      if (area !== 'local') return;
      if (Object.keys(changes).some((key) => WATCHED_KEYS.has(key))) schedule();
    };

    // Dev server / non-extension fallback: localStorage's cross-tab event.
    const handleLocalStorage = (e: StorageEvent) => {
      const key = e.key?.replace(/^zenith_/, '');
      if (key && WATCHED_KEYS.has(key)) schedule();
    };

    const handleVisibility = () => {
      if (document.hidden) {
        flush();
      } else {
        // Re-read on return regardless of what we saw — cheap, and covers
        // anything a hidden tab may have missed.
        pending = true;
        flush();
      }
    };

    // Held changes get applied as soon as the user leaves edit mode.
    const unsubscribeEditMode = useDashboardStore.subscribe((state, prev) => {
      if (prev.isEditMode && !state.isEditMode) flush();
    });

    const useChrome = isChromeExtension() && !!chrome.storage.onChanged;
    if (useChrome) chrome.storage.onChanged.addListener(handleChromeChange);
    else window.addEventListener('storage', handleLocalStorage);
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      if (timer) clearTimeout(timer);
      unsubscribeEditMode();
      if (useChrome) chrome.storage.onChanged.removeListener(handleChromeChange);
      else window.removeEventListener('storage', handleLocalStorage);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [isInitialized]);
}
