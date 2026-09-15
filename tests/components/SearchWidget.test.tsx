import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import { SearchWidget } from '../../src/components/widgets/SearchWidget/SearchWidget';
import { useDashboardStore } from '../../src/store/useDashboardStore';
import { resetDashboardStore } from '../helpers/store';

const base = { defaultEngine: 'google' as const, openInNewTab: true, showEngineSelector: true };

function typeAndSearch(text: string) {
  const input = screen.getByPlaceholderText(/Search the web/i);
  fireEvent.change(input, { target: { value: text } });
  fireEvent.submit(input.closest('form')!);
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

  it('Enter で既定エンジンの検索URLを新しいタブで開くこと', () => {
    render(<SearchWidget widgetId="s" config={base} />);
    typeAndSearch('zenith tab');
    expect(open).toHaveBeenCalledWith('https://www.google.com/search?q=zenith%20tab', '_blank');
  });

  it('空のクエリでは検索しないこと', () => {
    render(<SearchWidget widgetId="s" config={base} />);
    typeAndSearch('   ');
    expect(open).not.toHaveBeenCalled();
  });

  it('openInNewTab=false なら同じタブで遷移すること', () => {
    const original = window.location;
    const assign = vi.fn();
    Object.defineProperty(window, 'location', { configurable: true, value: { ...original, href: '' } });
    Object.defineProperty(window.location, 'href', { set: assign, get: () => '' });

    render(<SearchWidget widgetId="s" config={{ ...base, openInNewTab: false }} />);
    typeAndSearch('cats');

    expect(assign).toHaveBeenCalledWith('https://www.google.com/search?q=cats');
    expect(open).not.toHaveBeenCalled();
    Object.defineProperty(window, 'location', { configurable: true, value: original });
  });

  it('ピルでエンジンを切り替えると検索先が変わること', () => {
    render(<SearchWidget widgetId="s" config={base} />);
    fireEvent.click(screen.getByRole('button', { name: /YouTube/ }));
    typeAndSearch('lofi');
    expect(open).toHaveBeenCalledWith('https://www.youtube.com/results?search_query=lofi', '_blank');
  });

  it('ドロップダウンからエンジンを選べ、外側クリックで閉じること', () => {
    render(<SearchWidget widgetId="s" config={{ ...base, showEngineSelector: false }} />);
    fireEvent.click(screen.getByTitle('Switch Search Engine'));

    const menu = document.body.querySelector('.z-\\[9999\\]') as HTMLElement;
    expect(menu).toBeInTheDocument();
    fireEvent.click(within(menu).getByText('DuckDuckGo'));
    expect(document.body.querySelector('.z-\\[9999\\]')).not.toBeInTheDocument();

    typeAndSearch('privacy');
    expect(open).toHaveBeenCalledWith('https://duckduckgo.com/?q=privacy', '_blank');

    fireEvent.click(screen.getByTitle('Switch Search Engine'));
    expect(document.body.querySelector('.z-\\[9999\\]')).toBeInTheDocument();
    fireEvent.mouseDown(document.body);
    expect(document.body.querySelector('.z-\\[9999\\]')).not.toBeInTheDocument();
  });

  it('「検索エンジンを管理」で設定モーダルを開くこと', () => {
    render(<SearchWidget widgetId="widget-search-1" config={base} />);
    fireEvent.click(screen.getByTitle('Switch Search Engine'));
    fireEvent.click(screen.getByText('Manage search engines...'));
    expect(useDashboardStore.getState().activeSettingsModal).toBe('editWidget');
    expect(useDashboardStore.getState().editingWidgetId).toBe('widget-search-1');
  });

  it('カスタムエンジンと非表示の組み込みエンジンを反映すること', () => {
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
    typeAndSearch('cat & dog');
    expect(open).toHaveBeenCalledWith('https://wiki.example/w?q=cat%20%26%20dog', '_blank');
  });

  it('選択中のエンジンが消えた場合は既定にフォールバックすること', () => {
    const { rerender } = render(
      <SearchWidget
        widgetId="s"
        config={{ ...base, customEngines: [{ id: 'c1', name: 'Temp', urlTemplate: 'https://t.example/?q={query}' }] }}
      />
    );
    fireEvent.click(screen.getByRole('button', { name: /Temp/ }));
    rerender(<SearchWidget widgetId="s" config={{ ...base, customEngines: [] }} />);
    typeAndSearch('x');
    expect(open).toHaveBeenCalledWith('https://www.google.com/search?q=x', '_blank');
  });

  it('Google も削除されていれば残ったエンジンにフォールバックすること', () => {
    render(<SearchWidget widgetId="s" config={{ ...base, hiddenBuiltinEngines: ['google'] }} />);
    typeAndSearch('x');
    expect(open).toHaveBeenCalledWith(expect.stringContaining('duckduckgo.com'), '_blank');
  });

  it('"/" キーで検索欄にフォーカスすること', () => {
    render(<SearchWidget widgetId="s" config={base} />);
    const input = screen.getByPlaceholderText(/Search the web/i);
    expect(document.activeElement).not.toBe(input);
    fireEvent.keyDown(window, { key: '/' });
    expect(document.activeElement).toBe(input);
  });
});
