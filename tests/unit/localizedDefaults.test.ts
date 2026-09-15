import { describe, it, expect } from 'vitest';
import { rssService } from '../../src/services/rssService';
import { createDefaultWidgets, createDefaultLayouts } from '../../src/services/storageService';
import { getPageDisplayName } from '../../src/utils/pageName';
import { LOCALES } from '../../src/i18n/resolve';
import { useDashboardStore } from '../../src/store/useDashboardStore';

describe('Google News URLs', () => {
  it('言語ごとに地域エディションのトップニュースURLを生成すること', () => {
    expect(rssService.buildGoogleNewsTopStoriesUrl('ja')).toBe('https://news.google.com/rss?hl=ja&gl=JP&ceid=JP:ja');
    expect(rssService.buildGoogleNewsTopStoriesUrl('de')).toBe('https://news.google.com/rss?hl=de&gl=DE&ceid=DE:de');
    expect(rssService.buildGoogleNewsTopStoriesUrl('xx')).toBe('https://news.google.com/rss?hl=en-US&gl=US&ceid=US:en');
  });

  it('キーワード検索URLも同じエディションを使うこと', () => {
    expect(rssService.buildGoogleNewsRssUrl('野球', 'ja')).toBe(
      'https://news.google.com/rss/search?q=%E9%87%8E%E7%90%83&hl=ja&gl=JP&ceid=JP:ja'
    );
  });
});

describe('createDefaultWidgets', () => {
  it('ウィジェット名・メモ・タスク・ニュースが指定言語で生成されること', () => {
    const widgets = createDefaultWidgets(LOCALES.ja, 'ja');
    const byType = Object.fromEntries(widgets.map((w) => [w.type, w]));

    expect(byType.clock.title).toBe(LOCALES.ja.widgets.clock.title);
    expect(byType.notes.config.content).toBe(LOCALES.ja.defaults.notes);
    expect(byType.todo.config.items[0].text).toBe(LOCALES.ja.defaults.todoExplore);
    expect(byType.rss.title).toBe(LOCALES.ja.defaults.newsTitle);
    expect(byType.rss.config.searchQuery).toBe('');
    expect(byType.rss.config.feedUrl).toContain('gl=JP');
  });

  it('全ロケールでデフォルト文言が空でないこと', () => {
    for (const [code, locale] of Object.entries(LOCALES)) {
      expect(locale.defaults.notes, code).not.toBe('');
      expect(locale.pages.defaultName, code).toContain('{n}');
      expect(locale.pages.backTo, code).toContain('{name}');
    }
  });

  it('レイアウトが全ウィジェット分・全ブレークポイント分生成されること', () => {
    const widgets = createDefaultWidgets(LOCALES.en, 'en');
    const layouts = createDefaultLayouts(widgets);
    for (const bp of ['lg', 'md', 'sm', 'xs', 'xxs'] as const) {
      expect(layouts[bp].map((l) => l.i)).toEqual(widgets.map((w) => w.id));
    }
  });
});

describe('getPageDisplayName', () => {
  it('未命名のページは言語設定に応じた「ページ N」になること', () => {
    expect(getPageDisplayName({ id: 'a', name: '' }, 0, LOCALES.ja)).toBe('ページ 1');
    expect(getPageDisplayName({ id: 'a', name: '' }, 2, LOCALES.en)).toBe('Page 3');
  });

  it('ユーザーが付けた名前はそのまま表示されること', () => {
    expect(getPageDisplayName({ id: 'a', name: '仕事' }, 0, LOCALES.ja)).toBe('仕事');
  });
});

describe('addPage', () => {
  it('複製したページのウィジェットとレイアウトが新しいIDを持つこと', () => {
    const store = useDashboardStore.getState();
    const sourceIds = store.widgets.map((w) => w.id);
    expect(sourceIds.length).toBeGreaterThan(0);

    store.addPage({ duplicateCurrent: true });

    const after = useDashboardStore.getState();
    const copiedIds = after.widgets.map((w) => w.id);
    expect(copiedIds).toHaveLength(sourceIds.length);
    expect(copiedIds.some((id) => sourceIds.includes(id))).toBe(false);
    expect(after.layouts.lg.map((l) => l.i)).toEqual(copiedIds);
    expect(after.widgets.map((w) => w.layout.i)).toEqual(copiedIds);
    expect(after.isEditMode).toBe(false);
    expect(after.pages[after.pages.length - 1].name).toBe('');
  });

  it('空のページは編集モードで開くこと', () => {
    useDashboardStore.getState().addPage();
    const after = useDashboardStore.getState();
    expect(after.widgets).toHaveLength(0);
    expect(after.isEditMode).toBe(true);
  });
});
