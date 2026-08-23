import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { ClockWidget } from '../../src/components/widgets/ClockWidget/ClockWidget';

describe('ClockWidget', () => {
  it('デジタル時計と日付を描画できること', () => {
    const { container } = render(
      <ClockWidget
        config={{
          style: 'digital',
          showSeconds: true,
          showDate: true,
          is24Hour: true,
        }}
      />
    );

    const clockElement = container.querySelector('[data-widget-type="clock"]');
    expect(clockElement).toBeInTheDocument();
  });

  it('アナログ時計スタイルを描画できること', () => {
    const { container } = render(
      <ClockWidget
        config={{
          style: 'analog',
          showSeconds: true,
          showDate: false,
          is24Hour: true,
        }}
      />
    );

    const clockElement = container.querySelector('[data-widget-type="clock"]');
    expect(clockElement).toBeInTheDocument();
  });
});
