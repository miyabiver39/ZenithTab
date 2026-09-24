import { describe, it, expect } from 'vitest';
import type { AppearanceSettings, WallpaperSettings, DockItem, KeyboardShortcutBinding, TimeSlotConfig, DynamicWallpaperSettings } from '../../../src/types/settings';
import {
  sanitizeWallpaper,
  sanitizeAppearance,
  sanitizeDockItems,
  sanitizeKeyboardShortcuts,
  sanitizePages,
  isSafeGradient,
  isDataImageUrl,
  isSafeWallpaperUrl,
  cssUrl,
  DEFAULT_WALLPAPER,
  DEFAULT_APPEARANCE,
} from '../../../src/utils/settingsSanitizers';

describe('settingsSanitizers › gradient / data URL / wallpaper URL checks', () => {
  it('linear/radial/conic gradient だけを安全と判定し、url() を含むものは拒否すること', () => {
    expect(isSafeGradient('linear-gradient(135deg, #0f172a 0%, #311042 100%)')).toBe(true);
    expect(isSafeGradient('radial-gradient(circle, red, blue)')).toBe(true);
    expect(isSafeGradient('conic-gradient(from 90deg, red, blue)')).toBe(true);
    expect(isSafeGradient('linear-gradient(to right, url(javascript:alert(1)), red)')).toBe(false);
    expect(isSafeGradient('x), url(https://evil.example/pixel.png')).toBe(false);
    expect(isSafeGradient('background: red; }body{display:none')).toBe(false);
    expect(isSafeGradient(42)).toBe(false);
  });

  it('data:image/* の base64 だけを画像アップロードとして許可すること', () => {
    expect(isDataImageUrl('data:image/png;base64,iVBORw0KGgo=')).toBe(true);
    expect(isDataImageUrl('data:image/svg+xml;base64,PHN2Zz4=')).toBe(false);
    expect(isDataImageUrl('data:text/html;base64,PHNjcmlwdD4=')).toBe(false);
    expect(isDataImageUrl('data:image/png,not-base64')).toBe(false);
  });

  it('isSafeWallpaperUrl は http(s) / data:image / gradient の3種のみ通すこと', () => {
    expect(isSafeWallpaperUrl('https://images.example.com/a.jpg')).toBe(true);
    expect(isSafeWallpaperUrl('data:image/png;base64,abc=')).toBe(true);
    expect(isSafeWallpaperUrl('linear-gradient(135deg, red, blue)')).toBe(true);
    expect(isSafeWallpaperUrl('javascript:alert(1)')).toBe(false);
    expect(isSafeWallpaperUrl('file:///etc/passwd')).toBe(false);
  });

  it('cssUrl は引用符・括弧・バックスラッシュ・空白をエスケープし url() から脱出できないこと', () => {
    const evil = 'x"); background: url(https://evil.example/pixel.png); //';
    const escaped = cssUrl(evil);
    expect(escaped.startsWith('url("')).toBe(true);
    expect(escaped.endsWith('")')).toBe(true);
    expect(escaped).not.toContain('");');
    // No bare quote/paren inside the string content (the wrapper's own trailing `")` is fine).
    expect(escaped.slice(5, -2)).not.toMatch(/["()]/);
  });
});

describe('settingsSanitizers › sanitizeWallpaper', () => {
  it('gradient ソースは安全なグラデーションのみ許可し、そうでなければ既定に戻すこと', () => {
    const good = sanitizeWallpaper({ source: 'gradient', currentWallpaperUrl: 'linear-gradient(135deg, red, blue)' });
    expect(good.source).toBe('gradient');
    expect(good.currentWallpaperUrl).toBe('linear-gradient(135deg, red, blue)');

    const bad = sanitizeWallpaper({ source: 'gradient', currentWallpaperUrl: 'x), url(https://evil.example/p.png' });
    expect(bad.source).toBe(DEFAULT_WALLPAPER.source);
    expect(bad.currentWallpaperUrl).toBe(DEFAULT_WALLPAPER.currentWallpaperUrl);
  });

  it('unsplash/custom ソースは http(s) または data:image のみ許可すること', () => {
    const httpOk = sanitizeWallpaper({ source: 'unsplash', currentWallpaperUrl: 'https://images.unsplash.com/x.jpg' });
    expect(httpOk.currentWallpaperUrl).toBe('https://images.unsplash.com/x.jpg');

    const dataOk = sanitizeWallpaper({ source: 'custom', currentWallpaperUrl: 'data:image/png;base64,abc=' });
    expect(dataOk.currentWallpaperUrl).toBe('data:image/png;base64,abc=');
    expect(dataOk.source).toBe('custom');

    const injected = sanitizeWallpaper({ source: 'custom', currentWallpaperUrl: 'javascript:alert(1)' });
    expect(injected.currentWallpaperUrl).toBe(DEFAULT_WALLPAPER.currentWallpaperUrl);
    expect(injected.source).toBe(DEFAULT_WALLPAPER.source);
  });

  it('数値は範囲にクランプし、列挙値は既定にフォールバックすること', () => {
    const out = sanitizeWallpaper({
      source: 'not-a-source',
      category: 'nonsense',
      blur: 999,
      brightness: -5,
      overlayOpacity: 5,
      refreshInterval: 'whenever',
      currentWallpaperUrl: 'https://a.example/b.jpg',
    });
    expect(out.source).toBe(DEFAULT_WALLPAPER.source);
    expect(out.category).toBe(DEFAULT_WALLPAPER.category);
    expect(out.blur).toBe(20);
    expect(out.brightness).toBe(0.2);
    expect(out.overlayOpacity).toBe(0.8);
    expect(out.refreshInterval).toBe(DEFAULT_WALLPAPER.refreshInterval);
  });

  it('部分的な dynamic スロット構成をそのまま保持すること(欠けた時間帯はプリセットで補う設計)', () => {
    const out = sanitizeWallpaper({
      ...DEFAULT_WALLPAPER,
      dynamic: {
        enabled: true,
        mode: 'custom',
        seed: 3,
        slots: { morning: { startHour: 5, source: 'gradient', category: 'nature', gradientIndex: 1 } },
      },
    });
    expect(out.dynamic?.enabled).toBe(true);
    expect(out.dynamic?.slots).toBeDefined();
    expect(Object.keys(out.dynamic!.slots!)).toEqual(['morning']);
    expect(out.dynamic!.slots!.morning.source).toBe('gradient');
  });

  it('null / 非オブジェクトの入力には既定値を返すこと', () => {
    expect(sanitizeWallpaper(null)).toEqual(DEFAULT_WALLPAPER);
    expect(sanitizeWallpaper('nope')).toEqual(DEFAULT_WALLPAPER);
    expect(sanitizeWallpaper(undefined)).toEqual(DEFAULT_WALLPAPER);
  });
});

describe('settingsSanitizers › sanitizeAppearance', () => {
  it('未知の列挙値は既定に、数値は範囲にクランプすること', () => {
    const out = sanitizeAppearance({
      language: 'klingon',
      theme: 'ultra-dark',
      glassBlur: -10,
      glassOpacity: 5,
      borderRadius: 'huge',
      dockPosition: 'sideways',
      compactMode: 'yes',
      adaptiveTextColor: 'no',
    });
    expect(out.language).toBe(DEFAULT_APPEARANCE.language);
    expect(out.theme).toBe(DEFAULT_APPEARANCE.theme);
    expect(out.glassBlur).toBe(0);
    expect(out.glassOpacity).toBe(0.95);
    expect(out.borderRadius).toBe(DEFAULT_APPEARANCE.borderRadius);
    expect(out.dockPosition).toBe(DEFAULT_APPEARANCE.dockPosition);
    expect(out.compactMode).toBe(false);
    expect(out.adaptiveTextColor).toBe(true);
  });

  it('妥当な値はそのまま通すこと', () => {
    const out = sanitizeAppearance({ language: 'ja', theme: 'light', glassBlur: 8, glassOpacity: 0.6, borderRadius: 'lg', dockPosition: 'top', compactMode: true, adaptiveTextColor: false });
    expect(out).toEqual({ language: 'ja', theme: 'light', glassBlur: 8, glassOpacity: 0.6, borderRadius: 'lg', dockPosition: 'top', compactMode: true, adaptiveTextColor: false });
  });

  it('null / 非オブジェクトの入力には既定値を返すこと', () => {
    expect(sanitizeAppearance(null)).toEqual(DEFAULT_APPEARANCE);
    expect(sanitizeAppearance(123)).toEqual(DEFAULT_APPEARANCE);
  });
});

describe('settingsSanitizers › sanitizeDockItems / sanitizeKeyboardShortcuts', () => {
  it('壊れた要素(null・URL なし・危険なスキーム)を落とし、openInNewTab を既定 true で補うこと', () => {
    const out = sanitizeDockItems([
      null,
      'string',
      { id: 'a', label: 'ok', url: 'https://ok.example', icon: 'globe' },
      { id: 'b', label: 'bad', url: 'javascript:1', icon: 'globe' },
      { id: 'c', label: 'no icon', url: 'https://x.example' },
      { id: 'd', label: 'explicit false', url: 'https://y.example', icon: 'globe', openInNewTab: false },
    ]);
    expect(out.map((d) => d.id)).toEqual(['a', 'd']);
    expect(out[0].openInNewTab).toBe(true);
    expect(out[1].openInNewTab).toBe(false);
  });

  it('配列でない入力は空配列にすること', () => {
    expect(sanitizeDockItems(null)).toEqual([]);
    expect(sanitizeDockItems({})).toEqual([]);
  });

  it('キーボードショートカットも同様に検証すること', () => {
    const out = sanitizeKeyboardShortcuts([
      null,
      { id: 'a', combo: 'Ctrl+Alt+G', label: 'GitHub', url: 'https://github.com' },
      { id: 'b', combo: 'Ctrl+Alt+X', label: 'Bad', url: 'data:text/html,evil' },
      { id: 'c', combo: 'Ctrl+Alt+Y', label: 'No URL' },
    ]);
    expect(out.map((s) => s.id)).toEqual(['a']);
    expect(out[0].openInNewTab).toBe(true);
  });
});

describe('sanitizePages (#79)', () => {
  it('配列以外は空配列になること', () => {
    expect(sanitizePages(undefined)).toEqual([]);
    expect(sanitizePages({ id: 'p1' })).toEqual([]);
  });

  it('id が空/非文字列/予約語のエントリと重複 id を落とし、name を文字列に正規化すること', () => {
    expect(
      sanitizePages([
        { id: 'a', name: 'A' },
        { id: 'a', name: 'dup' },
        { id: '', name: 'empty' },
        { id: 1, name: 'num' },
        { id: 'constructor', name: 'c' },
        { id: 'b', name: ['x'] },
        { id: 'c' },
        'garbage',
        null,
      ])
    ).toEqual([
      { id: 'a', name: 'A' },
      { id: 'b', name: '' },
      { id: 'c', name: '' },
    ]);
  });

  it('name は 60 文字で切り詰め、余分なフィールドは持ち込まないこと', () => {
    const [page] = sanitizePages([{ id: 'a', name: 'n'.repeat(100), extra: '<script>' }]);
    expect(page).toEqual({ id: 'a', name: 'n'.repeat(60) });
  });
});

// Each sample sets every field (Required<…>): adding a field to one of
// these types stops this file compiling until the sample covers it, and
// the round-trip then fails if the sanitizer drops the new field (#80).
describe('設定サニタイザが型の全フィールドを保持すること (#80)', () => {
  it('Appearance', () => {
    const sample: Required<AppearanceSettings> = {
      language: 'ja',
      theme: 'light',
      glassBlur: 20,
      glassOpacity: 0.5,
      borderRadius: 'lg',
      compactMode: true,
      dockPosition: 'top',
      adaptiveTextColor: false,
    };
    expect(sanitizeAppearance(sample)).toEqual(sample);
  });

  it('Wallpaper(動的壁紙のスロットを含む)', () => {
    const slot: Required<TimeSlotConfig> = { startHour: 6, source: 'gradient', category: 'nature', gradientIndex: 2, blur: 3, brightness: 0.9, overlayOpacity: 0.2 };
    const dynamic: Required<DynamicWallpaperSettings> = {
      enabled: true,
      mode: 'custom',
      seed: 7,
      slots: { morning: slot, day: { ...slot, startHour: 10 }, sunset: { ...slot, startHour: 17 }, night: { ...slot, startHour: 21 } },
    };
    const sample: Required<WallpaperSettings> = {
      source: 'custom',
      customUrl: 'https://img.example/a.jpg',
      category: 'space',
      blur: 5,
      brightness: 1,
      overlayOpacity: 0.3,
      refreshInterval: 'daily',
      lastRefreshed: 1_700_000_000_000,
      currentWallpaperUrl: 'https://img.example/a.jpg',
      dynamic,
    };
    expect(sanitizeWallpaper(sample)).toEqual(sample);
  });

  it('Dock / キーボードショートカット', () => {
    const dock: Required<DockItem> = { id: 'd', label: 'D', url: 'https://d.example', icon: 'globe', openInNewTab: false };
    const shortcut: Required<KeyboardShortcutBinding> = { id: 's', combo: 'Ctrl+Alt+G', label: 'S', url: 'https://s.example', openInNewTab: false };
    expect(sanitizeDockItems([dock])).toEqual([dock]);
    expect(sanitizeKeyboardShortcuts([shortcut])).toEqual([shortcut]);
  });
});
