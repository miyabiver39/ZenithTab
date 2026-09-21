import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { onboardingService, HINT_MAX_OPENS } from '../../src/services/onboardingService';
import { buildSetupResult, DEFAULT_SETUP_CHOICES, SETUP_INTERESTS } from '../../src/config/setup/applySetup';
import { storageService, STORAGE_KEYS } from '../../src/services/storageService';
import { getTranslation } from '../../src/i18n/resolve';
import { useDashboardStore } from '../../src/store/useDashboardStore';
import { chromeStorageData } from '../helpers/chrome';
import { resetDashboardStore } from '../helpers/store';

const state = () => useDashboardStore.getState();

describe('onboardingService.evaluateStartup', () => {
  it('保存データが何もない初回起動ではウィザードを出すこと', async () => {
    expect(await onboardingService.evaluateStartup()).toEqual({ showSetup: true, showHint: false });
    // Not marked complete until the wizard finishes or is skipped.
    expect((await onboardingService.get()).completedAt).toBeUndefined();
  });

  it('既存ユーザー(保存データあり)にはウィザードもヒントも出さず、完了扱いにすること', async () => {
    await storageService.saveWidgets([]);
    expect(await onboardingService.evaluateStartup(1000)).toEqual({ showSetup: false, showHint: false });
    expect(await onboardingService.get()).toMatchObject({ completedAt: 1000, hintDismissed: true });
    expect(await onboardingService.evaluateStartup()).toEqual({ showSetup: false, showHint: false });
  });

  it('セットアップ完了後は最初の数回だけヒントを出し、× で以後出さないこと', async () => {
    await onboardingService.markCompleted(1);
    for (let i = 0; i < HINT_MAX_OPENS; i++) {
      expect((await onboardingService.evaluateStartup()).showHint, `open ${i + 1}`).toBe(true);
    }
    expect((await onboardingService.evaluateStartup()).showHint).toBe(false);

    await onboardingService.markCompleted(2);
    expect((await onboardingService.evaluateStartup()).showHint).toBe(true);
    await onboardingService.dismissHint();
    expect((await onboardingService.evaluateStartup()).showHint).toBe(false);
  });
});

describe('buildSetupResult', () => {
  const t = getTranslation('ja');

  it('既定の選択は標準テンプレートと地域のドックになること', () => {
    const { page, dockItems } = buildSetupResult(DEFAULT_SETUP_CHOICES, t, 'ja');
    expect(page.widgets.map((w) => w.type)).toEqual(['search', 'clock', 'weather', 'pomodoro', 'bookmarks', 'rss', 'todo', 'notes']);
    expect(page.widgets.find((w) => w.type === 'rss')!.config.googleNewsMode).toBe('headlines');
    expect(dockItems.map((d) => d.label)).toEqual(['Google', 'YouTube', 'X (Twitter)', 'Yahoo! JAPAN', 'Amazon', 'ChatGPT']);
  });

  it('興味を選ぶとニュースがそのトピックになり、ショートカットに関連サイトが足されること', () => {
    const { page } = buildSetupResult({ interests: ['TECHNOLOGY', 'SPORTS'], purpose: 'news' }, t, 'ja');
    const feeds = page.widgets.filter((w) => w.type === 'rss');
    expect(feeds.map((f) => f.config.googleNewsTopic)).toEqual(['TECHNOLOGY', 'SPORTS', 'TECHNOLOGY']);
    expect(feeds[1].title).toBe(t.widgets.rss.topics.SPORTS);
    expect(feeds[1].config.feedUrl).toContain('/topic/SPORTS');
    expect(feeds.every((f) => f.config.googleNewsMode === 'topic')).toBe(true);

    const work = buildSetupResult({ interests: ['TECHNOLOGY', 'ENTERTAINMENT'], purpose: 'work' }, t, 'ja');
    const items = work.page.widgets.find((w) => w.type === 'shortcuts')!.config.items as { title: string; category: string }[];
    expect(items.length).toBe(12 + 3 + 3);
    // AI tools for TECHNOLOGY (ChatGPT is already a default → next three), video for ENTERTAINMENT.
    expect(items.slice(12, 15).every((i) => i.category === 'AI・ツール')).toBe(true);
    expect(items.slice(15).every((i) => i.category === 'エンタメ')).toBe(true);
    expect(new Set(items.map((i) => i.title)).size).toBe(items.length);
  });

  it('全トピック × 全テンプレートで壊れないこと', () => {
    for (const purpose of ['standard', 'work', 'study', 'news', 'minimal'] as const) {
      const { page } = buildSetupResult({ interests: SETUP_INTERESTS, purpose }, getTranslation('en'), 'en');
      expect(page.widgets.length).toBeGreaterThan(0);
      expect(page.layouts.lg).toHaveLength(page.widgets.length);
    }
  });
});

describe('store: applySetup / skipSetup', () => {
  beforeEach(() => resetDashboardStore());
  afterEach(() => vi.restoreAllMocks());

  it('初回起動時に isOnboardingOpen になり、完了で選んだ言語とテンプレートが保存されること', async () => {
    useDashboardStore.setState({ isInitialized: false });
    await state().initialize();
    expect(state().isOnboardingOpen).toBe(true);
    expect(state().showFirstRunHint).toBe(false);

    await state().applySetup({ interests: ['BUSINESS'], purpose: 'minimal' }, 'de');
    expect(state().isOnboardingOpen).toBe(false);
    expect(state().showFirstRunHint).toBe(true);
    expect(state().appearance.language).toBe('de');
    expect(state().widgets.map((w) => w.type)).toEqual(['clock', 'search', 'shortcuts']);
    expect(state().dockItems.map((d) => d.label)).toContain('Amazon');
    expect(chromeStorageData[STORAGE_KEYS.APPEARANCE].language).toBe('de');
    expect(chromeStorageData[STORAGE_KEYS.PAGE_DATA][state().activePageId].widgets).toHaveLength(3);
    expect(chromeStorageData[STORAGE_KEYS.ONBOARDING].completedAt).toBeTypeOf('number');
    // No snapshot on a fresh install: there was nothing to keep.
    expect(chromeStorageData[STORAGE_KEYS.SNAPSHOTS]).toBeUndefined();
  });

  it('既存データがあるときの「もう一度」はスナップショットを取ってから置き換え、壁紙は保つこと', async () => {
    await storageService.saveWidgets(state().widgets);
    await storageService.saveWallpaper({ ...state().wallpaper, blur: 17 });
    await state().applySetup({ interests: [], purpose: 'study' }, 'en');
    expect(chromeStorageData[STORAGE_KEYS.SNAPSHOTS]).toHaveLength(1);
    expect(chromeStorageData[STORAGE_KEYS.SNAPSHOTS][0].reason).toBe('before-reset');
    expect(chromeStorageData[STORAGE_KEYS.WALLPAPER].blur).toBe(17);
    expect(state().widgets.map((w) => w.type)).toContain('habits');
  });

  it('スキップは完了扱いにして閉じ、二度目以降のスキップでは何も書き換えないこと', async () => {
    useDashboardStore.setState({ isOnboardingOpen: true });
    await state().skipSetup();
    expect(state().isOnboardingOpen).toBe(false);
    expect(state().showFirstRunHint).toBe(true);
    const first = chromeStorageData[STORAGE_KEYS.ONBOARDING].completedAt;

    useDashboardStore.setState({ isOnboardingOpen: true, showFirstRunHint: false });
    await state().skipSetup();
    expect(chromeStorageData[STORAGE_KEYS.ONBOARDING].completedAt).toBe(first);
    expect(state().showFirstRunHint).toBe(false);
  });

  it('ヒントを閉じると保存され、次回は出ないこと', async () => {
    await onboardingService.markCompleted();
    useDashboardStore.setState({ showFirstRunHint: true });
    state().dismissFirstRunHint();
    expect(state().showFirstRunHint).toBe(false);
    await vi.waitFor(async () => expect((await onboardingService.get()).hintDismissed).toBe(true));
  });
});
