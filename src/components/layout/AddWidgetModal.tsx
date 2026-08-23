import React from 'react';
import { Clock, CloudSun, Bookmark, Newspaper, Globe, FileText, Plus } from 'lucide-react';
import { Modal } from '../common/Modal';
import { useDashboardStore } from '../../store/useDashboardStore';
import { WidgetType } from '../../types/widget';

const WIDGET_CATALOG: Array<{
  type: WidgetType;
  title: string;
  description: string;
  icon: React.ElementType;
  color: string;
}> = [
  {
    type: 'clock',
    title: 'Clock & Time',
    description: 'Digital or analog clock with real-time seconds, date, and timezone support.',
    icon: Clock,
    color: 'text-sky-400 bg-sky-400/10 border-sky-400/20',
  },
  {
    type: 'weather',
    title: 'Live Weather',
    description: 'Current weather condition, temperature, wind, humidity, and 3-day forecast.',
    icon: CloudSun,
    color: 'text-amber-400 bg-amber-400/10 border-amber-400/20',
  },
  {
    type: 'bookmarks',
    title: 'Chrome Bookmarks',
    description: 'Seamless browser bookmarks browser with folder navigation and auto-favicons.',
    icon: Bookmark,
    color: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20',
  },
  {
    type: 'rss',
    title: 'RSS & Google News',
    description: 'Multi-source RSS feed reader with instant Google News keyword search.',
    icon: Newspaper,
    color: 'text-violet-400 bg-violet-400/10 border-violet-400/20',
  },
  {
    type: 'iframe',
    title: 'Web Embed (iFrame)',
    description: 'Embed your favorite web tools, dashboards, documentation, or websites.',
    icon: Globe,
    color: 'text-blue-400 bg-blue-400/10 border-blue-400/20',
  },
  {
    type: 'notes',
    title: 'Quick Notes',
    description: 'Instant scratchpad for typing markdown notes, tasks, and ideas with auto-save.',
    icon: FileText,
    color: 'text-pink-400 bg-pink-400/10 border-pink-400/20',
  },
];

export const AddWidgetModal: React.FC = () => {
  const { activeSettingsModal, closeSettingsModal, addWidget } = useDashboardStore();

  const isOpen = activeSettingsModal === 'addWidget';

  const handleAdd = (type: WidgetType) => {
    addWidget(type);
  };

  return (
    <Modal isOpen={isOpen} onClose={closeSettingsModal} title="Add New Widget" maxWidth="xl">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
        {WIDGET_CATALOG.map((widget) => {
          const Icon = widget.icon;
          return (
            <div
              key={widget.type}
              className="p-4 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 transition-all flex flex-col justify-between group select-none"
            >
              <div className="flex items-start gap-3 mb-3">
                <div className={`p-2.5 rounded-xl border ${widget.color}`}>
                  <Icon size={20} />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-semibold text-white group-hover:text-sky-300 transition-colors">
                    {widget.title}
                  </h4>
                  <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                    {widget.description}
                  </p>
                </div>
              </div>

              <button
                onClick={() => handleAdd(widget.type)}
                className="w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg bg-sky-500/20 hover:bg-sky-500 text-sky-200 hover:text-white border border-sky-400/30 text-xs font-medium transition-all shadow-sm group-hover:shadow-sky-500/20"
              >
                <Plus size={14} />
                <span>Add to Dashboard</span>
              </button>
            </div>
          );
        })}
      </div>
    </Modal>
  );
};
