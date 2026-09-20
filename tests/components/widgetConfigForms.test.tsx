import { describe, it, expect } from 'vitest';
import React, { useState } from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { setupUser, literal } from '../helpers/user';
import type { ConfigFormProps } from '../../src/components/widgets/configForm';
import { BookmarkConfig } from '../../src/components/widgets/BookmarkWidget/BookmarkConfig';
import { ClockConfig } from '../../src/components/widgets/ClockWidget/ClockConfig';
import { PomodoroConfig } from '../../src/components/widgets/PomodoroWidget/PomodoroConfig';
import { ShortcutsConfig } from '../../src/components/widgets/ShortcutsWidget/ShortcutsConfig';
import { IframeConfig } from '../../src/components/widgets/IframeWidget/IframeConfig';
import { WeatherConfig } from '../../src/components/widgets/WeatherWidget/WeatherConfig';
import { RssFeedConfig } from '../../src/components/widgets/RssFeedWidget/RssFeedConfig';

/**
 * The per-widget settings forms are plain controlled forms: they edit a
 * draft config through `setConfig`. This drives each one the way
 * WidgetConfigModal does and checks the draft they produce.
 */
function Harness({ Form, initial }: { Form: React.ComponentType<ConfigFormProps>; initial: Record<string, any> }) {
  const [config, setConfig] = useState(initial);
  return (
    <>
      <Form widgetId="w" config={config} setConfig={setConfig} />
      <pre data-testid="draft">{JSON.stringify(config)}</pre>
    </>
  );
}

const draft = () => JSON.parse(screen.getByTestId('draft').textContent || '{}');

describe('widget config forms', () => {
  it('BookmarkConfig: 表示モードとファビコンの切替', async () => {
    const user = setupUser();
    render(<Harness Form={BookmarkConfig} initial={{ viewMode: 'grid', showFavicons: true }} />);
    await user.click(screen.getByRole('button', { name: 'list' }));
    expect(draft().viewMode).toBe('list');
    await user.click(screen.getByRole('checkbox', { name: 'Show Favicons' }));
    expect(draft().showFavicons).toBe(false);
  });

  it('ClockConfig: スタイル・24 時間・秒・日付・タイムゾーン', async () => {
    const user = setupUser();
    render(<Harness Form={ClockConfig} initial={{ style: 'digital', is24Hour: true, showSeconds: true, showDate: true }} />);
    await user.click(screen.getByRole('button', { name: 'analog' }));
    expect(draft().style).toBe('analog');
    await user.click(screen.getByRole('checkbox', { name: '24-Hour Format' }));
    await user.click(screen.getByRole('checkbox', { name: 'Show Seconds' }));
    await user.click(screen.getByRole('checkbox', { name: 'Show Date' }));
    expect(draft()).toMatchObject({ is24Hour: false, showSeconds: false, showDate: false });
    await user.type(screen.getByPlaceholderText(/Asia\/Tokyo/), literal('UTC'));
    expect(draft().timezone).toBe('UTC');
  });

  it('PomodoroConfig: 各時間を変更でき、空や不正値は既定に戻ること', () => {
    render(<Harness Form={PomodoroConfig} initial={{ focusDurationMinutes: 25, shortBreakDurationMinutes: 5, longBreakDurationMinutes: 15 }} />);
    // Number inputs: fireEvent.change sets the value in one step (user.type
    // would go through intermediate states like "5" → "50").
    fireEvent.change(screen.getByLabelText('Focus Duration (Minutes)'), { target: { value: '50' } });
    fireEvent.change(screen.getByLabelText('Short Break Duration (Minutes)'), { target: { value: '10' } });
    fireEvent.change(screen.getByLabelText('Long Break Duration (Minutes)'), { target: { value: '30' } });
    expect(draft()).toMatchObject({ focusDurationMinutes: 50, shortBreakDurationMinutes: 10, longBreakDurationMinutes: 30 });
    fireEvent.change(screen.getByLabelText('Focus Duration (Minutes)'), { target: { value: '' } });
    fireEvent.change(screen.getByLabelText('Short Break Duration (Minutes)'), { target: { value: 'abc' } });
    fireEvent.change(screen.getByLabelText('Long Break Duration (Minutes)'), { target: { value: '' } });
    expect(draft()).toMatchObject({ focusDurationMinutes: 25, shortBreakDurationMinutes: 5, longBreakDurationMinutes: 15 });
  });

  it('ShortcutsConfig: 新しいタブで開くの切替と列数(不正値は 4)', async () => {
    const user = setupUser();
    render(<Harness Form={ShortcutsConfig} initial={{ openInNewTab: true, columns: 4 }} />);
    await user.click(screen.getByRole('checkbox', { name: 'Open in New Tab' }));
    expect(draft().openInNewTab).toBe(false);
    fireEvent.change(screen.getByLabelText('Columns'), { target: { value: '6' } }); // number input
    expect(draft().columns).toBe(6);
    fireEvent.change(screen.getByLabelText('Columns'), { target: { value: '' } });
    expect(draft().columns).toBe(4);
  });

  it('IframeConfig: URL とスクロール許可', async () => {
    const user = setupUser();
    render(<Harness Form={IframeConfig} initial={{ url: '', title: '', allowScroll: false }} />);
    await user.type(screen.getByPlaceholderText('https://example.com'), literal('https://x.example'));
    expect(draft().url).toBe('https://x.example');
    await user.click(screen.getByRole('checkbox', { name: 'Allow Scroll inside Frame' }));
    expect(draft().allowScroll).toBe(true);
  });

  it('WeatherConfig: 単位と予報表示', async () => {
    const user = setupUser();
    render(<Harness Form={WeatherConfig} initial={{ city: 'Tokyo', unit: 'celsius', showForecast: true }} />);
    await user.click(screen.getByRole('button', { name: /Fahrenheit/ }));
    expect(draft().unit).toBe('fahrenheit');
    await user.click(screen.getByRole('checkbox', { name: 'Show 3-Day Forecast' }));
    expect(draft().showForecast).toBe(false);
  });

  it('RssFeedConfig: 件数・サムネイル・概要の切替', async () => {
    const user = setupUser();
    render(<Harness Form={RssFeedConfig} initial={{ isGoogleNews: false, feedUrl: 'https://x.example/feed', maxItems: 8, showThumbnail: true, showDescription: true }} />);
    fireEvent.change(screen.getByLabelText('Max Articles to Display'), { target: { value: '12' } }); // number input
    expect(draft().maxItems).toBe(12);
    fireEvent.change(screen.getByLabelText('Max Articles to Display'), { target: { value: '' } });
    expect(draft().maxItems).toBe(8);
    await user.click(screen.getByRole('checkbox', { name: 'Show Article Thumbnail' }));
    await user.click(screen.getByRole('checkbox', { name: 'Show Article Snippet' }));
    expect(draft()).toMatchObject({ showThumbnail: false, showDescription: false });
  });
});
