import { snapshotService, snapshotDataFromState, DEFAULT_BACKUP_SETTINGS } from '../../services/snapshotService';
import { createStoreHelpers } from './helpers';
import type { DashboardSliceCreator, SnapshotSlice } from '../types';

export const createSnapshotSlice: DashboardSliceCreator<SnapshotSlice> = (set, get) => {
  const { reloadFromStorage } = createStoreHelpers(set, get);

  return {
    snapshots: null,
    backupSettings: DEFAULT_BACKUP_SETTINGS,

    refreshSnapshots: async () => {
      try {
        set({ snapshots: await snapshotService.list() });
      } catch (err) {
        console.error('Failed listing snapshots:', err);
        set({ snapshots: [] });
      }
    },

    takeSnapshot: async () => {
      const taken = await snapshotService.take('manual', snapshotDataFromState(get()));
      await get().refreshSnapshots();
      return taken !== null;
    },

    restoreSnapshot: async (id) => {
      const snapshot = await snapshotService.get(id);
      if (!snapshot) return false;
      // So the restore itself can be walked back from the same list.
      const current = snapshotDataFromState(get());
      await snapshotService.take('before-restore', current);
      const ok = await snapshotService.restore(snapshot, current);
      if (ok) await reloadFromStorage();
      await get().refreshSnapshots();
      return ok;
    },

    deleteSnapshot: async (id) => {
      await snapshotService.remove(id);
      await get().refreshSnapshots();
    },

    updateBackupSettings: async (partial) => {
      const updated = { ...get().backupSettings, ...partial };
      set({ backupSettings: updated });
      await snapshotService.saveSettings(updated);
    },
  };
};
