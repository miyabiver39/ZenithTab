import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { QuickNotesWidget } from '../../src/components/widgets/QuickNotesWidget/QuickNotesWidget';
import { useDashboardStore } from '../../src/store/useDashboardStore';
import { resetDashboardStore } from '../helpers/store';
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
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('旧形式の content を「Page 1」として表示すること', () => {
    renderNotes();
    expect(screen.getByText('Page 1')).toBeInTheDocument();
    expect((screen.getByRole('textbox') as HTMLTextAreaElement).value).toContain('Welcome to ZenithTab');
  });

  it('入力は400ms後にデバウンス保存され、pages 形式へ移行すること', () => {
    renderNotes();
    const textarea = screen.getByRole('textbox') as HTMLTextAreaElement;

    fireEvent.change(textarea, { target: { value: 'hello' } });
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

  it('ページを追加・切り替え・閉じることができること', () => {
    renderNotes();
    fireEvent.click(screen.getByTitle('Add page'));

    expect(config().pages).toHaveLength(2);
    expect(config().activePageId).toBe(config().pages[1].id);
    expect(screen.getByText('Page 2')).toBeInTheDocument();
    expect((screen.getByRole('textbox') as HTMLTextAreaElement).value).toBe('');

    fireEvent.click(screen.getByText('Page 1'));
    expect(config().activePageId).toBe(config().pages[0].id);
    expect((screen.getByRole('textbox') as HTMLTextAreaElement).value).toContain('Welcome');

    const page2Tab = screen.getByText('Page 2').closest('.group')!;
    fireEvent.click(page2Tab.querySelector('button')!);
    expect(config().pages).toHaveLength(1);
    expect(screen.queryByText('Page 2')).not.toBeInTheDocument();
  });

  it('ダブルクリックでページ名を変更でき、空なら元の名前を保つこと', () => {
    renderNotes();
    fireEvent.doubleClick(screen.getByText('Page 1'));
    const input = screen.getAllByRole('textbox').find((el) => el.tagName === 'INPUT') as HTMLInputElement;
    fireEvent.change(input, { target: { value: 'Ideas' } });
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(config().pages[0].title).toBe('Ideas');

    fireEvent.doubleClick(screen.getByText('Ideas'));
    const again = screen.getAllByRole('textbox').find((el) => el.tagName === 'INPUT') as HTMLInputElement;
    fireEvent.change(again, { target: { value: '   ' } });
    fireEvent.blur(again);
    expect(config().pages[0].title).toBe('Ideas');
  });

  it('Escape でリネームをキャンセルすること', () => {
    renderNotes();
    fireEvent.doubleClick(screen.getByText('Page 1'));
    const input = screen.getAllByRole('textbox').find((el) => el.tagName === 'INPUT') as HTMLInputElement;
    fireEvent.change(input, { target: { value: 'Nope' } });
    fireEvent.keyDown(input, { key: 'Escape' });
    expect(screen.getByText('Page 1')).toBeInTheDocument();
    expect(config().pages).toBeUndefined();
  });

  it('最大8ページで追加ボタンが消えること', () => {
    const pages = Array.from({ length: 8 }, (_, i) => ({ id: `p${i}`, title: `P${i}`, content: '' }));
    useDashboardStore.getState().updateWidgetConfig(WIDGET_ID, { pages, activePageId: 'p0', content: undefined });
    renderNotes();
    expect(screen.queryByTitle('Add page')).not.toBeInTheDocument();
  });

  it('フォント設定がクラスに反映されること', () => {
    useDashboardStore.getState().updateWidgetConfig(WIDGET_ID, { fontSize: 'lg', fontFamily: 'mono' });
    renderNotes();
    const textarea = screen.getByRole('textbox');
    expect(textarea).toHaveClass('text-base');
    expect(textarea).toHaveClass('font-mono');
  });
});
