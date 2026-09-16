import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import {
  getRegionalDockItems,
  getRegionalShortcuts,
  getRegionalWeatherDefault,
  resolvePresetLanguage,
} from '../../src/config/defaults/regionalPresets';
import { DOCK_ICON_LIBRARY } from '../../src/utils/dockIcons';
import { isSafeHttpUrl } from '../../src/utils/url';
import { useDashboardStore } from '../../src/store/useDashboardStore';
import { storageService, STORAGE_KEYS, createDefaultWidgets } from '../../src/services/storageService';
import { LOCALES } from '../../src/i18n/resolve';
import { chromeStorageData } from '../helpers/chrome';
import { resetDashboardStore } from '../helpers/store';

const titles = (items: { title?: string; label?: string }[]) => items.map((i) => i.title ?? i.label);

describe('regionalPresets', () => {
  it('言語コードをプリセットに解決し、未対応は en にフォールバックすること', () => {
    expect(resolvePresetLanguage('ja')).toBe('ja');
    expect(resolvePresetLanguage('ja-JP')).toBe('ja');
    expect(resolvePresetLanguage('zh')).toBe('zh-CN');
    expect(resolvePresetLanguage('zh-TW')).toBe('zh-CN');
    expect(resolvePresetLanguage('ko-KR')).toBe('ko');
    expect(resolvePresetLanguage('pt-BR')).toBe('en');
    expect(resolvePresetLanguage(undefined)).toBe('en');
    expect(resolvePresetLanguage('')).toBe('en');
  });

  it('日本語: Yahoo! JAPAN・楽天・Amazon.co.jp を含むこと', () => {
    expect(titles(getRegionalDockItems('ja'))).toEqual(['Google', 'YouTube', 'X (Twitter)', 'Yahoo! JAPAN', 'Amazon', 'ChatGPT']);
    const apps = getRegionalShortcuts('ja');
    expect(titles(apps)).toEqual(expect.arrayContaining(['Yahoo! JAPAN', '楽天市場', 'Instagram', 'Gmail', 'Spotify', 'Netflix']));
    expect(apps.find((a) => a.title === 'Amazon')?.url).toBe('https://www.amazon.co.jp');
    expect(apps.map((a) => a.category)).toContain('ショッピング');
  });

  it('英語: グローバルな構成であること', () => {
    expect(titles(getRegionalDockItems('en'))).toEqual(['Google', 'YouTube', 'Amazon', 'ChatGPT', 'Google Maps', 'Wikipedia']);
    expect(titles(getRegionalShortcuts('en'))).toEqual(expect.arrayContaining(['Reddit', 'Wikipedia', 'Amazon', 'Netflix']));
  });

  it('韓国語: Naver・Coupang・Daum・배달의민족・Musinsa を含むこと', () => {
    expect(titles(getRegionalDockItems('ko'))).toEqual(['Naver', 'YouTube', 'Coupang', 'ChatGPT', 'Instagram', 'Google']);
    expect(titles(getRegionalShortcuts('ko'))).toEqual(expect.arrayContaining(['Naver', 'Coupang', 'Daum (Kakao)', '배달의민족', 'Musinsa']));
  });

  it('中国語: Bilibili・百度・淘宝・京东・小红书・知乎 を含むこと', () => {
    expect(titles(getRegionalDockItems('zh-CN'))).toEqual(['Bilibili', 'YouTube', 'Baidu', 'Taobao', 'Xiaohongshu', 'ChatGPT']);
    expect(titles(getRegionalShortcuts('zh'))).toEqual(expect.arrayContaining(['Bilibili', '百度', '微博', '小红书', '淘宝', '京东', '知乎']));
  });

  it('欧州: 各地域版 Amazon と地域ポータルを含むこと', () => {
    expect(getRegionalDockItems('es').find((d) => d.label === 'Amazon')?.url).toBe('https://www.amazon.es');
    expect(getRegionalDockItems('fr').find((d) => d.label === 'Amazon')?.url).toBe('https://www.amazon.fr');
    expect(getRegionalDockItems('de').find((d) => d.label === 'Amazon')?.url).toBe('https://www.amazon.de');
    expect(titles(getRegionalShortcuts('es'))).toEqual(expect.arrayContaining(['El País', 'Wallapop']));
    expect(titles(getRegionalShortcuts('fr'))).toEqual(expect.arrayContaining(['Le Monde', 'Leboncoin']));
    expect(titles(getRegionalShortcuts('de'))).toEqual(expect.arrayContaining(['DER SPIEGEL', 'Kleinanzeigen']));
  });

  it('全プリセットで URL が https、アイコンが有効、ID が一意であること', () => {
    for (const lang of ['en', 'ja', 'ko', 'zh-CN', 'es', 'fr', 'de']) {
      const dockItems = getRegionalDockItems(lang);
      const apps = getRegionalShortcuts(lang);
      expect(dockItems.length, lang).toBe(6);
      expect(apps.length, lang).toBe(12);
      for (const d of dockItems) {
        expect(isSafeHttpUrl(d.url), `${lang} ${d.label}`).toBe(true);
        expect(DOCK_ICON_LIBRARY[d.icon], `${lang} ${d.icon}`).toBeDefined();
      }
      for (const a of apps) expect(isSafeHttpUrl(a.url), `${lang} ${a.title}`).toBe(true);
      expect(new Set(dockItems.map((d) => d.id)).size).toBe(dockItems.length);
      expect(new Set(apps.map((a) => a.id)).size).toBe(apps.length);
    }
  });

  it('返り値は毎回新しいコピーであること', () => {
    const a = getRegionalDockItems('ja');
    a[0].label = 'mutated';
    expect(getRegionalDockItems('ja')[0].label).toBe('Google');
  });

  it('天気の初期都市が地域ごとに変わること', () => {
    expect(getRegionalWeatherDefault('ja').city).toBe('Tokyo');
    expect(getRegionalWeatherDefault('ko').city).toBe('Seoul');
    expect(getRegionalWeatherDefault('xx').city).toBe('New York');
    expect(createDefaultWidgets(LOCALES.de, 'de').find((w) => w.type === 'weather')?.config.city).toBe('Berlin');
  });
});

describe('regional presets at first launch / reset', () => {
  beforeEach(() => resetDashboardStore());
  afterEach(() => vi.restoreAllMocks());

  it('初回起動時はブラウザ言語のプリセットで Dock が組まれること', async () => {
    vi.spyOn(navigator, 'language', 'get').mockReturnValue('ko-KR');
    useDashboardStore.setState({ isInitialized: false });
    await useDashboardStore.getState().initialize();
    expect(titles(useDashboardStore.getState().dockItems)).toContain('Naver');
    expect(useDashboardStore.getState().widgets.find((w) => w.type === 'weather')?.config.city).toBe('Seoul');
  });

  it('保存済みの Dock があればプリセットで上書きしないこと', async () => {
    vi.spyOn(navigator, 'language', 'get').mockReturnValue('ja-JP');
    const mine = [{ id: 'dock-custom', label: 'My Site', url: 'https://mine.example', icon: 'star', openInNewTab: true }];
    await storageService.saveDockItems(mine);
    await useDashboardStore.getState().initialize();
    expect(useDashboardStore.getState().dockItems).toEqual(mine);

    await useDashboardStore.getState().syncFromStorage();
    expect(useDashboardStore.getState().dockItems).toEqual(mine);
  });

  it('未保存の初回状態で他タブ同期しても Dock が en プリセットに戻らないこと', async () => {
    vi.spyOn(navigator, 'language', 'get').mockReturnValue('ja-JP');
    await useDashboardStore.getState().initialize();
    const before = useDashboardStore.getState().dockItems;
    await useDashboardStore.getState().syncFromStorage();
    expect(useDashboardStore.getState().dockItems).toBe(before);
    expect(chromeStorageData[STORAGE_KEYS.DOCK_ITEMS]).toBeUndefined();
  });

  it('リセットは現在の言語設定のプリセットを保存すること', async () => {
    useDashboardStore.getState().updateAppearance({ language: 'zh-CN' });
    await useDashboardStore.getState().resetToDefault();
    expect(titles(useDashboardStore.getState().dockItems)).toContain('Bilibili');
    expect(titles(chromeStorageData[STORAGE_KEYS.DOCK_ITEMS])).toContain('Bilibili');
  });

  it('ショートカットウィジェットの追加時は現在の言語のプリセットになること', () => {
    useDashboardStore.getState().updateAppearance({ language: 'ja' });
    useDashboardStore.getState().addWidget('shortcuts');
    const added = useDashboardStore.getState().widgets.at(-1)!;
    expect(titles(added.config.items)).toContain('楽天市場');
  });
});
