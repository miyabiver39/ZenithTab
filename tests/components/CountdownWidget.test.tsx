import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import { setupUser, literal } from '../helpers/user';
import { CountdownWidget } from '../../src/components/widgets/CountdownWidget/CountdownWidget';
import { useDashboardStore } from '../../src/store/useDashboardStore';
import { useUndoStore } from '../../src/store/useUndoStore';
import { resetDashboardStore } from '../helpers/store';
import { WidgetHarness } from '../helpers/WidgetHarness';
import { WIDGET_DEFINITIONS } from '../../src/components/widgets/widgetDefinitions';
import { LOCALES } from '../../src/i18n/resolve';

const WIDGET_ID = 'widget-countdown-test';
const config = () => useDashboardStore.getState().widgets.find((w) => w.id === WIDGET_ID)!.config;

function renderCountdown(events: Record<string, any>[]) {
  useDashboardStore.setState((s) => ({
    widgets: [
      ...s.widgets,
      { id: WIDGET_ID, type: 'countdown', title: 'CD', config: { events }, layout: { i: WIDGET_ID, x: 0, y: 0, w: 3, h: 3 } },
    ],
  }));
  return render(<WidgetHarness widgetId={WIDGET_ID} render={(w) => <CountdownWidget widgetId={w.id} config={w.config as any} />} />);
}

describe('CountdownWidget', () => {
  beforeEach(() => {
    resetDashboardStore();
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date(2026, 8, 20, 12, 0));
  });
  afterEach(() => vi.useRealTimers());

  it('既定設定は翌年の元日を毎年繰り返しで持つこと', () => {
    const cfg = WIDGET_DEFINITIONS.countdown.createDefaultConfig(LOCALES.ja, 'ja');
    expect(cfg.events).toHaveLength(1);
    expect(cfg.events[0]).toMatchObject({ name: '元日', date: '2027-01-01', repeatYearly: true });
  });

  it('1 件だけなら大きく残り日数を表示すること', () => {
    renderCountdown([{ id: 'e1', name: 'Trip', date: '2026-09-30' }]);
    const hero = within(screen.getByTestId('countdown-hero'));
    expect(hero.getByText('10')).toBeInTheDocument();
    expect(hero.getByText('10 days left')).toBeInTheDocument();
    expect(hero.getByText('Trip')).toBeInTheDocument();
  });

  it('複数件は近い順に並び、今日・明日・過去の表現が変わること', () => {
    renderCountdown([
      { id: 'past', name: 'Past', date: '2026-09-10' },
      { id: 'later', name: 'Later', date: '2026-10-20' },
      { id: 'today', name: 'Today thing', date: '2026-09-20' },
      { id: 'tmrw', name: 'Tomorrow thing', date: '2026-09-21' },
    ]);
    const rows = within(screen.getByTestId('countdown-list')).getAllByRole('listitem');
    expect(rows.map((r) => r.textContent)).toEqual([
      expect.stringContaining('Today thing'),
      expect.stringContaining('Tomorrow thing'),
      expect.stringContaining('Later'),
      expect.stringContaining('Past'),
    ]);
    expect(rows[0]).toHaveTextContent('Today!');
    expect(rows[1]).toHaveTextContent('Tomorrow');
    expect(rows[2]).toHaveTextContent('30 days left');
    expect(rows[3]).toHaveTextContent('10 days ago');
  });

  it('フォームから追加でき、毎年繰り返しを保存すること', async () => {
    const user = setupUser();
    renderCountdown([]);
    expect(screen.getByText('No dates yet. Add one below.')).toBeInTheDocument();
    await user.click(screen.getByText('Add date'));
    await user.type(screen.getByLabelText('Name'), literal('Birthday'));
    await user.type(screen.getByLabelText('Emoji'), '🎂');
    await user.type(screen.getByLabelText('Date'), '1990-03-05');
    await user.click(screen.getByLabelText('Repeats every year'));
    await user.click(screen.getByRole('button', { name: 'Add date' }));

    expect(config().events).toHaveLength(1);
    expect(config().events[0]).toMatchObject({ name: 'Birthday', date: '1990-03-05', emoji: '🎂', repeatYearly: true });
    // Next occurrence is 2027-03-05 → 166 days from 2026-09-20.
    expect(screen.getByText('166')).toBeInTheDocument();
  });

  it('削除は Undo で戻せること', async () => {
    const user = setupUser();
    renderCountdown([
      { id: 'e1', name: 'One', date: '2026-10-01' },
      { id: 'e2', name: 'Two', date: '2026-11-01' },
    ]);
    await user.click(screen.getAllByTitle('Delete')[0]);
    expect(config().events.map((e: any) => e.id)).toEqual(['e2']);
    useUndoStore.getState().undo();
    expect(config().events.map((e: any) => e.id)).toEqual(['e1', 'e2']);
  });
});
