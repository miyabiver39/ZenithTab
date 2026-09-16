import { useEffect } from 'react';
import { useDashboardStore } from '../store/useDashboardStore';
import { snapshotService, snapshotDataFromState, SnapshotSource } from '../services/snapshotService';

const WATCHED: (keyof SnapshotSource)[] = [
  'pages',
  'activePageId',
  'pageData',
  'widgets',
  'layouts',
  'wallpaper',
  'appearance',
  'dockItems',
  'keyboardShortcuts',
];

/**
 * Automatic whole-dashboard snapshots.
 *
 * Rather than periodically saving whatever the dashboard looks like now,
 * this saves what it looked like *before* the first change after a quiet
 * spell: on every store change it offers the previous state to
 * snapshotService.maybeTakeAuto, which only keeps it when the last
 * automatic snapshot is old enough (30 min). The net effect is that "how
 * things were before I started fiddling" is always one restore away,
 * without a snapshot per click.
 */
export function useAutoSnapshot() {
  const isInitialized = useDashboardStore((s) => s.isInitialized);

  useEffect(() => {
    if (!isInitialized) return;
    return useDashboardStore.subscribe((state, prev) => {
      if (!prev.isInitialized || !state.backupSettings.autoSnapshot) return;
      if (!WATCHED.some((key) => state[key] !== prev[key])) return;
      void snapshotService.maybeTakeAuto(snapshotDataFromState(prev));
    });
  }, [isInitialized]);
}
