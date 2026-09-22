import React from 'react';
import { AlertTriangle, Settings, Trash2 } from 'lucide-react';
import { useDashboardStore } from '../../store/useDashboardStore';
import { useTranslation } from '../../i18n/i18n';
import { getLocalizedWidgetTitle } from '../../utils/widgetTitle';
import type { DashboardWidget } from '../../types/widget';

interface BoundaryProps {
  widgetId: string;
  /**
   * The widget's config object, by reference — the store only ever
   * replaces it (never mutates in place) when this widget's own config
   * changes, so a reference change is exactly "the user fixed the
   * settings, or an undo/import replaced them", and nothing else (a
   * sibling widget updating, an unrelated re-render) trips it.
   */
  resetKey: unknown;
  fallback: React.ReactNode;
  children: React.ReactNode;
}

interface BoundaryState {
  hasError: boolean;
}

/**
 * Catches a render crash from a single widget's body — a corrupted
 * config a sanitizer let through, a third-party feed shaped in a way the
 * widget didn't expect — instead of letting it propagate to the root
 * ErrorBoundary, whose only recovery is wiping chrome.storage.local and
 * taking every other page down with it (see #71).
 *
 * A class component because componentDidCatch has no hook equivalent;
 * the translated fallback UI lives in the functional wrapper below so it
 * can use useTranslation / the store.
 */
class WidgetCrashBoundary extends React.Component<BoundaryProps, BoundaryState> {
  state: BoundaryState = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: unknown, info: React.ErrorInfo) {
    console.error(`ZenithTab: widget "${this.props.widgetId}" crashed while rendering:`, error, info.componentStack);
  }

  // A widget that crashed once could well crash again on the same bad
  // config, but a config change (the user opened settings and fixed it,
  // or an undo/import replaced it) deserves a fresh try rather than
  // staying on the fallback forever.
  componentDidUpdate(prevProps: BoundaryProps) {
    if (this.state.hasError && prevProps.resetKey !== this.props.resetKey) {
      this.setState({ hasError: false });
    }
  }

  render() {
    return this.state.hasError ? this.props.fallback : this.props.children;
  }
}

interface WidgetErrorBoundaryProps {
  widget: DashboardWidget;
  children: React.ReactNode;
}

export const WidgetErrorBoundary: React.FC<WidgetErrorBoundaryProps> = ({ widget, children }) => {
  const { t } = useTranslation();
  const openSettingsModal = useDashboardStore((s) => s.openSettingsModal);
  const removeWidget = useDashboardStore((s) => s.removeWidget);
  const title = getLocalizedWidgetTitle(widget, t);

  const fallback = (
    <div className="w-full h-full flex flex-col items-center justify-center text-center gap-2 p-3" data-testid="widget-crash-fallback">
      <AlertTriangle size={20} className="text-amber-400" />
      <p className="text-xs font-semibold text-slate-200">{t.common.widgetError.title.replace('{name}', title)}</p>
      <p className="text-[11px] text-slate-400">{t.common.widgetError.desc}</p>
      <div className="flex items-center gap-2 mt-1">
        <button
          type="button"
          onClick={() => openSettingsModal('editWidget', widget.id)}
          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-sky-500/20 hover:bg-sky-500/30 text-sky-200 text-[11px] font-medium transition-colors"
        >
          <Settings size={11} />
          {t.common.settings}
        </button>
        <button
          type="button"
          onClick={() => removeWidget(widget.id)}
          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-200 text-[11px] font-medium transition-colors"
        >
          <Trash2 size={11} />
          {t.common.delete}
        </button>
      </div>
    </div>
  );

  return (
    <WidgetCrashBoundary widgetId={widget.id} resetKey={widget.config} fallback={fallback}>
      {children}
    </WidgetCrashBoundary>
  );
};
