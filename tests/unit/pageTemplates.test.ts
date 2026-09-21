import { describe, it, expect } from 'vitest';
import { PAGE_TEMPLATE_IDS, buildTemplatePage, getPageTemplate, templateWidgetTypes } from '../../src/config/templates/pageTemplates';
import { WIDGET_DEFINITIONS } from '../../src/components/widgets/widgetDefinitions';
import { GRID_COLS } from '../../src/config/grid';
import { LOCALES, getTranslation } from '../../src/i18n/resolve';

describe('pageTemplates', () => {
  it('全テンプレートの配置が登録済みウィジェットで、12 列に収まり、重ならないこと', () => {
    for (const id of PAGE_TEMPLATE_IDS) {
      const { placements } = getPageTemplate(id);
      expect(placements.length).toBeGreaterThan(0);
      for (const p of placements) {
        expect(WIDGET_DEFINITIONS[p.type], `${id}: ${p.type}`).toBeDefined();
        expect(p.x + p.w, `${id}: ${p.type} overflows`).toBeLessThanOrEqual(GRID_COLS.lg);
      }
      for (let i = 0; i < placements.length; i++) {
        for (let j = i + 1; j < placements.length; j++) {
          const a = placements[i];
          const b = placements[j];
          const overlap = a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
          expect(overlap, `${id}: ${a.type} overlaps ${b.type}`).toBe(false);
        }
      }
    }
  });

  it('ウィジェットを言語付きの既定設定で組み立て、毎回新しい id を振ること', () => {
    const t = getTranslation('ja');
    const a = buildTemplatePage('news', t, 'ja');
    const b = buildTemplatePage('news', t, 'ja');
    expect(a.widgets.map((w) => w.type)).toEqual(['search', 'clock', 'weather', 'rss', 'rss', 'rss']);
    expect(new Set([...a.widgets, ...b.widgets].map((w) => w.id)).size).toBe(12);
    expect(a.layouts.lg.map((l) => l.i)).toEqual(a.widgets.map((w) => w.id));
    expect(a.layouts.sm).toHaveLength(a.widgets.length);

    const [tech, top, biz] = a.widgets.filter((w) => w.type === 'rss');
    expect(tech.title).toBe(t.widgets.rss.topics.TECHNOLOGY);
    expect(tech.config.googleNewsTopic).toBe('TECHNOLOGY');
    expect(tech.config.feedUrl).toContain('/topic/TECHNOLOGY');
    expect(tech.config.feedUrl).toContain('hl=ja');
    expect(top.config.googleNewsMode).toBe('headlines');
    expect(biz.config.googleNewsTopic).toBe('BUSINESS');
    // Registry defaults still fill in everything the override didn't say.
    expect(tech.config.maxItems).toBe(8);

    const weather = a.widgets.find((w) => w.type === 'weather')!;
    expect(weather.config.city).toBe('Tokyo');
  });

  it('仕事 / 学習テンプレートはサンプルのタスクやメモを持たないこと', () => {
    const t = getTranslation('en');
    for (const id of ['work', 'study'] as const) {
      const page = buildTemplatePage(id, t, 'en');
      expect(page.widgets.find((w) => w.type === 'todo')!.config.items).toEqual([]);
      expect(page.widgets.find((w) => w.type === 'notes')!.config.content).toBe('');
    }
    const minimal = buildTemplatePage('minimal', t, 'en');
    expect(minimal.widgets.find((w) => w.type === 'clock')!.config).toMatchObject({ style: 'minimal', showSeconds: false, showDate: true });
  });

  it('7 言語すべてにテンプレート名と説明があること', () => {
    for (const lang of Object.keys(LOCALES)) {
      const t = getTranslation(lang as any);
      for (const id of PAGE_TEMPLATE_IDS) {
        expect(t.templates.items[id].name, `${lang}/${id}`).toBeTruthy();
        expect(t.templates.items[id].desc, `${lang}/${id}`).toBeTruthy();
      }
      expect(templateWidgetTypes('standard')).toHaveLength(8);
    }
  });
});
