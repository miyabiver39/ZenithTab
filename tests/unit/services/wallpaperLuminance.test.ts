import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  relativeLuminance,
  parseCssColors,
  gradientLuminance,
  effectiveLuminance,
  classifyBackdrop,
  imageLuminance,
  clearLuminanceCache,
  resolveBackdropTone,
  LIGHT_BACKDROP_THRESHOLD,
} from '../../../src/services/wallpaperLuminance';

/** Stand-in for a decoded image: every sampled pixel is this one colour. */
function stubImageAs(rgb: [number, number, number] | 'error' | 'tainted') {
  const OriginalImage = globalThis.Image;
  class FakeImage {
    crossOrigin = '';
    onload: (() => void) | null = null;
    onerror: (() => void) | null = null;
    set src(_value: string) {
      queueMicrotask(() => (rgb === 'error' ? this.onerror?.() : this.onload?.()));
    }
  }
  vi.stubGlobal('Image', FakeImage);
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockImplementation(() => {
    if (rgb === 'tainted' || rgb === 'error') {
      return {
        drawImage: vi.fn(),
        getImageData: () => {
          throw new DOMException('tainted', 'SecurityError');
        },
      } as unknown as CanvasRenderingContext2D;
    }
    const data = new Uint8ClampedArray(16 * 16 * 4);
    for (let i = 0; i < data.length; i += 4) {
      data[i] = rgb[0];
      data[i + 1] = rgb[1];
      data[i + 2] = rgb[2];
      data[i + 3] = 255;
    }
    return { drawImage: vi.fn(), getImageData: () => ({ data }) } as unknown as CanvasRenderingContext2D;
  });
  return () => vi.stubGlobal('Image', OriginalImage);
}

describe('wallpaperLuminance', () => {
  beforeEach(() => clearLuminanceCache());
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('相対輝度は黒 0・白 1 で、緑が最も重く効くこと', () => {
    expect(relativeLuminance(0, 0, 0)).toBe(0);
    expect(relativeLuminance(255, 255, 255)).toBeCloseTo(1, 5);
    expect(relativeLuminance(0, 255, 0)).toBeGreaterThan(relativeLuminance(255, 0, 0));
    expect(relativeLuminance(255, 0, 0)).toBeGreaterThan(relativeLuminance(0, 0, 255));
  });

  it('グラデーション文字列から #rgb / #rrggbb / rgb() の色を拾い、平均輝度を返すこと', () => {
    expect(parseCssColors('linear-gradient(135deg, #fff 0%, #000000 50%, rgb(0, 255, 0) 100%)')).toEqual([
      [255, 255, 255],
      [0, 0, 0],
      [0, 255, 0],
    ]);
    expect(gradientLuminance('linear-gradient(135deg, #000 0%, #fff 100%)')).toBeCloseTo(0.5, 5);
    expect(gradientLuminance('linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #311042 100%)')).toBeLessThan(0.05);
    expect(gradientLuminance('none')).toBeNull();
  });

  it('brightness フィルタと暗いオーバーレイを合成した実効輝度を返すこと', () => {
    expect(effectiveLuminance(1, 1, 0)).toBe(1);
    expect(effectiveLuminance(1, 0.5, 0)).toBe(0.5);
    // A 50% near-black overlay halves what is left (plus the overlay's own trace of light).
    expect(effectiveLuminance(1, 1, 0.5)).toBeCloseTo(0.5, 2);
    // brightness > 1 can't push luminance past white; garbage input is clamped.
    expect(effectiveLuminance(0.9, 1.5, 0)).toBe(1);
    expect(effectiveLuminance(0.5, -1, 2)).toBeCloseTo(0.0027, 3);
  });

  it('閾値以上なら light、未満・不明なら dark に分類すること', () => {
    expect(classifyBackdrop(LIGHT_BACKDROP_THRESHOLD)).toBe('light');
    expect(classifyBackdrop(LIGHT_BACKDROP_THRESHOLD - 0.01)).toBe('dark');
    expect(classifyBackdrop(null)).toBe('dark');
  });

  it('画像は 16×16 に縮小して平均輝度を取り、同じ URL はキャッシュすること', async () => {
    const restore = stubImageAs([255, 255, 255]);
    expect(await imageLuminance('https://img.example/white.jpg')).toBeCloseTo(1, 5);
    const getContext = HTMLCanvasElement.prototype.getContext as unknown as ReturnType<typeof vi.fn>;
    expect(getContext).toHaveBeenCalledTimes(1);
    await imageLuminance('https://img.example/white.jpg');
    expect(getContext).toHaveBeenCalledTimes(1);
    restore();
  });

  it('読み込み失敗や汚染されたキャンバスは null(= dark 扱い)になり、例外を投げないこと', async () => {
    let restore = stubImageAs('error');
    expect(await imageLuminance('https://img.example/missing.jpg')).toBeNull();
    restore();
    restore = stubImageAs('tainted');
    expect(await imageLuminance('https://img.example/no-cors.jpg')).toBeNull();
    restore();
  });

  it('resolveBackdropTone: 白い写真の「いい感じモード」朝スロットは light、既定の宇宙壁紙は dark', async () => {
    const restore = stubImageAs([245, 245, 240]);
    // Smart "morning" slot: brightness 0.95, overlay 0.25.
    expect(await resolveBackdropTone({ url: 'https://img.example/bright.jpg', isGradient: false, brightness: 0.95, overlayOpacity: 0.25 })).toBe('light');
    restore();
    const restoreDark = stubImageAs([20, 24, 60]);
    expect(await resolveBackdropTone({ url: 'https://img.example/space.jpg', isGradient: false, brightness: 0.85, overlayOpacity: 0.35 })).toBe('dark');
    restoreDark();
  });

  it('resolveBackdropTone: 十分に濃いオーバーレイは白い写真でも dark に戻し、グラデーションは brightness を無視すること', async () => {
    const restore = stubImageAs([255, 255, 255]);
    expect(await resolveBackdropTone({ url: 'https://img.example/white.jpg', isGradient: false, brightness: 0.85, overlayOpacity: 0.8 })).toBe('dark');
    restore();
    expect(await resolveBackdropTone({ url: 'linear-gradient(135deg, #fff 0%, #eee 100%)', isGradient: true, brightness: 0.1, overlayOpacity: 0 })).toBe('light');
    expect(await resolveBackdropTone({ url: '', isGradient: false, brightness: 1, overlayOpacity: 0 })).toBe('dark');
  });
});
