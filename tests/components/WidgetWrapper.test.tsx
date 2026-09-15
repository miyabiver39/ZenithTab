import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { WidgetWrapper } from '../../src/components/widgets/WidgetWrapper';
import { useDashboardStore } from '../../src/store/useDashboardStore';
import { resetDashboardStore } from '../helpers/store';
import { DashboardWidget } from '../../src/types/widget';

const widget: DashboardWidget = {
  id: 'widget-clock-1',
  type: 'clock',
  title: 'My Clock',
  config: {},
  layout: { i: 'widget-clock-1', x: 0, y: 0, w: 4, h: 2 },
};

describe('WidgetWrapper', () => {
  beforeEach(() => resetDashboardStore());

  it('通常時はタイトルと子要素のみ描画し、編集コントロールは出さないこと', () => {
    render(
      <WidgetWrapper widget={widget}>
        <span>content</span>
      </WidgetWrapper>
    );
    expect(screen.getByText('My Clock')).toBeInTheDocument();
    expect(screen.getByText('content')).toBeInTheDocument();
    expect(screen.queryByTitle('Widget Settings')).not.toBeInTheDocument();
    expect(screen.queryByTitle('Remove Widget')).not.toBeInTheDocument();
    expect(document.querySelector('.grid-drag-handle')).not.toBeInTheDocument();
  });

  it('編集モードではドラッグハンドル・設定・削除が出て、それぞれ store を呼ぶこと', () => {
    useDashboardStore.getState().setEditMode(true);
    render(
      <WidgetWrapper widget={widget}>
        <span>content</span>
      </WidgetWrapper>
    );
    expect(document.querySelector('.grid-drag-handle')).toBeInTheDocument();

    fireEvent.click(screen.getByTitle('Widget Settings'));
    expect(useDashboardStore.getState().activeSettingsModal).toBe('editWidget');
    expect(useDashboardStore.getState().editingWidgetId).toBe('widget-clock-1');

    fireEvent.click(screen.getByTitle('Remove Widget'));
    expect(useDashboardStore.getState().widgets.some((w) => w.id === 'widget-clock-1')).toBe(false);
  });

  it('検索ウィジェットは通常時ヘッダーを隠し、編集モードでは表示すること', () => {
    const search = { ...widget, id: 'widget-search-1', type: 'search' as const, title: 'Search' };
    const { rerender } = render(
      <WidgetWrapper widget={search}>
        <span>bar</span>
      </WidgetWrapper>
    );
    expect(screen.queryByText('Search')).not.toBeInTheDocument();

    act(() => useDashboardStore.getState().setEditMode(true));
    rerender(
      <WidgetWrapper widget={search}>
        <span>bar</span>
      </WidgetWrapper>
    );
    expect(screen.getByText('Search')).toBeInTheDocument();
  });
});
