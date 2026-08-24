import { useState, useEffect, useCallback } from 'react';
import { RssFeedData } from '../types/rss';
import { rssService, FeedPermissionRequired } from '../services/rssService';
import { requestHostPermission } from '../utils/permissions';

export function useRssFeed(feedUrl: string, refreshIntervalMinutes = 30) {
  const [data, setData] = useState<RssFeedData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [needsPermission, setNeedsPermission] = useState(false);

  const fetchFeedData = useCallback(async (force = false) => {
    if (!feedUrl) {
      setData(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await rssService.fetchFeed(feedUrl, force);
      setData(result);
      setNeedsPermission(false);
    } catch (err: any) {
      if (err instanceof FeedPermissionRequired) {
        setNeedsPermission(true);
        setError(null);
      } else {
        setNeedsPermission(false);
        setError(err?.message || 'Failed to fetch RSS feed');
      }
    } finally {
      setIsLoading(false);
    }
  }, [feedUrl]);

  /**
   * Must be invoked directly from a click handler — Chrome only shows the
   * permission prompt while a user gesture is still in scope.
   */
  const grantAccess = useCallback(async () => {
    if (!feedUrl) return false;
    const granted = await requestHostPermission(feedUrl);
    if (granted) {
      await fetchFeedData(true);
    }
    return granted;
  }, [feedUrl, fetchFeedData]);

  useEffect(() => {
    fetchFeedData();

    if (refreshIntervalMinutes > 0) {
      const interval = setInterval(() => {
        fetchFeedData(true);
      }, refreshIntervalMinutes * 60 * 1000);

      return () => clearInterval(interval);
    }
  }, [fetchFeedData, refreshIntervalMinutes]);

  return {
    data,
    items: data?.items || [],
    isLoading,
    error,
    needsPermission,
    grantAccess,
    refresh: () => fetchFeedData(true),
  };
}
