import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { setupUser, literal } from '../helpers/user';
import { QuickNotesWidget } from '../../src/components/widgets/QuickNotesWidget/QuickNotesWidget';
import { useDashboardStore } from '../../src/store/useDashboardStore';
import { resetDashboardStore } from '../helpers/store';
import { useUndoStore } from '../../src/store/useUndoStore';
import { WidgetHarness } from '../helpers/WidgetHarness';

const WIDGET_ID = 'widget-notes-1';
const config = () => useDashboardStore.getState().widgets.find((w) => w.id === WIDGET_ID)!.config;

function renderNotes() {
  return render(
    <WidgetHarness widgetId={WIDGET_ID} render={(w) => <QuickNotesWidget widgetId={w.id} config={w.config as any} />} />
  );
}

describe('QuickNotesWidget', () => {
  beforeEach(() => {
    resetDashboardStore();
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'setInterval', 'clearInterval', 'Date'] });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('旧形式の content を「Page 1」として表示すること', async () => {
    renderNotes();
    expect(screen.getByText('Page 1')).toBeInTheDocument();
    expect((screen.getByRole('textbox') as HTMLTextAreaElement).value).toContain('Welcome to ZenithTab');
  });

  it('入力は400ms後にデバウンス保存され、pages 形式へ移行すること', async () => {
    const user = setupUser();
    renderNotes();
    const textarea = screen.getByRole('textbox') as HTMLTextAreaElement;

    await user.clear(textarea);

    await user.type(textarea, literal('hello'));
    expect(textarea.value).toBe('hello');
    expect(config().pages).toBeUndefined();

    act(() => {
      vi.advanceTimersByTime(399);
    });
    expect(config().pages).toBeUndefined();

    act(() => {
      vi.advanceTimersByTime(1);
    });
    expect(config().pages).toHaveLength(1);
    expect(config().pages[0].content).toBe('hello');
    expect(config().content).toBeUndefined();
  });

  it('ページを追加・切り替え・閉じることができること', async () => {
    const user = setupUser();
    renderNotes();
    await user.click(screen.getByTitle('Add page'));

    expect(config().pages).toHaveLength(2);
    expect(config().activePageId).toBe(config().pages[1].id);
    expect(screen.getByText('Page 2')).toBeInTheDocument();
    expect((screen.getByRole('textbox') as HTMLTextAreaElement).value).toBe('');

    await user.click(screen.getByText('Page 1'));
    expect(config().activePageId).toBe(config().pages[0].id);
    expect((screen.getByRole('textbox') as HTMLTextAreaElement).value).toContain('Welcome');

    await user.click(screen.getAllByTitle('Close page')[1]);
    expect(config().pages).toHaveLength(1);
    expect(screen.queryByText('Page 2')).not.toBeInTheDocument();
  });

  it('閉じたページを本文ごと元に戻せること', async () => {
    const user = setupUser();
    renderNotes();
    await user.click(screen.getByTitle('Add page'));
    await user.type(screen.getByRole('textbox'), 'draft');
    act(() => vi.advanceTimersByTime(500));
    const secondId = config().pages[1].id;

    await user.click(screen.getAllByTitle('Close page')[1]);
    expect(config().pages).toHaveLength(1);
    expect(useUndoStore.getState().toast?.label).toBe('Closed note page "Page 2"');

    act(() => void useUndoStore.getState().undo());
    expect(config().pages.map((p: any) => p.id)).toContain(secondId);
    expect(config().pages[1].content).toBe('draft');
    expect(config().activePageId).toBe(secondId);
  });

  it('ダブルクリックでページ名を変更でき、空なら元の名前を保つこと', async () => {
    const user = setupUser();
    renderNotes();
    await user.dblClick(screen.getByText('Page 1'));
    const input = screen.getAllByRole('textbox').find((el) => el.tagName === 'INPUT') as HTMLInputElement;
    await user.clear(input);
    await user.type(input, literal('Ideas'));
    await user.keyboard('{Enter}');
    expect(config().pages[0].title).toBe('Ideas');

    await user.dblClick(screen.getByText('Ideas'));
    const again = screen.getAllByRole('textbox').find((el) => el.tagName === 'INPUT') as HTMLInputElement;
    await user.clear(again);
    await user.type(again, literal('   '));
    await user.tab();
    expect(config().pages[0].title).toBe('Ideas');
  });

  it('Escape でリネームをキャンセルすること', async () => {
    const user = setupUser();
    renderNotes();
    await user.dblClick(screen.getByText('Page 1'));
    const input = screen.getAllByRole('textbox').find((el) => el.tagName === 'INPUT') as HTMLInputElement;
    await user.clear(input);
    await user.type(input, literal('Nope'));
    await user.keyboard('{Escape}');
    expect(screen.getByText('Page 1')).toBeInTheDocument();
    expect(config().pages).toBeUndefined();
  });

  it('最大8ページで追加ボタンが消えること', async () => {
    const pages = Array.from({ length: 8 }, (_, i) => ({ id: `p${i}`, title: `P${i}`, content: '' }));
    useDashboardStore.getState().updateWidgetConfig(WIDGET_ID, { pages, activePageId: 'p0', content: undefined });
    renderNotes();
    expect(screen.queryByTitle('Add page')).not.toBeInTheDocument();
  });

  it('フォント設定がクラスに反映されること', async () => {
    useDashboardStore.getState().updateWidgetConfig(WIDGET_ID, { fontSize: 'lg', fontFamily: 'mono' });
    renderNotes();
    const textarea = screen.getByRole('textbox');
    expect(textarea).toHaveClass('text-base');
    expect(textarea).toHaveClass('font-mono');
  });
});
