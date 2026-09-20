import React, { useRef } from 'react';
import { Upload } from 'lucide-react';
import { Button } from '../../common/Button';
import { useDashboardStore } from '../../../store/useDashboardStore';
import { WallpaperCategory, TimeSlot, TimeSlotConfig } from '../../../types/settings';
import { wallpaperService, GRADIENT_PRESETS, TIME_SLOTS } from '../../../services/wallpaperService';
import { useTranslation } from '../../../i18n/i18n';

/** Wallpaper source, categories, upload, gradients and the time-aware mode. */
export const WallpaperTab: React.FC = () => {
  const wallpaper = useDashboardStore((s) => s.wallpaper);
  const updateWallpaper = useDashboardStore((s) => s.updateWallpaper);
  const { t } = useTranslation();
  const wallpaperUploadRef = useRef<HTMLInputElement>(null);

  // --- Time-aware wallpaper -------------------------------------------
  const dynamic = wallpaper.dynamic;
  const dynamicEnabled = !!dynamic?.enabled;
  const activeSlots = wallpaperService.getActiveSlots(wallpaper);
  const currentSlot = wallpaperService.getCurrentTimeSlot(new Date().getHours(), activeSlots);

  const setDynamic = (partial: Partial<NonNullable<typeof dynamic>>) =>
    updateWallpaper({ dynamic: { enabled: false, mode: 'smart', ...dynamic, ...partial } });

  // Custom mode starts from the smart presets so every slot is complete
  // before the user touches anything.
  const updateSlot = (slot: TimeSlot, partial: Partial<TimeSlotConfig>) =>
    setDynamic({
      mode: 'custom',
      slots: { ...activeSlots, [slot]: { ...activeSlots[slot], ...partial } },
    });


  const wallpaperCategories: Array<{ id: WallpaperCategory; label: string }> = [
    { id: 'space', label: t.categories.space },
    { id: 'nature', label: t.categories.nature },
    { id: 'minimal', label: t.categories.minimal },
    { id: 'architecture', label: t.categories.architecture },
    { id: 'abstract', label: t.categories.abstract },
    { id: 'cyberpunk', label: t.categories.cyberpunk },
  ];

  const handleCustomWallpaperUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      // Downscaled + re-encoded so a large photo cannot exhaust the
      // chrome.storage.local quota.
      const dataUrl = await wallpaperService.prepareUploadedWallpaper(file);
      updateWallpaper({
        source: 'custom',
        currentWallpaperUrl: dataUrl,
      });
    } catch (err) {
      console.error('Failed reading custom wallpaper image:', err);
    }
  };

  return (
    <div className="space-y-5">
      {/* Time-aware wallpaper */}
      <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/10 space-y-3">
        <label className="flex items-start justify-between gap-3 cursor-pointer">
          <div>
            <div className="text-xs font-semibold text-white">{t.settings.dynamic.title}</div>
            <div className="text-[11px] text-slate-400 leading-relaxed">{t.settings.dynamic.desc}</div>
          </div>
          <input
            type="checkbox"
            checked={dynamicEnabled}
            onChange={(e) => setDynamic({ enabled: e.target.checked })}
            aria-label={t.settings.dynamic.enable}
            className="mt-0.5 w-4 h-4 rounded text-sky-500 bg-slate-800 border-white/20"
          />
        </label>

        {dynamicEnabled && (
          <>
            <div className="grid grid-cols-2 gap-2">
              {(
                [
                  { key: 'smart', label: t.settings.dynamic.modeSmart, desc: t.settings.dynamic.modeSmartDesc },
                  { key: 'custom', label: t.settings.dynamic.modeCustom, desc: t.settings.dynamic.modeCustomDesc },
                ] as const
              ).map((m) => (
                <button
                  key={m.key}
                  type="button"
                  onClick={() => setDynamic({ mode: m.key, slots: m.key === 'custom' ? activeSlots : dynamic?.slots })}
                  className={`p-2.5 rounded-xl border text-left transition-all ${
                    (dynamic?.mode || 'smart') === m.key
                      ? 'bg-sky-500/20 border-sky-400 text-sky-100'
                      : 'bg-slate-800/40 border-white/10 text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  <div className="text-xs font-semibold">{m.label}</div>
                  <div className="text-[10px] text-slate-400 leading-snug mt-0.5">{m.desc}</div>
                </button>
              ))}
            </div>

            <p className="text-[11px] text-slate-400">
              {t.settings.dynamic.now}: <span className="text-sky-300 font-medium">{t.settings.dynamic.slots[currentSlot]}</span>
            </p>

            {dynamic?.mode === 'custom' && (
              <div className="space-y-2.5">
                {TIME_SLOTS.map((slot) => {
                  const cfg = activeSlots[slot];
                  return (
                    <div key={slot} data-testid={`slot-${slot}`} className="p-2.5 rounded-xl bg-slate-800/40 border border-white/10 space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-semibold text-white">{t.settings.dynamic.slots[slot]}</span>
                        <label className="flex items-center gap-1.5 text-[11px] text-slate-400">
                          {t.settings.dynamic.startHour}
                          <input
                            type="number"
                            min="0"
                            max="23"
                            value={cfg.startHour}
                            onChange={(e) => updateSlot(slot, { startHour: Math.min(23, Math.max(0, parseInt(e.target.value) || 0)) })}
                            className="w-14 px-2 py-1 rounded-lg bg-slate-900/60 border border-white/10 text-xs text-white text-center focus:outline-none focus:border-sky-400/50"
                          />
                        </label>
                      </div>

                      <div className="flex flex-wrap items-center gap-1.5">
                        {(['unsplash', 'gradient'] as const).map((src) => (
                          <button
                            key={src}
                            type="button"
                            onClick={() => updateSlot(slot, { source: src })}
                            className={`px-2 py-1 rounded-lg text-[11px] font-medium border transition-all ${
                              cfg.source === src
                                ? 'bg-sky-500/20 border-sky-400 text-sky-200'
                                : 'bg-slate-900/40 border-white/10 text-slate-300 hover:bg-slate-800'
                            }`}
                          >
                            {src === 'unsplash' ? t.settings.dynamic.sourceUnsplash : t.settings.dynamic.sourceGradient}
                          </button>
                        ))}
                        {cfg.source === 'unsplash' ? (
                          <select
                            value={cfg.category}
                            onChange={(e) => updateSlot(slot, { category: e.target.value as WallpaperCategory })}
                            aria-label={t.settings.dynamic.sourceUnsplash}
                            className="ml-auto px-2 py-1 rounded-lg bg-slate-900/60 border border-white/10 text-[11px] text-white focus:outline-none"
                          >
                            {wallpaperCategories.map((cat) => (
                              <option key={cat.id} value={cat.id} className="bg-slate-900">
                                {cat.label}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <div className="ml-auto flex items-center gap-1">
                            {GRADIENT_PRESETS.map((grad, index) => (
                              <button
                                key={grad}
                                type="button"
                                onClick={() => updateSlot(slot, { gradientIndex: index })}
                                aria-label={`${t.settings.dynamic.sourceGradient} ${index + 1}`}
                                className={`w-5 h-5 rounded-md border transition-all ${
                                  (cfg.gradientIndex ?? 0) === index ? 'border-sky-400 scale-110' : 'border-white/10'
                                }`}
                                style={{ background: grad }}
                              />
                            ))}
                          </div>
                        )}
                      </div>

                      <div className="grid grid-cols-3 gap-2 text-[10px] text-slate-400">
                        <label>
                          {t.settings.wallpaperBlur} <span className="font-mono">{cfg.blur ?? 0}px</span>
                          <input
                            type="range"
                            min="0"
                            max="20"
                            value={cfg.blur ?? 0}
                            onChange={(e) => updateSlot(slot, { blur: parseInt(e.target.value) || 0 })}
                            className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-sky-400"
                          />
                        </label>
                        <label>
                          {t.settings.wallpaperBrightness} <span className="font-mono">{Math.round((cfg.brightness ?? 1) * 100)}%</span>
                          <input
                            type="range"
                            min="20"
                            max="120"
                            value={Math.round((cfg.brightness ?? 1) * 100)}
                            onChange={(e) => updateSlot(slot, { brightness: parseInt(e.target.value) / 100 })}
                            className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-sky-400"
                          />
                        </label>
                        <label>
                          {t.settings.overlayTint} <span className="font-mono">{Math.round((cfg.overlayOpacity ?? 0) * 100)}%</span>
                          <input
                            type="range"
                            min="0"
                            max="80"
                            value={Math.round((cfg.overlayOpacity ?? 0) * 100)}
                            onChange={(e) => updateSlot(slot, { overlayOpacity: parseInt(e.target.value) / 100 })}
                            className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-sky-400"
                          />
                        </label>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>

      {/* Manual wallpaper (hidden while the time-aware mode drives the background) */}
      {!dynamicEnabled && (
      <>
      {/* Wallpaper Sources */}
      <div>
        <label className="block text-xs font-medium text-slate-300 mb-2">
          {t.settings.wallpaperSource}
        </label>
        <div className="grid grid-cols-3 gap-2">
          {[
            { key: 'unsplash', label: 'Unsplash HD' },
            { key: 'gradient', label: 'Gradient' },
            { key: 'custom', label: 'Custom File' },
          ].map((src) => (
            <button
              key={src.key}
              type="button"
              onClick={() => {
                if (src.key === 'unsplash') {
                  const url = wallpaperService.getRandomWallpaper(wallpaper.category);
                  updateWallpaper({ source: 'unsplash', currentWallpaperUrl: url });
                } else if (src.key === 'gradient') {
                  updateWallpaper({ source: 'gradient', currentWallpaperUrl: GRADIENT_PRESETS[0] });
                } else {
                  updateWallpaper({ source: 'custom' });
                }
              }}
              className={`py-2 px-3 rounded-xl text-xs font-medium border transition-all ${
                wallpaper.source === src.key
                  ? 'bg-sky-500/20 border-sky-400 text-sky-200'
                  : 'bg-slate-800/40 border-white/10 text-slate-300 hover:bg-slate-800'
              }`}
            >
              {src.label}
            </button>
          ))}
        </div>
      </div>

      {/* Category selection for Unsplash */}
      {wallpaper.source === 'unsplash' && (
        <div>
          <label className="block text-xs font-medium text-slate-300 mb-2">
            {t.settings.unsplashTheme}
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {wallpaperCategories.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => {
                  const newUrl = wallpaperService.getRandomWallpaper(cat.id);
                  updateWallpaper({
                    category: cat.id,
                    currentWallpaperUrl: newUrl,
                  });
                }}
                className={`p-2.5 rounded-xl text-xs font-medium border text-left transition-all ${
                  wallpaper.category === cat.id
                    ? 'bg-sky-500/20 border-sky-400 text-sky-200 shadow'
                    : 'bg-slate-800/40 border-white/10 text-slate-300 hover:bg-slate-800'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Gradient Selection */}
      {wallpaper.source === 'gradient' && (
        <div>
          <label className="block text-xs font-medium text-slate-300 mb-2">
            {t.settings.gradientPresets}
          </label>
          <div className="grid grid-cols-5 gap-2">
            {GRADIENT_PRESETS.map((grad, index) => (
              <button
                key={index}
                onClick={() => updateWallpaper({ currentWallpaperUrl: grad })}
                className={`h-12 rounded-xl border transition-all ${
                  wallpaper.currentWallpaperUrl === grad
                    ? 'ring-2 ring-sky-400 border-white'
                    : 'border-white/10'
                }`}
                style={{ background: grad }}
              />
            ))}
          </div>
        </div>
      )}

      {/* Custom Image Upload */}
      {wallpaper.source === 'custom' && (
        <div>
          <label className="block text-xs font-medium text-slate-300 mb-2">
            {t.settings.uploadWallpaper}
          </label>
          <input
            type="file"
            ref={wallpaperUploadRef}
            onChange={handleCustomWallpaperUpload}
            aria-label={t.settings.chooseImage}
            accept="image/*"
            className="hidden"
          />
          <Button
            variant="secondary"
            size="sm"
            onClick={() => wallpaperUploadRef.current?.click()}
            className="gap-2"
          >
            <Upload size={14} />
            <span>{t.settings.chooseImage}</span>
          </Button>
        </div>
      )}

      {/* Sliders for Blur, Brightness, Overlay */}
      <div className="space-y-4 pt-2 border-t border-white/10">
        <div>
          <div className="flex justify-between text-xs text-slate-300 mb-1">
            <span>{t.settings.wallpaperBlur}</span>
            <span className="font-mono text-slate-400">{wallpaper.blur}px</span>
          </div>
          <input
            type="range"
            min="0"
            max="20"
            value={wallpaper.blur}
            aria-label={t.settings.wallpaperBlur}
            onChange={(e) => updateWallpaper({ blur: parseInt(e.target.value) || 0 })}
            className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-sky-400"
          />
        </div>

        <div>
          <div className="flex justify-between text-xs text-slate-300 mb-1">
            <span>{t.settings.wallpaperBrightness}</span>
            <span className="font-mono text-slate-400">
              {Math.round(wallpaper.brightness * 100)}%
            </span>
          </div>
          <input
            type="range"
            min="30"
            max="120"
            value={Math.round(wallpaper.brightness * 100)}
            aria-label={t.settings.wallpaperBrightness}
            onChange={(e) => updateWallpaper({ brightness: parseInt(e.target.value) / 100 })}
            className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-sky-400"
          />
        </div>

        <div>
          <div className="flex justify-between text-xs text-slate-300 mb-1">
            <span>{t.settings.overlayTint}</span>
            <span className="font-mono text-slate-400">
              {Math.round(wallpaper.overlayOpacity * 100)}%
            </span>
          </div>
          <input
            type="range"
            min="0"
            max="80"
            value={Math.round(wallpaper.overlayOpacity * 100)}
            aria-label={t.settings.overlayTint}
            onChange={(e) => updateWallpaper({ overlayOpacity: parseInt(e.target.value) / 100 })}
            className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-sky-400"
          />
        </div>
      </div>
      </>
      )}
    </div>
  );
};
