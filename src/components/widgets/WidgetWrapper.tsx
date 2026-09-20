import React from 'react';
import { GripHorizontal, Settings, Trash2 } from 'lucide-react';
import { DashboardWidget } from '../../types/widget';
import { useDashboardStore } from '../../store/useDashboardStore';
import { useTranslation } from '../../i18n/i18n';
import { getLocalizedWidgetTitle } from '../../utils/widgetTitle';
import { GlassCard } from '../common/GlassCard';
import { cn } from '../../utils/cn';

interface WidgetWrapperProps {
  widget: DashboardWidget;
  children: React.ReactNode;
}

export const WidgetWrapper: React.FC<WidgetWrapperProps> = ({ widget, children }) => {
  const { isEditMode, removeWidget, openSettingsModal } = useDashboardStore();
  const { t } = useTranslation();
  const isSearch = widget.type === 'search';
  // Stock titles follow the language setting; user-typed ones are kept.
  const title = getLocalizedWidgetTitle(widget, t);

  return (
    <GlassCard
      className={cn(
        'widget-card w-full h-full flex flex-col overflow-hidden relative group select-none transition-shadow',
        isEditMode && 'ring-2 ring-sky-400/50 shadow-sky-500/20',
        isSearch && !isEditMode && 'bg-transparent border-transparent backdrop-blur-none shadow-none'
      )}
    >
      {/* Widget Header - Show for normal widgets, or in edit mode for search */}
      {(!isSearch || isEditMode) && (
        <div className="widget-card-header flex items-center justify-between px-3 py-2 border-b border-white/5 bg-white/[0.02] flex-shrink-0">
          <div className="flex items-center gap-2 overflow-hidden">
            {isEditMode && (
              <div data-testid="drag-handle" className="grid-drag-handle cursor-grab active:cursor-grabbing text-slate-400 hover:text-white p-0.5 rounded hover:bg-white/10 transition-colors">
                <GripHorizontal size={16} />
              </div>
            )}
            <h3 className="text-xs font-semibold text-slate-200 truncate tracking-wide">
              {title}
            </h3>
          </div>

          {/* Action Controls in Edit Mode */}
          {isEditMode ? (
            <div className="flex items-center gap-1">
              <button
                onClick={() => openSettingsModal('editWidget', widget.id)}
                className="p-1 text-slate-400 hover:text-sky-400 hover:bg-sky-500/10 rounded-md transition-colors"
                title="Widget Settings"
              >
                <Settings size={14} />
              </button>
              <button
                onClick={() => removeWidget(widget.id)}
                className="p-1 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-md transition-colors"
                title="Remove Widget"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ) : null}
        </div>
      )}

      {/* Widget Content Container */}
      <div
        className={cn(
          'flex-1 min-h-0 overflow-hidden relative flex flex-col',
          isSearch ? 'p-0.5 justify-center' : 'widget-card-body p-3.5'
        )}
      >
        {children}
      </div>
    </GlassCard>
  );
};
