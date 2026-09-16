import { WallpaperCategory, WallpaperSettings, TimeSlot, TimeSlotConfig } from '../types/settings';

/** Widest edge we keep for a user-uploaded wallpaper, in CSS pixels. */
const MAX_WALLPAPER_WIDTH = 2560;

export const WALLPAPER_COLLECTIONS: Record<WallpaperCategory, string[]> = {
  space: [
    'https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?auto=format&fit=crop&w=2560&q=80',
    'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=2560&q=80',
    'https://images.unsplash.com/photo-1502134249126-9f3755a50d78?auto=format&fit=crop&w=2560&q=80',
    'https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?auto=format&fit=crop&w=2560&q=80',
  ],
  nature: [
    'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=2560&q=80',
    'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&w=2560&q=80',
    'https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&w=2560&q=80',
    'https://images.unsplash.com/photo-1511497584788-87676104235f?auto=format&fit=crop&w=2560&q=80',
  ],
  minimal: [
    'https://images.unsplash.com/photo-1494438639946-1ebd1d20bf85?auto=format&fit=crop&w=2560&q=80',
    'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=2560&q=80',
    'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=2560&q=80',
  ],
  architecture: [
    'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=2560&q=80',
    'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=2560&q=80',
    'https://images.unsplash.com/photo-1503387762-592deb58ef4e?auto=format&fit=crop&w=2560&q=80',
  ],
  abstract: [
    'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=2560&q=80',
    'https://images.unsplash.com/photo-1604076913837-52ab5629fba9?auto=format&fit=crop&w=2560&q=80',
    'https://images.unsplash.com/photo-1541701494587-cb58502866ab?auto=format&fit=crop&w=2560&q=80',
  ],
  cyberpunk: [
    'https://images.unsplash.com/photo-1508739773434-c26b3d09e071?auto=format&fit=crop&w=2560&q=80',
    'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=2560&q=80',
    'https://images.unsplash.com/photo-1578632767115-351597cf2477?auto=format&fit=crop&w=2560&q=80',
  ],
};

export const GRADIENT_PRESETS = [
  'linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #311042 100%)',
  'linear-gradient(135deg, #09203f 0%, #537895 100%)',
  'linear-gradient(135deg, #141e30 0%, #243b55 100%)',
  'linear-gradient(135deg, #000428 0%, #004e92 100%)',
  'linear-gradient(135deg, #0b0c10 0%, #1f2833 50%, #45a29e 100%)',
];

export const TIME_SLOTS: TimeSlot[] = ['morning', 'day', 'sunset', 'night'];

/**
 * The "make it nice for me" presets: one look per part of the day, tuned
 * so white glass-UI text stays readable (brighter mornings still carry a
 * light tint; nights get a heavier overlay to rest the eyes).
 */
export const SMART_TIME_SLOTS: Record<TimeSlot, TimeSlotConfig> = {
  morning: { startHour: 6, source: 'unsplash', category: 'nature', gradientIndex: 1, blur: 3, brightness: 0.95, overlayOpacity: 0.25 },
  day: { startHour: 11, source: 'unsplash', category: 'architecture', gradientIndex: 2, blur: 3, brightness: 0.9, overlayOpacity: 0.3 },
  sunset: { startHour: 17, source: 'unsplash', category: 'abstract', gradientIndex: 0, blur: 4, brightness: 0.85, overlayOpacity: 0.35 },
  night: { startHour: 20, source: 'unsplash', category: 'space', gradientIndex: 3, blur: 5, brightness: 0.7, overlayOpacity: 0.5 },
};

export interface ResolvedWallpaper {
  slot: TimeSlot;
  source: 'unsplash' | 'gradient';
  url: string;
  blur: number;
  brightness: number;
  overlayOpacity: number;
}

/** Day-of-year, so the picked image is stable for a day but rotates over time. */
function dayOfYear(date: Date): number {
  const start = Date.UTC(date.getFullYear(), 0, 0);
  return Math.floor((Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) - start) / 86400000);
}

export const wallpaperService = {
  /**
   * Which slot a given hour falls into. Slots are ordered by startHour and
   * the last one wraps past midnight, so with the defaults 03:00 is
   * "night" (started at 20:00 the previous evening).
   */
  getCurrentTimeSlot(hour: number, slots: Record<TimeSlot, TimeSlotConfig> = SMART_TIME_SLOTS): TimeSlot {
    const ordered = TIME_SLOTS.map((slot) => ({ slot, start: slots[slot]?.startHour ?? SMART_TIME_SLOTS[slot].startHour }))
      .sort((a, b) => a.start - b.start);
    const h = ((Math.floor(hour) % 24) + 24) % 24;
    let current = ordered[ordered.length - 1].slot;
    for (const entry of ordered) {
      if (entry.start <= h) current = entry.slot;
    }
    return current;
  },

  /** The slot table a settings object is actually using (smart vs custom). */
  getActiveSlots(wallpaper: WallpaperSettings): Record<TimeSlot, TimeSlotConfig> {
    const dynamic = wallpaper.dynamic;
    if (dynamic?.mode === 'custom' && dynamic.slots) {
      // Fill any slot a partial custom config leaves out from the presets.
      return TIME_SLOTS.reduce(
        (acc, slot) => ({ ...acc, [slot]: { ...SMART_TIME_SLOTS[slot], ...dynamic.slots?.[slot] } }),
        {} as Record<TimeSlot, TimeSlotConfig>
      );
    }
    return SMART_TIME_SLOTS;
  },

  /**
   * Turns the dynamic settings into the concrete look for `now`. Only
   * Unsplash (already an allowed host) or local CSS gradients are ever
   * used; when the browser reports itself offline the gradient is used so
   * the page never sits on a blank background.
   */
  resolveDynamicWallpaper(wallpaper: WallpaperSettings, now: Date = new Date()): ResolvedWallpaper {
    const slots = this.getActiveSlots(wallpaper);
    const slot = this.getCurrentTimeSlot(now.getHours(), slots);
    const config = slots[slot];
    const seed = wallpaper.dynamic?.seed ?? 0;
    const offline = typeof navigator !== 'undefined' && navigator.onLine === false;

    const gradient = GRADIENT_PRESETS[(config.gradientIndex ?? TIME_SLOTS.indexOf(slot)) % GRADIENT_PRESETS.length];
    let source: 'unsplash' | 'gradient' = config.source;
    let url = gradient;
    if (source === 'unsplash' && !offline) {
      const list = WALLPAPER_COLLECTIONS[config.category] || WALLPAPER_COLLECTIONS.space;
      url = list[(dayOfYear(now) + TIME_SLOTS.indexOf(slot) + seed) % list.length];
    } else {
      source = 'gradient';
    }

    return {
      slot,
      source,
      url,
      blur: config.blur ?? wallpaper.blur,
      brightness: config.brightness ?? wallpaper.brightness,
      overlayOpacity: config.overlayOpacity ?? wallpaper.overlayOpacity,
    };
  },

  getRandomWallpaper(category: WallpaperCategory = 'space'): string {
    const list = WALLPAPER_COLLECTIONS[category] || WALLPAPER_COLLECTIONS.space;
    const index = Math.floor(Math.random() * list.length);
    return list[index];
  },

  getAllWallpapers(category: WallpaperCategory): string[] {
    return WALLPAPER_COLLECTIONS[category] || [];
  },

  convertFileToDataUrl(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (error) => reject(error);
      reader.readAsDataURL(file);
    });
  },

  /**
   * Prepares an uploaded image for storage.
   *
   * chrome.storage.local caps out at ~10MB and a base64 data URL is roughly a
   * third larger than the file it encodes, so a raw 4K photo can blow the quota
   * on its own. We downscale to at most `maxWidth` and re-encode as JPEG, which
   * keeps a full-screen wallpaper comfortably under a megabyte while staying
   * visually indistinguishable behind the blur and overlay.
   *
   * Falls back to the untouched data URL if the browser cannot decode the file.
   */
  async prepareUploadedWallpaper(file: File, maxWidth = MAX_WALLPAPER_WIDTH, quality = 0.82): Promise<string> {
    try {
      const bitmap = await createImageBitmap(file);
      const scale = Math.min(1, maxWidth / bitmap.width);
      const width = Math.round(bitmap.width * scale);
      const height = Math.round(bitmap.height * scale);

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Canvas 2D context unavailable.');

      ctx.drawImage(bitmap, 0, 0, width, height);
      bitmap.close();

      return canvas.toDataURL('image/jpeg', quality);
    } catch (error) {
      console.warn('[ZenithTab] Could not downscale wallpaper, storing original:', error);
      return this.convertFileToDataUrl(file);
    }
  },
};
