import { describe, it, expect, vi, afterEach } from 'vitest';
import { wallpaperService, WALLPAPER_COLLECTIONS, GRADIENT_PRESETS } from '../../../src/services/wallpaperService';

describe('wallpaperService', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('カテゴリ内からランダムに1枚返し、未知のカテゴリは space にフォールバックすること', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.99);
    const nature = wallpaperService.getRandomWallpaper('nature');
    expect(nature).toBe(WALLPAPER_COLLECTIONS.nature[WALLPAPER_COLLECTIONS.nature.length - 1]);

    const fallback = wallpaperService.getRandomWallpaper('nope' as any);
    expect(WALLPAPER_COLLECTIONS.space).toContain(fallback);
  });

  it('getAllWallpapers がカテゴリの全URLを返し、未知は空配列を返すこと', () => {
    expect(wallpaperService.getAllWallpapers('cyberpunk')).toEqual(WALLPAPER_COLLECTIONS.cyberpunk);
    expect(wallpaperService.getAllWallpapers('nope' as any)).toEqual([]);
    expect(GRADIENT_PRESETS.length).toBeGreaterThan(0);
  });

  it('convertFileToDataUrl が data URL を返すこと', async () => {
    const file = new File(['hello'], 'a.txt', { type: 'text/plain' });
    const url = await wallpaperService.convertFileToDataUrl(file);
    expect(url).toMatch(/^data:text\/plain;base64,/);
  });

  it('convertFileToDataUrl が読み込みエラーを reject すること', async () => {
    const file = new File(['x'], 'a.txt');
    vi.spyOn(FileReader.prototype, 'readAsDataURL').mockImplementation(function (this: FileReader) {
      this.onerror?.(new ProgressEvent('error') as any);
    });
    await expect(wallpaperService.convertFileToDataUrl(file)).rejects.toBeDefined();
  });

  it('prepareUploadedWallpaper が maxWidth に縮小して JPEG で返すこと', async () => {
    const close = vi.fn();
    vi.stubGlobal('createImageBitmap', vi.fn(async () => ({ width: 4000, height: 2000, close })));
    const drawImage = vi.fn();
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue({ drawImage } as any);
    vi.spyOn(HTMLCanvasElement.prototype, 'toDataURL').mockReturnValue('data:image/jpeg;base64,xyz');

    const file = new File(['img'], 'big.png', { type: 'image/png' });
    const result = await wallpaperService.prepareUploadedWallpaper(file, 2000, 0.5);

    expect(result).toBe('data:image/jpeg;base64,xyz');
    expect(drawImage).toHaveBeenCalledWith(expect.anything(), 0, 0, 2000, 1000);
    expect(close).toHaveBeenCalled();
    expect(HTMLCanvasElement.prototype.toDataURL).toHaveBeenCalledWith('image/jpeg', 0.5);
  });

  it('デコードに失敗した場合は元の data URL を返すこと', async () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.stubGlobal('createImageBitmap', vi.fn(async () => { throw new Error('bad image'); }));

    const file = new File(['hello'], 'a.png', { type: 'image/png' });
    const result = await wallpaperService.prepareUploadedWallpaper(file);
    expect(result).toMatch(/^data:image\/png;base64,/);
  });
});
