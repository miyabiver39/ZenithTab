import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { RssFeedWidget } from '../../src/components/widgets/RssFeedWidget/RssFeedWidget';
import { rssService, FeedPermissionRequired } from '../../src/services/rssService';
import { useDashboardStore } from '../../src/store/useDashboardStore';
import { resetDashboardStore } from '../helpers/store';
import { chromeMock } from '../helpers/chrome';
import { RssFeedData } from '../../src/types/rss';

const FEED: RssFeedData = {
  title: 'Example',
  link: 'https://example.com/feed',
  lastUpdated: Date.now(),
  items: [
    { id: '1', title: 'First story', link: 'https://example.com/1', contentSnippet: 'Snippet one', sourceTitle: 'Example', isoDate: new Date().toISOString() },
    { id: '2', title: 'Second story', link: 'https://example.com/2', imageUrl: 'https://example.com/img.png' },
    { id: '3', title: 'Third story', link: 'https://example.com/3' },
  ] as any,
};

const base = { feedUrl: 'https://example.com/feed', maxItems: 2, refreshIntervalMinutes: 0, showThumbnail: true, showDate: true, showDescription: true };

describe('RssFeedWidget', () => {
  beforeEach(() => resetDashboardStore());
  afterEach(() => vi.restoreAllMocks());

  it('フィード取得中→記事一覧を maxItems 件まで描画すること', async () => {
    vi.spyOn(rssService, 'fetchFeed').mockResolvedValue(FEED);
    render(<RssFeedWidget widgetId="widget-rss-1" config={base} />);

    expect(screen.getByText('Fetching news feed...')).toBeInTheDocument();
    await waitFor(() => expect(screen.getByText('First story')).toBeInTheDocument());
    expect(screen.getByText('Second story')).toBeInTheDocument();
    expect(screen.queryByText('Third story')).not.toBeInTheDocument();
    expect(screen.getByText('Snippet one')).toBeInTheDocument();
    expect(screen.getByText('Live Feed')).toBeInTheDocument();
    expect(screen.getByText('First story').closest('a')).toHaveAttribute('href', 'https://example.com/1');
  });

  it('Google News モードは言語に応じたURLを使い、キーワード無しはトップニュース表示になること', async () => {
    const fetchSpy = vi.spyOn(rssService, 'fetchFeed').mockResolvedValue(FEED);
    render(<RssFeedWidget widgetId="widget-rss-1" config={{ ...base, isGoogleNews: true, searchQuery: '' }} />);
    await waitFor(() => screen.getByText('First story'));
    expect(fetchSpy).toHaveBeenCalledWith('https://news.google.com/rss?hl=en-US&gl=US&ceid=US:en', false);
    expect(screen.getByText('Google News: Top stories')).toBeInTheDocument();
  });

  it('キーワード検索でウィジェット設定とタイトルが更新されること', async () => {
    vi.spyOn(rssService, 'fetchFeed').mockResolvedValue(FEED);
    render(<RssFeedWidget widgetId="widget-rss-1" config={{ ...base, isGoogleNews: true, searchQuery: '' }} />);
    await waitFor(() => screen.getByText('First story'));

    fireEvent.click(screen.getByTitle('Search Google News'));
    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: '  space  ' } });
    fireEvent.submit(input.closest('form')!);

    const w = useDashboardStore.getState().widgets.find((x) => x.id === 'widget-rss-1')!;
    expect(w.config.searchQuery).toBe('space');
    expect(w.config.googleNewsMode).toBe('search');
    expect(w.config.feedUrl).toContain('q=space');
    expect(w.title).toBe('space News');
  });

  it('トピックモードではトピック名をヘッダーに出し、セクションURLを読むこと', async () => {
    const fetchSpy = vi.spyOn(rssService, 'fetchFeed').mockResolvedValue(FEED);
    render(
      <RssFeedWidget widgetId="widget-rss-1" config={{ ...base, isGoogleNews: true, googleNewsMode: 'topic', googleNewsTopic: 'SCIENCE' }} />
    );
    await waitFor(() => screen.getByText('First story'));
    expect(fetchSpy).toHaveBeenCalledWith('https://news.google.com/rss/headlines/section/topic/SCIENCE?hl=en-US&gl=US&ceid=US:en', false);
    expect(screen.getByText('Google News: Science')).toBeInTheDocument();
  });

  it('インライン検索に「headlines」と入れると主要ヘッドラインに戻ること', async () => {
    vi.spyOn(rssService, 'fetchFeed').mockResolvedValue(FEED);
    render(<RssFeedWidget widgetId="widget-rss-1" config={{ ...base, isGoogleNews: true, googleNewsMode: 'search', searchQuery: 'tech' }} />);
    await waitFor(() => screen.getByText('First story'));
    fireEvent.click(screen.getByTitle('Search Google News'));
    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: 'headlines' } });
    fireEvent.submit(input.closest('form')!);
    const w = useDashboardStore.getState().widgets.find((x) => x.id === 'widget-rss-1')!;
    expect(w.config.googleNewsMode).toBe('headlines');
    expect(w.config.searchQuery).toBe('');
  });

  it('キーワードを空で保存するとトップニュースに戻ること', async () => {
    vi.spyOn(rssService, 'fetchFeed').mockResolvedValue(FEED);
    render(<RssFeedWidget widgetId="widget-rss-1" config={{ ...base, isGoogleNews: true, searchQuery: 'tech' }} />);
    await waitFor(() => screen.getByText('First story'));
    expect(screen.getByText('Google News: "tech"')).toBeInTheDocument();

    fireEvent.click(screen.getByTitle('Search Google News'));
    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: '' } });
    fireEvent.submit(input.closest('form')!);

    const w = useDashboardStore.getState().widgets.find((x) => x.id === 'widget-rss-1')!;
    expect(w.config.searchQuery).toBe('');
    expect(w.config.googleNewsMode).toBe('headlines');
    expect(w.config.feedUrl).toBe('https://news.google.com/rss?hl=en-US&gl=US&ceid=US:en');
    expect(w.title).toBe('News');
  });

  it('検索フォームはキャンセルで閉じること', async () => {
    vi.spyOn(rssService, 'fetchFeed').mockResolvedValue(FEED);
    render(<RssFeedWidget widgetId="widget-rss-1" config={base} />);
    await waitFor(() => screen.getByText('First story'));
    fireEvent.click(screen.getByTitle('Search Google News'));
    fireEvent.click(screen.getByText('Cancel'));
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
  });

  it('権限が無いフィードでは許可ボタンを出し、許可後に再取得すること', async () => {
    const fetchSpy = vi
      .spyOn(rssService, 'fetchFeed')
      .mockRejectedValueOnce(new FeedPermissionRequired(base.feedUrl))
      .mockResolvedValue(FEED);

    render(<RssFeedWidget widgetId="widget-rss-1" config={base} />);
    await waitFor(() => expect(screen.getByText('Allow this feed')).toBeInTheDocument());

    fireEvent.click(screen.getByText('Allow this feed'));
    await waitFor(() => expect(screen.getByText('First story')).toBeInTheDocument());
    expect(chromeMock.permissions.request).toHaveBeenCalledWith({ origins: ['https://example.com/*'] });
    expect(fetchSpy).toHaveBeenLastCalledWith(base.feedUrl, true);
  });

  it('権限が拒否されたら許可ボタンのままであること', async () => {
    vi.spyOn(rssService, 'fetchFeed').mockRejectedValue(new FeedPermissionRequired(base.feedUrl));
    chromeMock.permissions.request.mockResolvedValue(false);
    render(<RssFeedWidget widgetId="widget-rss-1" config={base} />);
    await waitFor(() => screen.getByText('Allow this feed'));
    fireEvent.click(screen.getByText('Allow this feed'));
    await waitFor(() => expect(chromeMock.permissions.request).toHaveBeenCalled());
    expect(screen.getByText('Allow this feed')).toBeInTheDocument();
  });

  it('取得失敗時はエラーメッセージを表示すること', async () => {
    vi.spyOn(rssService, 'fetchFeed').mockRejectedValue(new Error('HTTP error 500'));
    render(<RssFeedWidget widgetId="widget-rss-1" config={base} />);
    await waitFor(() => expect(screen.getByText('Failed to load feed')).toBeInTheDocument());
    expect(screen.getByText('HTTP error 500')).toBeInTheDocument();
  });

  it('記事が無ければ空メッセージを表示し、更新ボタンで再取得すること', async () => {
    const fetchSpy = vi.spyOn(rssService, 'fetchFeed').mockResolvedValue({ ...FEED, items: [] });
    render(<RssFeedWidget widgetId="widget-rss-1" config={base} />);
    await waitFor(() => expect(screen.getByText('No articles found')).toBeInTheDocument());
    fireEvent.click(screen.getByTitle('Refresh Feed'));
    await waitFor(() => expect(fetchSpy).toHaveBeenLastCalledWith(base.feedUrl, true));
  });

  it('サムネイル・日付・説明を非表示にできること', async () => {
    vi.spyOn(rssService, 'fetchFeed').mockResolvedValue(FEED);
    const { container } = render(
      <RssFeedWidget widgetId="widget-rss-1" config={{ ...base, showThumbnail: false, showDate: false, showDescription: false }} />
    );
    await waitFor(() => screen.getByText('First story'));
    expect(container.querySelector('img')).not.toBeInTheDocument();
    expect(screen.queryByText('Snippet one')).not.toBeInTheDocument();
    expect(screen.queryByText('Just now')).not.toBeInTheDocument();
  });

  it('feedUrl が空なら取得せず空表示になること', async () => {
    const fetchSpy = vi.spyOn(rssService, 'fetchFeed');
    render(<RssFeedWidget widgetId="widget-rss-1" config={{ ...base, feedUrl: '' }} />);
    await waitFor(() => expect(screen.getByText('No articles found')).toBeInTheDocument());
    expect(fetchSpy).not.toHaveBeenCalled();
  });
});
