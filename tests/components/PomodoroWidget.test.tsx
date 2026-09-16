import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { setupUser } from '../helpers/user';
import { PomodoroWidget } from '../../src/components/widgets/PomodoroWidget/PomodoroWidget';
import { resetDashboardStore } from '../helpers/store';

const config = { focusDurationMinutes: 1, shortBreakDurationMinutes: 2, longBreakDurationMinutes: 3, autoStartBreaks: false };

// Advance one second at a time so React can flip `timeLeft` through 0
// exactly as it does in the browser (a single big jump would batch every
// interval callback before the completion effect gets to run).
const tick = (seconds: number) => {
  for (let i = 0; i < seconds; i++) {
    act(() => {
      vi.advanceTimersByTime(1000);
    });
  }
};

describe('PomodoroWidget', () => {
  beforeEach(() => {
    resetDashboardStore();
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'setInterval', 'clearInterval', 'Date'] });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('設定した集中時間で開始し、スタートでカウントダウンすること', async () => {
    const user = setupUser();
    render(<PomodoroWidget config={config} />);
    expect(screen.getByText('01:00')).toBeInTheDocument();

    await user.click(screen.getByText('Start'));
    expect(screen.getByText('Pause')).toBeInTheDocument();
    tick(5);
    expect(screen.getByText('00:55')).toBeInTheDocument();
  });

  it('一時停止で止まり、再開で続きから進むこと', async () => {
    const user = setupUser();
    render(<PomodoroWidget config={config} />);
    await user.click(screen.getByText('Start'));
    tick(3);
    await user.click(screen.getByText('Pause'));
    tick(10);
    expect(screen.getByText('00:57')).toBeInTheDocument();
    await user.click(screen.getByText('Start'));
    tick(2);
    expect(screen.getByText('00:55')).toBeInTheDocument();
  });

  it('リセットで停止し残り時間が戻ること', async () => {
    const user = setupUser();
    render(<PomodoroWidget config={config} />);
    await user.click(screen.getByText('Start'));
    tick(10);
    await user.click(screen.getByTitle('Reset'));
    expect(screen.getByText('01:00')).toBeInTheDocument();
    expect(screen.getByText('Start')).toBeInTheDocument();
  });

  it('モード切替で該当時間になり、タイマーが止まること', async () => {
    const user = setupUser();
    render(<PomodoroWidget config={config} />);
    await user.click(screen.getByText('Start'));
    await user.click(screen.getByText('Short Break'));
    expect(screen.getByText('02:00')).toBeInTheDocument();
    expect(screen.getByText('Start')).toBeInTheDocument();
    await user.click(screen.getByText('Long Break'));
    expect(screen.getByText('03:00')).toBeInTheDocument();
  });

  it('集中セッション完了で小休憩に移り、セッション数が増えること', async () => {
    const user = setupUser();
    render(<PomodoroWidget config={config} />);
    await user.click(screen.getByText('Start'));
    tick(61);
    expect(screen.getByText('02:00')).toBeInTheDocument();
    expect(screen.getByText('Start')).toBeInTheDocument();
    expect(screen.getByText('1')).toBeInTheDocument();
  });

  it('4回目の集中完了後は長休憩になり、休憩完了で集中に戻ること', async () => {
    const user = setupUser();
    render(<PomodoroWidget config={config} />);
    for (let i = 0; i < 3; i++) {
      await user.click(screen.getByText('Focus'));
      await user.click(screen.getByText('Start'));
      tick(61);
    }
    await user.click(screen.getByText('Focus'));
    await user.click(screen.getByText('Start'));
    tick(61);
    expect(screen.getByText('03:00')).toBeInTheDocument();
    expect(screen.getByText('4')).toBeInTheDocument();

    await user.click(screen.getByText('Start'));
    tick(181);
    expect(screen.getByText('01:00')).toBeInTheDocument();
  });

  it('進捗バーの幅が経過に応じて伸びること', async () => {
    const user = setupUser();
    render(<PomodoroWidget config={config} />);
    await user.click(screen.getByText('Start'));
    tick(30);
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '50');
  });
});
