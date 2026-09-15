import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { TodoWidget } from '../../src/components/widgets/TodoWidget/TodoWidget';
import { useDashboardStore } from '../../src/store/useDashboardStore';
import { resetDashboardStore } from '../helpers/store';
import { WidgetHarness } from '../helpers/WidgetHarness';

const WIDGET_ID = 'widget-todo-1';
const items = () => useDashboardStore.getState().widgets.find((w) => w.id === WIDGET_ID)!.config.items;

function renderTodo() {
  return render(
    <WidgetHarness widgetId={WIDGET_ID} render={(w) => <TodoWidget widgetId={w.id} config={w.config as any} />} />
  );
}

describe('TodoWidget', () => {
  beforeEach(() => {
    resetDashboardStore();
  });

  it('既存タスクを描画し、完了済みは打ち消し線になること', () => {
    renderTodo();
    expect(screen.getByText('Explore ZenithTab settings')).not.toHaveClass('line-through');
    expect(screen.getByText('Customize widgets & wallpapers')).toHaveClass('line-through');
  });

  it('タスクを追加すると先頭に挿入され、入力欄がクリアされること', () => {
    renderTodo();
    const input = screen.getByPlaceholderText('Add a new task...') as HTMLInputElement;
    const submit = screen.getByTitle('Add');

    expect(submit).toBeDisabled();
    fireEvent.change(input, { target: { value: '  Buy milk  ' } });
    expect(submit).toBeEnabled();
    fireEvent.submit(input.closest('form')!);

    expect(items()[0]).toMatchObject({ text: 'Buy milk', completed: false });
    expect(input.value).toBe('');
    expect(screen.getByText('Buy milk')).toBeInTheDocument();
  });

  it('空白のみの入力は追加しないこと', () => {
    renderTodo();
    const before = items().length;
    const input = screen.getByPlaceholderText('Add a new task...');
    fireEvent.change(input, { target: { value: '   ' } });
    fireEvent.submit(input.closest('form')!);
    expect(items()).toHaveLength(before);
  });

  it('クリックで完了状態をトグルできること', () => {
    renderTodo();
    fireEvent.click(screen.getByText('Explore ZenithTab settings'));
    expect(items().find((i: any) => i.id === '1').completed).toBe(true);
    expect(screen.getByText('Explore ZenithTab settings')).toHaveClass('line-through');

    fireEvent.click(screen.getByText('Explore ZenithTab settings'));
    expect(items().find((i: any) => i.id === '1').completed).toBe(false);
  });

  it('削除ボタンでタスクを削除できること', () => {
    renderTodo();
    const row = screen.getByText('Explore ZenithTab settings').closest('.group')!;
    fireEvent.click(row.querySelector('button')!);
    expect(items().some((i: any) => i.id === '1')).toBe(false);
    expect(screen.queryByText('Explore ZenithTab settings')).not.toBeInTheDocument();
  });

  it('フィルターで未完了 / 完了済みを絞り込めること', () => {
    renderTodo();
    fireEvent.click(screen.getByText('Active'));
    expect(screen.getByText('Explore ZenithTab settings')).toBeInTheDocument();
    expect(screen.queryByText('Customize widgets & wallpapers')).not.toBeInTheDocument();

    fireEvent.click(screen.getByText('Completed'));
    expect(screen.queryByText('Explore ZenithTab settings')).not.toBeInTheDocument();
    expect(screen.getByText('Customize widgets & wallpapers')).toBeInTheDocument();

    fireEvent.click(screen.getByText('All'));
    expect(screen.getAllByText(/ZenithTab|wallpapers/)).toHaveLength(2);
  });

  it('完了済みをまとめて削除でき、無くなればボタンも消えること', () => {
    renderTodo();
    fireEvent.click(screen.getByText('Clear completed'));
    expect(items().every((i: any) => !i.completed)).toBe(true);
    expect(screen.queryByText('Clear completed')).not.toBeInTheDocument();
  });

  it('タスクが無い場合は空メッセージを表示すること', () => {
    useDashboardStore.getState().updateWidgetConfig(WIDGET_ID, { items: [] });
    renderTodo();
    expect(screen.getByText('No tasks yet. Enjoy your day!')).toBeInTheDocument();
  });
});
