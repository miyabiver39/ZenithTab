import { vi } from 'vitest';

/**
 * In-memory stand-in for the Chrome extension APIs ZenithTab touches.
 *
 * Every function is a `vi.fn` with a default implementation, so a test can
 * override behaviour for one case (`chrome.permissions.request.mockResolvedValueOnce(false)`)
 * and `resetChromeMock()` (run automatically after each test) puts the
 * defaults back and wipes storage, so nothing leaks between tests.
 */

export const chromeStorageData: Record<string, any> = {};

/** Pending failure injected by `failNextStorageCall`; consumed by the next call. */
let pendingStorageError: Error | null = null;

function takeStorageError(): Error | null {
  const err = pendingStorageError;
  pendingStorageError = null;
  return err;
}

/**
 * Makes the next `chrome.storage.local.*` call reject (and expose
 * `chrome.runtime.lastError` while it does), mimicking a quota or IO
 * failure so fallback paths can be exercised.
 */
export function failNextStorageCall(message = 'Simulated chrome.storage failure') {
  pendingStorageError = new Error(message);
}

async function withStorageFailure<T>(run: () => T): Promise<T> {
  const err = takeStorageError();
  if (err) {
    chromeMock.runtime.lastError = { message: err.message };
    try {
      throw err;
    } finally {
      chromeMock.runtime.lastError = undefined;
    }
  }
  return run();
}

export const MOCK_BOOKMARK_TREE: chrome.bookmarks.BookmarkTreeNode[] = [
  {
    id: '0',
    title: 'root',
    children: [
      {
        id: '1',
        title: 'Bookmarks bar',
        children: [
          { id: '10', title: 'GitHub', url: 'https://github.com' },
          { id: '11', title: 'Google', url: 'https://google.com' },
          {
            id: '12',
            title: 'Dev Tools',
            children: [
              { id: '120', title: 'MDN Web Docs', url: 'https://developer.mozilla.org' },
              { id: '121', title: 'Stack Overflow', url: 'https://stackoverflow.com' },
            ],
          },
        ],
      },
      {
        id: '2',
        title: 'Other bookmarks',
        children: [{ id: '20', title: 'Zenith Docs', url: 'https://zenith-tab.dev' }],
      },
    ],
  },
];

const storageGetImpl = (keys: string | string[] | Record<string, any> | null) =>
  withStorageFailure(() => {
    let result: Record<string, any> = {};
    if (typeof keys === 'string') {
      result[keys] = chromeStorageData[keys];
    } else if (Array.isArray(keys)) {
      keys.forEach((k) => {
        result[k] = chromeStorageData[k];
      });
    } else if (keys === null || keys === undefined) {
      result = { ...chromeStorageData };
    } else {
      for (const k in keys) {
        result[k] = chromeStorageData[k] !== undefined ? chromeStorageData[k] : keys[k];
      }
    }
    return result;
  });

const storageSetImpl = (items: Record<string, any>) =>
  withStorageFailure(() => {
    // Round-trip through JSON like the real API: callers must not rely on
    // object identity surviving a save.
    Object.assign(chromeStorageData, JSON.parse(JSON.stringify(items)));
  });

const storageRemoveImpl = (keys: string | string[]) =>
  withStorageFailure(() => {
    (Array.isArray(keys) ? keys : [keys]).forEach((k) => delete chromeStorageData[k]);
  });

const storageClearImpl = () =>
  withStorageFailure(() => {
    for (const key in chromeStorageData) delete chromeStorageData[key];
  });

const bookmarkSearchImpl = (query: string | chrome.bookmarks.BookmarkSearchQuery) => {
  const text = (typeof query === 'string' ? query : query.query || '').toLowerCase();
  const hits: chrome.bookmarks.BookmarkTreeNode[] = [];
  const walk = (nodes: chrome.bookmarks.BookmarkTreeNode[]) => {
    for (const node of nodes) {
      if (node.url && (node.title.toLowerCase().includes(text) || node.url.toLowerCase().includes(text))) {
        hits.push({ id: node.id, title: node.title, url: node.url });
      }
      if (node.children) walk(node.children);
    }
  };
  walk(MOCK_BOOKMARK_TREE);
  return Promise.resolve(hits);
};

export const MOCK_TOP_SITES: chrome.topSites.MostVisitedURL[] = [
  { title: 'YouTube', url: 'https://www.youtube.com/' },
  { title: 'Company Portal', url: 'https://portal.example.com/' },
  { title: '', url: 'https://news.example.com/' },
  { title: 'Not http', url: 'chrome://extensions' },
];

// Only the fields the service reads; cast because chrome.tabs.Tab has many more.
export const MOCK_RECENTLY_CLOSED = [
  { lastModified: 1700000000, tab: { sessionId: 's-1', title: 'Closed article', url: 'https://blog.example.com/post', index: 0, highlighted: false, active: false, pinned: false, incognito: false, selected: false, discarded: false, autoDiscardable: true, groupId: -1 } },
  {
    lastModified: 1699999000,
    window: {
      sessionId: 'w-1',
      focused: false,
      alwaysOnTop: false,
      incognito: false,
      tabs: [
        { sessionId: 's-2', title: 'Docs', url: 'https://docs.example.com/', index: 0, highlighted: false, active: false, pinned: false, incognito: false, selected: false, discarded: false, autoDiscardable: true, groupId: -1 },
        { sessionId: 's-3', title: 'Internal', url: 'chrome://settings', index: 1, highlighted: false, active: false, pinned: false, incognito: false, selected: false, discarded: false, autoDiscardable: true, groupId: -1 },
      ],
    },
  },
] as unknown as chrome.sessions.Session[];

const storageListeners = new Set<(changes: Record<string, chrome.storage.StorageChange>, area: string) => void>();

export const chromeMock = {
  storage: {
    local: {
      get: vi.fn(storageGetImpl),
      set: vi.fn(storageSetImpl),
      remove: vi.fn(storageRemoveImpl),
      clear: vi.fn(storageClearImpl),
    },
    onChanged: {
      addListener: vi.fn((fn: any) => storageListeners.add(fn)),
      removeListener: vi.fn((fn: any) => storageListeners.delete(fn)),
      hasListener: vi.fn((fn: any) => storageListeners.has(fn)),
    },
  },
  bookmarks: {
    getTree: vi.fn(() => Promise.resolve(MOCK_BOOKMARK_TREE)),
    search: vi.fn(bookmarkSearchImpl),
  },
  alarms: {
    create: vi.fn(),
    clear: vi.fn(() => Promise.resolve(true)),
    get: vi.fn(() => Promise.resolve(undefined)),
    getAll: vi.fn(() => Promise.resolve([])),
    onAlarm: {
      addListener: vi.fn(),
      removeListener: vi.fn(),
      hasListener: vi.fn(() => false),
    },
  },
  topSites: {
    get: vi.fn(() => Promise.resolve(MOCK_TOP_SITES)),
  },
  sessions: {
    getRecentlyClosed: vi.fn(() => Promise.resolve(MOCK_RECENTLY_CLOSED)),
    restore: vi.fn(() => Promise.resolve(MOCK_RECENTLY_CLOSED[0])),
  },
  permissions: {
    contains: vi.fn(() => Promise.resolve(true)),
    request: vi.fn(() => Promise.resolve(true)),
    remove: vi.fn(() => Promise.resolve(true)),
    getAll: vi.fn(() => Promise.resolve({ permissions: [], origins: [] })),
  },
  runtime: {
    id: 'mock-extension-id',
    // Like the real API, a leading slash on `path` is not doubled up.
    getURL: vi.fn((path: string) => `chrome-extension://mock-extension-id/${path.replace(/^\/+/, '')}`),
    // Deliberately not the real version: tests assert on shape, not on a
    // number that changes with every release.
    getManifest: vi.fn(() => ({ version: '9.9.9', name: 'ZenithTab (test)' })),
    lastError: undefined as { message: string } | undefined,
    // Service-worker entry points; tests grab the registered listeners.
    onInstalled: { addListener: vi.fn() },
    onMessage: { addListener: vi.fn() },
  },
};

/** Fires `chrome.storage.onChanged` listeners as another tab's write would. */
export function emitStorageChange(changes: Record<string, chrome.storage.StorageChange>, area = 'local') {
  storageListeners.forEach((fn) => fn(changes, area));
}

/** Restores every default implementation and empties the fake storage. */
export function resetChromeMock() {
  pendingStorageError = null;
  for (const key in chromeStorageData) delete chromeStorageData[key];
  storageListeners.clear();

  chromeMock.storage.local.get.mockReset().mockImplementation(storageGetImpl);
  chromeMock.storage.local.set.mockReset().mockImplementation(storageSetImpl);
  chromeMock.storage.local.remove.mockReset().mockImplementation(storageRemoveImpl);
  chromeMock.storage.local.clear.mockReset().mockImplementation(storageClearImpl);
  chromeMock.storage.onChanged.addListener.mockReset().mockImplementation((fn: any) => storageListeners.add(fn));
  chromeMock.storage.onChanged.removeListener.mockReset().mockImplementation((fn: any) => storageListeners.delete(fn));
  chromeMock.bookmarks.getTree.mockReset().mockImplementation(() => Promise.resolve(MOCK_BOOKMARK_TREE));
  chromeMock.bookmarks.search.mockReset().mockImplementation(bookmarkSearchImpl);
  chromeMock.topSites.get.mockReset().mockImplementation(() => Promise.resolve(MOCK_TOP_SITES));
  chromeMock.sessions.getRecentlyClosed.mockReset().mockImplementation(() => Promise.resolve(MOCK_RECENTLY_CLOSED));
  chromeMock.sessions.restore.mockReset().mockImplementation(() => Promise.resolve(MOCK_RECENTLY_CLOSED[0]));
  chromeMock.permissions.contains.mockReset().mockImplementation(() => Promise.resolve(true));
  chromeMock.permissions.request.mockReset().mockImplementation(() => Promise.resolve(true));
  chromeMock.permissions.remove.mockReset().mockImplementation(() => Promise.resolve(true));
  chromeMock.runtime.lastError = undefined;
}

export function installChromeMock() {
  (globalThis as any).chrome = chromeMock;
}

export function uninstallChromeMock() {
  delete (globalThis as any).chrome;
}
