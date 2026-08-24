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
import { cn } from '../../utils/cn';

const ResponsiveGridLayout = WidthProvider(Responsive);

export const GridContainer: React.FC = () => {
  const {
    widgets,
    layouts,
    isEditMode,
    updateLayouts,
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
      default:
        return (
          <div className="flex items-center justify-center h-full text-slate-400 text-xs">
            Unknown widget
          </div>
        );
    }
  };

  return (
    <div className="w-full flex-1 px-4 sm:px-6 pb-24 max-w-[1920px] mx-auto">
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
          <div key={widget.id} data-grid={widget.layout}>
            <WidgetWrapper widget={widget}>
              {renderWidgetContent(widget)}
            </WidgetWrapper>
          </div>
        ))}
      </ResponsiveGridLayout>
    </div>
  );
};
