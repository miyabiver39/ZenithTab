import { describe, it, expect } from 'vitest';
import {
  BUILTIN_SEARCH_KEYS,
  BUILTIN_SEARCH_TEMPLATES,
  builtinForTemplate,
  getSearchEngineCatalog,
} from '../../src/config/catalog/searchEngineCatalog';
import { SITE_CATALOG_LANGUAGES } from '../../src/config/catalog/siteCatalog';
import { normalizeSearchUrlTemplate } from '../../src/components/widgets/SearchWidget/SearchConfig';

describe('searchEngineCatalog', () => {
  it.each(SITE_CATALOG_LANGUAGES)('%s: すべてのテンプレートがそのまま保存できる安全な URL で、ID が重複しないこと', (region) => {
    const catalog = getSearchEngineCatalog(region);
    expect(new Set(catalog.map((e) => e.id)).size).toBe(catalog.length);
    expect(new Set(catalog.map((e) => e.urlTemplate)).size).toBe(catalog.length);
    for (const engine of catalog) {
      // Picked entries are stored as-is, so they must already pass the save-time check.
      expect(normalizeSearchUrlTemplate(engine.urlTemplate)).toBe(engine.urlTemplate);
    }
  });

  it.each(SITE_CATALOG_LANGUAGES)('%s: 組み込みエンジンはどの地域にも並び、AI カテゴリに複数のサービスがあること', (region) => {
    const catalog = getSearchEngineCatalog(region);
    for (const key of BUILTIN_SEARCH_KEYS) {
      expect(catalog.find((e) => e.builtin === key)?.urlTemplate).toBe(BUILTIN_SEARCH_TEMPLATES[key]);
    }
    expect(catalog.filter((e) => e.category === 'ai').length).toBeGreaterThanOrEqual(5);
  });

  it('地域限定のエンジンはその地域にだけ出ること', () => {
    expect(getSearchEngineCatalog('ja').some((e) => e.id === 'yahoo-japan')).toBe(true);
    expect(getSearchEngineCatalog('de').some((e) => e.id === 'yahoo-japan')).toBe(false);
    expect(getSearchEngineCatalog('ko').some((e) => e.id === 'naver')).toBe(true);
  });

  it('builtinForTemplate は組み込みエンジンのテンプレートだけを見分けること', () => {
    expect(builtinForTemplate('https://chatgpt.com/?q={query}')).toBe('chatgpt');
    expect(builtinForTemplate('https://claude.ai/new?q={query}')).toBeUndefined();
  });
});
