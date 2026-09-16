import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { ClockWidget } from '../../src/components/widgets/ClockWidget/ClockWidget';
import { resetDashboardStore } from '../helpers/store';
import { useDashboardStore } from '../../src/store/useDashboardStore';

const base = { style: 'digital' as const, showSeconds: true, showDate: true, is24Hour: true, timezone: 'UTC' };

describe('ClockWidget', () => {
  beforeEach(() => {
    resetDashboardStore();
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-09-16T15:04:05Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('24時間表記で時刻と日付を描画すること', async () => {
    render(<ClockWidget config={base} />);
    expect(screen.getByText('15:04:05')).toBeInTheDocument();
    expect(screen.getByText(/Wednesday/)).toBeInTheDocument();
    expect(screen.getByText('UTC')).toBeInTheDocument();
  });

  it('12時間表記に切り替わること', async () => {
    render(<ClockWidget config={{ ...base, is24Hour: false }} />);
    expect(screen.getByText(/^3:04:05\sPM$/)).toBeInTheDocument();
  });

  it('秒と日付を非表示にできること', async () => {
    render(<ClockWidget config={{ ...base, showSeconds: false, showDate: false }} />);
    expect(screen.getByText('15:04')).toBeInTheDocument();
    expect(screen.queryByText(/Wednesday/)).not.toBeInTheDocument();
  });

  it('1秒ごとに時刻が進むこと', async () => {
    render(<ClockWidget config={base} />);
    act(() => {
      vi.advanceTimersByTime(2000);
    });
    expect(screen.getByText('15:04:07')).toBeInTheDocument();
  });

  it('言語設定に応じた日付フォーマットになること', async () => {
    useDashboardStore.setState({ appearance: { ...useDashboardStore.getState().appearance, language: 'ja' } });
    render(<ClockWidget config={base} />);
    expect(screen.getByText(/水曜日/)).toBeInTheDocument();
  });

  it('アナログ時計では針の角度が現在時刻を反映すること', async () => {
    const { container } = render(<ClockWidget config={{ ...base, style: 'analog', timezone: undefined }} />);
    const clock = container.querySelector('[data-widget-type="clock"]');
    expect(clock).toBeInTheDocument();

    const hands = container.querySelectorAll('[style*="rotate"]');
    expect(hands).toHaveLength(3);
    const now = new Date();
    const secDeg = (now.getSeconds() / 60) * 360;
    expect((hands[2] as HTMLElement).style.transform).toBe(`rotate(${secDeg}deg)`);
  });

  it('アナログ時計で秒針を非表示にできること', async () => {
    const { container } = render(<ClockWidget config={{ ...base, style: 'analog', showSeconds: false }} />);
    expect(container.querySelectorAll('[style*="rotate"]')).toHaveLength(2);
  });
});
