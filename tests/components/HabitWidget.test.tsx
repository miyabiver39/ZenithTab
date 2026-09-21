import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, within, act } from '@testing-library/react';
import { setupUser, literal } from '../helpers/user';
import { HabitWidget } from '../../src/components/widgets/HabitWidget/HabitWidget';
import { WidgetConfigModal } from '../../src/components/layout/WidgetConfigModal';
import { useDashboardStore } from '../../src/store/useDashboardStore';
import { useUndoStore } from '../../src/store/useUndoStore';
import { resetDashboardStore } from '../helpers/store';
import { WidgetHarness } from '../helpers/WidgetHarness';
import { WIDGET_DEFINITIONS } from '../../src/components/widgets/widgetDefinitions';
import { LOCALES } from '../../src/i18n/resolve';

const WIDGET_ID = 'widget-habits-test';
const config = () => useDashboardStore.getState().widgets.find((w) => w.id === WIDGET_ID)!.config;

function renderHabits(habits: Record<string, any>[], extra: Record<string, any> = {}) {
  useDashboardStore.setState((s) => ({
    widgets: [
      ...s.widgets,
      { id: WIDGET_ID, type: 'habits', title: 'H', config: { habits, showWeek: true, ...extra }, layout: { i: WIDGET_ID, x: 0, y: 0, w: 4, h: 3 } },
    ],
  }));
  return render(<WidgetHarness widgetId={WIDGET_ID} render={(w) => <HabitWidget widgetId={w.id} config={w.config as any} />} />);
}

describe('HabitWidget', () => {
  beforeEach(() => {
    resetDashboardStore();
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date(2026, 8, 20, 9, 0));
  });
  afterEach(() => vi.useRealTimers());

  it('既定設定は 3 つの習慣を空の履歴で持つこと', () => {
    const cfg = WIDGET_DEFINITIONS.habits.createDefaultConfig(LOCALES.ja, 'ja');
    expect(cfg.habits.map((h: any) => h.name)).toEqual(['水を飲む', '運動する', '10 分読書']);
    expect(cfg.habits.every((h: any) => h.history.length === 0)).toBe(true);
  });

  it('今日をチェックすると履歴とストリーク・達成率が更新され、もう一度で取り消せること', async () => {
    const user = setupUser();
    renderHabits([{ id: 'h1', name: 'Water', emoji: '💧', history: ['2026-09-18', '2026-09-19'], createdAt: 1 }]);
    expect(screen.getByText('Today: 0 / 1')).toBeInTheDocument();
    expect(screen.getByTitle('2-day streak')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Done today: Water' }));
    expect(config().habits[0].history).toContain('2026-09-20');
    expect(screen.getByText('Today: 1 / 1')).toBeInTheDocument();
    expect(screen.getByTitle('3-day streak')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Undo today: Water' }));
    expect(config().habits[0].history).not.toContain('2026-09-20');
  });

  it('習慣を追加でき、削除は Undo で戻せること', async () => {
    const user = setupUser();
    renderHabits([]);
    expect(screen.getByText('No habits yet. Add one below.')).toBeInTheDocument();
    await user.type(screen.getByLabelText('Emoji'), '📖');
    await user.type(screen.getByLabelText('Habit'), literal('Read'));
    await user.click(screen.getByTitle('Add habit'));
    expect(config().habits).toHaveLength(1);
    expect(config().habits[0]).toMatchObject({ name: 'Read', emoji: '📖', history: [] });

    await user.click(screen.getByTitle('Delete'));
    expect(config().habits).toHaveLength(0);
    act(() => useUndoStore.getState().undo());
    expect(config().habits).toHaveLength(1);
  });

  it('直近 7 日のドットは設定で隠せること', async () => {
    const user = setupUser();
    renderHabits([{ id: 'h1', name: 'Water', history: [], createdAt: 1 }]);
    expect(within(screen.getByTestId('habit-list')).getAllByTestId('habit-week')).toHaveLength(1);

    act(() => useDashboardStore.getState().openSettingsModal('editWidget', WIDGET_ID));
    render(<WidgetConfigModal />);
    await user.click(screen.getByRole('checkbox', { name: 'Show the last 7 days' }));
    await user.click(screen.getByText('Save Changes'));
    expect(config().showWeek).toBe(false);
    expect(screen.queryByTestId('habit-week')).not.toBeInTheDocument();
  });
});
