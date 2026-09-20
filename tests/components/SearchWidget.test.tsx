import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import { setupUser, literal } from '../helpers/user';
import { SearchWidget } from '../../src/components/widgets/SearchWidget/SearchWidget';
import { useDashboardStore } from '../../src/store/useDashboardStore';
import { resetDashboardStore } from '../helpers/store';

const base = { defaultEngine: 'google' as const, openInNewTab: true, showEngineSelector: true };

async function typeAndSearch(user: ReturnType<typeof setupUser>, text: string) {
  const input = screen.getByPlaceholderText(/Search the web/i);
  await user.clear(input);
  await user.type(input, `${literal(text)}{Enter}`);
}

describe('SearchWidget', () => {
  let open: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    resetDashboardStore();
    open = vi.fn(() => null);
    vi.spyOn(window, 'open').mockImplementation(open as any);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('Enter で既定エンジンの検索URLを新しいタブで開くこと', async () => {
    const user = setupUser();
    render(<SearchWidget widgetId="s" config={base} />);
    await typeAndSearch(user, 'zenith tab');
    expect(open).toHaveBeenCalledWith('https://www.google.com/search?q=zenith%20tab', '_blank');
  });

  it('空のクエリでは検索しないこと', async () => {
    const user = setupUser();
    render(<SearchWidget widgetId="s" config={base} />);
    await typeAndSearch(user, '   ');
    expect(open).not.toHaveBeenCalled();
  });

  it('openInNewTab=false なら同じタブで遷移すること', async () => {
    const user = setupUser();
    const original = window.location;
    const assign = vi.fn();
    Object.defineProperty(window, 'location', { configurable: true, value: { ...original, href: '' } });
    Object.defineProperty(window.location, 'href', { set: assign, get: () => '' });

    render(<SearchWidget widgetId="s" config={{ ...base, openInNewTab: false }} />);
    await typeAndSearch(user, 'cats');

    expect(assign).toHaveBeenCalledWith('https://www.google.com/search?q=cats');
    expect(open).not.toHaveBeenCalled();
    Object.defineProperty(window, 'location', { configurable: true, value: original });
  });

  it('ピルでエンジンを切り替えると検索先が変わること', async () => {
   const user = setupUser();
        render(<SearchWidget widgetId="s" config={base} />);
    await user.click(screen.getByRole('button', { name: /YouTube/ }));
    await typeAndSearch(user, 'lofi');
    expect(open).toHaveBeenCalledWith('https://www.youtube.com/results?search_query=lofi', '_blank');
  });

  it('ドロップダウンからエンジンを選べ、外側クリックで閉じること', async () => {
   const user = setupUser();
        render(<SearchWidget widgetId="s" config={{ ...base, showEngineSelector: false }} />);
    await user.click(screen.getByTitle('Switch Search Engine'));

    const menu = screen.getByRole('menu');
    await user.click(within(menu).getByText('DuckDuckGo'));
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();

    await typeAndSearch(user, 'privacy');
    expect(open).toHaveBeenCalledWith('https://duckduckgo.com/?q=privacy', '_blank');

    await user.click(screen.getByTitle('Switch Search Engine'));
    expect(screen.getByRole('menu')).toBeInTheDocument();
    await user.click(document.body);
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  });

  it('「検索エンジンを管理」で設定モーダルを開くこと', async () => {
   const user = setupUser();
        render(<SearchWidget widgetId="widget-search-1" config={base} />);
    await user.click(screen.getByTitle('Switch Search Engine'));
    await user.click(screen.getByText('Manage search engines...'));
    expect(useDashboardStore.getState().activeSettingsModal).toBe('editWidget');
    expect(useDashboardStore.getState().editingWidgetId).toBe('widget-search-1');
  });

  it('カスタムエンジンと非表示の組み込みエンジンを反映すること', async () => {
    const user = setupUser();
    render(
      <SearchWidget
        widgetId="s"
        config={{
          ...base,
          defaultEngine: 'custom-1' as any,
          hiddenBuiltinEngines: ['bing', 'github'],
          customEngines: [{ id: 'custom-1', name: 'Wiki', urlTemplate: 'https://wiki.example/w?q={query}', icon: '📚' }],
        }}
      />
    );
    expect(screen.queryByRole('button', { name: /Bing/ })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /GitHub/ })).not.toBeInTheDocument();
    await typeAndSearch(user, 'cat & dog');
    expect(open).toHaveBeenCalledWith('https://wiki.example/w?q=cat%20%26%20dog', '_blank');
  });

  it('選択中のエンジンが消えた場合は既定にフォールバックすること', async () => {
   const user = setupUser();
        const { rerender } = render(
      <SearchWidget
        widgetId="s"
        config={{ ...base, customEngines: [{ id: 'c1', name: 'Temp', urlTemplate: 'https://t.example/?q={query}' }] }}
      />
    );
    await user.click(screen.getByRole('button', { name: /Temp/ }));
    rerender(<SearchWidget widgetId="s" config={{ ...base, customEngines: [] }} />);
    await typeAndSearch(user, 'x');
    expect(open).toHaveBeenCalledWith('https://www.google.com/search?q=x', '_blank');
  });

  it('Google も削除されていれば残ったエンジンにフォールバックすること', async () => {
    const user = setupUser();
    render(<SearchWidget widgetId="s" config={{ ...base, hiddenBuiltinEngines: ['google'] }} />);
    await typeAndSearch(user, 'x');
    expect(open).toHaveBeenCalledWith(expect.stringContaining('duckduckgo.com'), '_blank');
  });

  it('"/" キーで検索欄にフォーカスすること', async () => {
    const user = setupUser();
    render(<SearchWidget widgetId="s" config={base} />);
    const input = screen.getByPlaceholderText(/Search the web/i);
    expect(document.activeElement).not.toBe(input);
    await user.keyboard('/');
    expect(document.activeElement).toBe(input);
  });

  it('スマート回答: 式を打つと結果カードが出て、クリックでコピーでき、Enter は従来どおり検索すること', async () => {
    const user = setupUser();
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText } });
    render(<SearchWidget widgetId="s" config={base} />);
    expect(screen.queryByTestId('smart-result')).not.toBeInTheDocument();

    const input = screen.getByPlaceholderText(/Search the web/i);
    await user.type(input, literal('120*1.1'));
    const card = within(screen.getByTestId('smart-result'));
    expect(card.getByText('132')).toBeInTheDocument();
    expect(card.getByText('120*1.1 =')).toBeInTheDocument();

    await user.click(card.getByText('132'));
    expect(writeText).toHaveBeenCalledWith('132');
    expect(await card.findByText('Copied!')).toBeInTheDocument();

    await user.click(input);
    await user.keyboard('{Enter}');
    expect(open).toHaveBeenCalledWith('https://www.google.com/search?q=120*1.1', '_blank');

    // An ordinary query shows nothing.
    await user.clear(input);
    await user.type(input, literal('zenith tab'));
    expect(screen.queryByTestId('smart-result')).not.toBeInTheDocument();
  });

  it('スマート回答: "?" で入力例の一覧が出て、例をクリックすると検索欄に入り答えが出ること', async () => {
    const user = setupUser();
    render(<SearchWidget widgetId="s" config={base} />);
    const input = screen.getByPlaceholderText(/Search the web/i);
    await user.type(input, '?');
    const help = within(screen.getByTestId('smart-help'));
    expect(help.getByText('What the search bar can answer')).toBeInTheDocument();
    expect(help.getByText('Convert units')).toBeInTheDocument();

    await user.click(help.getByRole('button', { name: '10 km to mi' }));
    expect(input).toHaveValue('10 km to mi');
    expect(screen.queryByTestId('smart-help')).not.toBeInTheDocument();
    expect(within(screen.getByTestId('smart-result')).getByText('6.213711922 mi')).toBeInTheDocument();
  });

  it('スマート回答: コイントスは「もう一度」で再抽選でき、設定でオフにできること', async () => {
    const user = setupUser();
    const random = vi.spyOn(Math, 'random').mockReturnValue(0.1);
    const { unmount } = render(<SearchWidget widgetId="s" config={base} />);
    const input = screen.getByPlaceholderText(/Search the web/i);
    await user.type(input, literal('coin'));
    expect(within(screen.getByTestId('smart-result')).getByText('Heads')).toBeInTheDocument();

    random.mockReturnValue(0.9);
    await user.click(screen.getByTitle('Again'));
    expect(within(screen.getByTestId('smart-result')).getByText('Tails')).toBeInTheDocument();
    unmount();

    render(<SearchWidget widgetId="s" config={{ ...base, smartTools: false }} />);
    await user.type(screen.getByPlaceholderText(/Search the web/i), literal('1+1'));
    expect(screen.queryByTestId('smart-result')).not.toBeInTheDocument();
  });
});
