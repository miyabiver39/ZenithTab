import React, { useState } from 'react';
import { Plus, ArrowUp, ArrowDown, Trash2, GripVertical, LayoutGrid } from 'lucide-react';
import { Button } from '../../common/Button';
import { useDashboardStore } from '../../../store/useDashboardStore';
import { useTranslation } from '../../../i18n/i18n';
import { DOCK_ICON_LIBRARY, DOCK_ICON_KEYS } from '../../../utils/dockIcons';
import { cn } from '../../../utils/cn';
import { CatalogPicker, type PickedItem } from '../../common/CatalogPicker';

/** Quick Dock items: add, reorder (buttons or drag), remove. */
export const DockTab: React.FC = () => {
  const dockItems = useDashboardStore((s) => s.dockItems);
  const addDockItem = useDashboardStore((s) => s.addDockItem);
  const removeDockItem = useDashboardStore((s) => s.removeDockItem);
  const moveDockItem = useDashboardStore((s) => s.moveDockItem);
  const reorderDockItem = useDashboardStore((s) => s.reorderDockItem);
  const { t } = useTranslation();

  const [draggedDockId, setDraggedDockId] = useState<string | null>(null);
  const [dragOverDockId, setDragOverDockId] = useState<string | null>(null);

  const [newDockLabel, setNewDockLabel] = useState('');
  const [newDockUrl, setNewDockUrl] = useState('');
  const [newDockIcon, setNewDockIcon] = useState(DOCK_ICON_KEYS[0]);
  const [newDockCustomIcon, setNewDockCustomIcon] = useState('');
  const [newDockNewTab, setNewDockNewTab] = useState(true);
  const [isPickerOpen, setIsPickerOpen] = useState(false);

  const addPicked = (picked: PickedItem[]) => {
    for (const p of picked) {
      addDockItem({ label: p.title, url: p.url, icon: p.icon || 'globe', openInNewTab: true });
    }
  };

  const handleAddDockItem = () => {
    const url = newDockUrl.trim();
    if (!newDockLabel.trim() || !url) return;
    let safeUrl = url;
    if (!/^https?:\/\//i.test(safeUrl)) {
      safeUrl = `https://${safeUrl}`;
    }

    addDockItem({
      label: newDockLabel.trim(),
      url: safeUrl,
      icon: newDockCustomIcon.trim() || newDockIcon,
      openInNewTab: newDockNewTab,
    });

    setNewDockLabel('');
    setNewDockUrl('');
    setNewDockCustomIcon('');
    setNewDockIcon(DOCK_ICON_KEYS[0]);
    setNewDockNewTab(true);
  };

  return (
    <div className="space-y-5">
      <p className="text-xs text-slate-400">{t.settings.dock.desc}</p>

      {/* Existing items */}
      <div className="space-y-2">
        {dockItems.length === 0 && (
          <p className="text-xs text-slate-500 italic">{t.settings.dock.empty}</p>
        )}
        {dockItems.map((item, index) => {
          const Icon = DOCK_ICON_LIBRARY[item.icon];
          return (
            <div
              key={item.id}
              onDragOver={(e) => {
                if (!draggedDockId) return;
                e.preventDefault();
                setDragOverDockId(item.id);
              }}
              onDragLeave={() => setDragOverDockId((cur) => (cur === item.id ? null : cur))}
              onDrop={(e) => {
                e.preventDefault();
                if (draggedDockId && draggedDockId !== item.id) {
                  reorderDockItem(draggedDockId, index);
                }
                setDraggedDockId(null);
                setDragOverDockId(null);
              }}
              className={cn(
                'flex items-center gap-2 p-2.5 rounded-xl bg-slate-800/40 border transition-colors',
                dragOverDockId === item.id ? 'border-sky-400/60 bg-sky-500/10' : 'border-white/10'
              )}
            >
              <span
                draggable
                onDragStart={(e) => {
                  setDraggedDockId(item.id);
                  e.dataTransfer.effectAllowed = 'move';
                }}
                onDragEnd={() => {
                  setDraggedDockId(null);
                  setDragOverDockId(null);
                }}
                title={t.settings.dock.dragToReorder}
                className="cursor-grab active:cursor-grabbing text-slate-500 hover:text-white flex-shrink-0"
              >
                <GripVertical size={14} />
              </span>
              <div className="w-7 h-7 flex items-center justify-center rounded-lg bg-white/5 text-slate-300 flex-shrink-0">
                {Icon ? <Icon size={14} /> : <span className="text-sm leading-none">{item.icon || '🔗'}</span>}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-semibold text-white truncate">{item.label}</div>
                <div className="text-[10px] text-slate-500 truncate">{item.url}</div>
              </div>
              <button
                type="button"
                onClick={() => moveDockItem(item.id, 'up')}
                disabled={index === 0}
                title={t.settings.dock.moveUp}
                className="p-1.5 rounded-md text-slate-400 hover:text-white hover:bg-white/10 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
              >
                <ArrowUp size={13} />
              </button>
              <button
                type="button"
                onClick={() => moveDockItem(item.id, 'down')}
                disabled={index === dockItems.length - 1}
                title={t.settings.dock.moveDown}
                className="p-1.5 rounded-md text-slate-400 hover:text-white hover:bg-white/10 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
              >
                <ArrowDown size={13} />
              </button>
              <button
                type="button"
                onClick={() => removeDockItem(item.id)}
                title={t.common.delete}
                className="p-1.5 rounded-md text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
              >
                <Trash2 size={13} />
              </button>
            </div>
          );
        })}
      </div>

      {/* Add new item */}
      <div className="p-4 rounded-xl bg-white/[0.03] border border-white/10 space-y-3">
        <div className="flex items-center justify-between gap-3">
          <h4 className="text-xs font-semibold text-white">{t.settings.dock.addTitle}</h4>
          <Button variant="secondary" size="sm" onClick={() => setIsPickerOpen(true)} className="gap-1.5">
            <LayoutGrid size={13} />
            <span>{t.settings.dock.fromCatalog}</span>
          </Button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          <div>
            <label className="block text-[11px] text-slate-400 mb-1">{t.settings.dock.labelField}</label>
            <input
              type="text"
              value={newDockLabel}
              onChange={(e) => setNewDockLabel(e.target.value)}
              placeholder={t.settings.dock.labelPlaceholder}
              className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900/60 border border-white/10 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-400/50"
            />
          </div>
          <div>
            <label className="block text-[11px] text-slate-400 mb-1">{t.settings.dock.urlField}</label>
            <input
              type="text"
              value={newDockUrl}
              onChange={(e) => setNewDockUrl(e.target.value)}
              placeholder="example.com"
              className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900/60 border border-white/10 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-400/50"
            />
          </div>
        </div>

        <div>
          <label className="block text-[11px] text-slate-400 mb-1.5">{t.settings.dock.iconField}</label>
          <div className="flex flex-wrap gap-1.5 mb-2">
            {DOCK_ICON_KEYS.map((key) => {
              const Icon = DOCK_ICON_LIBRARY[key];
              const isSelected = !newDockCustomIcon && newDockIcon === key;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => {
                    setNewDockIcon(key);
                    setNewDockCustomIcon('');
                  }}
                  className={`w-8 h-8 flex items-center justify-center rounded-lg border transition-all ${
                    isSelected
                      ? 'bg-sky-500/20 border-sky-400 text-sky-200'
                      : 'bg-slate-800/40 border-white/10 text-slate-400 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  <Icon size={14} />
                </button>
              );
            })}
          </div>
          <input
            type="text"
            value={newDockCustomIcon}
            onChange={(e) => setNewDockCustomIcon(e.target.value)}
            placeholder={t.settings.dock.customIconPlaceholder}
            maxLength={4}
            className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900/60 border border-white/10 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-400/50"
          />
        </div>

        <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={newDockNewTab}
            onChange={(e) => setNewDockNewTab(e.target.checked)}
            className="accent-sky-400"
          />
          {t.settings.dock.openInNewTab}
        </label>

        <Button
          variant="primary"
          size="sm"
          onClick={handleAddDockItem}
          disabled={!newDockLabel.trim() || !newDockUrl.trim()}
          className="gap-2"
        >
          <Plus size={14} />
          <span>{t.settings.dock.addBtn}</span>
        </Button>
      </div>

      <CatalogPicker
        isOpen={isPickerOpen}
        onClose={() => setIsPickerOpen(false)}
        kind="sites"
        sources={['catalog', 'bookmarks', 'topSites']}
        existingUrls={dockItems.map((d) => d.url)}
        onAdd={addPicked}
      />
    </div>
  );
};
