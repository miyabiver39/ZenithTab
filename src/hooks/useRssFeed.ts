import { useState, useEffect, useCallback } from 'react';
import { RssFeedData } from '../types/rss';
import { rssService } from '../services/rssService';

export function useRssFeed(feedUrl: string, refreshIntervalMinutes = 30) {
  const [data, setData] = useState<RssFeedData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
    } catch (err: any) {
      setError(err?.message || 'Failed to fetch RSS feed');
    } finally {
      setIsLoading(false);
    }
  }, [feedUrl]);

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
    refresh: () => fetchFeedData(true),
  };
}
