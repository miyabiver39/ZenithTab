import React, { useState } from 'react';
import { Plus, Globe, Trash2, Edit2, ExternalLink } from 'lucide-react';
import { ShortcutsWidgetConfig, ShortcutItem } from '../../../types/widget';
import { useDashboardStore } from '../../../store/useDashboardStore';
import { getFaviconUrl } from '../../../utils/favicon';
import { useTranslation } from '../../../i18n/i18n';
import { Modal } from '../../common/Modal';
import { Input } from '../../common/Input';
import { Button } from '../../common/Button';

interface ShortcutsWidgetProps {
  widgetId: string;
  config: ShortcutsWidgetConfig;
}

export const ShortcutsWidget: React.FC<ShortcutsWidgetProps> = ({ widgetId, config }) => {
  const { items = [], openInNewTab = true } = config;
  const { updateWidgetConfig, isEditMode } = useDashboardStore();
  const { t } = useTranslation();

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ShortcutItem | null>(null);
  const [title, setTitle] = useState('');
  const [url, setUrl] = useState('');
  const [category, setCategory] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('all');

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
    const updated = items.filter((it) => it.id !== id);
    updateWidgetConfig(widgetId, { items: updated });
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
        id: `shortcut-${Date.now()}`,
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
    <div className="w-full h-full flex flex-col min-h-0 select-none">
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
            <button
              onClick={handleOpenAdd}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-sky-500/20 hover:bg-sky-500 text-sky-200 hover:text-white border border-sky-400/30 text-xs font-medium transition-all"
            >
              <Plus size={13} />
              <span>{t.widgets.shortcuts.addShortcut}</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-4 gap-2.5">
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
          <Input
            label={t.widgets.shortcuts.name}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. GitHub, Notion, YouTube"
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
            placeholder="e.g. Productivity, Media, Tools"
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
            title="Edit"
          >
            <Edit2 size={11} />
          </button>
          <button
            onClick={onDelete}
            className="p-1 text-slate-400 hover:text-rose-400 transition-colors"
            title="Delete"
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
