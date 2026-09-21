import React from 'react';
import { LayoutDashboard, Briefcase, GraduationCap, Newspaper, Minus, Plus } from 'lucide-react';
import { Modal } from '../common/Modal';
import { useTranslation } from '../../i18n/i18n';
import { PAGE_TEMPLATE_IDS, getPageTemplate, templateWidgetTypes, type PageTemplateId } from '../../config/templates/pageTemplates';
import { WIDGET_REGISTRY } from '../widgets/registry';

const ICONS = {
  'layout-dashboard': LayoutDashboard,
  briefcase: Briefcase,
  'graduation-cap': GraduationCap,
  newspaper: Newspaper,
  minus: Minus,
} as const;

interface PageTemplateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPick: (id: PageTemplateId) => void;
  /** Dialog title; defaults to "Choose a template". */
  title?: string;
  /** Button label on each card; defaults to "Use this template". */
  actionLabel?: string;
}

/** One card per page template, with the widgets it places listed as icons. */
export const PageTemplateModal: React.FC<PageTemplateModalProps> = ({ isOpen, onClose, onPick, title, actionLabel }) => {
  const { t } = useTranslation();
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title || t.templates.title} maxWidth="2xl">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {PAGE_TEMPLATE_IDS.map((id) => {
          const template = getPageTemplate(id);
          const Icon = ICONS[template.icon];
          const copy = t.templates.items[id];
          return (
            <div
              key={id}
              data-testid={`template-card-${id}`}
              className="p-3.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 transition-all flex flex-col justify-between group select-none"
            >
              <div className="flex items-start gap-2.5 mb-3">
                <div className="p-2 rounded-xl border bg-sky-500/10 border-sky-400/20 text-sky-300">
                  <Icon size={18} />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-xs font-semibold text-white group-hover:text-sky-300 transition-colors">{copy.name}</h4>
                  <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">{copy.desc}</p>
                  <div className="flex flex-wrap items-center gap-1 mt-2" aria-label={t.templates.includes}>
                    {templateWidgetTypes(id).map((type) => {
                      const entry = WIDGET_REGISTRY.find((w) => w.type === type);
                      if (!entry) return null;
                      const WidgetIcon = entry.icon;
                      return (
                        <span
                          key={type}
                          title={t.widgets[type].title}
                          className="p-1 rounded-md bg-white/5 border border-white/10 text-slate-300"
                        >
                          <WidgetIcon size={11} />
                        </span>
                      );
                    })}
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => onPick(id)}
                className="w-full flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg bg-sky-500/20 hover:bg-sky-500 text-sky-200 hover:text-white border border-sky-400/30 text-xs font-medium transition-all"
              >
                <Plus size={13} />
                <span>{actionLabel || t.templates.use}</span>
              </button>
            </div>
          );
        })}
      </div>
    </Modal>
  );
};
