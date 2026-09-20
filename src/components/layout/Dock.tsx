import React from 'react';
import { Settings2 } from 'lucide-react';
import { useDashboardStore } from '../../store/useDashboardStore';
import { useTranslation } from '../../i18n/i18n';
import { DOCK_ICON_LIBRARY } from '../../utils/dockIcons';

export const Dock: React.FC = () => {
  const appearance = useDashboardStore((s) => s.appearance);
  const dockItems = useDashboardStore((s) => s.dockItems);
  const openSettingsModal = useDashboardStore((s) => s.openSettingsModal);
  const { t } = useTranslation();

  if (appearance.dockPosition === 'hidden') {
    return null;
  }

  return (
    <div
      className={`fixed ${
        appearance.dockPosition === 'top' ? 'top-14' : 'bottom-4'
      } left-1/2 -translate-x-1/2 z-30 transition-all select-none`}
    >
      <div className="flex items-center gap-2 px-3 py-2 rounded-2xl bg-glass border border-white/10 shadow-2xl backdrop-blur-2xl">
        {dockItems.map((item) => {
          const Icon = DOCK_ICON_LIBRARY[item.icon];
          return (
            <a
              key={item.id}
              href={item.url}
              target={item.openInNewTab ? '_blank' : undefined}
              rel="noopener noreferrer"
              className="p-2.5 rounded-xl text-slate-300 hover:text-white hover:bg-white/10 transition-all hover:scale-110 active:scale-95 group relative flex items-center justify-center"
              title={item.label}
            >
              {Icon ? (
                <Icon size={18} />
              ) : (
                <span className="text-base leading-none">{item.icon || '🔗'}</span>
              )}
              <span className="absolute -top-8 px-2 py-0.5 rounded-md bg-slate-900/90 text-[10px] text-white font-medium opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow border border-white/10 whitespace-nowrap">
                {item.label}
              </span>
            </a>
          );
        })}

        <button
          type="button"
          onClick={() => openSettingsModal('settings', 'dock')}
          className="p-2.5 rounded-xl text-slate-500 hover:text-white hover:bg-white/10 transition-all active:scale-95"
          title={t.settings.tabs.dock}
        >
          <Settings2 size={16} />
        </button>
      </div>
    </div>
  );
};
