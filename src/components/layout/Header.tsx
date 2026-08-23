import React from 'react';
import { LayoutGrid, Plus, RefreshCw, Settings, Check } from 'lucide-react';
import { useDashboardStore } from '../../store/useDashboardStore';
import { Button } from '../common/Button';

export const Header: React.FC = () => {
  const {
    isEditMode,
    setEditMode,
    openSettingsModal,
    rotateWallpaper,
  } = useDashboardStore();

  return (
    <header className="w-full px-6 py-3.5 flex items-center justify-between z-30 select-none">
      {/* Brand & Logo */}
      <div className="flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-sky-500 to-indigo-500 flex items-center justify-center shadow-lg shadow-sky-500/20 text-white font-black text-sm">
          Z
        </div>
        <div>
          <h1 className="text-sm font-bold text-white tracking-wide">ZenithTab</h1>
          <p className="text-[10px] text-slate-300 font-medium tracking-wider uppercase">
            Dashboard
          </p>
        </div>
      </div>

      {/* Control Actions */}
      <div className="flex items-center gap-2">
        <button
          onClick={rotateWallpaper}
          className="p-2 rounded-xl bg-slate-900/40 hover:bg-slate-900/60 border border-white/10 text-slate-300 hover:text-white backdrop-blur-md transition-all shadow-md active:scale-95"
          title="Change Wallpaper"
        >
          <RefreshCw size={15} />
        </button>

        {isEditMode ? (
          <>
            <Button
              variant="primary"
              size="sm"
              onClick={() => openSettingsModal('addWidget')}
              className="gap-1 text-xs"
            >
              <Plus size={14} />
              <span>Add Widget</span>
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setEditMode(false)}
              className="gap-1 text-xs bg-emerald-500/30 hover:bg-emerald-500/40 border-emerald-400/40 text-emerald-100"
            >
              <Check size={14} />
              <span>Done Editing</span>
            </Button>
          </>
        ) : (
          <button
            onClick={() => setEditMode(true)}
            className="p-2 rounded-xl bg-slate-900/40 hover:bg-slate-900/60 border border-white/10 text-slate-300 hover:text-white backdrop-blur-md transition-all shadow-md active:scale-95 flex items-center gap-1.5 px-3 text-xs font-medium"
            title="Customize Layout"
          >
            <LayoutGrid size={14} />
            <span className="hidden sm:inline">Edit Layout</span>
          </button>
        )}

        <button
          onClick={() => openSettingsModal('settings')}
          className="p-2 rounded-xl bg-slate-900/40 hover:bg-slate-900/60 border border-white/10 text-slate-300 hover:text-white backdrop-blur-md transition-all shadow-md active:scale-95"
          title="Settings & Appearance"
        >
          <Settings size={15} />
        </button>
      </div>
    </header>
  );
};
