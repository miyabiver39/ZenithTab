import { useState, useEffect, useCallback } from 'react';
import { BookmarkItem } from '../types/bookmark';
import { bookmarkService } from '../services/bookmarkService';

export function useBookmarks() {
  const [bookmarks, setBookmarks] = useState<BookmarkItem[]>([]);
  const [searchResults, setSearchResults] = useState<BookmarkItem[] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const loadBookmarks = useCallback(async () => {
    setIsLoading(true);
    try {
      const tree = await bookmarkService.getBookmarkTree();
      setBookmarks(tree);
    } catch (err) {
      console.error('Failed loading bookmarks:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadBookmarks();
  }, [loadBookmarks]);

  const handleSearch = useCallback(async (query: string) => {
    setSearchQuery(query);
    if (!query.trim()) {
      setSearchResults(null);
      return;
    }

    try {
      const results = await bookmarkService.searchBookmarks(query);
      setSearchResults(results);
    } catch (err) {
      console.error('Failed searching bookmarks:', err);
    }
  }, []);

  return {
    bookmarks,
    searchResults,
    searchQuery,
    isLoading,
    refreshBookmarks: loadBookmarks,
    searchBookmarks: handleSearch,
  };
}
