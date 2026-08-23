export interface RssFeedItem {
  id: string;
  title: string;
  link: string;
  pubDate?: string;
  isoDate?: string;
  contentSnippet?: string;
  content?: string;
  creator?: string;
  imageUrl?: string;
  sourceTitle?: string;
}

export interface RssFeedData {
  title: string;
  description?: string;
  link?: string;
  lastUpdated: number;
  items: RssFeedItem[];
}

export interface CachedFeedStore {
  [feedUrl: string]: RssFeedData;
}
