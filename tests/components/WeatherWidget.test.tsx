import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { setupUser } from '../helpers/user';
import { WeatherWidget } from '../../src/components/widgets/WeatherWidget/WeatherWidget';
import { weatherService, GeolocationFailure } from '../../src/services/weatherService';
import { useDashboardStore } from '../../src/store/useDashboardStore';
import { resetDashboardStore } from '../helpers/store';
import { WeatherData } from '../../src/types/weather';

const WEATHER: WeatherData = {
  city: 'Tokyo',
  lastUpdated: Date.now(),
  current: {
    temperature: 21,
    apparentTemperature: 20,
    condition: 'Slight rain',
    weatherCode: 61,
    isDay: true,
    windSpeed: 12,
    humidity: 68,
    time: '2026-09-16T09:00',
  },
  forecast: [
    { date: '2026-09-16', maxTemp: 24, minTemp: 18, weatherCode: 61, condition: 'x' },
    { date: '2026-09-17', maxTemp: 28, minTemp: 20, weatherCode: 0, condition: 'x' },
    { date: '2026-09-18', maxTemp: 26, minTemp: 19, weatherCode: 2, condition: 'x' },
    { date: '2026-09-19', maxTemp: 23, minTemp: 18, weatherCode: 75, condition: 'x' },
  ],
};

const config = { city: 'Tokyo', latitude: 35.6762, longitude: 139.6503, unit: 'celsius' as const, showForecast: true };

describe('WeatherWidget', () => {
  beforeEach(() => resetDashboardStore());
  afterEach(() => vi.restoreAllMocks());

  it('ローディング表示の後に現在の天気と予報を描画すること', async () => {
    let resolve!: (v: WeatherData) => void;
    vi.spyOn(weatherService, 'fetchWeather').mockReturnValue(new Promise((r) => (resolve = r)));

    render(<WeatherWidget widgetId="widget-weather-1" config={config} />);
    expect(screen.getByText('Loading weather...')).toBeInTheDocument();

    resolve(WEATHER);
    await waitFor(() => expect(screen.getByText('Slight rain')).toBeInTheDocument());
    expect(screen.getByText('21')).toBeInTheDocument();
    expect(screen.getByText('12 km/h')).toBeInTheDocument();
    expect(screen.getByText('68%')).toBeInTheDocument();
    // Forecast skips today and shows the next three days.
    expect(screen.getByText('28°')).toBeInTheDocument();
    expect(screen.queryByText('24°')).not.toBeInTheDocument();
  });

  it('WMO コードごとに正しいアイコンを描くこと(にわか雨は雪にならない)', async () => {
    const forecast = [
      { date: '2026-09-16', maxTemp: 30, minTemp: 22, weatherCode: 3, condition: 'x' },
      { date: '2026-09-17', maxTemp: 25, minTemp: 20, weatherCode: 82, condition: 'x' }, // rain showers
      { date: '2026-09-18', maxTemp: 28, minTemp: 21, weatherCode: 95, condition: 'x' }, // thunderstorm
      { date: '2026-09-19', maxTemp: 24, minTemp: 18, weatherCode: 45, condition: 'x' }, // fog
    ];
    vi.spyOn(weatherService, 'fetchWeather').mockResolvedValue({ ...WEATHER, forecast });
    const { container } = render(<WeatherWidget config={config} />);
    await waitFor(() => expect(screen.getByText('25°')).toBeInTheDocument());

    // lucide icons carry no text or role, so their generated class is the
    // only handle we have on which icon was chosen.
    expect(container.querySelector('.lucide-snowflake')).toBeNull();
    expect(container.querySelector('.lucide-cloud-rain')).not.toBeNull();
    expect(container.querySelector('.lucide-cloud-lightning')).not.toBeNull();
    expect(container.querySelector('.lucide-cloud-fog')).not.toBeNull();
  });

  it('華氏に変換し、予報を非表示にできること', async () => {
    vi.spyOn(weatherService, 'fetchWeather').mockResolvedValue(WEATHER);
    render(<WeatherWidget config={{ ...config, unit: 'fahrenheit', showForecast: false }} />);
    await waitFor(() => expect(screen.getByText('70')).toBeInTheDocument());
    expect(screen.getByText('°F')).toBeInTheDocument();
    expect(screen.queryByText(/°$/)).not.toBeInTheDocument();
  });

  it('取得失敗時はエラー表示にフォールバックすること', async () => {
    vi.spyOn(weatherService, 'fetchWeather').mockRejectedValue(new Error('offline'));
    render(<WeatherWidget config={config} />);
    await waitFor(() => expect(screen.getByText('Weather info unavailable')).toBeInTheDocument());
  });

  it('現在地検出でウィジェット設定が更新され再取得されること', async () => {
    const user = setupUser();
    const fetchSpy = vi.spyOn(weatherService, 'fetchWeather').mockResolvedValue(WEATHER);
    vi.spyOn(weatherService, 'detectUserLocation').mockResolvedValue({ latitude: 34.69, longitude: 135.5, city: 'Osaka' });

    render(<WeatherWidget widgetId="widget-weather-1" config={config} />);
    await waitFor(() => screen.getByText('Slight rain'));
    await user.click(screen.getByTitle('Detect Current Location'));

    await waitFor(() => {
      const w = useDashboardStore.getState().widgets.find((x) => x.id === 'widget-weather-1')!;
      expect(w.config.city).toBe('Osaka');
      expect(w.config.latitude).toBe(34.69);
    });
    expect(fetchSpy.mock.calls.length).toBeGreaterThanOrEqual(2);
  });

  it('位置情報が拒否された場合はその旨を表示すること', async () => {
    const user = setupUser();
    vi.spyOn(weatherService, 'fetchWeather').mockResolvedValue(WEATHER);
    vi.spyOn(weatherService, 'detectUserLocation').mockRejectedValue(new GeolocationFailure('denied', 'no'));

    render(<WeatherWidget widgetId="widget-weather-1" config={config} />);
    await waitFor(() => screen.getByText('Slight rain'));
    await user.click(screen.getByTitle('Detect Current Location'));

    await waitFor(() => expect(screen.getByText(/Location access was denied/)).toBeInTheDocument());
  });

  it('その他の位置情報エラーは汎用メッセージになること', async () => {
    const user = setupUser();
    vi.spyOn(weatherService, 'fetchWeather').mockResolvedValue(WEATHER);
    vi.spyOn(weatherService, 'detectUserLocation').mockRejectedValue(new Error('weird'));

    render(<WeatherWidget config={config} />);
    await waitFor(() => screen.getByText('Slight rain'));
    await user.click(screen.getByTitle('Detect Current Location'));
    await waitFor(() => expect(screen.getByText(/Could not determine your location/)).toBeInTheDocument());
  });

  it('既定の都市のままなら現在地の提案を一度だけ出し、「あとで」で以後出さないこと', async () => {
    const user = setupUser();
    vi.spyOn(weatherService, 'fetchWeather').mockResolvedValue(WEATHER);
    const widgetConfig = () => useDashboardStore.getState().widgets.find((x) => x.id === 'widget-weather-1')!.config;

    const { rerender } = render(<WeatherWidget widgetId="widget-weather-1" config={config} />);
    await waitFor(() => screen.getByText('Slight rain'));
    expect(screen.getByRole('note')).toHaveTextContent('Show the weather where you are?');

    await user.click(screen.getByRole('button', { name: 'Not now' }));
    expect(widgetConfig().locationPrompted).toBe(true);
    rerender(<WeatherWidget widgetId="widget-weather-1" config={widgetConfig() as any} />);
    expect(screen.queryByRole('note')).not.toBeInTheDocument();
    // The re-render kicked off another (mocked) fetch; let it settle inside the test.
    await waitFor(() => expect(screen.getByText('Slight rain')).toBeInTheDocument());
  });

  it('提案の「現在地を使う」は検出して保存し、ユーザーが選んだ座標では提案しないこと', async () => {
    const user = setupUser();
    vi.spyOn(weatherService, 'fetchWeather').mockResolvedValue(WEATHER);
    vi.spyOn(weatherService, 'detectUserLocation').mockResolvedValue({ latitude: 34.69, longitude: 135.5, city: 'Osaka' });

    const { unmount } = render(<WeatherWidget widgetId="widget-weather-1" config={config} />);
    await waitFor(() => screen.getByText('Slight rain'));
    await user.click(screen.getByRole('button', { name: 'Use my location' }));
    await waitFor(() => {
      const w = useDashboardStore.getState().widgets.find((x) => x.id === 'widget-weather-1')!;
      expect(w.config).toMatchObject({ city: 'Osaka', latitude: 34.69, locationPrompted: true });
    });

    unmount();
    // Custom coordinates (not a regional default) → no offer even without the flag.
    render(<WeatherWidget widgetId="widget-weather-1" config={{ ...config, latitude: 35.8712, longitude: 139.7461 }} />);
    await waitFor(() => screen.getByText('Slight rain'));
    expect(screen.queryByRole('note')).not.toBeInTheDocument();
  });

  it('更新ボタンで再取得すること', async () => {
    const user = setupUser();
    const fetchSpy = vi.spyOn(weatherService, 'fetchWeather').mockResolvedValue(WEATHER);
    render(<WeatherWidget config={config} />);
    await waitFor(() => screen.getByText('Slight rain'));
    await user.click(screen.getByTitle('Refresh'));
    await waitFor(() => expect(fetchSpy).toHaveBeenCalledTimes(2));
  });
});
