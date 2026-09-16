import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, act, waitFor } from '@testing-library/react';
import React from 'react';
import v123 from '../fixtures/export-v1.2.3.json';
import v133 from '../fixtures/export-v1.3.3.json';
import v150 from '../fixtures/export-v1.5.0.json';
import { useDashboardStore } from '../../src/store/useDashboardStore';
import { storageService, STORAGE_KEYS, hydrateWidget, DEFAULT_WALLPAPER } from '../../src/services/storageService';
import { WIDGET_DEFINITIONS, WIDGET_TYPES } from '../../src/components/widgets/widgetDefinitions';
import { LOCALES } from '../../src/i18n/resolve';
import { rssService } from '../../src/services/rssService';
import { weatherService } from '../../src/services/weatherService';
import { wallpaperService } from '../../src/services/wallpaperService';
import { GridContainer } from '../../src/components/layout/GridContainer';
import { Header } from '../../src/components/layout/Header';
import { PageSwitcher } from '../../src/components/layout/PageSwitcher';
import { Dock } from '../../src/components/layout/Dock';
import { WallpaperBackground } from '../../src/components/layout/WallpaperBackground';
import { SettingsPanel } from '../../src/components/layout/SettingsPanel';
import { WidgetConfigModal } from '../../src/components/layout/WidgetConfigModal';
import { chromeStorageData } from '../helpers/chrome';
import { resetDashboardStore } from '../helpers/store';

type Fixture = typeof v123 | typeof v133 | typeof v150;
const FIXTURES: Array<[string, Fixture]> = [
  ['v1.2.3', v123],
  ['v1.3.3', v133],
  ['v1.5.0', v150],
];

/**
 * Puts a fixture into chrome.storage exactly as that version left it — the
 * auto-update path, where no import/sanitize step runs.
 */
function seedStorageAsVersion(data: any) {
  chromeStorageData[STORAGE_KEYS.WIDGETS] = data.widgets;
  chromeStorageData[STORAGE_KEYS.LAYOUTS] = data.layouts;
  chromeStorageData[STORAGE_KEYS.WALLPAPER] = data.wallpaper;
  chromeStorageData[STORAGE_KEYS.APPEARANCE] = data.appearance;
  if (data.dockItems) chromeStorageData[STORAGE_KEYS.DOCK_ITEMS] = data.dockItems;
  if (data.keyboardShortcuts) chromeStorageData[STORAGE_KEYS.KEYBOARD_SHORTCUTS] = data.keyboardShortcuts;
  if (data.pages) {
    chromeStorageData[STORAGE_KEYS.PAGES] = data.pages;
    chromeStorageData[STORAGE_KEYS.PAGE_DATA] = data.pageData;
    chromeStorageData[STORAGE_KEYS.ACTIVE_PAGE_ID] = data.activePageId;
  }
}

const Dashboard: React.FC = () => (
  <>
    <WallpaperBackground />
    <Header />
    <PageSwitcher />
    <GridContainer />
    <Dock />
    <SettingsPanel />
    <WidgetConfigModal />
  </>
);

const allWidgets = () => Object.values(useDashboardStore.getState().pageData).flatMap((p) => p.widgets);

function expectFullyHydrated() {
  const { appearance } = useDashboardStore.getState();
  const t = LOCALES[appearance.language === 'auto' ? 'en' : appearance.language] || LOCALES.en;
  for (const widget of allWidgets()) {
    const defaults = WIDGET_DEFINITIONS[widget.type as keyof typeof WIDGET_DEFINITIONS]?.createDefaultConfig(t, 'en') || {};
    for (const key of Object.keys(defaults)) {
      expect(widget.config[key], `${widget.id}.config.${key}`).not.toBeUndefined();
    }
  }
}

describe('upgrade regression: data written by older versions', () => {
  beforeEach(() => {
    resetDashboardStore();
    vi.spyOn(rssService, 'fetchFeed').mockResolvedValue({ title: 't', lastUpdated: Date.now(), items: [] });
    vi.spyOn(weatherService, 'fetchWeather').mockResolvedValue({
      city: 'x',
      lastUpdated: Date.now(),
      current: { temperature: 1, weatherCode: 0, condition: 'Clear sky', isDay: true, windSpeed: 0, time: 't' },
      forecast: [],
    });
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });
  afterEach(() => vi.restoreAllMocks());

  describe.each(FIXTURES)('%s data already in storage (auto-update path)', (_label, data) => {
    it('初期化できて、全ウィジェットと全ページが保たれること', async () => {
      seedStorageAsVersion(data);
      useDashboardStore.setState({ isInitialized: false });

      await useDashboardStore.getState().initialize();

      const state = useDashboardStore.getState();
      expect(state.isInitialized).toBe(true);
      const expectedPages = (data as any).pages ? (data as any).pages.length : 1;
      expect(state.pages).toHaveLength(expectedPages);
      const expectedWidgetCount = (data as any).pageData
        ? Object.values((data as any).pageData).reduce((n: number, p: any) => n + p.widgets.length, 0)
        : data.widgets.length;
      expect(allWidgets()).toHaveLength(expectedWidgetCount);
      // Everything the user had is still there, with user values untouched.
      for (const original of data.widgets) {
        const now = state.widgets.find((w) => w.id === original.id)!;
        expect(now, original.id).toBeDefined();
        expect(now.title).toBe(original.title);
        for (const [key, value] of Object.entries(original.config)) {
          expect(now.config[key], `${original.id}.${key}`).toEqual(value);
        }
      }
      expect(state.appearance.theme).toBe(data.appearance.theme);
      expect(state.wallpaper.currentWallpaperUrl).toBe(data.wallpaper.currentWallpaperUrl);
    });

    it('新設フィールドが欠けずにハイドレートされていること', async () => {
      seedStorageAsVersion(data);
      await useDashboardStore.getState().initialize();
      expectFullyHydrated();
      const { wallpaper, appearance } = useDashboardStore.getState();
      for (const key of Object.keys(DEFAULT_WALLPAPER)) expect(wallpaper, `wallpaper.${key}`).toHaveProperty(key);
      expect(appearance.dockPosition).toBeDefined();
      // Hydration is in-memory only until the user changes something.
      expect(chromeStorageData[STORAGE_KEYS.PAGE_DATA]).toEqual((data as any).pageData ?? undefined);
    });

    it('ダッシュボード全体がエラーなく描画され、設定モーダルも開けること', async () => {
      seedStorageAsVersion(data);
      await useDashboardStore.getState().initialize();

      const { container } = render(<Dashboard />);
      await waitFor(() => expect(container.querySelector('.react-grid-layout')).toBeInTheDocument());
      expect(screen.queryByText('Unknown widget')).not.toBeInTheDocument();
      expect(screen.queryByText(/Something went wrong/)).not.toBeInTheDocument();

      for (const widget of useDashboardStore.getState().widgets) {
        act(() => useDashboardStore.getState().openSettingsModal('editWidget', widget.id));
        await waitFor(() => expect(screen.getByText(/^Configure /)).toBeInTheDocument());
        act(() => useDashboardStore.getState().closeSettingsModal());
      }

      act(() => useDashboardStore.getState().openSettingsModal('settings'));
      expect(screen.getAllByRole('heading', { level: 2 }).length).toBeGreaterThan(0);
    });
  });

  describe.each(FIXTURES)('%s export file (import path)', (_label, data) => {
    it('インポート→初期化→描画が通り、ユーザーデータが保たれること', async () => {
      const ok = await storageService.importDashboardData(JSON.stringify(data));
      expect(ok).toBe(true);
      await useDashboardStore.getState().initialize();
      expectFullyHydrated();

      const state = useDashboardStore.getState();
      expect(state.widgets.map((w) => w.id)).toEqual(data.widgets.map((w) => w.id));
      const { container } = render(<Dashboard />);
      await waitFor(() => expect(container.querySelector('.react-grid-layout')).toBeInTheDocument());
      expect(screen.queryByText('Unknown widget')).not.toBeInTheDocument();
    });
  });

  it('v1.2.3 の "technology" キーワード検索は検索モードとして読み替えられること', async () => {
    seedStorageAsVersion(v123);
    await useDashboardStore.getState().initialize();
    const rss = useDashboardStore.getState().widgets.find((w) => w.type === 'rss')!;
    // The migrate hook derives the mode from the old keyword; a plain
    // default of 'headlines' would have silently replaced the user's search.
    expect(rss.config.googleNewsMode).toBe('search');
    expect(rssService.resolveGoogleNewsMode(rss.config)).toBe('search');
    expect(rssService.buildGoogleNewsUrlForConfig(rss.config, 'en')).toContain('q=technology');
  });

  it('v1.3.3 の空キーワード Google News は主要ヘッドラインになること', async () => {
    seedStorageAsVersion(v133);
    await useDashboardStore.getState().initialize();
    const rss = useDashboardStore.getState().widgets.find((w) => w.id === 'widget-rss-1')!;
    expect(rss.config.googleNewsMode).toBe('headlines');
    expect(rssService.buildGoogleNewsUrlForConfig(rss.config, 'ja')).toBe('https://news.google.com/rss?hl=ja&gl=JP&ceid=JP:ja');
    const ai = allWidgets().find((w) => w.id === 'widget-rss-1757920000000')!;
    expect(ai.config.googleNewsMode).toBe('search');
  });

  it('v1.5.0 の部分的なカスタム壁紙スロットが欠けた時間帯をプリセットで補うこと', async () => {
    seedStorageAsVersion(v150);
    await useDashboardStore.getState().initialize();
    const slots = wallpaperService.getActiveSlots(useDashboardStore.getState().wallpaper);
    expect(slots.morning.source).toBe('gradient');
    expect(slots.day.category).toBe('architecture');
    expect(slots.night.category).toBe('cyberpunk');
  });

  it('hydrateWidget は既存キー（空配列を含む）を上書きせず、未知の型は素通しすること', () => {
    const t = LOCALES.en;
    const emptied = hydrateWidget({ id: 'a', type: 'shortcuts', title: 'S', config: { items: [] }, layout: { i: 'a', x: 0, y: 0, w: 1, h: 1 } }, t, 'en');
    expect(emptied.config.items).toEqual([]);
    expect(emptied.config.columns).toBe(4);
    const unknown = { id: 'b', type: 'legacy' as any, title: 'L', config: { foo: 1 }, layout: { i: 'b', x: 0, y: 0, w: 1, h: 1 } };
    expect(hydrateWidget(unknown, t, 'en')).toBe(unknown);
    for (const type of WIDGET_TYPES) {
      const complete = { id: type, type, title: type, config: WIDGET_DEFINITIONS[type].createDefaultConfig(t, 'en'), layout: { i: type, x: 0, y: 0, w: 1, h: 1 } };
      expect(hydrateWidget(complete, t, 'en')).toBe(complete);
    }
  });
});
