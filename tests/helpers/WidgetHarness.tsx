import React from 'react';
import { useDashboardStore } from '../../src/store/useDashboardStore';
import { DashboardWidget } from '../../src/types/widget';

interface WidgetHarnessProps {
  widgetId: string;
  render: (widget: DashboardWidget) => React.ReactElement;
}

/**
 * Renders a widget from the live store so that `updateWidgetConfig` calls
 * made by the widget flow back into its `config` prop — the same loop
 * GridContainer provides in the app.
 */
export const WidgetHarness: React.FC<WidgetHarnessProps> = ({ widgetId, render }) => {
  const widget = useDashboardStore((s) => s.widgets.find((w) => w.id === widgetId));
  if (!widget) return <div data-testid="widget-missing" />;
  return render(widget);
};
