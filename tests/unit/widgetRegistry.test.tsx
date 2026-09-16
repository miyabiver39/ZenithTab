import { describe, it, expect } from 'vitest';
import { WIDGET_REGISTRY, getWidgetDefinition } from '../../src/components/widgets/registry';
import { WIDGET_DEFINITIONS, WIDGET_TYPES, getWidgetMeta, GENERIC_URL_KEYS } from '../../src/components/widgets/widgetDefinitions';
import { LOCALES } from '../../src/i18n/resolve';
import { storageService } from '../../src/services/storageService';

describe('widget registry', () => {
  it('全ウィジェット型がメタ定義とUI定義の両方に、同じ順序・重複なしで登録されていること', () => {
    const uiTypes = WIDGET_REGISTRY.map((d) => d.type);
    expect(new Set(uiTypes).size).toBe(uiTypes.length);
    expect([...uiTypes].sort()).toEqual([...WIDGET_TYPES].sort());
    for (const type of WIDGET_TYPES) {
      expect(getWidgetDefinition(type)?.type).toBe(type);
      expect(getWidgetMeta(type)?.size.w).toBeGreaterThan(0);
    }
    expect(getWidgetDefinition('mystery')).toBeUndefined();
    expect(getWidgetMeta('mystery')).toBeUndefined();
  });

  it('全ウィジェット型に7言語分のタイトルと説明があること', () => {
    for (const [code, locale] of Object.entries(LOCALES)) {
      for (const type of WIDGET_TYPES) {
        const copy = (locale.widgets as Record<string, { title?: string; desc?: string }>)[type];
        expect(copy?.title, `${code}.widgets.${type}.title`).toBeTruthy();
        expect(copy?.desc, `${code}.widgets.${type}.desc`).toBeTruthy();
      }
    }
  });

  it('createDefaultConfig が言語ごとの初期設定を返すこと', () => {
    const ja = WIDGET_DEFINITIONS.notes.createDefaultConfig(LOCALES.ja, 'ja');
    expect(ja.content).toContain('ようこそ');
    expect(WIDGET_DEFINITIONS.rss.createDefaultConfig(LOCALES.en, 'de').feedUrl).toContain('gl=DE');
    expect(WIDGET_DEFINITIONS.shortcuts.createDefaultConfig(LOCALES.ko, 'ko').items.map((i: any) => i.title)).toContain('Naver');
    expect(WIDGET_DEFINITIONS.weather.createDefaultConfig(LOCALES.fr, 'fr').city).toBe('Paris');
  });

  it('URL キーの集約と型別サニタイズがインポートで効くこと', async () => {
    expect(GENERIC_URL_KEYS).toEqual(expect.arrayContaining(['feedUrl', 'url', 'targetUrl', 'iconUrl']));
    expect(WIDGET_DEFINITIONS.iframe.urlKeys).toEqual(['url']);
    expect(WIDGET_DEFINITIONS.rss.urlKeys).toEqual(['feedUrl']);

    const ok = await storageService.importDashboardData(
      JSON.stringify({
        version: '1.0.0',
        exportedAt: 'x',
        widgets: [
          {
            id: 'w-search',
            type: 'search',
            title: 'S',
            config: {
              customEngines: [
                { id: 'a', name: 'Good', urlTemplate: 'https://g.example/?q={query}' },
                { id: 'b', name: 'Bad', urlTemplate: 'javascript:{query}' },
              ],
              hiddenBuiltinEngines: ['google', 'nope'],
            },
            layout: { i: 'w-search', x: 0, y: 0, w: 8, h: 1 },
          },
          {
            id: 'w-old',
            type: 'legacy-type',
            title: 'Old',
            config: { url: 'javascript:alert(1)', feedUrl: 'https://ok.example/feed' },
            layout: { i: 'w-old', x: 0, y: 1, w: 4, h: 2 },
          },
        ],
      })
    );
    expect(ok).toBe(true);
    const widgets = await storageService.getWidgets();
    const search = widgets.find((w) => w.id === 'w-search')!.config;
    expect(search.customEngines.map((e: any) => e.id)).toEqual(['a']);
    expect(search.hiddenBuiltinEngines).toEqual(['google']);
    const old = widgets.find((w) => w.id === 'w-old')!.config;
    expect(old.url).toBeUndefined();
    expect(old.feedUrl).toBe('https://ok.example/feed');
  });

  it('設定フォームを持たない型はモーダルにタイトル入力だけを出すこと', () => {
    expect(getWidgetDefinition('todo')?.ConfigForm).toBeUndefined();
    expect(getWidgetDefinition('qrcode')?.ConfigForm).toBeUndefined();
    expect(getWidgetDefinition('rss')?.beforeSave).toBeTypeOf('function');
    expect(getWidgetDefinition('iframe')?.beforeSave).toBeTypeOf('function');
  });
});
