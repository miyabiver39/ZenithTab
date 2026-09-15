import React, { useState, useEffect } from 'react';
import { LayoutGrid, Plus, RefreshCw, Settings, Check, Layers } from 'lucide-react';
import { useDashboardStore } from '../../store/useDashboardStore';
import { Button } from '../common/Button';
import { AddPageMenu } from './AddPageMenu';
import { useTranslation } from '../../i18n/i18n';

export const Header: React.FC = () => {
  const {
    isEditMode,
    setEditMode,
    openSettingsModal,
    rotateWallpaper,
    toggleAppDrawer,
    pages,
  } = useDashboardStore();

  const { t } = useTranslation();
  const [greeting, setGreeting] = useState('');

  useEffect(() => {
    const hour = new Date().getHours();
    let timeGreeting: string;
    if (hour >= 5 && hour < 12) {
      timeGreeting = t.greeting.morning;
    } else if (hour >= 12 && hour < 18) {
      timeGreeting = t.greeting.afternoon;
    } else if (hour >= 18 && hour < 22) {
      timeGreeting = t.greeting.evening;
    } else {
      timeGreeting = t.greeting.night;
    }

    // Mostly show a normal time-based greeting, but every so often surprise
    // with a splash-text-style quip (Minecraft/Discord loading-screen style).
    const splashes = t.greeting.splashes;
    const showSplash = splashes.length > 0 && Math.random() < 0.35;
    setGreeting(showSplash ? splashes[Math.floor(Math.random() * splashes.length)] : timeGreeting);
  }, [t]);

  return (
    <header className="w-full px-6 py-3.5 flex items-center justify-between z-30 select-none">
      {/* Brand & Logo with Greeting */}
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-sky-500 to-indigo-500 flex items-center justify-center shadow-lg shadow-sky-500/20 text-white font-black text-sm">
          Z
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-sm font-bold text-white tracking-wide">ZenithTab</h1>
            <span className="text-xs text-slate-400 font-normal hidden md:inline">
              • {greeting}
            </span>
          </div>
          <p className="text-[10px] text-slate-300 font-medium tracking-wider uppercase">
            {t.common.dashboard}
          </p>
        </div>
      </div>

      {/* Control Actions */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => toggleAppDrawer(true)}
          className="p-2 rounded-xl bg-slate-900/40 hover:bg-slate-900/60 border border-white/10 text-slate-300 hover:text-white backdrop-blur-md transition-all shadow-md active:scale-95 flex items-center gap-1.5 px-3 text-xs font-medium"
          title={t.appDrawer.title}
        >
          <LayoutGrid size={14} className="text-sky-400" />
          <span className="hidden sm:inline">{t.appDrawer.title}</span>
        </button>

        <button
          onClick={rotateWallpaper}
          className="p-2 rounded-xl bg-slate-900/40 hover:bg-slate-900/60 border border-white/10 text-slate-300 hover:text-white backdrop-blur-md transition-all shadow-md active:scale-95"
          title={t.common.changeWallpaper}
        >
          <RefreshCw size={15} />
        </button>

        {/* While there's only one page, the dedicated page-tab strip stays
            hidden to save a full row of vertical space — this button is the
            only "add a page" entry point until a second one exists, at which
            point the strip itself takes over. It carries a text label: an
            unlabeled icon here read as a mystery button, and a first-time
            press "made every widget disappear" (it had switched to the new,
            empty page). */}
        {pages.length === 1 && (
          <AddPageMenu align="right">
            <button
              className="p-2 rounded-xl bg-slate-900/40 hover:bg-slate-900/60 border border-white/10 text-slate-300 hover:text-white backdrop-blur-md transition-all shadow-md active:scale-95 flex items-center gap-1.5 px-3 text-xs font-medium"
              title={t.pages.add}
            >
              <Layers size={14} />
              <span className="hidden sm:inline">{t.pages.add}</span>
            </button>
          </AddPageMenu>
        )}

        {isEditMode ? (
          <>
            <Button
              variant="primary"
              size="sm"
              onClick={() => openSettingsModal('addWidget')}
              className="gap-1 text-xs"
            >
              <Plus size={14} />
              <span>{t.common.addWidget}</span>
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setEditMode(false)}
              className="gap-1 text-xs bg-emerald-500/30 hover:bg-emerald-500/40 border-emerald-400/40 text-emerald-100"
            >
              <Check size={14} />
              <span>{t.common.doneEditing}</span>
            </Button>
          </>
        ) : (
          <button
            onClick={() => setEditMode(true)}
            className="p-2 rounded-xl bg-slate-900/40 hover:bg-slate-900/60 border border-white/10 text-slate-300 hover:text-white backdrop-blur-md transition-all shadow-md active:scale-95 flex items-center gap-1.5 px-3 text-xs font-medium"
            title={t.common.editLayout}
          >
            <LayoutGrid size={14} />
            <span className="hidden sm:inline">{t.common.editLayout}</span>
          </button>
        )}

        <button
          onClick={() => openSettingsModal('settings')}
          className="p-2 rounded-xl bg-slate-900/40 hover:bg-slate-900/60 border border-white/10 text-slate-300 hover:text-white backdrop-blur-md transition-all shadow-md active:scale-95"
          title={t.common.settings}
        >
          <Settings size={15} />
        </button>
      </div>
    </header>
  );
};
