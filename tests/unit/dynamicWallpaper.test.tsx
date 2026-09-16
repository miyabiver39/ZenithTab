import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act, within } from '@testing-library/react';
import { setupUser } from '../helpers/user';
import {
  wallpaperService,
  SMART_TIME_SLOTS,
  GRADIENT_PRESETS,
  WALLPAPER_COLLECTIONS,
} from '../../src/services/wallpaperService';
import { WallpaperBackground } from '../../src/components/layout/WallpaperBackground';
import { SettingsPanel } from '../../src/components/layout/SettingsPanel';
import { useDashboardStore } from '../../src/store/useDashboardStore';
import { DEFAULT_WALLPAPER, STORAGE_KEYS } from '../../src/services/storageService';
import { WallpaperSettings } from '../../src/types/settings';
import { resetDashboardStore } from '../helpers/store';
import { chromeStorageData } from '../helpers/chrome';

const at = (iso: string) => new Date(iso);
const smart = (extra: Partial<WallpaperSettings> = {}): WallpaperSettings => ({
  ...DEFAULT_WALLPAPER,
  dynamic: { enabled: true, mode: 'smart' },
  ...extra,
});

describe('wallpaperService time slots', () => {
  afterEach(() => vi.restoreAllMocks());

  it('デフォルトの時間帯区分(朝6/昼11/夕17/夜20、深夜は夜に含まれる)', async () => {
    const expectSlot = (hour: number, slot: string) => expect(wallpaperService.getCurrentTimeSlot(hour)).toBe(slot);
    expectSlot(6, 'morning');
    expectSlot(10, 'morning');
    expectSlot(11, 'day');
    expectSlot(16, 'day');
    expectSlot(17, 'sunset');
    expectSlot(19, 'sunset');
    expectSlot(20, 'night');
    expectSlot(23, 'night');
    expectSlot(0, 'night');
    expectSlot(5, 'night');
    expectSlot(30, 'morning'); // wraps modulo 24
  });

  it('カスタム開始時刻を順序に関係なく解釈すること', async () => {
    const slots = {
      morning: { ...SMART_TIME_SLOTS.morning, startHour: 5 },
      day: { ...SMART_TIME_SLOTS.day, startHour: 9 },
      sunset: { ...SMART_TIME_SLOTS.sunset, startHour: 18 },
      night: { ...SMART_TIME_SLOTS.night, startHour: 22 },
    };
    expect(wallpaperService.getCurrentTimeSlot(4, slots)).toBe('night');
    expect(wallpaperService.getCurrentTimeSlot(8, slots)).toBe('morning');
    expect(wallpaperService.getCurrentTimeSlot(21, slots)).toBe('sunset');
  });

  it('おまかせモードは時間帯ごとの厳選プリセットで解決すること', async () => {
    const night = wallpaperService.resolveDynamicWallpaper(smart(), at('2026-09-16T23:00:00'));
    expect(night.slot).toBe('night');
    expect(night.source).toBe('unsplash');
    expect(WALLPAPER_COLLECTIONS.space).toContain(night.url);
    expect(night.overlayOpacity).toBe(0.5);
    expect(night.brightness).toBe(0.7);

    const morning = wallpaperService.resolveDynamicWallpaper(smart(), at('2026-09-16T07:00:00'));
    expect(morning.slot).toBe('morning');
    expect(WALLPAPER_COLLECTIONS.nature).toContain(morning.url);
    expect(morning.overlayOpacity).toBeLessThan(night.overlayOpacity);
  });

  it('同じ日のうちは画像が安定し、seed で次の画像に進むこと', async () => {
    const a = wallpaperService.resolveDynamicWallpaper(smart(), at('2026-09-16T12:00:00'));
    const b = wallpaperService.resolveDynamicWallpaper(smart(), at('2026-09-16T15:30:00'));
    expect(a.url).toBe(b.url);
    const bumped = wallpaperService.resolveDynamicWallpaper(smart({ dynamic: { enabled: true, mode: 'smart', seed: 1 } }), at('2026-09-16T12:00:00'));
    expect(bumped.url).not.toBe(a.url);
    expect(WALLPAPER_COLLECTIONS.architecture).toContain(bumped.url);
  });

  it('こだわりモードはスロットごとの設定を使い、欠けた項目はプリセットで補うこと', async () => {
    const settings = smart({
      dynamic: {
        enabled: true,
        mode: 'custom',
        slots: {
          morning: { startHour: 6, source: 'gradient', category: 'nature', gradientIndex: 2, blur: 0, brightness: 1.1, overlayOpacity: 0.1 },
          day: { startHour: 11, source: 'unsplash', category: 'cyberpunk' },
        } as any,
      },
    });
    const morning = wallpaperService.resolveDynamicWallpaper(settings, at('2026-09-16T08:00:00'));
    expect(morning.source).toBe('gradient');
    expect(morning.url).toBe(GRADIENT_PRESETS[2]);
    expect(morning).toMatchObject({ blur: 0, brightness: 1.1, overlayOpacity: 0.1 });

    const day = wallpaperService.resolveDynamicWallpaper(settings, at('2026-09-16T13:00:00'));
    expect(WALLPAPER_COLLECTIONS.cyberpunk).toContain(day.url);
    // blur/brightness/overlay fall back to the smart preset for "day".
    expect(day.blur).toBe(SMART_TIME_SLOTS.day.blur);

    const night = wallpaperService.resolveDynamicWallpaper(settings, at('2026-09-16T23:00:00'));
    expect(night.slot).toBe('night');
    expect(WALLPAPER_COLLECTIONS.space).toContain(night.url);
  });

  it('オフライン時は写真ではなくグラデーションにフォールバックすること', async () => {
    vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(false);
    const resolved = wallpaperService.resolveDynamicWallpaper(smart(), at('2026-09-16T12:00:00'));
    expect(resolved.source).toBe('gradient');
    expect(GRADIENT_PRESETS).toContain(resolved.url);
  });
});

describe('WallpaperBackground (time-aware)', () => {
  beforeEach(() => {
    resetDashboardStore();
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'setInterval', 'clearInterval', 'Date'] });
    vi.setSystemTime(new Date('2026-09-16T23:00:00'));
  });
  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('有効時は時間帯で解決した画像とオーバーレイを描画すること', async () => {
    act(() => useDashboardStore.getState().updateWallpaper({ dynamic: { enabled: true, mode: 'smart' } }));
    const { container } = render(<WallpaperBackground />);
    const layer = container.querySelector('[data-wallpaper-layer="top"]') as HTMLElement;
    expect(layer.style.backgroundImage).toContain('images.unsplash.com');
    expect(layer.style.filter).toBe('blur(5px) brightness(0.7)');
    const overlay = screen.getByTestId('wallpaper-overlay');
    expect(overlay.style.opacity).toBe('0.5');
  });

  it('タブ再表示で時間帯をまたいでいればクロスフェードで切り替わること', async () => {
    act(() => useDashboardStore.getState().updateWallpaper({ dynamic: { enabled: true, mode: 'smart' } }));
    const { container } = render(<WallpaperBackground />);
    const before = (container.querySelector('[data-wallpaper-layer="top"]') as HTMLElement).style.backgroundImage;

    vi.setSystemTime(new Date('2026-09-17T08:00:00'));
    act(() => {
      document.dispatchEvent(new Event('visibilitychange'));
    });

    const layers = container.querySelectorAll('[data-wallpaper-layer]');
    expect(layers).toHaveLength(2);
    const top = layers[1] as HTMLElement;
    expect(top.style.backgroundImage).not.toBe(before);

    act(() => {
      vi.advanceTimersByTime(800);
    });
    expect(container.querySelectorAll('[data-wallpaper-layer]')).toHaveLength(1);
  });

  it('無効時は従来どおり手動設定の壁紙を描画すること', async () => {
    act(() => useDashboardStore.getState().updateWallpaper({ currentWallpaperUrl: 'https://img.example/manual.jpg', blur: 2, brightness: 1 }));
    const { container } = render(<WallpaperBackground />);
    const layer = container.querySelector('[data-wallpaper-layer="top"]') as HTMLElement;
    expect(layer.style.backgroundImage).toContain('manual.jpg');
    expect(layer.style.filter).toBe('blur(2px) brightness(1)');
  });

  it('壁紙変更ボタンは時間帯モードでは seed を進めること', async () => {
    act(() => useDashboardStore.getState().updateWallpaper({ dynamic: { enabled: true, mode: 'smart' } }));
    act(() => useDashboardStore.getState().rotateWallpaper());
    expect(useDashboardStore.getState().wallpaper.dynamic?.seed).toBe(1);
    expect(useDashboardStore.getState().wallpaper.currentWallpaperUrl).toBe(DEFAULT_WALLPAPER.currentWallpaperUrl);
  });
});

describe('SettingsPanel: time-aware wallpaper', () => {
  beforeEach(() => resetDashboardStore());

  it('トグルで有効化し、モードを切り替え、こだわり設定のスロットを編集できること', async () => {
    const user = setupUser();
    act(() => useDashboardStore.getState().openSettingsModal('settings'));
    render(<SettingsPanel />);

    await user.click(screen.getByLabelText('Change with the time of day'));
    const wp = () => useDashboardStore.getState().wallpaper;
    expect(wp().dynamic).toMatchObject({ enabled: true, mode: 'smart' });
    // Manual source picker is hidden while the time-aware mode drives things.
    expect(screen.queryByText('Wallpaper Source')).not.toBeInTheDocument();
    expect(screen.getByText(/^Now/)).toBeInTheDocument();

    await user.click(screen.getByText('Fine-tune it myself'));
    expect(wp().dynamic?.mode).toBe('custom');
    expect(wp().dynamic?.slots?.night.category).toBe('space');

    const night = screen.getByTestId('slot-night');
    const startHour = within(night).getByRole('spinbutton');
    await user.clear(startHour);
    await user.type(startHour, '21');
    expect(wp().dynamic?.slots?.night.startHour).toBe(21);

    await user.click(within(night).getByRole('button', { name: 'Gradient' }));
    expect(wp().dynamic?.slots?.night.source).toBe('gradient');
    await user.click(screen.getAllByLabelText('Gradient 3')[0]);
    expect(wp().dynamic?.slots?.night.gradientIndex).toBe(2);

    const morning = screen.getByTestId('slot-morning');
    await user.selectOptions(within(morning).getByRole('combobox'), 'minimal');
    expect(wp().dynamic?.slots?.morning.category).toBe('minimal');
    const sliders = morning.querySelectorAll('input[type="range"]');
    fireEvent.change(sliders[2], { target: { value: '60' } }); // range input
    expect(wp().dynamic?.slots?.morning.overlayOpacity).toBe(0.6);

    await act(async () => {});
    expect(chromeStorageData[STORAGE_KEYS.WALLPAPER].dynamic.mode).toBe('custom');

    await user.click(screen.getByLabelText('Change with the time of day'));
    expect(wp().dynamic?.enabled).toBe(false);
    expect(screen.getByText('Wallpaper Source')).toBeInTheDocument();
  });
});
