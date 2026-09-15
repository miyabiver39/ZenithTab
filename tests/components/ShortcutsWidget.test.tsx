import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { ShortcutsWidget } from '../../src/components/widgets/ShortcutsWidget/ShortcutsWidget';
import { useDashboardStore } from '../../src/store/useDashboardStore';
import { resetDashboardStore } from '../helpers/store';
import { WidgetHarness } from '../helpers/WidgetHarness';

const WIDGET_ID = 'widget-shortcuts-test';
const items = () => useDashboardStore.getState().widgets.find((w) => w.id === WIDGET_ID)!.config.items;

const mockItems = [
  { id: '1', title: 'GitHub', url: 'https://github.com', category: 'Dev' },
  { id: '2', title: 'YouTube', url: 'https://youtube.com', category: 'Media' },
  { id: '3', title: 'Spotify', url: 'https://open.spotify.com', category: 'Media' },
];

function renderShortcuts(initialItems = mockItems) {
  useDashboardStore.setState((s) => ({
    widgets: [
      ...s.widgets,
      {
        id: WIDGET_ID,
        type: 'shortcuts',
        title: 'Shortcuts',
        config: { items: initialItems, columns: 4, openInNewTab: true, viewMode: 'grid' },
        layout: { i: WIDGET_ID, x: 0, y: 0, w: 6, h: 3 },
      },
    ],
  }));
  return render(
    <WidgetHarness widgetId={WIDGET_ID} render={(w) => <ShortcutsWidget widgetId={w.id} config={w.config as any} />} />
  );
}

describe('ShortcutsWidget', () => {
  beforeEach(() => resetDashboardStore());

  it('ショートカットをリンクとして描画し、新しいタブで開く設定になっていること', () => {
    renderShortcuts();
    const link = screen.getByText('GitHub').closest('a')!;
    expect(link).toHaveAttribute('href', 'https://github.com');
    expect(link).toHaveAttribute('target', '_blank');
    expect(screen.getByText('YouTube')).toBeInTheDocument();
  });

  it('カテゴリで絞り込めること', () => {
    renderShortcuts();
    fireEvent.click(screen.getByText('Media'));
    expect(screen.queryByText('GitHub')).not.toBeInTheDocument();
    expect(screen.getByText('YouTube')).toBeInTheDocument();
    fireEvent.click(screen.getByText('All Apps'));
    expect(screen.getByText('GitHub')).toBeInTheDocument();
  });

  it('追加フォームから新しいショートカットを保存し、スキームを補うこと', () => {
    renderShortcuts();
    fireEvent.click(screen.getByTitle('Add Shortcut'));

    fireEvent.change(screen.getByPlaceholderText('e.g. GitHub, Notion, YouTube'), { target: { value: ' Wikipedia ' } });
    fireEvent.change(screen.getByPlaceholderText('https://example.com'), { target: { value: 'wikipedia.org' } });
    fireEvent.click(screen.getByText('Save'));

    expect(items()).toHaveLength(4);
    expect(items()[3]).toMatchObject({ title: 'Wikipedia', url: 'https://wikipedia.org' });
    expect(screen.getByText('Wikipedia')).toBeInTheDocument();
  });

  it('名前かURLが空なら保存しないこと', () => {
    renderShortcuts();
    fireEvent.click(screen.getByTitle('Add Shortcut'));
    fireEvent.change(screen.getByPlaceholderText('e.g. GitHub, Notion, YouTube'), { target: { value: 'NoUrl' } });
    fireEvent.click(screen.getByText('Save'));
    expect(items()).toHaveLength(3);
    fireEvent.click(screen.getByText('Cancel'));
  });

  it('編集モードで項目を編集・削除できること', () => {
    renderShortcuts();
    act(() => useDashboardStore.getState().setEditMode(true));

    const editButtons = screen.getAllByTitle('Edit');
    fireEvent.click(editButtons[0]);
    expect(screen.getByText('Edit Shortcut')).toBeInTheDocument();
    fireEvent.change(screen.getByPlaceholderText('e.g. GitHub, Notion, YouTube'), { target: { value: 'GH' } });
    fireEvent.change(screen.getByPlaceholderText('e.g. Productivity, Media, Tools'), { target: { value: '' } });
    fireEvent.click(screen.getByText('Save'));
    expect(items()[0]).toMatchObject({ title: 'GH', category: undefined });

    fireEvent.click(screen.getAllByTitle('Delete')[0]);
    expect(items().some((i: any) => i.id === '1')).toBe(false);
  });

  it('項目が無い場合は空状態と追加導線を出すこと', () => {
    renderShortcuts([]);
    expect(screen.getByText(/No shortcuts found/)).toBeInTheDocument();
    fireEvent.click(screen.getByText('Add Shortcut'));
    expect(screen.getByPlaceholderText('https://example.com')).toBeInTheDocument();
  });
});
