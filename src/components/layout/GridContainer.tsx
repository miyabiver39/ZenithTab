import React, { useState, useCallback } from 'react';
import { Responsive, WidthProvider, Layout } from 'react-grid-layout';
import { useDashboardStore } from '../../store/useDashboardStore';
import { WidgetWrapper } from '../widgets/WidgetWrapper';
import { getWidgetDefinition } from '../widgets/registry';
import { EmptyPage } from './EmptyPage';
import { DashboardWidget } from '../../types/widget';
import { cn } from '../../utils/cn';

const ResponsiveGridLayout = WidthProvider(Responsive);

export const GridContainer: React.FC = () => {
  const {
    widgets,
    layouts,
    isEditMode,
    updateLayouts,
    appearance,
  } = useDashboardStore();

  const handleLayoutChange = (currentLayout: Layout[], allLayouts: any) => {
    if (isEditMode) {
      updateLayouts(currentLayout, allLayouts);
    }
  };

  // Every widget normally animates to its new position over 200ms (nice for
  // a manual drag/resize) — but a window resize can flip the breakpoint and
  // move every widget on the page at once, and mid-transition they have no
  // collision awareness, so they can visibly pass through/over each other
  // for a moment before settling. Suppressing the transition for one paint
  // right when the breakpoint changes makes widgets snap straight to their
  // correct spot instead.
  const [suppressTransition, setSuppressTransition] = useState(false);
  const handleBreakpointChange = useCallback(() => {
    setSuppressTransition(true);
    requestAnimationFrame(() => {
      requestAnimationFrame(() => setSuppressTransition(false));
    });
  }, []);

  const renderWidgetContent = (widget: DashboardWidget) => {
    const definition = getWidgetDefinition(widget.type);
    if (!definition) {
      return (
        <div className="flex items-center justify-center h-full text-slate-400 text-xs">
          Unknown widget
        </div>
      );
    }
    const Component = definition.Component;
    return <Component widgetId={widget.id} config={widget.config} />;
  };

  return (
    <div
      data-testid="dashboard-grid"
      className={cn(
        'w-full px-4 sm:px-6 max-w-[1920px] mx-auto',
        appearance.dockPosition === 'bottom' && 'pb-24'
      )}
    >
      {widgets.length === 0 && <EmptyPage />}
      <ResponsiveGridLayout
        className={cn('layout', isEditMode && 'is-editing', suppressTransition && 'no-breakpoint-transition')}
        layouts={layouts}
        breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
        cols={{ lg: 12, md: 10, sm: 6, xs: 4, xxs: 2 }}
        rowHeight={90}
        isDraggable={isEditMode}
        isResizable={isEditMode}
        draggableHandle=".grid-drag-handle"
        onLayoutChange={handleLayoutChange}
        onBreakpointChange={handleBreakpointChange}
        margin={[16, 16]}
        containerPadding={[0, 10]}
      >
        {widgets.map((widget) => (
          // No `data-grid` here on purpose: react-grid-layout treats a
          // child's `data-grid` as authoritative and lets it override the
          // per-breakpoint `layouts` prop above, which was collapsing every
          // breakpoint back down to the `lg` coordinates and breaking the
          // grid on resize. `layouts` (kept in sync for every breakpoint by
          // the store) is the single source of truth instead.
          <div key={widget.id}>
            <WidgetWrapper widget={widget}>
              {renderWidgetContent(widget)}
            </WidgetWrapper>
          </div>
        ))}
      </ResponsiveGridLayout>
    </div>
  );
};
