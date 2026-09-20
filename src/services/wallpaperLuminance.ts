/**
 * Decides whether the wallpaper behind the UI reads as light or dark, so
 * text sitting directly on it (header, page strip, search pills) can flip
 * to a dark colour instead of white-on-white. Everything runs locally: a
 * wallpaper is sampled once into a tiny canvas and the result is cached
 * per URL.
 */

export type BackdropTone = 'light' | 'dark';

/**
 * Effective relative luminance above which dark text wins. White text and
 * near-black (#0f172a) text have equal WCAG contrast at L ≈ 0.20; a little
 * headroom above that keeps busy-but-dark photos on the white side.
 */
export const LIGHT_BACKDROP_THRESHOLD = 0.25;

/** Relative luminance of `bg-slate-950` (#020617), the overlay tint colour. */
const OVERLAY_LUMINANCE = 0.0027;

/** Edge length of the sampling canvas — plenty for an average, cheap to draw. */
const SAMPLE_SIZE = 16;

function srgbToLinear(channel: number): number {
  const c = channel / 255;
  return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
}

/** WCAG relative luminance (0 = black, 1 = white) of an 8-bit sRGB colour. */
export function relativeLuminance(r: number, g: number, b: number): number {
  return 0.2126 * srgbToLinear(r) + 0.7152 * srgbToLinear(g) + 0.0722 * srgbToLinear(b);
}

const HEX_COLOR = /#([0-9a-f]{3}|[0-9a-f]{6})\b/gi;
const RGB_COLOR = /rgba?\(\s*(\d{1,3})\s*[, ]\s*(\d{1,3})\s*[, ]\s*(\d{1,3})/gi;

/** Every `#rgb` / `#rrggbb` / `rgb(a)()` colour stop in a CSS gradient string. */
export function parseCssColors(css: string): [number, number, number][] {
  const colors: [number, number, number][] = [];
  for (const match of css.matchAll(HEX_COLOR)) {
    const hex = match[1].length === 3 ? match[1].split('').map((c) => c + c).join('') : match[1];
    colors.push([parseInt(hex.slice(0, 2), 16), parseInt(hex.slice(2, 4), 16), parseInt(hex.slice(4, 6), 16)]);
  }
  for (const match of css.matchAll(RGB_COLOR)) {
    colors.push([Number(match[1]), Number(match[2]), Number(match[3])]);
  }
  return colors;
}

/** Mean luminance of a gradient's colour stops, or null when none can be read. */
export function gradientLuminance(css: string): number | null {
  const colors = parseCssColors(css);
  if (colors.length === 0) return null;
  return colors.reduce((sum, [r, g, b]) => sum + relativeLuminance(r, g, b), 0) / colors.length;
}

/**
 * What the eye actually sees once `WallpaperBackground` applies its
 * `brightness()` filter and lays the dark overlay on top. The filter
 * scales channel values (approximated as scaling luminance); the overlay
 * is a normal alpha composite with a near-black colour.
 */
export function effectiveLuminance(base: number, brightness: number, overlayOpacity: number): number {
  const lit = Math.min(1, Math.max(0, base * Math.max(0, brightness)));
  const alpha = Math.min(1, Math.max(0, overlayOpacity));
  return lit * (1 - alpha) + OVERLAY_LUMINANCE * alpha;
}

/** Unknown luminance (image failed to load, canvas unavailable) is treated as dark: the current default look. */
export function classifyBackdrop(luminance: number | null, threshold = LIGHT_BACKDROP_THRESHOLD): BackdropTone {
  return luminance !== null && luminance >= threshold ? 'light' : 'dark';
}

const imageCache = new Map<string, Promise<number | null>>();

/**
 * Average luminance of an image, sampled through a 16×16 canvas. Resolves
 * null when the image can't be decoded or the canvas would be tainted
 * (a host without CORS headers) — never throws.
 */
export function imageLuminance(url: string): Promise<number | null> {
  const cached = imageCache.get(url);
  if (cached) return cached;

  const task = new Promise<number | null>((resolve) => {
    if (typeof Image === 'undefined' || typeof document === 'undefined') {
      resolve(null);
      return;
    }
    const img = new Image();
    // Needed to read pixels back from cross-origin images (Unsplash sends
    // permissive CORS headers; local and data: URLs don't need it).
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = SAMPLE_SIZE;
        canvas.height = SAMPLE_SIZE;
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        if (!ctx) {
          resolve(null);
          return;
        }
        ctx.drawImage(img, 0, 0, SAMPLE_SIZE, SAMPLE_SIZE);
        const { data } = ctx.getImageData(0, 0, SAMPLE_SIZE, SAMPLE_SIZE);
        let sum = 0;
        const pixels = data.length / 4;
        for (let i = 0; i < data.length; i += 4) {
          sum += relativeLuminance(data[i], data[i + 1], data[i + 2]);
        }
        resolve(pixels > 0 ? sum / pixels : null);
      } catch {
        // Tainted canvas or decode failure — fall back to the dark default.
        resolve(null);
      }
    };
    img.onerror = () => resolve(null);
    img.src = url;
  });

  imageCache.set(url, task);
  return task;
}

/** Drops cached samples; tests use it, and so would a wallpaper re-upload under the same URL. */
export function clearLuminanceCache(): void {
  imageCache.clear();
}

export interface BackdropInput {
  url: string;
  isGradient: boolean;
  brightness: number;
  overlayOpacity: number;
}

/** The tone of the composited wallpaper as `WallpaperBackground` will show it. */
export async function resolveBackdropTone(input: BackdropInput): Promise<BackdropTone> {
  if (!input.url) return 'dark';
  const base = input.isGradient ? gradientLuminance(input.url) : await imageLuminance(input.url);
  if (base === null) return 'dark';
  // Gradients are drawn without the brightness filter (see WallpaperBackground).
  const brightness = input.isGradient ? 1 : input.brightness;
  return classifyBackdrop(effectiveLuminance(base, brightness, input.overlayOpacity));
}
