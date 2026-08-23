import React, { useState } from 'react';
import { Folder, ChevronRight, ExternalLink, Search, Globe } from 'lucide-react';
import { BookmarkWidgetConfig } from '../../../types/widget';
import { BookmarkItem } from '../../../types/bookmark';
import { useBookmarks } from '../../../hooks/useBookmarks';

interface BookmarkWidgetProps {
  config: BookmarkWidgetConfig;
}

export const BookmarkWidget: React.FC<BookmarkWidgetProps> = ({ config }) => {
  const { viewMode = 'grid', showFavicons = true } = config;
  const { bookmarks, searchResults, searchQuery, searchBookmarks, isLoading } = useBookmarks();

  // Navigation state: path of folder items traversed
  const [folderPath, setFolderPath] = useState<BookmarkItem[]>([]);

  // Current folder items to display
  const currentFolder = folderPath.length > 0 ? folderPath[folderPath.length - 1] : null;
  const currentItems = currentFolder ? currentFolder.children || [] : bookmarks;

  const displayedItems = searchQuery ? searchResults || [] : currentItems;

  const navigateIntoFolder = (folder: BookmarkItem) => {
    setFolderPath((prev) => [...prev, folder]);
  };

  const navigateToBreadcrumb = (index: number) => {
    if (index === -1) {
      setFolderPath([]);
    } else {
      setFolderPath((prev) => prev.slice(0, index + 1));
    }
  };

  if (isLoading) {
    return (
      <div className="w-full h-full flex items-center justify-center text-xs text-slate-400">
        Loading bookmarks...
      </div>
    );
  }

  return (
    <div className="w-full h-full flex flex-col min-h-0 select-none">
      {/* Top Bar: Search & Breadcrumbs */}
      <div className="flex flex-col gap-1.5 pb-2 border-b border-white/5">
        {/* Search Input */}
        <div className="relative">
          <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => searchBookmarks(e.target.value)}
            placeholder="Search bookmarks..."
            className="w-full pl-8 pr-3 py-1 bg-slate-800/40 border border-white/10 rounded-lg text-xs text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-sky-400"
          />
        </div>

        {/* Breadcrumb Navigation */}
        {!searchQuery && (
          <div className="flex items-center gap-1 text-[11px] text-slate-400 overflow-x-auto whitespace-nowrap py-0.5 custom-scrollbar">
            <button
              onClick={() => navigateToBreadcrumb(-1)}
              className="hover:text-white hover:underline transition-colors"
            >
              All
            </button>
            {folderPath.map((folder, index) => (
              <React.Fragment key={folder.id}>
                <ChevronRight size={10} className="text-slate-500 flex-shrink-0" />
                <button
                  onClick={() => navigateToBreadcrumb(index)}
                  className={`hover:text-white truncate max-w-[100px] transition-colors ${
                    index === folderPath.length - 1 ? 'text-sky-400 font-medium' : ''
                  }`}
                >
                  {folder.title}
                </button>
              </React.Fragment>
            ))}
          </div>
        )}
      </div>

      {/* Items Container */}
      <div className="flex-1 overflow-y-auto mt-2 pr-1 custom-scrollbar">
        {displayedItems.length === 0 ? (
          <div className="h-full flex items-center justify-center text-xs text-slate-400">
            {searchQuery ? 'No bookmarks found' : 'Folder is empty'}
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {displayedItems.map((item) => (
              <BookmarkGridCard
                key={item.id}
                item={item}
                showFavicons={showFavicons}
                onOpenFolder={() => navigateIntoFolder(item)}
              />
            ))}
          </div>
        ) : (
          <div className="flex flex-col gap-1">
            {displayedItems.map((item) => (
              <BookmarkListItem
                key={item.id}
                item={item}
                showFavicons={showFavicons}
                onOpenFolder={() => navigateIntoFolder(item)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

const BookmarkGridCard: React.FC<{
  item: BookmarkItem;
  showFavicons: boolean;
  onOpenFolder: () => void;
}> = ({ item, showFavicons, onOpenFolder }) => {
  const [imgError, setImgError] = useState(false);

  if (item.isFolder) {
    return (
      <button
        onClick={onOpenFolder}
        className="flex flex-col items-center justify-center p-2.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.09] border border-white/5 hover:border-white/15 transition-all text-center group"
      >
        <Folder size={22} className="text-amber-400 mb-1.5 group-hover:scale-110 transition-transform" />
        <span className="text-xs font-medium text-slate-200 truncate w-full group-hover:text-white">
          {item.title}
        </span>
        <span className="text-[10px] text-slate-400">
          {item.children ? `${item.children.length} items` : 'Folder'}
        </span>
      </button>
    );
  }

  return (
    <a
      href={item.url}
      target="_blank"
      rel="noopener noreferrer"
      className="flex flex-col items-center justify-center p-2.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.09] border border-white/5 hover:border-white/15 transition-all text-center group"
    >
      {showFavicons && item.faviconUrl && !imgError ? (
        <img
          src={item.faviconUrl}
          alt=""
          onError={() => setImgError(true)}
          className="w-6 h-6 rounded-md mb-1.5 group-hover:scale-110 transition-transform"
        />
      ) : (
        <Globe size={22} className="text-sky-400 mb-1.5 group-hover:scale-110 transition-transform" />
      )}
      <span className="text-xs font-medium text-slate-200 truncate w-full group-hover:text-sky-300">
        {item.title}
      </span>
      <span className="text-[10px] text-slate-400 truncate w-full">
        {item.url ? new URL(item.url).hostname : ''}
      </span>
    </a>
  );
};

const BookmarkListItem: React.FC<{
  item: BookmarkItem;
  showFavicons: boolean;
  onOpenFolder: () => void;
}> = ({ item, showFavicons, onOpenFolder }) => {
  const [imgError, setImgError] = useState(false);

  if (item.isFolder) {
    return (
      <button
        onClick={onOpenFolder}
        className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-white/[0.03] hover:bg-white/[0.08] transition-colors text-left group"
      >
        <div className="flex items-center gap-2 overflow-hidden">
          <Folder size={16} className="text-amber-400 flex-shrink-0" />
          <span className="text-xs text-slate-200 truncate group-hover:text-white">
            {item.title}
          </span>
        </div>
        <ChevronRight size={14} className="text-slate-400 flex-shrink-0" />
      </button>
    );
  }

  return (
    <a
      href={item.url}
      target="_blank"
      rel="noopener noreferrer"
      className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-white/[0.03] hover:bg-white/[0.08] transition-colors text-left group"
    >
      <div className="flex items-center gap-2 overflow-hidden">
        {showFavicons && item.faviconUrl && !imgError ? (
          <img
            src={item.faviconUrl}
            alt=""
            onError={() => setImgError(true)}
            className="w-4 h-4 rounded-sm flex-shrink-0"
          />
        ) : (
          <Globe size={16} className="text-sky-400 flex-shrink-0" />
        )}
        <span className="text-xs text-slate-200 truncate group-hover:text-sky-300">
          {item.title}
        </span>
      </div>
      <ExternalLink size={12} className="text-slate-500 group-hover:text-slate-300 flex-shrink-0 ml-2" />
    </a>
  );
};
