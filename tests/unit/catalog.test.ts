import { describe, it, expect } from 'vitest';
import { getSiteCatalog, getSiteCategories, SITE_CATALOG_LANGUAGES, REGION_LABELS } from '../../src/config/catalog/siteCatalog';
import { getFeedCatalog, FEED_CATEGORIES } from '../../src/config/catalog/feedCatalog';
import { getRegionalDockItems, getRegionalShortcuts } from '../../src/config/defaults/regionalPresets';
import { DOCK_ICON_LIBRARY } from '../../src/utils/dockIcons';
import { isSafeHttpUrl } from '../../src/utils/url';

describe('siteCatalog', () => {
  it('全地域に 30 件以上のサイトがあり、id が重複せず、URL が https であること', () => {
    for (const lang of SITE_CATALOG_LANGUAGES) {
      const sites = getSiteCatalog(lang);
      expect(sites.length, lang).toBeGreaterThanOrEqual(30);
      expect(new Set(sites.map((s) => s.id)).size, `${lang} ids`).toBe(sites.length);
      expect(new Set(sites.map((s) => s.url.toLowerCase())).size, `${lang} urls`).toBe(sites.length);
      for (const s of sites) {
        expect(isSafeHttpUrl(s.url), `${lang}/${s.id}`).toBe(true);
        expect(s.url.startsWith('https://'), `${lang}/${s.id}`).toBe(true);
        expect(DOCK_ICON_LIBRARY[s.icon], `${lang}/${s.id} icon ${s.icon}`).toBeDefined();
        expect(s.title.trim()).toBe(s.title);
        expect(s.category).toBeTruthy();
      }
      expect(getSiteCategories(lang).length, lang).toBeGreaterThanOrEqual(6);
      expect(REGION_LABELS[lang]).toBeTruthy();
    }
  });

  it('既定のドック 6 件 / ショートカット 12 件が順位つきで一意に決まること', () => {
    for (const lang of SITE_CATALOG_LANGUAGES) {
      const sites = getSiteCatalog(lang);
      const dockRanks = sites.filter((s) => s.dock).map((s) => s.dock!).sort((a, b) => a - b);
      const appRanks = sites.filter((s) => s.shortcut).map((s) => s.shortcut!).sort((a, b) => a - b);
      expect(dockRanks, `${lang} dock`).toEqual([1, 2, 3, 4, 5, 6]);
      expect(appRanks, `${lang} shortcuts`).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);
      expect(getRegionalDockItems(lang).map((d) => d.id)).toEqual(sites.filter((s) => s.dock).sort((a, b) => a.dock! - b.dock!).map((s) => `dock-${s.id}`));
      expect(getRegionalShortcuts(lang)).toHaveLength(12);
    }
  });

  it('返す配列は毎回新しいコピーであること', () => {
    const a = getSiteCatalog('ja');
    a[0].title = 'changed';
    expect(getSiteCatalog('ja')[0].title).toBe('Google');
  });
});

describe('feedCatalog', () => {
  it('全地域に 12 件以上のフィードがあり、カテゴリが既知で URL が https であること', () => {
    for (const lang of SITE_CATALOG_LANGUAGES) {
      const feeds = getFeedCatalog(lang);
      expect(feeds.length, lang).toBeGreaterThanOrEqual(12);
      expect(new Set(feeds.map((f) => f.id)).size).toBe(feeds.length);
      for (const f of feeds) {
        expect(FEED_CATEGORIES).toContain(f.category);
        expect(f.url.startsWith('https://'), `${lang}/${f.id}`).toBe(true);
      }
      // Every region offers at least general news and technology.
      expect(feeds.some((f) => f.category === 'general')).toBe(true);
      expect(feeds.some((f) => f.category === 'tech')).toBe(true);
    }
  });
});
