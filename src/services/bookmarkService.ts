import { BookmarkItem } from '../types/bookmark';
import { getFaviconUrl } from '../utils/favicon';

const MOCK_BOOKMARKS: BookmarkItem[] = [
  {
    id: 'folder-bar',
    title: 'Bookmarks Bar',
    isFolder: true,
    children: [
      {
        id: 'bm-1',
        title: 'GitHub',
        url: 'https://github.com',
        isFolder: false,
        faviconUrl: getFaviconUrl('https://github.com'),
      },
      {
        id: 'bm-2',
        title: 'Google',
        url: 'https://google.com',
        isFolder: false,
        faviconUrl: getFaviconUrl('https://google.com'),
      },
      {
        id: 'bm-3',
        title: 'YouTube',
        url: 'https://youtube.com',
        isFolder: false,
        faviconUrl: getFaviconUrl('https://youtube.com'),
      },
      {
        id: 'bm-4',
        title: 'Reddit',
        url: 'https://reddit.com',
        isFolder: false,
        faviconUrl: getFaviconUrl('https://reddit.com'),
      },
      {
        id: 'folder-dev',
        title: 'Development',
        isFolder: true,
        children: [
          {
            id: 'bm-5',
            title: 'MDN Web Docs',
            url: 'https://developer.mozilla.org',
            isFolder: false,
            faviconUrl: getFaviconUrl('https://developer.mozilla.org'),
          },
          {
            id: 'bm-6',
            title: 'Stack Overflow',
            url: 'https://stackoverflow.com',
            isFolder: false,
            faviconUrl: getFaviconUrl('https://stackoverflow.com'),
          },
          {
            id: 'bm-7',
            title: 'Tailwind CSS',
            url: 'https://tailwindcss.com',
            isFolder: false,
            faviconUrl: getFaviconUrl('https://tailwindcss.com'),
          },
        ],
      },
    ],
  },
];

function transformChromeBookmarkNode(node: chrome.bookmarks.BookmarkTreeNode): BookmarkItem {
  const isFolder = !node.url && (!!node.children || node.id === '0' || node.id === '1' || node.id === '2');
  const item: BookmarkItem = {
    id: node.id,
    parentId: node.parentId,
    index: node.index,
    title: node.title || (isFolder ? 'Untitled Folder' : 'Untitled Bookmark'),
    url: node.url,
    dateAdded: node.dateAdded,
    dateGroupModified: node.dateGroupModified,
    isFolder,
    faviconUrl: node.url ? getFaviconUrl(node.url) : undefined,
  };

  if (node.children) {
    item.children = node.children.map(transformChromeBookmarkNode);
  }

  return item;
}

export const bookmarkService = {
  async getBookmarkTree(): Promise<BookmarkItem[]> {
    if (typeof chrome !== 'undefined' && chrome.bookmarks?.getTree) {
      try {
        const tree = await chrome.bookmarks.getTree();
        if (tree && tree.length > 0) {
          // If root has children, unpack them
          const root = tree[0];
          if (root.children && root.children.length > 0) {
            return root.children.map(transformChromeBookmarkNode);
          }
          return tree.map(transformChromeBookmarkNode);
        }
      } catch (err) {
        console.warn('Failed to access chrome.bookmarks API:', err);
      }
    }

    return MOCK_BOOKMARKS;
  },

  async searchBookmarks(query: string): Promise<BookmarkItem[]> {
    if (!query.trim()) {
      return [];
    }

    if (typeof chrome !== 'undefined' && chrome.bookmarks?.search) {
      try {
        const results = await chrome.bookmarks.search(query);
        return results.map(transformChromeBookmarkNode);
      } catch (err) {
        console.warn('Failed searching chrome.bookmarks:', err);
      }
    }

    // Fallback search over mock items
    const lower = query.toLowerCase();
    const matches: BookmarkItem[] = [];

    function searchRecursive(items: BookmarkItem[]) {
      for (const item of items) {
        if (
          item.title.toLowerCase().includes(lower) ||
          (item.url && item.url.toLowerCase().includes(lower))
        ) {
          matches.push(item);
        }
        if (item.children) {
          searchRecursive(item.children);
        }
      }
    }

    searchRecursive(MOCK_BOOKMARKS);
    return matches;
  },
};
