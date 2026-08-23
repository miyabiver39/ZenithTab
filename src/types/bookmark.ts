export interface BookmarkItem {
  id: string;
  parentId?: string;
  index?: number;
  url?: string;
  title: string;
  dateAdded?: number;
  dateGroupModified?: number;
  children?: BookmarkItem[];
  isFolder: boolean;
  faviconUrl?: string;
}
