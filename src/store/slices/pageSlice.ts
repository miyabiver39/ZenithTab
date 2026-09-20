import { DashboardPageMeta, DashboardPageData } from '../../types/widget';
import { storageService, DEFAULT_PAGES, DEFAULT_PAGE_ID } from '../../services/storageService';
import { getPageDisplayName } from '../../utils/pageName';
import { uniqueId } from '../../utils/id';
import { createTrashedPage } from '../../services/trashService';
import { createStoreHelpers, EMPTY_LAYOUTS, cloneWidgetsWithNewIds } from './helpers';
import type { DashboardSliceCreator, PageSlice } from '../types';

export const createPageSlice: DashboardSliceCreator<PageSlice> = (set, get) => {
  const { tr, pushUndo, fmt, addTrash, removeTrashEntry, removePageInternal, restorePageInternal } = createStoreHelpers(set, get);

  return {
    pages: DEFAULT_PAGES,
    activePageId: DEFAULT_PAGE_ID,
    pageData: {},

    switchPage: (id) => {
      const { pages, pageData, activePageId, widgets, layouts } = get();
      if (id === activePageId || !pages.some((p) => p.id === id)) return;

      // Snapshot the outgoing page's live state before switching away.
      const updatedPageData = { ...pageData, [activePageId]: { widgets, layouts } };
      const nextPage = updatedPageData[id] || { widgets: [], layouts: EMPTY_LAYOUTS };

      set({
        pageData: updatedPageData,
        activePageId: id,
        widgets: nextPage.widgets,
        layouts: nextPage.layouts,
        isEditMode: false,
      });

      storageService.savePageData(updatedPageData);
      storageService.saveActivePageId(id);
      storageService.saveWidgets(nextPage.widgets);
      storageService.saveLayouts(nextPage.layouts);
    },

    addPage: (options) => {
      const { pages, pageData, activePageId, widgets, layouts } = get();
      const newId = uniqueId('page');
      // Empty name = "unnamed", rendered as the localized "Page N".
      const newPageMeta: DashboardPageMeta = { id: newId, name: options?.name?.trim() || '' };
      const newPages = [...pages, newPageMeta];

      const newPage: DashboardPageData = options?.duplicateCurrent
        ? cloneWidgetsWithNewIds(widgets, layouts)
        : { widgets: [], layouts: EMPTY_LAYOUTS };

      const updatedPageData = {
        ...pageData,
        [activePageId]: { widgets, layouts },
        [newId]: newPage,
      };

      set({
        pages: newPages,
        pageData: updatedPageData,
        activePageId: newId,
        widgets: newPage.widgets,
        layouts: newPage.layouts,
        // A brand-new empty page drops straight into edit mode so "Add
        // Widget" is immediately visible; a duplicate is ready to use as-is.
        isEditMode: newPage.widgets.length === 0,
      });

      storageService.savePages(newPages);
      storageService.savePageData(updatedPageData);
      storageService.saveActivePageId(newId);
      storageService.saveWidgets(newPage.widgets);
      storageService.saveLayouts(newPage.layouts);
    },

    removePage: (id) => {
      const { pages } = get();
      const index = pages.findIndex((p) => p.id === id);
      if (index === -1) return;
      const name = getPageDisplayName(pages[index], index, tr());
      const removed = removePageInternal(id);
      if (!removed) return;
      const entry = createTrashedPage(removed.meta, removed.data);
      addTrash(entry);
      pushUndo(
        fmt(tr().undo.removedPage, name),
        () => {
          restorePageInternal(removed);
          removeTrashEntry(entry.id);
        },
        () => {
          removePageInternal(id);
          addTrash(entry);
        }
      );
    },

    renamePage: (id, name) => {
      // Clearing the name hands the page back to its localized "Page N".
      const trimmed = name.trim();
      const { pages } = get();
      const newPages = pages.map((p) => (p.id === id ? { ...p, name: trimmed } : p));
      set({ pages: newPages });
      storageService.savePages(newPages);
    },
  };
};
