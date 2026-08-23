import React from 'react';
import { useDashboardStore } from '../../store/useDashboardStore';

export const WallpaperBackground: React.FC = () => {
  const { wallpaper } = useDashboardStore();

  const {
    source = 'unsplash',
    currentWallpaperUrl,
    blur = 4,
    brightness = 0.85,
    overlayOpacity = 0.35,
  } = wallpaper;

  const isGradient = source === 'gradient';

  return (
    <div className="fixed inset-0 -z-50 overflow-hidden pointer-events-none select-none bg-slate-950">
      {/* Background Media */}
      {isGradient ? (
        <div
          className="absolute inset-0 w-full h-full"
          style={{ background: currentWallpaperUrl }}
        />
      ) : (
        <div
          className="absolute inset-0 w-full h-full bg-cover bg-center transition-all duration-700 ease-out transform scale-105"
          style={{
            backgroundImage: `url(${currentWallpaperUrl})`,
            filter: `blur(${blur}px) brightness(${brightness})`,
          }}
        />
      )}

      {/* Dark / Tint Overlay */}
      <div
        className="absolute inset-0 bg-slate-950 transition-opacity duration-300"
        style={{ opacity: overlayOpacity }}
      />
    </div>
  );
};
