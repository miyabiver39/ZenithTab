import React from 'react';
import { Globe, Code2, Video, Sparkles, Terminal, Mail, Plus, LayoutGrid } from 'lucide-react';
import { useDashboardStore } from '../../store/useDashboardStore';

export const Dock: React.FC = () => {
  const { appearance, openSettingsModal, toggleAppDrawer } = useDashboardStore();

  if (appearance.dockPosition === 'hidden') {
    return null;
  }

  const defaultDockItems = [
    { label: 'Google', icon: Globe, url: 'https://google.com' },
    { label: 'GitHub', icon: Code2, url: 'https://github.com' },
    { label: 'YouTube', icon: Video, url: 'https://youtube.com' },
    { label: 'Gmail', icon: Mail, url: 'https://mail.google.com' },
    { label: 'ChatGPT', icon: Sparkles, url: 'https://chatgpt.com' },
    { label: 'Dev Docs', icon: Terminal, url: 'https://developer.mozilla.org' },
  ];

  return (
    <div
      className={`fixed ${
        appearance.dockPosition === 'top' ? 'top-14' : 'bottom-4'
      } left-1/2 -translate-x-1/2 z-30 transition-all select-none`}
    >
      <div className="flex items-center gap-2 px-3 py-2 rounded-2xl bg-slate-900/40 border border-white/10 shadow-2xl backdrop-blur-2xl">
        {defaultDockItems.map((item, index) => {
          const Icon = item.icon;
          return (
            <a
              key={index}
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2.5 rounded-xl text-slate-300 hover:text-white hover:bg-white/10 transition-all hover:scale-110 active:scale-95 group relative flex items-center justify-center"
              title={item.label}
            >
              <Icon size={18} />
              <span className="absolute -top-8 px-2 py-0.5 rounded-md bg-slate-900/90 text-[10px] text-white font-medium opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow border border-white/10 whitespace-nowrap">
                {item.label}
              </span>
            </a>
          );
        })}

        <div className="w-[1px] h-5 bg-white/10 mx-1" />

        <button
          onClick={() => toggleAppDrawer(true)}
          className="p-2.5 rounded-xl text-sky-400 hover:text-sky-300 hover:bg-sky-500/10 transition-all hover:scale-110 active:scale-95 group relative flex items-center justify-center"
          title="App Drawer"
        >
          <LayoutGrid size={18} />
          <span className="absolute -top-8 px-2 py-0.5 rounded-md bg-slate-900/90 text-[10px] text-white font-medium opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow border border-white/10 whitespace-nowrap">
            App Drawer
          </span>
        </button>

        <button
          onClick={() => openSettingsModal('addWidget')}
          className="p-2.5 rounded-xl text-slate-300 hover:text-white hover:bg-white/10 transition-all hover:scale-110 active:scale-95 group relative flex items-center justify-center"
          title="Add Widget"
        >
          <Plus size={18} />
          <span className="absolute -top-8 px-2 py-0.5 rounded-md bg-slate-900/90 text-[10px] text-white font-medium opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow border border-white/10 whitespace-nowrap">
            Add Widget
          </span>
        </button>
      </div>
    </div>
  );
};
