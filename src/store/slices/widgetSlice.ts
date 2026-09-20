import { Layout } from 'react-grid-layout';
import { DashboardWidget, ResponsiveLayouts } from '../../types/widget';
import { DEFAULT_WIDGETS, DEFAULT_LAYOUTS } from '../../services/storageService';
import { getTranslation, resolveLanguageCode } from '../../i18n/resolve';
import { getDefaultWidgetTitle, getLocalizedWidgetTitle } from '../../utils/widgetTitle';
import { getPageDisplayName } from '../../utils/pageName';
import { WIDGET_DEFINITIONS } from '../../components/widgets/widgetDefinitions';
import { uniqueId } from '../../utils/id';
import { calculateBottomY } from '../../utils/layout';
import { createTrashedWidget } from '../../services/trashService';
import { createStoreHelpers } from './helpers';
import type { DashboardSliceCreator, WidgetSlice } from '../types';

export const createWidgetSlice: DashboardSliceCreator<WidgetSlice> = (set, get) => {
  const { persistPageState, tr, pushUndo, fmt, removeWidgetInternal, restoreWidgetInternal, addTrash, removeTrashEntry } = createStoreHelpers(set, get);

  return {
    widgets: DEFAULT_WIDGETS,
    layouts: DEFAULT_LAYOUTS,

    addWidget: (type, customTitle, initialConfig) => {
      const { widgets, layouts, appearance } = get();
      const id = uniqueId(`widget-${type}`);
      const definition = WIDGET_DEFINITIONS[type];
      const size = definition.size;
      const languageSetting = appearance.language || 'auto';
      const defaultConfig = definition.createDefaultConfig(getTranslation(languageSetting), resolveLanguageCode(languageSetting));
      const config = { ...defaultConfig, ...initialConfig };

      // Stock titles are recognised by WidgetWrapper and re-localized on
      // language change, so it's fine to persist the current language's one.
      const title = customTitle || getDefaultWidgetTitle(type, getTranslation(languageSetting));

      // Place at the bottom of the current layout per breakpoint (never use Infinity:
      // in react-grid-layout, Infinity causes an infinite compaction while-loop).
      const newLayout: Layout = {
        i: id,
        x: 0,
        y: calculateBottomY(layouts.lg || []),
        w: size.w,
        h: size.h,
        minW: size.minW,
        minH: size.minH,
      };

      const newWidget: DashboardWidget = {
        id,
        type,
        title,
        config,
        layout: newLayout,
      };

      const updatedWidgets = [...widgets, newWidget];
      const updatedLayouts: ResponsiveLayouts = {
        lg: [...(layouts.lg || []), newLayout],
        md: [
          ...(layouts.md || []),
          { ...newLayout, y: calculateBottomY(layouts.md || []), w: Math.min(newLayout.w, 5) },
        ],
        sm: [
          ...(layouts.sm || []),
          { ...newLayout, y: calculateBottomY(layouts.sm || []), w: 6 },
        ],
        xs: [
          ...(layouts.xs || []),
          { ...newLayout, y: calculateBottomY(layouts.xs || []), w: 4 },
        ],
        xxs: [
          ...(layouts.xxs || []),
          { ...newLayout, y: calculateBottomY(layouts.xxs || []), w: 2 },
        ],
      };

      persistPageState(updatedWidgets, updatedLayouts);
      set({ activeSettingsModal: null });
    },

    removeWidget: (id) => {
      const { pages, activePageId } = get();
      const pageIndex = pages.findIndex((p) => p.id === activePageId);
      const pageName = pageIndex === -1 ? '' : getPageDisplayName(pages[pageIndex], pageIndex, tr());
      const removed = removeWidgetInternal(id);
      if (!removed) return;
      const entry = createTrashedWidget(removed.widget, removed.layouts, removed.pageId, pageName);
      addTrash(entry);
      pushUndo(
        fmt(tr().undo.removedWidget, getLocalizedWidgetTitle(removed.widget, tr())),
        () => {
          restoreWidgetInternal(removed);
          removeTrashEntry(entry.id);
        },
        () => {
          removeWidgetInternal(id);
          addTrash(entry);
        }
      );
    },

    updateWidgetConfig: (id, config, title) => {
      const { widgets, layouts } = get();
      const updatedWidgets = widgets.map((w) => {
        if (w.id === id) {
          return {
            ...w,
            title: title !== undefined ? title : w.title,
            config: { ...w.config, ...config },
          };
        }
        return w;
      });

      // Deliberately no UI side effect here: widgets call this from timers
      // and debounced inputs, and it used to slam whatever settings dialog
      // the user had open. Closing is the config modal's own job.
      persistPageState(updatedWidgets, layouts);
    },

    updateWidgetConfigUndoable: (id, config, label) => {
      const { widgets, layouts } = get();
      const target = widgets.find((w) => w.id === id);
      if (!target) return;
      const previous: Record<string, any> = {};
      for (const key of Object.keys(config)) previous[key] = target.config?.[key];

      const apply = (patch: Record<string, any>) => {
        const current = get();
        if (!current.widgets.some((w) => w.id === id)) return;
        const updated = current.widgets.map((w) => (w.id === id ? { ...w, config: { ...w.config, ...patch } } : w));
        persistPageState(updated, current.layouts);
      };

      persistPageState(
        widgets.map((w) => (w.id === id ? { ...w, config: { ...w.config, ...config } } : w)),
        layouts
      );
      pushUndo(label, () => apply(previous), () => apply(config));
    },

    updateLayouts: (_currentLayout, allLayouts) => {
      const { widgets, layouts } = get();

      // An empty page has nothing to sync — react-grid-layout still fires
      // onLayoutChange for a 0-item grid, and persisting+re-rendering on every
      // one of those firings risks feeding a render loop for no benefit.
      if (widgets.length === 0) return;

      // Skip the write (and the state update it would trigger) when nothing
      // actually changed — react-grid-layout can re-report an equivalent
      // layout after unrelated re-renders, and persisting a no-op change on
      // every firing is exactly the kind of self-feeding loop that can hang
      // the tab.
      if (JSON.stringify(allLayouts) === JSON.stringify(layouts)) return;

      // Sync layout coordinates back to widget layout reference
      const updatedWidgets = widgets.map((w) => {
        const match = allLayouts.lg?.find((l) => l.i === w.id) || w.layout;
        return {
          ...w,
          layout: match,
        };
      });

      persistPageState(updatedWidgets, allLayouts);
    },
  };
};
