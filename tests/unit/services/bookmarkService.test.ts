import { describe, it, expect, vi, afterEach } from 'vitest';
import { bookmarkService } from '../../../src/services/bookmarkService';
import { chromeMock, installChromeMock, uninstallChromeMock } from '../../helpers/chrome';

describe('bookmarkService', () => {
  afterEach(() => {
    installChromeMock();
    vi.restoreAllMocks();
  });

  describe('getBookmarkTree', () => {
    it('Chrome のツリーをルートの子から展開して変換すること', async () => {
      const tree = await bookmarkService.getBookmarkTree();

      expect(tree.map((n) => n.title)).toEqual(['Bookmarks bar', 'Other bookmarks']);
      const bar = tree[0];
      expect(bar.isFolder).toBe(true);
      expect(bar.children?.map((c) => c.title)).toEqual(['GitHub', 'Google', 'Dev Tools']);

      const github = bar.children![0];
      expect(github.isFolder).toBe(false);
      expect(github.url).toBe('https://github.com');
      expect(github.faviconUrl).toContain('_favicon');
      expect(github.faviconUrl).toContain('pageUrl=https%3A%2F%2Fgithub.com');

      const devTools = bar.children![2];
      expect(devTools.isFolder).toBe(true);
      expect(devTools.faviconUrl).toBeUndefined();
      expect(devTools.children).toHaveLength(2);
    });

    it('ルートに子が無い場合はツリーをそのまま変換すること', async () => {
      chromeMock.bookmarks.getTree.mockResolvedValue([{ id: '0', title: 'root', children: [] }]);
      const tree = await bookmarkService.getBookmarkTree();
      expect(tree).toHaveLength(1);
      expect(tree[0].isFolder).toBe(true);
    });

    it('タイトルが空のノードにはプレースホルダ名を付けること', async () => {
      chromeMock.bookmarks.getTree.mockResolvedValue([
        { id: '0', title: '', children: [{ id: '1', title: '', children: [{ id: '5', title: '', url: 'https://a.example' }] }] },
      ]);
      const tree = await bookmarkService.getBookmarkTree();
      expect(tree[0].title).toBe('Untitled Folder');
      expect(tree[0].children?.[0].title).toBe('Untitled Bookmark');
    });

    it('Chrome API が失敗した場合はモックデータにフォールバックすること', async () => {
      vi.spyOn(console, 'warn').mockImplementation(() => {});
      chromeMock.bookmarks.getTree.mockRejectedValue(new Error('denied'));
      const tree = await bookmarkService.getBookmarkTree();
      expect(tree[0].title).toBe('Bookmarks Bar');
      expect(tree[0].children?.some((c) => c.title === 'Development')).toBe(true);
    });

    it('Chrome API が無い環境ではモックデータを返すこと', async () => {
      uninstallChromeMock();
      const tree = await bookmarkService.getBookmarkTree();
      expect(tree[0].title).toBe('Bookmarks Bar');
    });
  });

  describe('searchBookmarks', () => {
    it('空クエリは空配列を返し API を呼ばないこと', async () => {
      expect(await bookmarkService.searchBookmarks('   ')).toEqual([]);
      expect(chromeMock.bookmarks.search).not.toHaveBeenCalled();
    });

    it('Chrome の検索結果を変換して返すこと', async () => {
      const results = await bookmarkService.searchBookmarks('git');
      expect(chromeMock.bookmarks.search).toHaveBeenCalledWith('git');
      expect(results).toHaveLength(1);
      expect(results[0]).toMatchObject({ title: 'GitHub', isFolder: false });
    });

    it('Chrome の検索が失敗した場合はモックデータをタイトル/URLで検索すること', async () => {
      vi.spyOn(console, 'warn').mockImplementation(() => {});
      chromeMock.bookmarks.search.mockRejectedValue(new Error('denied'));

      const byTitle = await bookmarkService.searchBookmarks('stack');
      expect(byTitle.map((b) => b.title)).toEqual(['Stack Overflow']);

      const byUrl = await bookmarkService.searchBookmarks('mozilla.org');
      expect(byUrl.map((b) => b.title)).toEqual(['MDN Web Docs']);

      const folder = await bookmarkService.searchBookmarks('development');
      expect(folder[0].isFolder).toBe(true);
    });

    it('Chrome API が無い環境ではモック検索を使うこと', async () => {
      uninstallChromeMock();
      const results = await bookmarkService.searchBookmarks('youtube');
      expect(results.map((b) => b.title)).toEqual(['YouTube']);
    });
  });
});
