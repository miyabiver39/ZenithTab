import React from 'react';
import { Responsive, WidthProvider, Layout } from 'react-grid-layout';
import { useDashboardStore } from '../../store/useDashboardStore';
import { WidgetWrapper } from '../widgets/WidgetWrapper';
import { ClockWidget } from '../widgets/ClockWidget/ClockWidget';
import { WeatherWidget } from '../widgets/WeatherWidget/WeatherWidget';
import { BookmarkWidget } from '../widgets/BookmarkWidget/BookmarkWidget';
import { RssFeedWidget } from '../widgets/RssFeedWidget/RssFeedWidget';
import { IframeWidget } from '../widgets/IframeWidget/IframeWidget';
import { QuickNotesWidget } from '../widgets/QuickNotesWidget/QuickNotesWidget';
import { SearchWidget } from '../widgets/SearchWidget/SearchWidget';
import { PomodoroWidget } from '../widgets/PomodoroWidget/PomodoroWidget';
import { TodoWidget } from '../widgets/TodoWidget/TodoWidget';
import { ShortcutsWidget } from '../widgets/ShortcutsWidget/ShortcutsWidget';
import { QrCodeWidget } from '../widgets/QrCodeWidget/QrCodeWidget';
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

  const renderWidgetContent = (widget: any) => {
    switch (widget.type) {
      case 'search':
        return <SearchWidget config={widget.config} />;
      case 'shortcuts':
        return <ShortcutsWidget widgetId={widget.id} config={widget.config} />;
      case 'clock':
        return <ClockWidget config={widget.config} />;
      case 'weather':
        return <WeatherWidget widgetId={widget.id} config={widget.config} />;
      case 'bookmarks':
        return <BookmarkWidget config={widget.config} />;
      case 'rss':
        return <RssFeedWidget widgetId={widget.id} config={widget.config} />;
      case 'pomodoro':
        return <PomodoroWidget config={widget.config} />;
      case 'todo':
        return <TodoWidget widgetId={widget.id} config={widget.config} />;
      case 'iframe':
        return <IframeWidget config={widget.config} />;
      case 'notes':
        return <QuickNotesWidget widgetId={widget.id} config={widget.config} />;
      case 'qrcode':
        return <QrCodeWidget widgetId={widget.id} config={widget.config} />;
      default:
        return (
          <div className="flex items-center justify-center h-full text-slate-400 text-xs">
            Unknown widget
          </div>
        );
    }
  };

  return (
    <div
      className={cn(
        'w-full px-4 sm:px-6 max-w-[1920px] mx-auto',
        appearance.dockPosition === 'bottom' && 'pb-24'
      )}
    >
      <ResponsiveGridLayout
        className={cn('layout', isEditMode && 'is-editing')}
        layouts={layouts}
        breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
        cols={{ lg: 12, md: 10, sm: 6, xs: 4, xxs: 2 }}
        rowHeight={90}
        isDraggable={isEditMode}
        isResizable={isEditMode}
        draggableHandle=".grid-drag-handle"
        onLayoutChange={handleLayoutChange}
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
