import { useEffect } from 'react';
import { useDashboardStore } from '../store/useDashboardStore';
import { syncService, type SyncedSettings } from '../services/syncService';

/** Local writes settle (dock reorder = several updates) before one push. */
const PUSH_DEBOUNCE_MS = 800;

/**
 * Runs the settings sync while it is switched on (Settings > Backup):
 * pulls once at start, listens for other devices' writes, and pushes
 * this device's changes to appearance / Dock / keyboard shortcuts.
 *
 * Applying a remote value goes through `applySyncedSettings`, which
 * flags the store so the local-change subscriber below doesn't push the
 * very value that just came in (that would bounce between devices).
 */
export function useSettingsSync() {
  const isInitialized = useDashboardStore((s) => s.isInitialized);
  const enabled = useDashboardStore((s) => !!s.backupSettings.syncSettings);

  useEffect(() => {
    if (!isInitialized || !enabled || !syncService.isAvailable()) return;
    let disposed = false;
    let timer: ReturnType<typeof setTimeout> | null = null;

    const current = (): SyncedSettings => {
      const s = useDashboardStore.getState();
      return { appearance: s.appearance, dockItems: s.dockItems, keyboardShortcuts: s.keyboardShortcuts };
    };

    const push = async () => {
      const { skipped } = await syncService.push(current());
      if (!disposed) useDashboardStore.getState().setSyncSkipped(skipped);
    };

    const applyRemote = async (payload: { settings: Partial<SyncedSettings>; updatedAt: number }) => {
      if (disposed || payload.updatedAt === 0) return;
      const last = await syncService.getLastStamp();
      if (payload.updatedAt <= last) return;
      useDashboardStore.getState().applySyncedSettings(payload.settings);
      await syncService.setLastStamp(payload.updatedAt);
    };

    // First contact: take the remote state if there is one, otherwise seed it.
    void syncService.pull().then((payload) => {
      if (disposed) return;
      if (payload.updatedAt === 0) return push();
      return applyRemote(payload);
    });

    const unsubscribeRemote = syncService.subscribe((payload) => void applyRemote(payload));

    const unsubscribeStore = useDashboardStore.subscribe((state, prev) => {
      if (state.isApplyingSyncedSettings) return;
      if (state.appearance === prev.appearance && state.dockItems === prev.dockItems && state.keyboardShortcuts === prev.keyboardShortcuts) return;
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => void push(), PUSH_DEBOUNCE_MS);
    });

    return () => {
      disposed = true;
      if (timer) clearTimeout(timer);
      unsubscribeRemote();
      unsubscribeStore();
    };
  }, [isInitialized, enabled]);
}
