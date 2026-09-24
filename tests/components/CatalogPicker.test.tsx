import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, within, waitFor, fireEvent } from '@testing-library/react';
import { setupUser } from '../helpers/user';
import { CatalogPicker, urlKey } from '../../src/components/common/CatalogPicker';
import { resetDashboardStore } from '../helpers/store';
import { chromeMock } from '../helpers/chrome';

describe('CatalogPicker', () => {
  beforeEach(() => resetDashboardStore());

  it('地域のカタログをカテゴリで絞り込み、複数選んでまとめて追加できること', async () => {
    const user = setupUser();
    const onAdd = vi.fn();
    const onClose = vi.fn();
    render(<CatalogPicker isOpen onClose={onClose} kind="sites" existingUrls={['https://google.com/']} onAdd={onAdd} />);

    const list = screen.getByRole('list', { name: 'Add sites' });
    // Already present → ticked and not clickable.
    const google = within(list).getByRole('button', { name: /^Google google\.com$/ });
    expect(google).toBeDisabled();

    await user.click(screen.getByRole('button', { name: 'Shopping' }));
    expect(within(list).queryByText('YouTube')).not.toBeInTheDocument();
    await user.click(within(list).getByRole('button', { name: /Amazon/ }));
    await user.click(within(list).getByRole('button', { name: /eBay/ }));
    expect(within(list).getByRole('button', { name: /Amazon/ })).toHaveAttribute('aria-pressed', 'true');
    // Deselect one again.
    await user.click(within(list).getByRole('button', { name: /eBay/ }));

    await user.click(screen.getByRole('button', { name: 'All' }));
    await user.click(within(list).getByRole('button', { name: /Netflix/ }));

    await user.click(screen.getByRole('button', { name: 'Add 2' }));
    expect(onAdd).toHaveBeenCalledWith([
      expect.objectContaining({ title: 'Amazon', url: 'https://www.amazon.com', category: 'Shopping', icon: 'cart' }),
      expect.objectContaining({ title: 'Netflix', url: 'https://netflix.com' }),
    ]);
    expect(onClose).toHaveBeenCalled();
  });

  it('地域を切り替えると別の地域のサイトが出ること', async () => {
    const user = setupUser();
    render(<CatalogPicker isOpen onClose={() => {}} kind="sites" existingUrls={[]} onAdd={() => {}} />);
    await user.selectOptions(screen.getByRole('combobox', { name: 'Region' }), 'ja');
    expect(screen.getByText('楽天市場')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'ショッピング' })).toBeInTheDocument();
  });

  it('ブックマークとよく見るサイトを取得元として選べ、権限が拒否されたら説明を出すこと', async () => {
    const user = setupUser();
    const onAdd = vi.fn();
    render(
      <CatalogPicker isOpen onClose={() => {}} kind="sites" sources={['catalog', 'bookmarks', 'topSites']} existingUrls={[]} onAdd={onAdd} />
    );
    await user.click(screen.getByRole('tab', { name: 'Bookmarks' }));
    await waitFor(() => expect(screen.getByText('MDN Web Docs')).toBeInTheDocument());
    // Folder name doubles as the category chip.
    expect(screen.getByRole('button', { name: 'Dev Tools' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /Zenith Docs/ }));
    await user.click(screen.getByRole('button', { name: 'Add 1' }));
    expect(onAdd).toHaveBeenCalledWith([expect.objectContaining({ title: 'Zenith Docs', url: 'https://zenith-tab.dev', category: 'Other bookmarks' })]);

    chromeMock.permissions.contains.mockResolvedValueOnce(false);
    chromeMock.permissions.request.mockResolvedValueOnce(false);
    await user.click(screen.getByRole('tab', { name: 'Most visited' }));
    await waitFor(() => expect(screen.getByText(/Permission was not granted/)).toBeInTheDocument());

    await user.click(screen.getByRole('tab', { name: 'Bookmarks' }));
    await user.click(screen.getByRole('tab', { name: 'Most visited' }));
    await waitFor(() => expect(screen.getByText('Company Portal')).toBeInTheDocument());
  });

  it('フィードは 1 件選ぶとすぐ追加され、カテゴリはローカライズされること', async () => {
    const user = setupUser();
    const onAdd = vi.fn();
    const onClose = vi.fn();
    render(<CatalogPicker isOpen onClose={onClose} kind="feeds" mode="single" existingUrls={[]} onAdd={onAdd} />);
    expect(screen.getByRole('dialog', { name: 'Choose a feed' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Technology' }));
    await user.click(screen.getByRole('button', { name: /The Verge/ }));
    expect(onAdd).toHaveBeenCalledWith([expect.objectContaining({ url: 'https://www.theverge.com/rss/index.xml' })]);
    expect(onClose).toHaveBeenCalled();
  });

  it('検索エンジンは AI などのカテゴリで選べ、テンプレート URL を返し、地域ごとのエンジンを出し分けること', async () => {
    const user = setupUser();
    const onAdd = vi.fn();
    render(
      <CatalogPicker
        isOpen
        onClose={() => {}}
        kind="searchEngines"
        existingUrls={['https://chatgpt.com/?q={query}']}
        onAdd={onAdd}
      />
    );
    const list = screen.getByRole('list', { name: 'Add search engines' });
    expect(within(list).queryByText('Yahoo! JAPAN')).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'AI assistants' }));
    expect(within(list).queryByText('Google')).not.toBeInTheDocument();
    expect(within(list).getByRole('button', { name: /ChatGPT/ })).toBeDisabled();
    await user.click(within(list).getByRole('button', { name: /^Claude/ }));
    await user.click(screen.getByRole('button', { name: 'Add 1' }));
    expect(onAdd).toHaveBeenCalledWith([expect.objectContaining({ title: 'Claude', url: 'https://claude.ai/new?q={query}' })]);

    await user.selectOptions(screen.getByRole('combobox', { name: 'Region' }), 'ja');
    expect(within(list).getByText('Yahoo! JAPAN')).toBeInTheDocument();
  });

  it('urlKey は末尾スラッシュと大文字小文字を無視すること', () => {
    expect(urlKey('https://Example.com/')).toBe(urlKey('https://example.com'));
  });
});

describe('CatalogPicker › Favicon', () => {
  it('読み込みに失敗したアイコンのフォールバックが、別の URL に切り替わったときに引き継がれないこと', async () => {
    const { Favicon } = await import('../../src/components/common/CatalogPicker');
    const { rerender, container } = render(<Favicon url="https://a.example" isFeed={false} />);
    // `load`/`error` on <img> can't be produced by user-event.
    fireEvent.error(container.querySelector('img')!);
    expect(container.querySelector('img')).toBeNull();
    expect(container.querySelector('.lucide-globe')).not.toBeNull();

    rerender(<Favicon url="https://b.example" isFeed={false} />);
    expect(container.querySelector('img')).not.toBeNull();

    rerender(<Favicon url="https://a.example" isFeed={false} />);
    expect(container.querySelector('img')).toBeNull();
  });
});
