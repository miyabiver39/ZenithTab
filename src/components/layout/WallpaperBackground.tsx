import React, { useEffect, useMemo, useState } from 'react';
import { useDashboardStore } from '../../store/useDashboardStore';
import { wallpaperService } from '../../services/wallpaperService';
import { resolveBackdropTone } from '../../services/wallpaperLuminance';

const CROSSFADE_MS = 700;

interface Layer {
  key: string;
  url: string;
  isGradient: boolean;
  blur: number;
  brightness: number;
  /** False for one frame after mounting so the opacity transition can run. */
  visible: boolean;
}

export const WallpaperBackground: React.FC = () => {
  const wallpaper = useDashboardStore((s) => s.wallpaper);
  const appearance = useDashboardStore((s) => s.appearance);
  const adaptiveText = appearance.adaptiveTextColor !== false;
  const {
    source = 'unsplash',
    currentWallpaperUrl,
    blur = 4,
    brightness = 0.85,
    overlayOpacity = 0.35,
    dynamic,
  } = wallpaper;

  // Time-aware mode re-checks the clock only when the tab is (re)shown —
  // no interval ticking in the background of every open new-tab page.
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    if (!dynamic?.enabled) return;
    const refresh = () => {
      if (!document.hidden) setNow(new Date());
    };
    document.addEventListener('visibilitychange', refresh);
    window.addEventListener('focus', refresh);
    return () => {
      document.removeEventListener('visibilitychange', refresh);
      window.removeEventListener('focus', refresh);
    };
  }, [dynamic?.enabled]);

  const target = useMemo(() => {
    if (dynamic?.enabled) {
      const resolved = wallpaperService.resolveDynamicWallpaper(wallpaper, now);
      return {
        url: resolved.url,
        isGradient: resolved.source === 'gradient',
        blur: resolved.blur,
        brightness: resolved.brightness,
        overlayOpacity: resolved.overlayOpacity,
      };
    }
    return { url: currentWallpaperUrl, isGradient: source === 'gradient', blur, brightness, overlayOpacity };
    // `wallpaper` covers every field the resolver reads.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wallpaper, now]);

  // Tell the rest of the UI whether the composited wallpaper is light, so
  // text placed straight on it (header, page strip, search pills) can turn
  // dark. Set on <html> so portaled menus see it too; absent = dark.
  useEffect(() => {
    const root = document.documentElement;
    if (!adaptiveText) {
      delete root.dataset.backdrop;
      return;
    }
    let cancelled = false;
    const { url, isGradient, brightness: imageBrightness, overlayOpacity: overlay } = target;
    void resolveBackdropTone({ url, isGradient, brightness: imageBrightness, overlayOpacity: overlay }).then((tone) => {
      if (!cancelled) root.dataset.backdrop = tone;
    });
    return () => {
      cancelled = true;
    };
  }, [adaptiveText, target]);

  // Keep the previous layer mounted underneath the new one for a short
  // cross-fade instead of a hard cut when the time slot (or the user's
  // choice) changes.
  const [layers, setLayers] = useState<Layer[]>(() => [
    { key: target.url, url: target.url, isGradient: target.isGradient, blur: target.blur, brightness: target.brightness, visible: true },
  ]);
  useEffect(() => {
    setLayers((prev) => {
      const top = prev[prev.length - 1];
      if (top && top.url === target.url) {
        // Same image, maybe new blur/brightness: update in place, no fade.
        return [...prev.slice(0, -1), { ...top, blur: target.blur, brightness: target.brightness }];
      }
      return [
        ...prev.slice(-1),
        { key: `${target.url}#${Date.now()}`, url: target.url, isGradient: target.isGradient, blur: target.blur, brightness: target.brightness, visible: false },
      ];
    });
  }, [target.url, target.isGradient, target.blur, target.brightness]);

  // Reveal a freshly added layer on the next frame (so the transition
  // runs), then drop the layer underneath once the fade has finished.
  useEffect(() => {
    const top = layers[layers.length - 1];
    if (!top || top.visible) return;
    const frame = requestAnimationFrame(() =>
      setLayers((prev) => prev.map((l) => (l.key === top.key ? { ...l, visible: true } : l)))
    );
    return () => cancelAnimationFrame(frame);
  }, [layers]);

  useEffect(() => {
    if (layers.length < 2) return;
    const timer = setTimeout(() => setLayers((prev) => prev.slice(-1)), CROSSFADE_MS);
    return () => clearTimeout(timer);
  }, [layers]);

  return (
    <div className="fixed inset-0 -z-50 overflow-hidden pointer-events-none select-none bg-slate-950">
      {layers.map((layer, index) => {
        const isTop = index === layers.length - 1;
        const fade: React.CSSProperties = {
          transition: `opacity ${CROSSFADE_MS}ms ease-out`,
          opacity: layer.visible ? 1 : 0,
        };
        return layer.isGradient ? (
          <div
            key={layer.key}
            data-wallpaper-layer={isTop ? 'top' : 'below'}
            className="absolute inset-0 w-full h-full"
            style={{ background: layer.url, ...fade }}
          />
        ) : (
          <div
            key={layer.key}
            data-wallpaper-layer={isTop ? 'top' : 'below'}
            className="absolute inset-0 w-full h-full bg-cover bg-center transform scale-105"
            style={{
              backgroundImage: `url(${layer.url})`,
              filter: `blur(${layer.blur}px) brightness(${layer.brightness})`,
              ...fade,
            }}
          />
        );
      })}

      {/* Dark / Tint Overlay */}
      <div
        data-testid="wallpaper-overlay"
        className="absolute inset-0 bg-slate-950 transition-opacity duration-700"
        style={{ opacity: target.overlayOpacity }}
      />
    </div>
  );
};
