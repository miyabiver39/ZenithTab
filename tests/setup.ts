import '@testing-library/jest-dom';

// Setup basic global chrome mock for unit tests
if (typeof global.chrome === 'undefined') {
  const store: Record<string, any> = {};
  
  (global as any).chrome = {
    storage: {
      local: {
        get: (keys: string | string[] | Record<string, any> | null, cb?: (items: Record<string, any>) => void) => {
          let result: Record<string, any> = {};
          if (typeof keys === 'string') {
            result[keys] = store[keys];
          } else if (Array.isArray(keys)) {
            keys.forEach(k => { result[k] = store[k]; });
          } else if (keys === null) {
            result = { ...store };
          } else if (typeof keys === 'object') {
            for (const k in keys) {
              result[k] = store[k] !== undefined ? store[k] : keys[k];
            }
          }
          if (cb) cb(result);
          return Promise.resolve(result);
        },
        set: (items: Record<string, any>, cb?: () => void) => {
          Object.assign(store, items);
          if (cb) cb();
          return Promise.resolve();
        },
        remove: (keys: string | string[], cb?: () => void) => {
          const arr = Array.isArray(keys) ? keys : [keys];
          arr.forEach(k => delete store[k]);
          if (cb) cb();
          return Promise.resolve();
        },
        clear: (cb?: () => void) => {
          for (const key in store) delete store[key];
          if (cb) cb();
          return Promise.resolve();
        }
      }
    },
    bookmarks: {
      getTree: (cb?: (nodes: chrome.bookmarks.BookmarkTreeNode[]) => void) => {
        const mockTree: chrome.bookmarks.BookmarkTreeNode[] = [
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
                    ]
                  }
                ]
              },
              {
                id: '2',
                title: 'Other bookmarks',
                children: [
                  { id: '20', title: 'Zenith Docs', url: 'https://zenith-tab.dev' }
                ]
              }
            ]
          }
        ];
        if (cb) cb(mockTree);
        return Promise.resolve(mockTree);
      },
      search: (_query: string | chrome.bookmarks.BookmarkSearchQuery, cb?: (results: chrome.bookmarks.BookmarkTreeNode[]) => void) => {
        const results = [
          { id: '10', title: 'GitHub', url: 'https://github.com' }
        ];
        if (cb) cb(results);
        return Promise.resolve(results);
      }
    },
    alarms: {
      create: () => {},
      clear: () => Promise.resolve(true),
      get: () => Promise.resolve(undefined),
      getAll: () => Promise.resolve([]),
      onAlarm: {
        addListener: () => {},
        removeListener: () => {},
        hasListener: () => false,
      }
    },
    runtime: {
      id: 'mock-extension-id',
      getURL: (path: string) => `chrome-extension://mock-extension-id/${path}`,
      lastError: undefined,
    }
  };
}
