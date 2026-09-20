import { storageService } from '../../services/storageService';
import { getLocalizedWidgetTitle } from '../../utils/widgetTitle';
import { getPageDisplayName } from '../../utils/pageName';
import { uniqueId } from '../../utils/id';
import { layoutsWithRestoredWidget, withFreshWidgetId } from '../../services/trashService';
import { createStoreHelpers } from './helpers';
import type { DashboardSliceCreator, TrashSlice } from '../types';

export const createTrashSlice: DashboardSliceCreator<TrashSlice> = (set, get) => {
  const { tr, pushUndo, fmt, readPage, writePage, removeWidgetFromPage, saveTrash, addTrash, removeTrashEntry, removePageInternal } = createStoreHelpers(set, get);

  return {
    trash: [],

    restoreFromTrash: (entryId) => {
      const entry = get().trash.find((e) => e.id === entryId);
      if (!entry) return;

      if (entry.kind === 'widget') {
        const { pageData, activePageId } = get();
        const pageId = entry.sourcePageId === activePageId || pageData[entry.sourcePageId] ? entry.sourcePageId : activePageId;
        // The id may be live again (the delete was undone, or the widget
        // restored from another tab); give the copy a fresh one then.
        const idTaken =
          Object.values(pageData).some((p) => p.widgets.some((w) => w.id === entry.widget.id)) ||
          get().widgets.some((w) => w.id === entry.widget.id);
        const restored = idTaken ? withFreshWidgetId(entry, uniqueId('widget-' + entry.widget.type)) : entry;
        const page = readPage(pageId);
        if (!page) return;
        writePage(pageId, {
          widgets: [...page.widgets, restored.widget],
          layouts: layoutsWithRestoredWidget(page.layouts, restored.widget, restored.layouts),
        });
        removeTrashEntry(entry.id);
        if (pageId !== get().activePageId) get().switchPage(pageId);
        pushUndo(fmt(tr().undo.restoredFromTrash, getLocalizedWidgetTitle(restored.widget, tr())), () => {
          removeWidgetFromPage(pageId, restored.widget.id);
          addTrash(entry);
        });
        return;
      }

      const { pages, activePageId, widgets, layouts, pageData } = get();
      const pageId = pages.some((p) => p.id === entry.pageMeta.id) ? uniqueId('page') : entry.pageMeta.id;
      const meta = { ...entry.pageMeta, id: pageId };
      const newPages = [...pages, meta];
      const updatedPageData = { ...pageData, [activePageId]: { widgets, layouts }, [pageId]: entry.pageData };
      set({ pages: newPages, pageData: updatedPageData });
      storageService.savePages(newPages);
      storageService.savePageData(updatedPageData);
      removeTrashEntry(entry.id);
      get().switchPage(pageId);
      pushUndo(fmt(tr().undo.restoredFromTrash, getPageDisplayName(meta, newPages.length - 1, tr())), () => {
        removePageInternal(pageId);
        addTrash(entry);
      });
    },

    deleteFromTrash: (entryId) => removeTrashEntry(entryId),

    emptyTrash: () => {
      if (get().trash.length === 0) return;
      saveTrash([]);
    },
  };
};
