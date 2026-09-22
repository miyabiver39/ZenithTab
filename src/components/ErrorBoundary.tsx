import React from 'react';
import { snapshotService, type SnapshotMeta } from '../services/snapshotService';

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
  /** The newest automatic/manual backup, if one exists and could be listed. */
  latestSnapshot: SnapshotMeta | null;
  restoring: boolean;
  restoreFailed: boolean;
}

/**
 * Last line of defense against a render crash from corrupted persisted
 * data (a malformed widget config, a broken layout, etc.). Without this,
 * a crash here has no way out short of manually reinstalling the
 * extension to wipe chrome.storage.local — this shows a recovery screen
 * instead. Deliberately self-contained (no i18n, no store, no other app
 * component) so it still renders even if the crash's root cause is
 * something those systems depend on; snapshotService is a plain async
 * module over chrome.storage with no dependency on the Zustand store or
 * React, so it is safe to reach for here too.
 *
 * Per-widget crashes are caught lower down by WidgetErrorBoundary and
 * never reach this component; this one is for a crash in the shell
 * itself (layout, wallpaper, settings panel…).
 */
export class ErrorBoundary extends React.Component<Props, State> {
  state: State = { hasError: false, latestSnapshot: null, restoring: false, restoreFailed: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: unknown, info: React.ErrorInfo) {
    console.error('ZenithTab crashed while rendering:', error, info.componentStack);
    // Best-effort: a backup to offer instead of an outright wipe. Any
    // failure here (storage itself being the problem) just leaves the
    // "restore" option off the screen — the reset button is still there.
    snapshotService
      .list()
      .then((snapshots) => {
        if (snapshots[0]) this.setState({ latestSnapshot: snapshots[0] });
      })
      .catch(() => {
        // No backup to offer; fall through to reset-only.
      });
  }

  handleRestoreLatest = async () => {
    const meta = this.state.latestSnapshot;
    if (!meta) return;
    this.setState({ restoring: true, restoreFailed: false });
    try {
      const snapshot = await snapshotService.get(meta.id);
      if (!snapshot) throw new Error('snapshot missing');
      // No live store state to diff against (it crashed) — any large
      // wallpaper image the snapshot left out simply reverts to a
      // default rather than being restored, which beats losing everything.
      const ok = await snapshotService.restore(snapshot, {});
      if (!ok) throw new Error('restore failed');
      window.location.reload();
    } catch {
      this.setState({ restoring: false, restoreFailed: true });
    }
  };

  handleReset = async () => {
    try {
      if (typeof chrome !== 'undefined' && chrome.storage?.local) {
        await chrome.storage.local.clear();
      }
    } catch {
      // Fall through to the localStorage clear below regardless.
    }
    try {
      localStorage.clear();
    } catch {
      // Nothing more we can do here.
    }
    window.location.reload();
  };

  render() {
    if (!this.state.hasError) {
      return this.props.children;
    }

    const { latestSnapshot, restoring, restoreFailed } = this.state;

    return (
      <div className="fixed inset-0 bg-slate-950 flex items-center justify-center text-center p-6">
        <div className="max-w-sm space-y-4">
          <p className="text-white text-sm font-semibold">
            ZenithTab に問題が発生しました / Something went wrong
          </p>
          <p className="text-slate-400 text-xs leading-relaxed">
            保存データの読み込み中に問題が発生しました。
            {latestSnapshot
              ? 'いちばん新しいバックアップから復元するか、初期状態にリセットして復旧できます。'
              : 'リセットすると復旧します(ウィジェットや設定は初期状態に戻ります)。'}
            <br />
            <br />
            A problem occurred loading saved data.{' '}
            {latestSnapshot
              ? 'You can restore your most recent backup, or reset to recover.'
              : 'Resetting will recover the dashboard (widgets and settings return to their defaults).'}
          </p>
          {restoreFailed && (
            <p className="text-rose-400 text-[11px]">
              バックアップの復元に失敗しました。リセットをお試しください。 / Restoring the backup failed — try resetting instead.
            </p>
          )}
          <div className="flex flex-col gap-2">
            {latestSnapshot && (
              <button
                onClick={this.handleRestoreLatest}
                disabled={restoring}
                className="px-4 py-2 rounded-xl bg-sky-500 hover:bg-sky-400 disabled:opacity-60 text-white text-xs font-medium transition-colors"
              >
                {restoring
                  ? '復元しています… / Restoring…'
                  : `直近のバックアップから復元 / Restore latest backup (${new Date(latestSnapshot.takenAt).toLocaleString()})`}
              </button>
            )}
            <button
              onClick={this.handleReset}
              disabled={restoring}
              className={
                latestSnapshot
                  ? 'px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 disabled:opacity-60 text-white text-xs font-medium transition-colors'
                  : 'px-4 py-2 rounded-xl bg-sky-500 hover:bg-sky-400 text-white text-xs font-medium transition-colors'
              }
            >
              初期状態にリセット / Reset to defaults
            </button>
          </div>
        </div>
      </div>
    );
  }
}
