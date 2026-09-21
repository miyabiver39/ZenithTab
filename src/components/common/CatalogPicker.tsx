import React, { useEffect, useMemo, useState } from 'react';
import { Check, Globe, Plus, Rss, Bookmark, TrendingUp, LayoutGrid, Folder } from 'lucide-react';
import { Modal } from './Modal';
import { Button } from './Button';
import { useTranslation } from '../../i18n/i18n';
import { getFaviconUrl } from '../../utils/favicon';
import { hostnameOf } from '../../utils/url';
import { resolvePresetLanguage, type PresetLanguage } from '../../config/defaults/regionalPresets';
import { getSiteCatalog, SITE_CATALOG_LANGUAGES, REGION_LABELS } from '../../config/catalog/siteCatalog';
import { getFeedCatalog, FEED_CATEGORIES } from '../../config/catalog/feedCatalog';
import { bookmarkService } from '../../services/bookmarkService';
import { quickAccessService } from '../../services/quickAccessService';
import { hasApiPermissions, requestApiPermissions } from '../../utils/permissions';
import type { BookmarkItem } from '../../types/bookmark';
import { cn } from '../../utils/cn';

/** What a picker hands back: enough to build a shortcut, a dock item or a feed config. */
export interface PickedItem {
  title: string;
  url: string;
  /** Category label (sites) — free text stored on the shortcut. */
  category?: string;
  /** DOCK_ICON_LIBRARY key when the catalog knows one. */
  icon?: string;
}

export type PickerSource = 'catalog' | 'bookmarks' | 'topSites';

interface CatalogPickerProps {
  isOpen: boolean;
  onClose: () => void;
  /** Sites (shortcuts / dock) or news feeds. Feeds have no bookmark / top-sites sources. */
  kind: 'sites' | 'feeds';
  /** Extra sources offered as tabs next to the catalog (sites only). */
  sources?: PickerSource[];
  /** URLs already present; shown as added and not selectable again. */
  existingUrls: string[];
  /** 'multi' collects a selection and adds it at once; 'single' adds on click. */
  mode?: 'multi' | 'single';
  onAdd: (items: PickedItem[]) => void;
  title?: string;
}

interface PickerItem extends PickedItem {
  id: string;
}

/** Trailing slash and case don't make a different site. */
export const urlKey = (url: string) => url.trim().toLowerCase().replace(/\/+$/, '');

const SOURCE_ICONS: Record<PickerSource, React.FC<{ size?: number; className?: string }>> = {
  catalog: LayoutGrid,
  bookmarks: Bookmark,
  topSites: TrendingUp,
};

/** Bookmarks flattened to links, with the folder path as the category. */
function flattenBookmarks(nodes: BookmarkItem[], path: string[] = []): PickerItem[] {
  const out: PickerItem[] = [];
  for (const node of nodes) {
    if (node.url) {
      out.push({ id: `bm-${node.id}`, title: node.title || hostnameOf(node.url), url: node.url, category: path[path.length - 1] });
    } else if (node.children) {
      out.push(...flattenBookmarks(node.children, node.title ? [...path, node.title] : path));
    }
  }
  return out;
}

/**
 * "Add from…" dialog shared by the Shortcuts widget, the Dock settings and
 * the news feed settings. Tiles come from the regional catalog (any region,
 * independent of the UI language), and — for sites — from the user's
 * Chrome bookmarks or most-visited sites. Already-present URLs are shown
 * ticked so the same site is never added twice.
 */
export const CatalogPicker: React.FC<CatalogPickerProps> = ({
  isOpen,
  onClose,
  kind,
  sources = ['catalog'],
  existingUrls,
  mode = 'multi',
  onAdd,
  title,
}) => {
  const { t, activeLanguageCode } = useTranslation();
  const [source, setSource] = useState<PickerSource>('catalog');
  const [region, setRegion] = useState<PresetLanguage>(() => resolvePresetLanguage(activeLanguageCode));
  const [category, setCategory] = useState<string>('all');
  const [selected, setSelected] = useState<Record<string, PickerItem>>({});
  const [external, setExternal] = useState<{ source: PickerSource; items: PickerItem[]; status: 'loading' | 'ready' | 'denied' } | null>(null);

  const existing = useMemo(() => new Set(existingUrls.map(urlKey)), [existingUrls]);

  // Reset transient state whenever the dialog is (re)opened.
  useEffect(() => {
    if (!isOpen) return;
    setSource('catalog');
    setCategory('all');
    setSelected({});
    setExternal(null);
    setRegion(resolvePresetLanguage(activeLanguageCode));
  }, [isOpen, activeLanguageCode]);

  const catalogItems: PickerItem[] = useMemo(() => {
    if (kind === 'feeds') {
      return getFeedCatalog(region).map((f) => ({ id: f.id, title: f.title, url: f.url, category: t.catalog.feedCategories[f.category] }));
    }
    return getSiteCatalog(region).map((s) => ({ id: s.id, title: s.title, url: s.url, category: s.category, icon: s.icon }));
  }, [kind, region, t]);

  const categoryOrder = useMemo(() => {
    if (kind === 'feeds' && source === 'catalog') return FEED_CATEGORIES.map((c) => t.catalog.feedCategories[c]);
    return undefined;
  }, [kind, source, t]);

  const externalItems = external?.items;
  const items = useMemo(() => (source === 'catalog' ? catalogItems : externalItems || []), [source, catalogItems, externalItems]);

  const categories = useMemo(() => {
    const seen = Array.from(new Set(items.map((i) => i.category).filter((c): c is string => !!c)));
    if (!categoryOrder) return seen;
    return categoryOrder.filter((c) => seen.includes(c));
  }, [items, categoryOrder]);

  const visible = category === 'all' ? items : items.filter((i) => i.category === category);

  const loadSource = async (next: PickerSource) => {
    setSource(next);
    setCategory('all');
    if (next === 'catalog') return;
    setExternal({ source: next, items: [], status: 'loading' });
    try {
      if (next === 'bookmarks') {
        const tree = await bookmarkService.getBookmarkTree();
        setExternal({ source: next, items: flattenBookmarks(tree), status: 'ready' });
      } else {
        // topSites is an optional permission: ask inside this click.
        const granted = (await hasApiPermissions(['topSites'])) || (await requestApiPermissions(['topSites']));
        if (!granted) {
          setExternal({ source: next, items: [], status: 'denied' });
          return;
        }
        const sites = await quickAccessService.getTopSites(24);
        setExternal({ source: next, items: sites.map((s) => ({ id: s.id, title: s.title, url: s.url })), status: 'ready' });
      }
    } catch (err) {
      console.warn('[ZenithTab] Catalog source failed:', err);
      setExternal({ source: next, items: [], status: 'ready' });
    }
  };

  const toggle = (item: PickerItem) => {
    if (existing.has(urlKey(item.url))) return;
    if (mode === 'single') {
      onAdd([item]);
      onClose();
      return;
    }
    setSelected((prev) => {
      const next = { ...prev };
      if (next[item.id]) delete next[item.id];
      else next[item.id] = item;
      return next;
    });
  };

  const commit = () => {
    const picked = Object.values(selected);
    if (picked.length === 0) return;
    onAdd(picked);
    onClose();
  };

  const count = Object.keys(selected).length;
  const heading = title || (kind === 'feeds' ? t.catalog.feedTitle : t.catalog.siteTitle);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={heading} maxWidth="2xl">
      <div className="space-y-3">
        {/* Source tabs (only when there is more than the catalog) + region */}
        <div className="flex flex-wrap items-center gap-2 justify-between">
          {sources.length > 1 ? (
            <div className="flex items-center gap-1" role="tablist" aria-label={t.catalog.source}>
              {sources.map((s) => {
                const Icon = SOURCE_ICONS[s];
                return (
                  <button
                    key={s}
                    type="button"
                    role="tab"
                    aria-selected={source === s}
                    onClick={() => void loadSource(s)}
                    className={cn(
                      'flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all',
                      source === s ? 'bg-sky-500/20 text-sky-200 border border-sky-400/30' : 'text-slate-400 hover:text-white hover:bg-white/5 border border-transparent'
                    )}
                  >
                    <Icon size={13} />
                    <span>{t.catalog.sources[s]}</span>
                  </button>
                );
              })}
            </div>
          ) : (
            <span />
          )}
          {source === 'catalog' && (
            <label className="flex items-center gap-2 text-[11px] text-slate-400">
              <Globe size={12} />
              <span>{t.catalog.region}</span>
              <select
                value={region}
                onChange={(e) => {
                  setRegion(e.target.value as PresetLanguage);
                  setCategory('all');
                }}
                aria-label={t.catalog.region}
                className="px-2 py-1 rounded-lg bg-slate-800/60 border border-white/10 text-xs text-white focus:outline-none focus:ring-2 focus:ring-sky-400/50"
              >
                {SITE_CATALOG_LANGUAGES.map((lang) => (
                  <option key={lang} value={lang} className="bg-slate-900">
                    {REGION_LABELS[lang]}
                  </option>
                ))}
              </select>
            </label>
          )}
        </div>

        {/* Category chips */}
        {categories.length > 1 && (
          <div className="flex items-center gap-1.5 overflow-x-auto custom-scrollbar pb-1">
            {['all', ...categories].map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setCategory(cat)}
                className={cn(
                  'px-2.5 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition-all border',
                  category === cat ? 'bg-sky-500/20 text-sky-200 border-sky-400/30' : 'text-slate-400 hover:text-white hover:bg-white/5 border-transparent'
                )}
              >
                {cat === 'all' ? t.catalog.allCategories : cat}
              </button>
            ))}
          </div>
        )}

        {/* Tiles */}
        {external && external.source === source && external.status !== 'ready' ? (
          <p className="text-xs text-slate-500 italic py-6 text-center">
            {external.status === 'loading' ? t.catalog.loading : t.catalog.permissionDenied}
          </p>
        ) : visible.length === 0 ? (
          <p className="text-xs text-slate-500 italic py-6 text-center">{t.catalog.empty}</p>
        ) : (
          <ul
            className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 max-h-[50vh] overflow-y-auto custom-scrollbar pr-1"
            aria-label={heading}
          >
            {visible.map((item) => {
              const isExisting = existing.has(urlKey(item.url));
              const isSelected = !!selected[item.id];
              return (
                <li key={item.id}>
                  <button
                    type="button"
                    onClick={() => toggle(item)}
                    disabled={isExisting}
                    aria-pressed={mode === 'multi' ? isSelected : undefined}
                    title={item.url}
                    className={cn(
                      'w-full flex items-center gap-2 p-2 rounded-xl border text-left transition-all',
                      isExisting
                        ? 'bg-white/[0.02] border-white/5 text-slate-500 cursor-default'
                        : isSelected
                          ? 'bg-sky-500/20 border-sky-400/50 text-white'
                          : 'bg-white/[0.04] hover:bg-white/[0.09] border-white/10 text-slate-200'
                    )}
                  >
                    <span className="w-7 h-7 rounded-lg bg-white/[0.06] border border-white/10 flex items-center justify-center flex-shrink-0 overflow-hidden">
                      <Favicon url={item.url} isFeed={kind === 'feeds'} folder={source === 'bookmarks' && !item.url} />
                    </span>
                    <span className="flex-1 min-w-0">
                      <span className="block text-xs font-medium truncate">{item.title}</span>
                      <span className="block text-[10px] text-slate-500 truncate">{hostnameOf(item.url)}</span>
                    </span>
                    <span className="flex-shrink-0 text-sky-300">
                      {isExisting || isSelected ? <Check size={13} /> : mode === 'single' ? <Plus size={13} className="text-slate-500" /> : null}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}

        {mode === 'multi' && (
          <div className="flex items-center justify-between gap-3 pt-3 border-t border-white/10">
            <span className="text-[11px] text-slate-500">{t.catalog.hint}</span>
            <div className="flex items-center gap-2">
              <Button type="button" variant="ghost" size="sm" onClick={onClose}>
                {t.common.cancel}
              </Button>
              <Button type="button" variant="primary" size="sm" onClick={commit} disabled={count === 0} className="gap-1.5">
                <Plus size={13} />
                <span>{count > 0 ? t.catalog.addCount.replace('{n}', String(count)) : t.catalog.add}</span>
              </Button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};

export const Favicon: React.FC<{ url: string; isFeed: boolean; folder?: boolean }> = ({ url, isFeed, folder }) => {
  const src = getFaviconUrl(url, 32);
  // Remember which src failed, not a bare flag: when the same tile position
  // is reused for another site (category / region switch) the new icon
  // gets its own chance instead of inheriting the old fallback.
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const error = failedSrc === src;
  if (folder) return <Folder size={14} className="text-amber-300" />;
  if (isFeed && (!src || error)) return <Rss size={14} className="text-orange-400" />;
  if (!src || error) return <Globe size={14} className="text-sky-400" />;
  return <img src={src} alt="" onError={() => setFailedSrc(src)} className="w-4 h-4 rounded-sm object-contain" />;
};
