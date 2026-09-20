import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, act, waitFor } from '@testing-library/react';
import { setupUser, literal } from '../helpers/user';
import QRCode from 'qrcode';
import { QrCodeWidget } from '../../src/components/widgets/QrCodeWidget/QrCodeWidget';
import { useDashboardStore } from '../../src/store/useDashboardStore';
import { resetDashboardStore } from '../helpers/store';
import { WidgetHarness } from '../helpers/WidgetHarness';

const WIDGET_ID = 'widget-qrcode-test';
const config = () => useDashboardStore.getState().widgets.find((w) => w.id === WIDGET_ID)!.config;

function renderQr(initial: Record<string, any> = {}) {
  useDashboardStore.setState((s) => ({
    widgets: [
      ...s.widgets,
      {
        id: WIDGET_ID,
        type: 'qrcode',
        title: 'QR',
        config: { mode: 'url', value: '', ...initial },
        layout: { i: WIDGET_ID, x: 0, y: 0, w: 3, h: 4 },
      },
    ],
  }));
  return render(
    <WidgetHarness widgetId={WIDGET_ID} render={(w) => <QrCodeWidget widgetId={w.id} config={w.config as any} />} />
  );
}

describe('QrCodeWidget', () => {
  let toCanvas: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    resetDashboardStore();
    toCanvas = vi.fn().mockResolvedValue(undefined);
    vi.spyOn(QRCode, 'toCanvas').mockImplementation(toCanvas as any);
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue({ clearRect: vi.fn() } as any);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it('入力が無ければ案内文を表示し、QRを描かないこと', async () => {
    renderQr();
    expect(screen.getByText('Enter a value above to generate a QR code.')).toBeInTheDocument();
    expect(toCanvas).not.toHaveBeenCalled();
  });

  it('URL モードはスキームを補って QR を生成し、デバウンス後に保存すること', async () => {
    const user = setupUser();
    renderQr();
    const input = screen.getByPlaceholderText('example.com');
    await user.clear(input);
    await user.type(input, literal('zenith.example/path'));

    // Typing re-renders the code per keystroke; the last render carries the full value.
    await waitFor(() => expect(toCanvas.mock.lastCall?.[1]).toBe('https://zenith.example/path'));
    // Not persisted synchronously — the widget debounces the store write.
    expect(config().value).toBe('');

    await waitFor(() => expect(config().value).toBe('zenith.example/path'), { timeout: 1500 });
  });

  it('電話モードは tel: に変換し、数字と + 以外を除去すること', async () => {
    renderQr({ mode: 'phone', value: '+1 (555) 123-4567' });
    await waitFor(() => expect(toCanvas).toHaveBeenCalled());
    expect(toCanvas.mock.calls[0][1]).toBe('tel:+15551234567');
    expect(screen.getByPlaceholderText('+1 555 123 4567')).toHaveAttribute('type', 'tel');
  });

  it('テキストモードはそのまま符号化すること', async () => {
    renderQr({ mode: 'text', value: 'hello world' });
    await waitFor(() => expect(toCanvas.mock.calls[0]?.[1]).toBe('hello world'));
  });

  it('モード切替が設定に保存されること', async () => {
    const user = setupUser();
    renderQr();
    await user.click(screen.getByText('Phone'));
    expect(config().mode).toBe('phone');
    await user.click(screen.getByText('Text'));
    expect(config().mode).toBe('text');
  });

  it('横長のウィジェットでも QR は短辺に合わせた正方形で表示されること', async () => {
    // jsdom has no layout: fake the free area as 300×120 and a ResizeObserver
    // that fires once on observe, the way the real one does.
    vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockReturnValue({
      width: 300, height: 120, top: 0, left: 0, right: 300, bottom: 120, x: 0, y: 0, toJSON: () => ({}),
    } as DOMRect);
    const observe = vi.fn();
    vi.stubGlobal(
      'ResizeObserver',
      class {
        observe = observe;
        disconnect = vi.fn();
        unobserve = vi.fn();
      }
    );
    // The library pins the CSS size to the drawn size; the widget must undo that.
    toCanvas.mockImplementation(async (canvas: HTMLCanvasElement) => {
      canvas.style.width = '220px';
      canvas.style.height = '220px';
    });

    renderQr({ value: 'example.com' });
    await waitFor(() => expect(toCanvas).toHaveBeenCalled());

    const frame = screen.getByTestId('qrcode-frame');
    expect(frame.style.width).toBe('120px');
    expect(frame.style.height).toBe('120px');
    expect(observe).toHaveBeenCalled();
    const canvas = frame.querySelector('canvas')!;
    await waitFor(() => expect(canvas.style.width).toBe(''));
    expect(canvas.style.height).toBe('');
    vi.unstubAllGlobals();
  });

  it('ダウンロードで PNG のリンクをクリックすること', async () => {
    const user = setupUser();
    renderQr({ value: 'example.com' });
    await waitFor(() => screen.getByText('Download'));
    vi.spyOn(HTMLCanvasElement.prototype, 'toDataURL').mockReturnValue('data:image/png;base64,abc');
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});

    await user.click(screen.getByText('Download'));

    expect(click).toHaveBeenCalled();
  });

  it('コピーでクリップボードに書き込み、表示が一時的に変わること', async () => {
    const user = setupUser();
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'setInterval', 'clearInterval', 'Date'] });
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText } });

    renderQr({ value: 'example.com' });
    await user.click(screen.getByText('Copy'));

    await act(async () => {
      await Promise.resolve();
    });
    expect(writeText).toHaveBeenCalledWith('https://example.com');
    expect(screen.getByText('Copied!')).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(1500);
    });
    expect(screen.getByText('Copy')).toBeInTheDocument();
  });

  it('クリップボードが拒否しても例外にならないこと', async () => {
    const user = setupUser();
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText: vi.fn().mockRejectedValue(new Error('denied')) },
    });
    renderQr({ value: 'example.com' });
    await user.click(screen.getByText('Copy'));
    await act(async () => {
      await Promise.resolve();
    });
    expect(screen.getByText('Copy')).toBeInTheDocument();
  });
});
