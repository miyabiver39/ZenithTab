import React from 'react';

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
}

/**
 * Last line of defense against a render crash from corrupted persisted
 * data (a malformed widget config, a broken layout, etc.). Without this,
 * a crash here has no way out short of manually reinstalling the
 * extension to wipe chrome.storage.local — this shows a recovery screen
 * instead. Deliberately self-contained (no i18n, no store, no other app
 * code) so it still renders even if the crash's root cause is something
 * those systems depend on.
 */
export class ErrorBoundary extends React.Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: unknown, info: React.ErrorInfo) {
    console.error('ZenithTab crashed while rendering:', error, info.componentStack);
  }

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

    return (
      <div className="fixed inset-0 bg-slate-950 flex items-center justify-center text-center p-6">
        <div className="max-w-sm space-y-4">
          <p className="text-white text-sm font-semibold">
            ZenithTab に問題が発生しました / Something went wrong
          </p>
          <p className="text-slate-400 text-xs leading-relaxed">
            保存データの読み込み中に問題が発生しました。リセットすると復旧します(ウィジェットや設定は初期状態に戻ります)。
            <br />
            <br />
            A problem occurred loading saved data. Resetting will recover the dashboard (widgets and settings return to their defaults).
          </p>
          <button
            onClick={this.handleReset}
            className="px-4 py-2 rounded-xl bg-sky-500 hover:bg-sky-400 text-white text-xs font-medium transition-colors"
          >
            初期状態にリセット / Reset to defaults
          </button>
        </div>
      </div>
    );
  }
}
