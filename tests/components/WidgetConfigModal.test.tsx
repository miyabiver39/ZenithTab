import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act, waitFor } from '@testing-library/react';
import { WidgetConfigModal } from '../../src/components/layout/WidgetConfigModal';
import { useDashboardStore } from '../../src/store/useDashboardStore';
import { weatherService, GeolocationFailure } from '../../src/services/weatherService';
import { resetDashboardStore } from '../helpers/store';
import { chromeMock } from '../helpers/chrome';

const state = () => useDashboardStore.getState();
const widget = (id: string) => state().widgets.find((w) => w.id === id)!;

let mounted: ReturnType<typeof render> | null = null;

// One modal at a time: unmount the previous render before opening another
// so queries never see two copies of the same control.
function openFor(id: string) {
  mounted?.unmount();
  act(() => state().openSettingsModal('editWidget', id));
  mounted = render(<WidgetConfigModal />);
  return mounted;
}

const save = () => fireEvent.click(screen.getByText('Save Changes'));

describe('WidgetConfigModal', () => {
  beforeEach(() => resetDashboardStore());
  afterEach(() => {
    mounted = null;
    vi.restoreAllMocks();
  });

  it('対象ウィジェットが無い / モーダルが閉じている間は描画しないこと', () => {
    const { container } = render(<WidgetConfigModal />);
    expect(container.firstChild).toBeNull();
    act(() => state().openSettingsModal('editWidget', 'ghost'));
    expect(container.firstChild).toBeNull();
  });

  it('タイトルを変更して保存すると反映され、キャンセルで閉じること', () => {
    openFor('widget-clock-1');
    expect(screen.getByText('Configure Clock')).toBeInTheDocument();
    fireEvent.change(screen.getByPlaceholderText('Custom Widget Name'), { target: { value: 'Wall Clock' } });
    save();
    expect(widget('widget-clock-1').title).toBe('Wall Clock');
    expect(state().activeSettingsModal).toBeNull();

    openFor('widget-clock-1');
    fireEvent.click(screen.getByText('Cancel'));
    expect(state().activeSettingsModal).toBeNull();
  });

  it('時計: チェックボックスとタイムゾーンを保存できること', () => {
    const { container } = openFor('widget-clock-1');
    const boxes = container.querySelectorAll('input[type="checkbox"]');
    fireEvent.click(boxes[0]);
    fireEvent.change(screen.getByPlaceholderText(/Asia\/Tokyo/), { target: { value: 'UTC' } });
    save();
    expect(widget('widget-clock-1').config.timezone).toBe('UTC');
    expect(widget('widget-clock-1').config.is24Hour).toBe(false);
  });

  it('天気: 都市・座標・現在地検出を扱えること', async () => {
    vi.spyOn(weatherService, 'detectUserLocation').mockResolvedValue({ latitude: 1.5, longitude: 2.5, city: 'Here' });
    openFor('widget-weather-1');
    fireEvent.change(screen.getByPlaceholderText(/Tokyo, Shinjuku/), { target: { value: 'Osaka' } });
    fireEvent.change(screen.getByPlaceholderText('35.6762'), { target: { value: '34.7' } });
    fireEvent.change(screen.getByPlaceholderText('139.6503'), { target: { value: '135.5' } });

    fireEvent.click(screen.getByText('Detect Current Location'));
    await waitFor(() => expect(screen.getByPlaceholderText(/Tokyo, Shinjuku/)).toHaveValue('Here'));
    save();
    expect(widget('widget-weather-1').config).toMatchObject({ city: 'Here', latitude: 1.5, longitude: 2.5 });
  });

  it('天気: 位置情報が拒否されたらエラーを表示すること', async () => {
    vi.spyOn(weatherService, 'detectUserLocation').mockRejectedValue(new GeolocationFailure('denied', 'x'));
    openFor('widget-weather-1');
    fireEvent.click(screen.getByText('Detect Current Location'));
    await waitFor(() => expect(screen.getByText(/Location access was denied/)).toBeInTheDocument());

    vi.spyOn(weatherService, 'detectUserLocation').mockRejectedValue(new Error('other'));
    fireEvent.click(screen.getByText('Detect Current Location'));
    await waitFor(() => expect(screen.getByText(/Could not determine/)).toBeInTheDocument());
  });

  it('検索: 組み込みエンジンの削除・復元、カスタム追加・削除、最後の1件は削除不可', () => {
    openFor('widget-search-1');
    const removeButtons = () => screen.getAllByRole('button').filter((b) => b.querySelector('.lucide-trash-2'));

    // Remove Google (the default) → default falls back to the next built-in.
    fireEvent.click(removeButtons()[0]);
    expect(screen.getByText('Removed (click to bring back):')).toBeInTheDocument();
    const chips = screen.getByText('Removed (click to bring back):').parentElement!;
    fireEvent.click(chips.querySelector('button')!);
    expect(screen.queryByText('Removed (click to bring back):')).not.toBeInTheDocument();

    // Remove everything but one → the last remove button is disabled.
    for (let i = 0; i < 5; i++) fireEvent.click(removeButtons()[0]);
    expect(removeButtons()[0]).toBeDisabled();
    expect(removeButtons()[0]).toHaveAttribute('title', 'At least one search engine is required');

    // Add a custom engine by pasting a results URL (auto-templated on blur).
    fireEvent.change(screen.getByPlaceholderText('Name'), { target: { value: 'Wiki' } });
    const urlInput = screen.getByPlaceholderText('https://example.com/search?q={query}');
    fireEvent.change(urlInput, { target: { value: 'https://wiki.example/w/index.php?search=hello' } });
    expect(screen.getByText(/Add Engine is disabled/)).toBeInTheDocument();
    fireEvent.blur(urlInput);
    expect((urlInput as HTMLInputElement).value).toContain('{query}');
    fireEvent.click(screen.getByText('Add Engine'));
    // Listed once in the engine list and once as a default-engine option.
    expect(screen.getAllByText('Wiki').length).toBeGreaterThanOrEqual(1);

    // A preset chip adds too.
    fireEvent.click(screen.getByText('Ecosia'));

    // Now the built-in can go; then remove the custom ones back down to one.
    fireEvent.click(removeButtons()[0]);
    save();
    const cfg = widget('widget-search-1').config;
    expect(cfg.hiddenBuiltinEngines).toHaveLength(6);
    expect(cfg.customEngines.map((e: any) => e.name)).toEqual(['Wiki', 'Ecosia']);
    expect(cfg.defaultEngine).toBe(cfg.customEngines[0].id);
  });

  it('検索: デフォルトのカスタムエンジンを削除すると既定が付け替わること', () => {
    act(() =>
      state().updateWidgetConfig('widget-search-1', {
        defaultEngine: 'c1',
        customEngines: [{ id: 'c1', name: 'Custom', urlTemplate: 'https://c.example/?q={query}' }],
      })
    );
    openFor('widget-search-1');
    const customRow = screen.getByText('https://c.example/?q={query}').closest('div.flex')!;
    fireEvent.click(customRow.querySelector('button')!);
    save();
    expect(widget('widget-search-1').config.defaultEngine).toBe('google');
    expect(widget('widget-search-1').config.customEngines).toHaveLength(0);
  });

  it('RSS: Google News の検索キーワードとカスタムフィードURLを保存し権限を要求すること', () => {
    openFor('widget-rss-1');
    fireEvent.change(screen.getByPlaceholderText(/artificial intelligence/), { target: { value: ' space ' } });
    save();
    expect(widget('widget-rss-1').config.searchQuery).toBe('space');
    expect(widget('widget-rss-1').config.feedUrl).toContain('q=space');

    const { container } = openFor('widget-rss-1');
    const googleToggle = container.querySelectorAll('input[type="checkbox"]')[0];
    fireEvent.click(googleToggle);
    fireEvent.change(screen.getByPlaceholderText('https://example.com/feed.xml'), { target: { value: 'https://blog.example/atom' } });
    save();
    expect(widget('widget-rss-1').config.isGoogleNews).toBe(false);
    expect(widget('widget-rss-1').config.feedUrl).toBe('https://blog.example/atom');
    expect(chromeMock.permissions.request).toHaveBeenCalledWith({ origins: ['https://blog.example/*'] });
  });

  it('埋め込み: スキーム無しURLを https に正規化し、不正なURLは空にすること', () => {
    act(() => state().addWidget('iframe'));
    const id = state().widgets[state().widgets.length - 1].id;

    openFor(id);
    fireEvent.change(screen.getByPlaceholderText('https://example.com'), { target: { value: 'example.org/app' } });
    save();
    expect(widget(id).config.url).toBe('https://example.org/app');

    openFor(id);
    fireEvent.change(screen.getByPlaceholderText('https://example.com'), { target: { value: 'javascript:alert(1)' } });
    save();
    expect(widget(id).config.url).toBe('');
  });

  it('メモ・タスク・ポモドーロ・ショートカット・ブックマーク・QR の設定画面が開けること', () => {
    for (const type of ['pomodoro', 'shortcuts', 'qrcode'] as const) {
      act(() => state().addWidget(type));
    }
    const ids = state().widgets.map((w) => w.id);
    for (const id of ids) {
      openFor(id);
      expect(screen.getByText(/^Configure /)).toBeInTheDocument();
      save();
    }
    expect(state().activeSettingsModal).toBeNull();
  });

  it('メモ: フォントサイズと書体を切り替えて保存できること', () => {
    openFor('widget-notes-1');
    fireEvent.click(screen.getByText('lg'));
    fireEvent.click(screen.getByText('mono'));
    save();
    expect(widget('widget-notes-1').config).toMatchObject({ fontSize: 'lg', fontFamily: 'mono' });
  });
});
