import React from 'react';
import {
  Clock,
  CloudSun,
  Bookmark,
  Newspaper,
  Globe,
  FileText,
  Search,
  Timer,
  CheckSquare,
  Plus,
} from 'lucide-react';
import { Modal } from '../common/Modal';
import { useDashboardStore } from '../../store/useDashboardStore';
import { WidgetType } from '../../types/widget';
import { useTranslation } from '../../i18n/i18n';

export const AddWidgetModal: React.FC = () => {
  const { activeSettingsModal, closeSettingsModal, addWidget } = useDashboardStore();
  const { t } = useTranslation();

  const isOpen = activeSettingsModal === 'addWidget';

  const WIDGET_CATALOG: Array<{
    type: WidgetType;
    title: string;
    description: string;
    icon: React.ElementType;
    color: string;
  }> = [
    {
      type: 'search',
      title: t.widgets.search.title,
      description: t.widgets.search.desc,
      icon: Search,
      color: 'text-sky-400 bg-sky-400/10 border-sky-400/20',
    },
    {
      type: 'shortcuts',
      title: t.widgets.shortcuts.title,
      description: t.widgets.shortcuts.desc,
      icon: Globe,
      color: 'text-cyan-400 bg-cyan-400/10 border-cyan-400/20',
    },
    {
      type: 'clock',
      title: t.widgets.clock.title,
      description: t.widgets.clock.desc,
      icon: Clock,
      color: 'text-indigo-400 bg-indigo-400/10 border-indigo-400/20',
    },
    {
      type: 'weather',
      title: t.widgets.weather.title,
      description: t.widgets.weather.desc,
      icon: CloudSun,
      color: 'text-amber-400 bg-amber-400/10 border-amber-400/20',
    },
    {
      type: 'bookmarks',
      title: t.widgets.bookmarks.title,
      description: t.widgets.bookmarks.desc,
      icon: Bookmark,
      color: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20',
    },
    {
      type: 'rss',
      title: t.widgets.rss.title,
      description: t.widgets.rss.desc,
      icon: Newspaper,
      color: 'text-violet-400 bg-violet-400/10 border-violet-400/20',
    },
    {
      type: 'pomodoro',
      title: t.widgets.pomodoro.title,
      description: t.widgets.pomodoro.desc,
      icon: Timer,
      color: 'text-orange-400 bg-orange-400/10 border-orange-400/20',
    },
    {
      type: 'todo',
      title: t.widgets.todo.title,
      description: t.widgets.todo.desc,
      icon: CheckSquare,
      color: 'text-teal-400 bg-teal-400/10 border-teal-400/20',
    },
    {
      type: 'notes',
      title: t.widgets.notes.title,
      description: t.widgets.notes.desc,
      icon: FileText,
      color: 'text-pink-400 bg-pink-400/10 border-pink-400/20',
    },
    {
      type: 'iframe',
      title: t.widgets.iframe.title,
      description: t.widgets.iframe.desc,
      icon: Globe,
      color: 'text-blue-400 bg-blue-400/10 border-blue-400/20',
    },
  ];

  const handleAdd = (type: WidgetType) => {
    addWidget(type);
  };

  return (
    <Modal isOpen={isOpen} onClose={closeSettingsModal} title={t.common.addWidget} maxWidth="2xl">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {WIDGET_CATALOG.map((widget) => {
          const Icon = widget.icon;
          return (
            <div
              key={widget.type}
              className="p-3.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 transition-all flex flex-col justify-between group select-none"
            >
              <div className="flex items-start gap-2.5 mb-3">
                <div className={`p-2 rounded-xl border ${widget.color}`}>
                  <Icon size={18} />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-xs font-semibold text-white group-hover:text-sky-300 transition-colors">
                    {widget.title}
                  </h4>
                  <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed line-clamp-2">
                    {widget.description}
                  </p>
                </div>
              </div>

              <button
                onClick={() => handleAdd(widget.type)}
                className="w-full flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg bg-sky-500/20 hover:bg-sky-500 text-sky-200 hover:text-white border border-sky-400/30 text-xs font-medium transition-all shadow-sm group-hover:shadow-sky-500/20"
              >
                <Plus size={13} />
                <span>{t.common.addWidget}</span>
              </button>
            </div>
          );
        })}
      </div>
    </Modal>
  );
};
