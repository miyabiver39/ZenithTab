import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, act, waitFor, within } from '@testing-library/react';
import { setupUser, literal } from '../helpers/user';
import { WidgetConfigModal } from '../../src/components/layout/WidgetConfigModal';
import { useDashboardStore } from '../../src/store/useDashboardStore';
import { prepareSearchConfigForSave } from '../../src/components/widgets/SearchWidget/SearchConfig';
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

  // Split in three and filled with paste() rather than type(): one test
  // typing four long URLs key by key used to run past the 5 s timeout
  // when the whole suite ran under coverage (#81). What is checked here
  // is the validation of the final value, not per-keystroke behaviour.
  describe('検索: カスタムエンジンの URL 検証 (#51)', () => {
    // The URL form sits behind "Add by URL" since the catalog became the main way in.
    const openSearch = async (user: ReturnType<typeof setupUser>) => {
      openFor('widget-search-1');
      await user.click(screen.getByRole('button', { name: /Add by URL/ }));
      return {
        name: screen.getByPlaceholderText('Name'),
        urlInput: screen.getByPlaceholderText('https://example.com/search?q={query}'),
        addButton: () => screen.getByRole('button', { name: /Add Engine/ }),
      };
    };
    const fill = async (user: ReturnType<typeof setupUser>, input: HTMLElement, text: string) => {
      await user.clear(input);
      await user.click(input);
      await user.paste(text);
    };

    it('危険なスキームのカスタムエンジンは追加できないこと', async () => {
      const user = setupUser();
      const { name, urlInput, addButton } = await openSearch(user);
      await fill(user, name, 'Evil');

      await fill(user, urlInput, 'javascript:alert({query})');
      expect(screen.getByText(/Only http:\/\/ or https:\/\//)).toBeInTheDocument();
      expect(addButton()).toBeDisabled();

      await fill(user, urlInput, 'data:text/html,{query}');
      expect(addButton()).toBeDisabled();
    });

    it('スキーム省略は https が補われて保存されること', async () => {
      const user = setupUser();
      const { name, urlInput, addButton } = await openSearch(user);
      await fill(user, name, 'Example');
      await fill(user, urlInput, 'search.example/?q={query}');
      expect(addButton()).toBeEnabled();
      await user.click(addButton());

      await save(user);
      const cfg = widget('widget-search-1').config;
      expect(cfg.customEngines.map((e: any) => e.urlTemplate)).toEqual(['https://search.example/?q={query}']);
    });

    it('下書きに紛れ込んだ危険なテンプレートも保存フックが落とすこと', () => {
      expect(
        prepareSearchConfigForSave({
          customEngines: [
            { id: 'a', name: 'Ok', urlTemplate: 'https://ok.example/?q={query}' },
            { id: 'b', name: 'Smuggled', urlTemplate: 'javascript:{query}' },
            { id: 'c', name: 'NoQuery', urlTemplate: 'https://ok.example/' },
          ],
        }).customEngines.map((e: any) => e.id)
      ).toEqual(['a']);
    });
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

  it('検索: 組み込みエンジンの削除とカタログからの復元、カスタム追加・削除、最後の1件は削除不可', async () => {
    const user = setupUser();
    openFor('widget-search-1');
    const removeButtons = () => screen.getAllByRole('button', { name: /^Delete: / });
    const defaultButton = (name: string) => screen.getByRole('button', { name: `Make default: ${name}` });

    // Remove Google (the default) → default falls back to the next built-in.
    await user.click(removeButtons()[0]);
    expect(screen.queryByRole('button', { name: 'Make default: Google' })).not.toBeInTheDocument();
    expect(defaultButton('DuckDuckGo')).toHaveAttribute('aria-pressed', 'true');

    // A removed built-in is back in the catalog; picking it un-hides it
    // rather than adding a copy.
    await user.click(screen.getByRole('button', { name: /Add from catalog/ }));
    const catalog = screen.getByRole('list', { name: 'Add search engines' });
    await user.click(within(catalog).getByRole('button', { name: /^Google\s*www/ }));
    await user.click(screen.getByRole('button', { name: /^Add 1$/ }));
    expect(defaultButton('Google')).toHaveAttribute('aria-pressed', 'false');

    // Remove everything but one → the last remove button is disabled.
    for (let i = 0; i < 5; i++) await user.click(removeButtons()[0]);
    expect(removeButtons()[0]).toBeDisabled();
    expect(removeButtons()[0]).toHaveAttribute('title', 'At least one search engine is required');

    // Add a custom engine by pasting a results URL (auto-templated on blur).
    await user.click(screen.getByRole('button', { name: /Add by URL/ }));
    await user.clear(screen.getByPlaceholderText('Name'));
    await user.type(screen.getByPlaceholderText('Name'), literal('Wiki'));
    const urlInput = screen.getByPlaceholderText('https://example.com/search?q={query}');
    await user.clear(urlInput);
    await user.type(urlInput, literal('https://wiki.example/w/index.php?search=hello'));
    expect(screen.getByText(/Add Engine is disabled/)).toBeInTheDocument();
    await user.tab();
    expect((urlInput as HTMLInputElement).value).toContain('{query}');
    await user.click(screen.getByText('Add Engine'));
    expect(screen.getByText('Wiki')).toBeInTheDocument();

    // AI services come from the catalog too.
    await user.click(screen.getByRole('button', { name: /Add from catalog/ }));
    await user.click(screen.getByRole('button', { name: 'AI assistants' }));
    await user.click(screen.getByRole('button', { name: /Perplexity/ }));
    await user.click(screen.getByRole('button', { name: /^Add 1$/ }));

    // The star makes an engine the default; then the last built-in can go.
    await user.click(defaultButton('Perplexity'));
    await user.click(removeButtons()[0]);
    await save(user);
    const cfg = widget('widget-search-1').config;
    expect(cfg.hiddenBuiltinEngines).toHaveLength(6);
    expect(cfg.customEngines.map((e: any) => [e.name, e.urlTemplate])).toEqual([
      ['Wiki', 'https://wiki.example/w/index.php?search={query}'],
      ['Perplexity', 'https://www.perplexity.ai/search?q={query}'],
    ]);
    expect(cfg.defaultEngine).toBe(cfg.customEngines[1].id);
  });

  it('検索: スマート回答の入力例は既定で閉じていて、開閉できること', async () => {
    const user = setupUser();
    openFor('widget-search-1');
    const toggle = screen.getByRole('button', { name: 'Show examples' });
    expect(toggle).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByRole('button', { name: '10 km to mi' })).not.toBeInTheDocument();

    await user.click(toggle);
    expect(screen.getByRole('button', { name: 'Hide examples' })).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByRole('button', { name: '10 km to mi' })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Hide examples' }));
    expect(screen.queryByRole('button', { name: '10 km to mi' })).not.toBeInTheDocument();
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
