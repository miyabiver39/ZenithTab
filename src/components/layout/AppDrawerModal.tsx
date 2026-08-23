import React, { useState } from 'react';
import { Search, Plus, Globe, X, ExternalLink } from 'lucide-react';
import { useDashboardStore } from '../../store/useDashboardStore';
import { getFaviconUrl } from '../../utils/favicon';
import { useTranslation } from '../../i18n/i18n';
import { ShortcutItem } from '../../types/widget';
import { Modal } from '../common/Modal';
import { Input } from '../common/Input';
import { Button } from '../common/Button';

export const AppDrawerModal: React.FC = () => {
  const { isAppDrawerOpen, toggleAppDrawer, widgets, updateWidgetConfig } = useDashboardStore();
  const { t } = useTranslation();

  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newUrl, setNewUrl] = useState('');
  const [newCategory, setNewCategory] = useState('');

  if (!isAppDrawerOpen) return null;

  // Find shortcuts widget config or fallback to default
  const shortcutsWidget = widgets.find((w) => w.type === 'shortcuts');
  const items: ShortcutItem[] = shortcutsWidget?.config?.items || [
    { id: 'app-chatgpt', title: 'ChatGPT', url: 'https://chatgpt.com', category: 'AI & Tools' },
    { id: 'app-github', title: 'GitHub', url: 'https://github.com', category: 'Development' },
    { id: 'app-youtube', title: 'YouTube', url: 'https://youtube.com', category: 'Media' },
    { id: 'app-gmail', title: 'Gmail', url: 'https://mail.google.com', category: 'Productivity' },
    { id: 'app-notion', title: 'Notion', url: 'https://notion.so', category: 'Productivity' },
    { id: 'app-twitter', title: 'X (Twitter)', url: 'https://x.com', category: 'Social' },
    { id: 'app-figma', title: 'Figma', url: 'https://figma.com', category: 'Design' },
    { id: 'app-spotify', title: 'Spotify', url: 'https://open.spotify.com', category: 'Media' },
    { id: 'app-reddit', title: 'Reddit', url: 'https://reddit.com', category: 'Social' },
  ];

  const categories = ['all', ...Array.from(new Set(items.map((it) => it.category).filter(Boolean))) as string[]];

  const filteredItems = items.filter((it) => {
    const matchesSearch =
      it.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      it.url.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = activeCategory === 'all' || it.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  const handleAddApp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newUrl.trim()) return;

    let formattedUrl = newUrl.trim();
    if (!/^https?:\/\//i.test(formattedUrl)) {
      formattedUrl = `https://${formattedUrl}`;
    }

    const newItem: ShortcutItem = {
      id: `shortcut-${Date.now()}`,
      title: newTitle.trim(),
      url: formattedUrl,
      category: newCategory.trim() || undefined,
    };

    if (shortcutsWidget) {
      updateWidgetConfig(shortcutsWidget.id, {
        items: [...items, newItem],
      });
    }

    setIsAddModalOpen(false);
    setNewTitle('');
    setNewUrl('');
    setNewCategory('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto animate-fade-in select-none">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-xl transition-opacity"
        onClick={() => toggleAppDrawer(false)}
      />

      {/* Drawer Container */}
      <div className="relative w-full max-w-4xl bg-slate-900/85 border border-white/15 text-slate-100 rounded-3xl shadow-2xl shadow-black/80 backdrop-blur-2xl z-10 overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="px-6 py-5 border-b border-white/10 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-sky-500 to-indigo-500 flex items-center justify-center text-white font-bold shadow-lg shadow-sky-500/25">
              <Globe size={18} />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-wide">
                {t.appDrawer.title}
              </h2>
              <p className="text-xs text-slate-400">
                {items.length} {t.widgets.shortcuts.title.toLowerCase()}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="primary"
              size="sm"
              onClick={() => setIsAddModalOpen(true)}
              className="gap-1.5 text-xs"
            >
              <Plus size={14} />
              <span>{t.appDrawer.addCustomApp}</span>
            </Button>

            <button
              onClick={() => toggleAppDrawer(false)}
              className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-white/10 transition-colors"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Search & Categories Bar */}
        <div className="px-6 py-3.5 bg-white/[0.02] border-b border-white/5 space-y-3">
          {/* Search Input */}
          <div className="relative">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t.appDrawer.searchPlaceholder}
              autoFocus
              className="w-full pl-10 pr-4 py-2 bg-slate-800/50 border border-white/10 rounded-xl text-sm text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-400/50 transition-all"
            />
          </div>

          {/* Category Chips */}
          <div className="flex items-center gap-2 overflow-x-auto custom-scrollbar py-0.5">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-3 py-1 rounded-xl text-xs font-medium whitespace-nowrap transition-all ${
                  activeCategory === cat
                    ? 'bg-sky-500 text-white shadow-md shadow-sky-500/25'
                    : 'bg-white/[0.04] text-slate-400 hover:text-white hover:bg-white/[0.08] border border-white/5'
                }`}
              >
                {cat === 'all' ? t.widgets.shortcuts.allCategories : cat}
              </button>
            ))}
          </div>
        </div>

        {/* Apps Grid */}
        <div className="p-6 overflow-y-auto flex-1 custom-scrollbar">
          {filteredItems.length === 0 ? (
            <div className="py-16 text-center text-slate-400 text-sm">
              {t.widgets.shortcuts.noShortcuts}
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3.5">
              {filteredItems.map((item) => (
                <DrawerAppCard key={item.id} item={item} onSelect={() => toggleAppDrawer(false)} />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Add Custom App Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title={t.appDrawer.addCustomApp}
        maxWidth="sm"
      >
        <form onSubmit={handleAddApp} className="space-y-4">
          <Input
            label={t.widgets.shortcuts.name}
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            placeholder="e.g. Discord, Netflix, Figma"
            required
            autoFocus
          />

          <Input
            label={t.widgets.shortcuts.url}
            value={newUrl}
            onChange={(e) => setNewUrl(e.target.value)}
            placeholder="https://example.com"
            required
          />

          <Input
            label={t.widgets.shortcuts.category}
            value={newCategory}
            onChange={(e) => setNewCategory(e.target.value)}
            placeholder="e.g. Work, Entertainment, AI"
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

const DrawerAppCard: React.FC<{ item: ShortcutItem; onSelect: () => void }> = ({ item, onSelect }) => {
  const [imgError, setImgError] = useState(false);
  const faviconUrl = item.iconUrl || getFaviconUrl(item.url, 64);

  return (
    <a
      href={item.url}
      target="_blank"
      rel="noopener noreferrer"
      onClick={onSelect}
      className="flex flex-col items-center justify-center p-4 rounded-2xl bg-white/[0.03] hover:bg-white/[0.08] border border-white/5 hover:border-white/20 shadow-md hover:shadow-2xl transition-all duration-200 group text-center aspect-square"
    >
      <div className="w-12 h-12 rounded-2xl bg-white/[0.06] border border-white/10 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform shadow-inner overflow-hidden">
        {faviconUrl && !imgError ? (
          <img
            src={faviconUrl}
            alt=""
            onError={() => setImgError(true)}
            className="w-7 h-7 rounded-lg object-contain"
          />
        ) : (
          <Globe size={24} className="text-sky-400" />
        )}
      </div>

      <span className="text-xs font-semibold text-slate-200 group-hover:text-sky-300 truncate w-full tracking-wide">
        {item.title}
      </span>

      {item.category && (
        <span className="text-[10px] text-slate-400 truncate w-full mt-0.5">
          {item.category}
        </span>
      )}

      <ExternalLink
        size={11}
        className="text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity mt-1"
      />
    </a>
  );
};
