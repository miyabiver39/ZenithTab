import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, act, fireEvent, within } from '@testing-library/react';
import { setupUser, literal } from '../helpers/user';
import { ShortcutsWidget } from '../../src/components/widgets/ShortcutsWidget/ShortcutsWidget';
import { useDashboardStore } from '../../src/store/useDashboardStore';
import { resetDashboardStore } from '../helpers/store';
import { useUndoStore } from '../../src/store/useUndoStore';
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

  it('ショートカットをリンクとして描画し、新しいタブで開く設定になっていること', async () => {
    renderShortcuts();
    const link = screen.getByText('GitHub').closest('a')!;
    expect(link).toHaveAttribute('href', 'https://github.com');
    expect(link).toHaveAttribute('target', '_blank');
    expect(screen.getByText('YouTube')).toBeInTheDocument();
  });

  it('カテゴリで絞り込めること', async () => {
    const user = setupUser();
    renderShortcuts();
    await user.click(screen.getByText('Media'));
    expect(screen.queryByText('GitHub')).not.toBeInTheDocument();
    expect(screen.getByText('YouTube')).toBeInTheDocument();
    await user.click(screen.getByText('All Apps'));
    expect(screen.getByText('GitHub')).toBeInTheDocument();
  });

  it('リンクをドロップするとタイルが増え、URL 以外のドロップは無視すること', () => {
    renderShortcuts();
    const widget = screen.getByTestId('shortcuts-widget');
    // HTML5 drag-and-drop has no user-event equivalent; fire the events with a hand-built DataTransfer.
    const dataTransfer = (data: Record<string, string>) => ({ types: Object.keys(data), getData: (k: string) => data[k] || '', dropEffect: 'none' });
    fireEvent.dragOver(widget, { dataTransfer: dataTransfer({ 'text/uri-list': '' }) });
    fireEvent.drop(widget, {
      dataTransfer: dataTransfer({ 'text/uri-list': 'https://developer.mozilla.org/', 'text/html': '<a href="https://developer.mozilla.org/">MDN</a>' }),
    });
    expect(items()).toHaveLength(4);
    expect(items()[3]).toMatchObject({ title: 'MDN', url: 'https://developer.mozilla.org/' });

    fireEvent.drop(widget, { dataTransfer: dataTransfer({ 'text/plain': 'just some text' }) });
    expect(items()).toHaveLength(4);
  });

  it('空のときは「カタログから選ぶ」でピッカーが開き、選んだサイトが追加されること', async () => {
    const user = setupUser();
    renderShortcuts([]);
    await user.click(screen.getByRole('button', { name: 'Choose from catalog' }));
    const list = screen.getByRole('list', { name: 'Add sites' });
    await user.click(within(list).getByRole('button', { name: /Reddit/ }));
    await user.click(screen.getByRole('button', { name: 'Add 1' }));
    expect(items()).toEqual([expect.objectContaining({ title: 'Reddit', url: 'https://reddit.com', category: 'Social' })]);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('追加フォームから新しいショートカットを保存し、スキームを補うこと', async () => {
    const user = setupUser();
    renderShortcuts();
    await user.click(screen.getByTitle('Add Shortcut'));

    await user.clear(screen.getByPlaceholderText('e.g. GitHub, Notion, YouTube'));

    await user.type(screen.getByPlaceholderText('e.g. GitHub, Notion, YouTube'), literal(' Wikipedia '));
    await user.clear(screen.getByPlaceholderText('https://example.com'));
    await user.type(screen.getByPlaceholderText('https://example.com'), literal('wikipedia.org'));
    await user.click(screen.getByText('Save'));

    expect(items()).toHaveLength(4);
    expect(items()[3]).toMatchObject({ title: 'Wikipedia', url: 'https://wikipedia.org' });
    expect(screen.getByText('Wikipedia')).toBeInTheDocument();
  });

  it('名前かURLが空なら保存しないこと', async () => {
    const user = setupUser();
    renderShortcuts();
    await user.click(screen.getByTitle('Add Shortcut'));
    await user.clear(screen.getByPlaceholderText('e.g. GitHub, Notion, YouTube'));
    await user.type(screen.getByPlaceholderText('e.g. GitHub, Notion, YouTube'), literal('NoUrl'));
    await user.click(screen.getByText('Save'));
    expect(items()).toHaveLength(3);
    await user.click(screen.getByText('Cancel'));
  });

  it('編集モードで項目を編集・削除できること', async () => {
    const user = setupUser();
    renderShortcuts();
    act(() => useDashboardStore.getState().setEditMode(true));

    const editButtons = screen.getAllByTitle('Edit');
    await user.click(editButtons[0]);
    expect(screen.getByText('Edit Shortcut')).toBeInTheDocument();
    await user.clear(screen.getByPlaceholderText('e.g. GitHub, Notion, YouTube'));
    await user.type(screen.getByPlaceholderText('e.g. GitHub, Notion, YouTube'), literal('GH'));
    await user.clear(screen.getByPlaceholderText('e.g. Productivity, Media, Tools'));
    await user.click(screen.getByText('Save'));
    expect(items()[0]).toMatchObject({ title: 'GH', category: undefined });

    await user.click(screen.getAllByTitle('Delete')[0]);
    expect(items().some((i: any) => i.id === '1')).toBe(false);
  });

  it('削除したショートカットを元に戻せること', async () => {
    const user = setupUser();
    renderShortcuts();
    act(() => useDashboardStore.getState().setEditMode(true));
    const first = items()[0];
    await user.click(screen.getAllByTitle('Delete')[0]);
    expect(items().some((i: any) => i.id === first.id)).toBe(false);
    expect(useUndoStore.getState().toast?.label).toBe(`Removed shortcut "${first.title}"`);

    act(() => void useUndoStore.getState().undo());
    expect(items()[0]).toEqual(first);
  });

  it('設定した列数がグリッドのインラインスタイルに反映されること', async () => {
    for (const [columns, expected] of [[2, 2], [6, 6], [undefined, 4], [1, 2], [20, 8]] as const) {
      useDashboardStore.setState((s) => ({
        widgets: [
          ...s.widgets.filter((w) => w.id !== WIDGET_ID),
          {
            id: WIDGET_ID,
            type: 'shortcuts',
            title: 'Shortcuts',
            config: { items: mockItems, columns, openInNewTab: true, viewMode: 'grid' },
            layout: { i: WIDGET_ID, x: 0, y: 0, w: 6, h: 3 },
          },
        ],
      }));
      const { unmount } = render(
        <WidgetHarness widgetId={WIDGET_ID} render={(w) => <ShortcutsWidget widgetId={w.id} config={w.config as any} />} />
      );
      expect(screen.getByTestId('shortcuts-grid').style.gridTemplateColumns).toBe(`repeat(${expected}, minmax(0, 1fr))`);
      unmount();
    }
  });

  it('項目が無い場合は空状態と追加導線を出すこと', async () => {
    const user = setupUser();
    renderShortcuts([]);
    expect(screen.getByText(/No shortcuts found/)).toBeInTheDocument();
    await user.click(screen.getByText('Add Shortcut'));
    expect(screen.getByPlaceholderText('https://example.com')).toBeInTheDocument();
  });
});
