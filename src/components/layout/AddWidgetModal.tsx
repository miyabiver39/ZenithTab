import React from 'react';
import { Plus } from 'lucide-react';
import { Modal } from '../common/Modal';
import { useDashboardStore } from '../../store/useDashboardStore';
import { useTranslation } from '../../i18n/i18n';
import { WIDGET_REGISTRY, WidgetDefinition } from '../widgets/registry';
import { requestApiPermissions } from '../../utils/permissions';

/** The "Add Widget" catalogue — one card per registry entry, in registry order. */
export const AddWidgetModal: React.FC = () => {
  const activeSettingsModal = useDashboardStore((s) => s.activeSettingsModal);
  const closeSettingsModal = useDashboardStore((s) => s.closeSettingsModal);
  const addWidget = useDashboardStore((s) => s.addWidget);
  const { t } = useTranslation();
  const isOpen = activeSettingsModal === 'addWidget';

  const handleAdd = (widget: WidgetDefinition) => {
    // Ask for any optional permission right here, inside the click, so
    // Chrome shows its prompt; the widget also offers a "grant" button in
    // case the user dismisses it.
    if (widget.optionalPermissions?.length) {
      void requestApiPermissions(widget.optionalPermissions);
    }
    addWidget(widget.type);
  };

  return (
    <Modal isOpen={isOpen} onClose={closeSettingsModal} title={t.common.addWidget} maxWidth="2xl">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {WIDGET_REGISTRY.map((widget) => {
          const Icon = widget.icon;
          const copy = t.widgets[widget.type];
          return (
            <div
              key={widget.type}
              data-testid={`widget-card-${widget.type}`}
              className="p-3.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 transition-all flex flex-col justify-between group select-none"
            >
              <div className="flex items-start gap-2.5 mb-3">
                <div className={`p-2 rounded-xl border ${widget.color}`}>
                  <Icon size={18} />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-xs font-semibold text-white group-hover:text-sky-300 transition-colors">
                    {copy.title}
                  </h4>
                  <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed line-clamp-2">
                    {copy.desc}
                  </p>
                </div>
              </div>

              <button
                onClick={() => handleAdd(widget)}
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
