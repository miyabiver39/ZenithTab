import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, act, waitFor } from '@testing-library/react';
import { setupUser, literal } from '../helpers/user';
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

const save = (user: ReturnType<typeof setupUser>) => user.click(screen.getByText('Save Changes'));

describe('WidgetConfigModal', () => {
  beforeEach(() => resetDashboardStore());
  afterEach(() => {
    mounted = null;
    vi.restoreAllMocks();
  });

  it('対象ウィジェットが無い / モーダルが閉じている間は描画しないこと', async () => {
    const { container } = render(<WidgetConfigModal />);
    expect(container.firstChild).toBeNull();
    act(() => state().openSettingsModal('editWidget', 'ghost'));
    expect(container.firstChild).toBeNull();
  });

  it('タイトルを変更して保存すると反映され、キャンセルで閉じること', async () => {
    const user = setupUser();
    openFor('widget-clock-1');
    expect(screen.getByText('Configure Clock')).toBeInTheDocument();
    await user.clear(screen.getByPlaceholderText('Custom Widget Name'));
    await user.type(screen.getByPlaceholderText('Custom Widget Name'), literal('Wall Clock'));
    await save(user);
    expect(widget('widget-clock-1').title).toBe('Wall Clock');
    expect(state().activeSettingsModal).toBeNull();

    openFor('widget-clock-1');
    await user.click(screen.getByText('Cancel'));
    expect(state().activeSettingsModal).toBeNull();
  });

  it('時計: チェックボックスとタイムゾーンを保存できること', async () => {
    const user = setupUser();
    openFor('widget-clock-1');
    await user.click(screen.getByRole('checkbox', { name: '24-Hour Format' }));
    await user.clear(screen.getByPlaceholderText(/Asia\/Tokyo/));
    await user.type(screen.getByPlaceholderText(/Asia\/Tokyo/), literal('UTC'));
    await save(user);
    expect(widget('widget-clock-1').config.timezone).toBe('UTC');
    expect(widget('widget-clock-1').config.is24Hour).toBe(false);
  });

  it('天気: 都市・座標・現在地検出を扱えること', async () => {
    const user = setupUser();
    vi.spyOn(weatherService, 'detectUserLocation').mockResolvedValue({ latitude: 1.5, longitude: 2.5, city: 'Here' });
    openFor('widget-weather-1');
    await user.clear(screen.getByPlaceholderText(/Tokyo, Shinjuku/));
    await user.type(screen.getByPlaceholderText(/Tokyo, Shinjuku/), literal('Osaka'));
    await user.clear(screen.getByPlaceholderText('35.6762'));
    await user.type(screen.getByPlaceholderText('35.6762'), literal('34.7'));
    await user.clear(screen.getByPlaceholderText('139.6503'));
    await user.type(screen.getByPlaceholderText('139.6503'), literal('135.5'));

    await user.click(screen.getByText('Detect Current Location'));
    await waitFor(() => expect(screen.getByPlaceholderText(/Tokyo, Shinjuku/)).toHaveValue('Here'));
    await save(user);
    expect(widget('widget-weather-1').config).toMatchObject({ city: 'Here', latitude: 1.5, longitude: 2.5 });
  });

  it('天気: 位置情報が拒否されたらエラーを表示すること', async () => {
    const user = setupUser();
    vi.spyOn(weatherService, 'detectUserLocation').mockRejectedValue(new GeolocationFailure('denied', 'x'));
    openFor('widget-weather-1');
    await user.click(screen.getByText('Detect Current Location'));
    await waitFor(() => expect(screen.getByText(/Location access was denied/)).toBeInTheDocument());

    vi.spyOn(weatherService, 'detectUserLocation').mockRejectedValue(new Error('other'));
    await user.click(screen.getByText('Detect Current Location'));
    await waitFor(() => expect(screen.getByText(/Could not determine/)).toBeInTheDocument());
  });

  it('検索: 組み込みエンジンの削除・復元、カスタム追加・削除、最後の1件は削除不可', async () => {
    const user = setupUser();
    openFor('widget-search-1');
    const removeButtons = () => screen.getAllByRole('button', { name: /^Delete: / });

    // Remove Google (the default) → default falls back to the next built-in.
    await user.click(removeButtons()[0]);
    expect(screen.getByText('Removed (click to bring back):')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /^Google/ }));
    expect(screen.queryByText('Removed (click to bring back):')).not.toBeInTheDocument();

    // Remove everything but one → the last remove button is disabled.
    for (let i = 0; i < 5; i++) await user.click(removeButtons()[0]);
    expect(removeButtons()[0]).toBeDisabled();
    expect(removeButtons()[0]).toHaveAttribute('title', 'At least one search engine is required');

    // Add a custom engine by pasting a results URL (auto-templated on blur).
    await user.clear(screen.getByPlaceholderText('Name'));
    await user.type(screen.getByPlaceholderText('Name'), literal('Wiki'));
    const urlInput = screen.getByPlaceholderText('https://example.com/search?q={query}');
    await user.clear(urlInput);
    await user.type(urlInput, literal('https://wiki.example/w/index.php?search=hello'));
    expect(screen.getByText(/Add Engine is disabled/)).toBeInTheDocument();
    await user.tab();
    expect((urlInput as HTMLInputElement).value).toContain('{query}');
    await user.click(screen.getByText('Add Engine'));
    // Listed once in the engine list and once as a default-engine option.
    expect(screen.getAllByText('Wiki').length).toBeGreaterThanOrEqual(1);

    // A preset chip adds too.
    await user.click(screen.getByText('Ecosia'));

    // Now the built-in can go; then remove the custom ones back down to one.
    await user.click(removeButtons()[0]);
    await save(user);
    const cfg = widget('widget-search-1').config;
    expect(cfg.hiddenBuiltinEngines).toHaveLength(6);
    expect(cfg.customEngines.map((e: any) => e.name)).toEqual(['Wiki', 'Ecosia']);
    expect(cfg.defaultEngine).toBe(cfg.customEngines[0].id);
  });

  it('検索: デフォルトのカスタムエンジンを削除すると既定が付け替わること', async () => {
    const user = setupUser();
    act(() =>
      state().updateWidgetConfig('widget-search-1', {
        defaultEngine: 'c1',
        customEngines: [{ id: 'c1', name: 'Custom', urlTemplate: 'https://c.example/?q={query}' }],
      })
    );
    openFor('widget-search-1');
    await user.click(screen.getByRole('button', { name: 'Delete: Custom' }));
    await save(user);
    expect(widget('widget-search-1').config.defaultEngine).toBe('google');
    expect(widget('widget-search-1').config.customEngines).toHaveLength(0);
  });

  it('RSS: ヘッドライン / トピック / 検索の各モードを保存できること', async () => {
    const user = setupUser();
    openFor('widget-rss-1');
    expect(screen.queryByPlaceholderText(/artificial intelligence/)).not.toBeInTheDocument();

    await user.click(screen.getByText('By topic'));
    await user.selectOptions(screen.getByRole('combobox'), 'SPORTS');
    await save(user);
    expect(widget('widget-rss-1').config).toMatchObject({ googleNewsMode: 'topic', googleNewsTopic: 'SPORTS' });
    expect(widget('widget-rss-1').config.feedUrl).toContain('/topic/SPORTS?');

    openFor('widget-rss-1');
    await user.click(screen.getByText('Keyword search'));
    await user.clear(screen.getByPlaceholderText(/artificial intelligence/));
    await user.type(screen.getByPlaceholderText(/artificial intelligence/), literal(' space '));
    await save(user);
    expect(widget('widget-rss-1').config).toMatchObject({ googleNewsMode: 'search', searchQuery: 'space' });
    expect(widget('widget-rss-1').config.feedUrl).toContain('q=space');

    openFor('widget-rss-1');
    await user.click(screen.getByText('Keyword search'));
    await user.clear(screen.getByPlaceholderText(/artificial intelligence/));
    await user.type(screen.getByPlaceholderText(/artificial intelligence/), literal('headlines'));
    await save(user);
    expect(widget('widget-rss-1').config.googleNewsMode).toBe('headlines');
    expect(widget('widget-rss-1').config.feedUrl).toBe('https://news.google.com/rss?hl=en-US&gl=US&ceid=US:en');

    openFor('widget-rss-1');
    await user.click(screen.getByText('Top stories'));
    await save(user);
    expect(widget('widget-rss-1').config.googleNewsMode).toBe('headlines');
  });

  it('RSS: カスタムフィードURLを保存し権限を要求すること', async () => {

    const user = setupUser();

    openFor('widget-rss-1');
    await user.click(screen.getByRole('checkbox', { name: 'Google News Keyword Feed' }));
    await user.clear(screen.getByPlaceholderText('https://example.com/feed.xml'));
    await user.type(screen.getByPlaceholderText('https://example.com/feed.xml'), literal('https://blog.example/atom'));
    await save(user);
    expect(widget('widget-rss-1').config.isGoogleNews).toBe(false);
    expect(widget('widget-rss-1').config.feedUrl).toBe('https://blog.example/atom');
    expect(chromeMock.permissions.request).toHaveBeenCalledWith({ origins: ['https://blog.example/*'] });
  });

  it('埋め込み: スキーム無しURLを https に正規化し、不正なURLは空にすること', async () => {
    const user = setupUser();
    act(() => state().addWidget('iframe'));
    const id = state().widgets[state().widgets.length - 1].id;

    openFor(id);
    await user.clear(screen.getByPlaceholderText('https://example.com'));
    await user.type(screen.getByPlaceholderText('https://example.com'), literal('example.org/app'));
    await save(user);
    expect(widget(id).config.url).toBe('https://example.org/app');

    openFor(id);
    await user.clear(screen.getByPlaceholderText('https://example.com'));
    await user.type(screen.getByPlaceholderText('https://example.com'), literal('javascript:alert(1)'));
    await save(user);
    expect(widget(id).config.url).toBe('');
  });

  it('メモ・タスク・ポモドーロ・ショートカット・ブックマーク・QR の設定画面が開けること', async () => {
    const user = setupUser();
    for (const type of ['pomodoro', 'shortcuts', 'qrcode'] as const) {
      act(() => state().addWidget(type));
    }
    const ids = state().widgets.map((w) => w.id);
    for (const id of ids) {
      openFor(id);
      expect(screen.getByText(/^Configure /)).toBeInTheDocument();
      await save(user);
    }
    expect(state().activeSettingsModal).toBeNull();
  });

  it('メモ: フォントサイズと書体を切り替えて保存できること', async () => {
    const user = setupUser();
    openFor('widget-notes-1');
    await user.click(screen.getByText('lg'));
    await user.click(screen.getByText('mono'));
    await save(user);
    expect(widget('widget-notes-1').config).toMatchObject({ fontSize: 'lg', fontFamily: 'mono' });
  });
});
