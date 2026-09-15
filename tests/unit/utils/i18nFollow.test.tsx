import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, act, waitFor } from '@testing-library/react';
import { getLocalizedWidgetTitle, isDefaultWidgetTitle, getDefaultWidgetTitle } from '../../../src/utils/widgetTitle';
import { getWeatherConditionLabel } from '../../../src/utils/weatherCondition';
import { LOCALES } from '../../../src/i18n/resolve';
import { WidgetWrapper } from '../../../src/components/widgets/WidgetWrapper';
import { WeatherWidget } from '../../../src/components/widgets/WeatherWidget/WeatherWidget';
import { weatherService } from '../../../src/services/weatherService';
import { useDashboardStore } from '../../../src/store/useDashboardStore';
import { resetDashboardStore } from '../../helpers/store';

const setLanguage = (language: 'auto' | 'en' | 'ja' | 'zh-CN' | 'ko') =>
  act(() => useDashboardStore.getState().updateAppearance({ language }));

describe('widgetTitle', () => {
  it('どのロケールの既定タイトルでも「既定」と判定し、現在の言語で解決すること', () => {
    for (const locale of Object.values(LOCALES)) {
      const stored = { type: 'clock' as const, title: locale.widgets.clock.title };
      expect(isDefaultWidgetTitle(stored)).toBe(true);
      expect(getLocalizedWidgetTitle(stored, LOCALES.zh)).toBe(LOCALES.zh.widgets.clock.title);
    }
  });

  it('旧バージョンの英語タイトルや型名タイトルも追従すること', () => {
    expect(getLocalizedWidgetTitle({ type: 'todo', title: 'Todo' }, LOCALES.ja)).toBe('タスク管理');
    expect(getLocalizedWidgetTitle({ type: 'rss', title: 'Tech News' }, LOCALES.ja)).toBe(LOCALES.ja.defaults.newsTitle);
    expect(getLocalizedWidgetTitle({ type: 'rss', title: 'ニュース' }, LOCALES.en)).toBe('News');
    expect(getLocalizedWidgetTitle({ type: 'rss', title: 'RSS & News' }, LOCALES.ja)).toBe(LOCALES.ja.widgets.rss.title);
  });

  it('ユーザーが付けたタイトルはそのまま返すこと', () => {
    expect(isDefaultWidgetTitle({ type: 'clock', title: '壁掛け時計' })).toBe(false);
    expect(getLocalizedWidgetTitle({ type: 'clock', title: 'My Clock' }, LOCALES.ja)).toBe('My Clock');
  });

  it('getDefaultWidgetTitle が全ウィジェット型で空でない文字列を返すこと', () => {
    for (const type of ['search', 'clock', 'weather', 'bookmarks', 'rss', 'pomodoro', 'todo', 'iframe', 'notes', 'shortcuts', 'qrcode'] as const) {
      expect(getDefaultWidgetTitle(type, LOCALES.ko)).not.toBe('');
    }
  });
});

describe('weatherCondition', () => {
  it('WMOコードをロケール別ラベルに解決し、未知コードはフォールバックすること', () => {
    expect(getWeatherConditionLabel(3, LOCALES.ja)).toBe('曇り');
    expect(getWeatherConditionLabel(61, LOCALES.zh)).toBe('小雨');
    expect(getWeatherConditionLabel(123, LOCALES.en, 'Mystery')).toBe('Mystery');
    expect(getWeatherConditionLabel(123, LOCALES.en)).toBe('Clear sky');
  });

  it('全ロケールが同じWMOコード集合を持つこと', () => {
    const reference = Object.keys(LOCALES.en.widgets.weather.conditions).sort();
    for (const [code, locale] of Object.entries(LOCALES)) {
      expect(Object.keys(locale.widgets.weather.conditions).sort(), code).toEqual(reference);
    }
  });
});

describe('language switch follows through the UI', () => {
  beforeEach(() => resetDashboardStore());
  afterEach(() => vi.restoreAllMocks());

  it('既定タイトルのウィジェットヘッダーが言語切替に即追従し、リネーム済みは維持されること', () => {
    const clock = useDashboardStore.getState().widgets.find((w) => w.type === 'clock')!;
    const { rerender } = render(
      <>
        <WidgetWrapper widget={clock}>x</WidgetWrapper>
        <WidgetWrapper widget={{ ...clock, id: 'c2', title: 'Kitchen' }}>y</WidgetWrapper>
      </>
    );
    expect(screen.getByText('Clock')).toBeInTheDocument();

    setLanguage('zh-CN');
    rerender(
      <>
        <WidgetWrapper widget={clock}>x</WidgetWrapper>
        <WidgetWrapper widget={{ ...clock, id: 'c2', title: 'Kitchen' }}>y</WidgetWrapper>
      </>
    );
    expect(screen.getByText(LOCALES.zh.widgets.clock.title)).toBeInTheDocument();
    expect(screen.getByText('Kitchen')).toBeInTheDocument();
  });

  it('天気の曜日と天候テキストが選択言語で描画されること', async () => {
    vi.spyOn(weatherService, 'fetchWeather').mockResolvedValue({
      city: 'Tokyo',
      lastUpdated: Date.now(),
      current: { temperature: 20, weatherCode: 3, condition: 'Overcast', isDay: true, windSpeed: 1, humidity: 50, time: 't' },
      forecast: [
        { date: '2026-09-16', maxTemp: 1, minTemp: 0, weatherCode: 0, condition: 'x' },
        { date: '2026-09-17', maxTemp: 1, minTemp: 0, weatherCode: 0, condition: 'x' },
      ],
    });
    setLanguage('ja');
    render(<WeatherWidget config={{ city: 'Tokyo', unit: 'celsius', showForecast: true }} />);
    await waitFor(() => expect(screen.getByText('曇り')).toBeInTheDocument());
    expect(screen.getByText('木')).toBeInTheDocument();
    expect(screen.queryByText('Overcast')).not.toBeInTheDocument();
  });
});
