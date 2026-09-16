import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BookmarkWidget } from '../../src/components/widgets/BookmarkWidget/BookmarkWidget';
import { resetDashboardStore } from '../helpers/store';
import { chromeMock } from '../helpers/chrome';

const config: { viewMode: 'grid' | 'list' | 'tree'; showFavicons: boolean; columns: number } = { viewMode: 'grid', showFavicons: true, columns: 4 };

async function renderLoaded(overrides: Partial<typeof config> = {}) {
  const utils = render(<BookmarkWidget config={{ ...config, ...overrides }} />);
  await waitFor(() => expect(screen.getByText('Bookmarks bar')).toBeInTheDocument());
  return utils;
}

describe('BookmarkWidget', () => {
  beforeEach(() => resetDashboardStore());
  afterEach(() => vi.restoreAllMocks());

  it('ローディングの後にルートのフォルダを描画すること', async () => {
    render(<BookmarkWidget config={config} />);
    expect(screen.getByText('Loading...')).toBeInTheDocument();
    await waitFor(() => expect(screen.getByText('Bookmarks bar')).toBeInTheDocument());
    expect(screen.getByText('Other bookmarks')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Search bookmarks...')).toBeInTheDocument();
  });

  it('フォルダをクリックで開き、パンくずで戻れること', async () => {
    await renderLoaded();
    fireEvent.click(screen.getByText('Bookmarks bar'));

    expect(screen.getByText('GitHub')).toBeInTheDocument();
    expect(screen.getByText('Dev Tools')).toBeInTheDocument();
    expect(screen.getByText('GitHub').closest('a')).toHaveAttribute('href', 'https://github.com');

    fireEvent.click(screen.getByText('Dev Tools'));
    expect(screen.getByText('MDN Web Docs')).toBeInTheDocument();

    // Breadcrumb: back to the parent folder, then all the way up.
    fireEvent.click(screen.getByText('Bookmarks bar'));
    expect(screen.getByText('Dev Tools')).toBeInTheDocument();
    expect(screen.queryByText('MDN Web Docs')).not.toBeInTheDocument();

    fireEvent.click(screen.getByText('All'));
    expect(screen.getByText('Other bookmarks')).toBeInTheDocument();
  });

  it('検索で結果を絞り込み、空にすると元に戻ること', async () => {
    await renderLoaded();
    const input = screen.getByPlaceholderText('Search bookmarks...');

    fireEvent.change(input, { target: { value: 'git' } });
    await waitFor(() => expect(screen.getByText('GitHub')).toBeInTheDocument());
    expect(screen.queryByText('Bookmarks bar')).not.toBeInTheDocument();
    expect(chromeMock.bookmarks.search).toHaveBeenCalledWith('git');

    fireEvent.change(input, { target: { value: 'zzz-nothing' } });
    await waitFor(() => expect(screen.getByText('No bookmarks found')).toBeInTheDocument());

    fireEvent.change(input, { target: { value: '' } });
    await waitFor(() => expect(screen.getByText('Bookmarks bar')).toBeInTheDocument());
  });

  it('グリッド表示の列数が設定に従うこと', async () => {
    await renderLoaded({ columns: 6 });
    expect(screen.getByTestId('bookmarks-grid').style.gridTemplateColumns).toBe('repeat(6, minmax(0, 1fr))');
  });

  it('リスト表示でも同じ項目を描画すること', async () => {
    await renderLoaded({ viewMode: 'list' });
    fireEvent.click(screen.getByText('Bookmarks bar'));
    expect(screen.getByText('Google').closest('a')).toHaveAttribute('href', 'https://google.com');
  });

  it('空のフォルダではその旨を表示すること', async () => {
    chromeMock.bookmarks.getTree.mockResolvedValue([
      { id: '0', title: 'root', children: [{ id: '1', title: 'Empty', children: [] }] },
    ]);
    render(<BookmarkWidget config={config} />);
    await waitFor(() => screen.getByText('Empty'));
    fireEvent.click(screen.getByText('Empty'));
    expect(screen.getByText('Folder is empty')).toBeInTheDocument();
  });

  it('ファビコンを非表示にできること', async () => {
    const { container } = await renderLoaded({ showFavicons: false });
    fireEvent.click(screen.getByText('Bookmarks bar'));
    expect(container.querySelector('img')).not.toBeInTheDocument();
  });
});
