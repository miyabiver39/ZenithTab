import React, { useState } from 'react';
import { Plus, Globe, Trash2, Edit2, ExternalLink, LayoutGrid } from 'lucide-react';
import { ShortcutsWidgetConfig, ShortcutItem } from '../../../types/widget';
import { useDashboardStore } from '../../../store/useDashboardStore';
import { getFaviconUrl } from '../../../utils/favicon';
import { useTranslation } from '../../../i18n/i18n';
import { Modal } from '../../common/Modal';
import { Input } from '../../common/Input';
import { Button } from '../../common/Button';
import { uniqueId } from '../../../utils/id';
import { CatalogPicker, type PickedItem } from '../../common/CatalogPicker';
import { readDroppedLink } from '../../../utils/dropLink';
import { cn } from '../../../utils/cn';

interface ShortcutsWidgetProps {
  widgetId: string;
  config: ShortcutsWidgetConfig;
}

export const ShortcutsWidget: React.FC<ShortcutsWidgetProps> = ({ widgetId, config }) => {
  const { items = [], openInNewTab = true } = config;
  // The settings modal offers 2–8 columns; clamp anything odd from storage.
  // Applied as an inline style: a computed `grid-cols-${n}` class would be
  // purged by Tailwind at build time and silently do nothing.
  const columns = Math.min(8, Math.max(2, config.columns || 4));
  const updateWidgetConfig = useDashboardStore((s) => s.updateWidgetConfig);
  const updateWidgetConfigUndoable = useDashboardStore((s) => s.updateWidgetConfigUndoable);
  const isEditMode = useDashboardStore((s) => s.isEditMode);
  const { t } = useTranslation();

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ShortcutItem | null>(null);
  const [title, setTitle] = useState('');
  const [url, setUrl] = useState('');
  const [category, setCategory] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [isDropTarget, setIsDropTarget] = useState(false);

  /** Catalog / bookmark / top-site picks and dropped links all land here. */
  const addItems = (picked: PickedItem[]) => {
    const fresh: ShortcutItem[] = picked.map((p) => ({
      id: uniqueId('shortcut'),
      title: p.title,
      url: p.url,
      category: p.category || undefined,
    }));
    if (fresh.length > 0) updateWidgetConfig(widgetId, { items: [...items, ...fresh] });
  };

  // A link (or the address bar's URL) dragged onto the widget becomes a tile.
  const handleDrop = (e: React.DragEvent) => {
    const link = readDroppedLink(e.dataTransfer);
    setIsDropTarget(false);
    if (!link) return;
    e.preventDefault();
    addItems([link]);
  };

  const categories = ['all', ...Array.from(new Set(items.map((it) => it.category).filter(Boolean))) as string[]];

  const handleOpenAdd = () => {
    setEditingItem(null);
    setTitle('');
    setUrl('');
    setCategory('');
    setIsAddModalOpen(true);
  };

  const handleOpenEdit = (item: ShortcutItem, e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setEditingItem(item);
    setTitle(item.title);
    setUrl(item.url);
    setCategory(item.category || '');
    setIsAddModalOpen(true);
  };

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    const removed = items.find((it) => it.id === id);
    const updated = items.filter((it) => it.id !== id);
    updateWidgetConfigUndoable(
      widgetId,
      { items: updated },
      t.undo.removedSite.replace('{name}', removed?.title || '')
    );
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !url.trim()) return;

    let formattedUrl = url.trim();
    if (!/^https?:\/\//i.test(formattedUrl)) {
      formattedUrl = `https://${formattedUrl}`;
    }

    if (editingItem) {
      const updated = items.map((it) =>
        it.id === editingItem.id
          ? {
              ...it,
              title: title.trim(),
              url: formattedUrl,
              category: category.trim() || undefined,
            }
          : it
      );
      updateWidgetConfig(widgetId, { items: updated });
    } else {
      const newItem: ShortcutItem = {
        id: uniqueId('shortcut'),
        title: title.trim(),
        url: formattedUrl,
        category: category.trim() || undefined,
      };
      updateWidgetConfig(widgetId, { items: [...items, newItem] });
    }

    setIsAddModalOpen(false);
  };

  const filteredItems = activeCategory === 'all'
    ? items
    : items.filter((it) => it.category === activeCategory);

  return (
    <div
      className={cn('w-full h-full flex flex-col min-h-0 select-none rounded-xl transition-colors', isDropTarget && 'ring-2 ring-sky-400/60 bg-sky-500/5')}
      onDragOver={(e) => {
        if (!readDroppedLink(e.dataTransfer, { peek: true })) return;
        e.preventDefault();
        e.dataTransfer.dropEffect = 'copy';
        if (!isDropTarget) setIsDropTarget(true);
      }}
      onDragLeave={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setIsDropTarget(false);
      }}
      onDrop={handleDrop}
      data-testid="shortcuts-widget"
    >
      {/* Category Pills (if multiple categories exist) */}
      {categories.length > 2 && (
        <div className="flex items-center gap-1.5 pb-2 overflow-x-auto custom-scrollbar border-b border-white/5">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                activeCategory === cat
                  ? 'bg-sky-500/20 text-sky-200 border border-sky-400/30'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              {cat === 'all' ? t.widgets.shortcuts.allCategories : cat}
            </button>
          ))}
        </div>
      )}

      {/* Grid of App Tiles */}
      <div className="flex-1 overflow-y-auto mt-2 pr-1 custom-scrollbar">
        {filteredItems.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-xs text-slate-400 p-4 text-center">
            <p className="mb-2">{t.widgets.shortcuts.noShortcuts}</p>
            <div className="flex flex-wrap items-center justify-center gap-2">
              <button
                onClick={() => setIsPickerOpen(true)}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-sky-500/20 hover:bg-sky-500 text-sky-200 hover:text-white border border-sky-400/30 text-xs font-medium transition-all"
              >
                <LayoutGrid size={13} />
                <span>{t.widgets.shortcuts.fromCatalog}</span>
              </button>
              <button
                onClick={handleOpenAdd}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-white/10 text-xs font-medium transition-all"
              >
                <Plus size={13} />
                <span>{t.widgets.shortcuts.addShortcut}</span>
              </button>
            </div>
            <p className="mt-3 text-[11px] text-slate-500">{t.widgets.shortcuts.dropHint}</p>
          </div>
        ) : (
          <div
            className="grid gap-2.5"
            data-testid="shortcuts-grid"
            style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
          >
            {filteredItems.map((item) => (
              <ShortcutCard
                key={item.id}
                item={item}
                openInNewTab={openInNewTab}
                isEditMode={isEditMode}
                onEdit={(e) => handleOpenEdit(item, e)}
                onDelete={(e) => handleDelete(item.id, e)}
              />
            ))}

            {/* Inline Add Button */}
            <button
              onClick={handleOpenAdd}
              className="flex flex-col items-center justify-center p-3 rounded-2xl bg-white/[0.02] hover:bg-white/[0.08] border border-dashed border-white/10 hover:border-sky-400/40 text-slate-400 hover:text-sky-300 transition-all group aspect-square"
              title={t.widgets.shortcuts.addShortcut}
            >
              <Plus size={20} className="mb-1 group-hover:scale-110 transition-transform" />
              <span className="text-[11px] font-medium truncate w-full text-center">
                {t.widgets.shortcuts.addShortcut}
              </span>
            </button>
          </div>
        )}
      </div>

      {/* Add / Edit Shortcut Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title={editingItem ? t.widgets.shortcuts.editShortcut : t.widgets.shortcuts.addShortcut}
        maxWidth="sm"
      >
        <form onSubmit={handleSave} className="space-y-4">
          {!editingItem && (
            <button
              type="button"
              onClick={() => {
                setIsAddModalOpen(false);
                setIsPickerOpen(true);
              }}
              className="w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-sky-500/10 hover:bg-sky-500/20 text-sky-200 border border-sky-400/20 text-xs font-medium transition-all"
            >
              <LayoutGrid size={13} />
              <span>{t.widgets.shortcuts.fromCatalog}</span>
            </button>
          )}
          <Input
            label={t.widgets.shortcuts.name}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={t.widgets.shortcuts.namePlaceholder}
            required
            autoFocus
          />

          <Input
            label={t.widgets.shortcuts.url}
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://example.com"
            required
          />

          <Input
            label={t.widgets.shortcuts.category}
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            placeholder={t.widgets.shortcuts.categoryPlaceholder}
          />

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-white/10">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setIsAddModalOpen(false)}
            >
              {t.common.cancel}
            </Button>
            <Button type="submit" variant="primary" size="sm">
              {t.common.save}
            </Button>
          </div>
        </form>
      </Modal>

      <CatalogPicker
        isOpen={isPickerOpen}
        onClose={() => setIsPickerOpen(false)}
        kind="sites"
        sources={['catalog', 'bookmarks', 'topSites']}
        existingUrls={items.map((it) => it.url)}
        onAdd={addItems}
      />
    </div>
  );
};

const ShortcutCard: React.FC<{
  item: ShortcutItem;
  openInNewTab: boolean;
  isEditMode: boolean;
  onEdit: (e: React.MouseEvent) => void;
  onDelete: (e: React.MouseEvent) => void;
}> = ({ item, openInNewTab, isEditMode, onEdit, onDelete }) => {
  const { t } = useTranslation();
  const [imgError, setImgError] = useState(false);
  const faviconUrl = item.iconUrl || getFaviconUrl(item.url, 48);

  return (
    <a
      href={item.url}
      target={openInNewTab ? '_blank' : '_self'}
      rel="noopener noreferrer"
      className="relative flex flex-col items-center justify-center p-3 rounded-2xl bg-white/[0.04] hover:bg-white/[0.09] border border-white/5 hover:border-white/20 shadow-sm hover:shadow-xl transition-all duration-200 group text-center aspect-square"
    >
      {/* Icon */}
      <div className="w-10 h-10 rounded-xl bg-white/[0.06] border border-white/10 flex items-center justify-center mb-1.5 group-hover:scale-110 transition-transform shadow-inner overflow-hidden">
        {faviconUrl && !imgError ? (
          <img
            src={faviconUrl}
            alt=""
            onError={() => setImgError(true)}
            className="w-6 h-6 rounded-md object-contain"
          />
        ) : (
          <Globe size={20} className="text-sky-400" />
        )}
      </div>

      {/* Title */}
      <span className="text-xs font-medium text-slate-200 group-hover:text-sky-300 truncate w-full tracking-wide">
        {item.title}
      </span>

      {/* Edit mode action buttons */}
      {isEditMode ? (
        <div className="absolute top-1 right-1 flex items-center gap-0.5 bg-slate-900/90 rounded-lg p-0.5 border border-white/10 shadow z-10">
          <button
            onClick={onEdit}
            className="p-1 text-slate-400 hover:text-sky-300 transition-colors"
            title={t.common.edit}
            aria-label={t.common.edit}
          >
            <Edit2 size={11} />
          </button>
          <button
            onClick={onDelete}
            className="p-1 text-slate-400 hover:text-rose-400 transition-colors"
            title={t.common.delete}
            aria-label={t.common.delete}
          >
            <Trash2 size={11} />
          </button>
        </div>
      ) : (
        <ExternalLink
          size={10}
          className="absolute top-2 right-2 text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity"
        />
      )}
    </a>
  );
};
