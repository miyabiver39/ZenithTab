import React, { useState, useRef, useEffect } from 'react';
import { Image, Palette, Download, Upload, RotateCcw, Languages, Dock as DockIcon, Plus, ArrowUp, ArrowDown, Trash2, Keyboard } from 'lucide-react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { useDashboardStore } from '../../store/useDashboardStore';
import { WallpaperCategory } from '../../types/settings';
import { wallpaperService, GRADIENT_PRESETS } from '../../services/wallpaperService';
import { useTranslation, SupportedLanguage } from '../../i18n/i18n';
import { DOCK_ICON_LIBRARY, DOCK_ICON_KEYS } from '../../utils/dockIcons';
import { getComboFromEvent } from '../../utils/keyboardShortcuts';

export const SettingsPanel: React.FC = () => {
  const {
    activeSettingsModal,
    editingWidgetId,
    closeSettingsModal,
    wallpaper,
    appearance,
    dockItems,
    keyboardShortcuts,
    updateWallpaper,
    updateAppearance,
    addDockItem,
    removeDockItem,
    moveDockItem,
    addKeyboardShortcut,
    removeKeyboardShortcut,
    resetToDefault,
    exportConfig,
    importConfig,
  } = useDashboardStore();

  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<'wallpaper' | 'appearance' | 'language' | 'backup' | 'dock' | 'keys'>('wallpaper');
  const [importStatus, setImportStatus] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const wallpaperUploadRef = useRef<HTMLInputElement>(null);

  const [newDockLabel, setNewDockLabel] = useState('');
  const [newDockUrl, setNewDockUrl] = useState('');
  const [newDockIcon, setNewDockIcon] = useState(DOCK_ICON_KEYS[0]);
  const [newDockCustomIcon, setNewDockCustomIcon] = useState('');
  const [newDockNewTab, setNewDockNewTab] = useState(true);

  const [newKeyLabel, setNewKeyLabel] = useState('');
  const [newKeyUrl, setNewKeyUrl] = useState('');
  const [newKeyCombo, setNewKeyCombo] = useState('');
  const [newKeyNewTab, setNewKeyNewTab] = useState(true);

  const isOpen = activeSettingsModal === 'settings';

  // The Dock's own gear icon opens straight to this tab (signaled via
  // editingWidgetId, since this modal has no dedicated "open on tab X" field).
  useEffect(() => {
    if (isOpen && editingWidgetId === 'dock') {
      setActiveTab('dock');
    }
  }, [isOpen, editingWidgetId]);

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

  const handleRecordCombo = (e: React.KeyboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const combo = getComboFromEvent(e);
    if (combo) setNewKeyCombo(combo);
  };

  const handleAddKeyboardShortcut = () => {
    const url = newKeyUrl.trim();
    if (!newKeyLabel.trim() || !url || !newKeyCombo) return;
    let safeUrl = url;
    if (!/^https?:\/\//i.test(safeUrl)) {
      safeUrl = `https://${safeUrl}`;
    }

    addKeyboardShortcut({
      label: newKeyLabel.trim(),
      url: safeUrl,
      combo: newKeyCombo,
      openInNewTab: newKeyNewTab,
    });

    setNewKeyLabel('');
    setNewKeyUrl('');
    setNewKeyCombo('');
    setNewKeyNewTab(true);
  };

  const wallpaperCategories: Array<{ id: WallpaperCategory; label: string }> = [
    { id: 'space', label: t.categories.space },
    { id: 'nature', label: t.categories.nature },
    { id: 'minimal', label: t.categories.minimal },
    { id: 'architecture', label: t.categories.architecture },
    { id: 'abstract', label: t.categories.abstract },
    { id: 'cyberpunk', label: t.categories.cyberpunk },
  ];

  const languageOptions: Array<{ code: SupportedLanguage; label: string; nativeName: string }> = [
    { code: 'auto', label: 'Auto (Browser Language)', nativeName: '自動 (ブラウザ言語)' },
    { code: 'ja', label: 'Japanese', nativeName: '日本語' },
    { code: 'en', label: 'English', nativeName: 'English (US)' },
    { code: 'zh-CN', label: 'Chinese (Simplified)', nativeName: '简体中文' },
    { code: 'es', label: 'Spanish', nativeName: 'Español' },
    { code: 'fr', label: 'French', nativeName: 'Français' },
    { code: 'de', label: 'German', nativeName: 'Deutsch' },
    { code: 'ko', label: 'Korean', nativeName: '한국어' },
  ];

  const handleCustomWallpaperUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      // Downscaled + re-encoded so a large photo cannot exhaust the
      // chrome.storage.local quota.
      const dataUrl = await wallpaperService.prepareUploadedWallpaper(file);
      updateWallpaper({
        source: 'custom',
        currentWallpaperUrl: dataUrl,
      });
    } catch (err) {
      console.error('Failed reading custom wallpaper image:', err);
    }
  };

  const handleExport = async () => {
    const jsonString = await exportConfig();
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `zenith-tab-config-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const content = event.target?.result as string;
      const success = await importConfig(content);
      if (success) {
        setImportStatus(t.settings.importSuccess);
        setTimeout(() => setImportStatus(null), 3000);
      } else {
        setImportStatus(t.settings.importFail);
      }
    };
    reader.readAsText(file);
  };

  return (
    <Modal isOpen={isOpen} onClose={closeSettingsModal} title={t.settings.modalTitle} maxWidth="2xl">
      {/* Navigation Tabs */}
      <div className="flex items-center gap-1 pb-4 border-b border-white/10 select-none overflow-x-auto custom-scrollbar">
        <button
          onClick={() => setActiveTab('wallpaper')}
          className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium whitespace-nowrap transition-all ${
            activeTab === 'wallpaper'
              ? 'bg-sky-500/20 text-sky-300 border border-sky-400/30'
              : 'text-slate-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <Image size={15} />
          <span>{t.settings.tabs.wallpaper}</span>
        </button>

        <button
          onClick={() => setActiveTab('appearance')}
          className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium whitespace-nowrap transition-all ${
            activeTab === 'appearance'
              ? 'bg-sky-500/20 text-sky-300 border border-sky-400/30'
              : 'text-slate-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <Palette size={15} />
          <span>{t.settings.tabs.appearance}</span>
        </button>

        <button
          onClick={() => setActiveTab('language')}
          className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium whitespace-nowrap transition-all ${
            activeTab === 'language'
              ? 'bg-sky-500/20 text-sky-300 border border-sky-400/30'
              : 'text-slate-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <Languages size={15} />
          <span>{t.settings.tabs.language}</span>
        </button>

        <button
          onClick={() => setActiveTab('backup')}
          className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium whitespace-nowrap transition-all ${
            activeTab === 'backup'
              ? 'bg-sky-500/20 text-sky-300 border border-sky-400/30'
              : 'text-slate-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <Download size={15} />
          <span>{t.settings.tabs.backup}</span>
        </button>

        <button
          onClick={() => setActiveTab('dock')}
          className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium whitespace-nowrap transition-all ${
            activeTab === 'dock'
              ? 'bg-sky-500/20 text-sky-300 border border-sky-400/30'
              : 'text-slate-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <DockIcon size={15} />
          <span>{t.settings.tabs.dock}</span>
        </button>

        <button
          onClick={() => setActiveTab('keys')}
          className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium whitespace-nowrap transition-all ${
            activeTab === 'keys'
              ? 'bg-sky-500/20 text-sky-300 border border-sky-400/30'
              : 'text-slate-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <Keyboard size={15} />
          <span>{t.settings.tabs.keyboardShortcuts}</span>
        </button>
      </div>

      {/* Tab Content */}
      <div className="py-4 space-y-6">
        {activeTab === 'wallpaper' && (
          <div className="space-y-5">
            {/* Wallpaper Sources */}
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-2">
                {t.settings.wallpaperSource}
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { key: 'unsplash', label: 'Unsplash HD' },
                  { key: 'gradient', label: 'Gradient' },
                  { key: 'custom', label: 'Custom File' },
                ].map((src) => (
                  <button
                    key={src.key}
                    type="button"
                    onClick={() => {
                      if (src.key === 'unsplash') {
                        const url = wallpaperService.getRandomWallpaper(wallpaper.category);
                        updateWallpaper({ source: 'unsplash', currentWallpaperUrl: url });
                      } else if (src.key === 'gradient') {
                        updateWallpaper({ source: 'gradient', currentWallpaperUrl: GRADIENT_PRESETS[0] });
                      } else {
                        updateWallpaper({ source: 'custom' });
                      }
                    }}
                    className={`py-2 px-3 rounded-xl text-xs font-medium border transition-all ${
                      wallpaper.source === src.key
                        ? 'bg-sky-500/20 border-sky-400 text-sky-200'
                        : 'bg-slate-800/40 border-white/10 text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    {src.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Category selection for Unsplash */}
            {wallpaper.source === 'unsplash' && (
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-2">
                  {t.settings.unsplashTheme}
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {wallpaperCategories.map((cat) => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => {
                        const newUrl = wallpaperService.getRandomWallpaper(cat.id);
                        updateWallpaper({
                          category: cat.id,
                          currentWallpaperUrl: newUrl,
                        });
                      }}
                      className={`p-2.5 rounded-xl text-xs font-medium border text-left transition-all ${
                        wallpaper.category === cat.id
                          ? 'bg-sky-500/20 border-sky-400 text-sky-200 shadow'
                          : 'bg-slate-800/40 border-white/10 text-slate-300 hover:bg-slate-800'
                      }`}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Gradient Selection */}
            {wallpaper.source === 'gradient' && (
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-2">
                  {t.settings.gradientPresets}
                </label>
                <div className="grid grid-cols-5 gap-2">
                  {GRADIENT_PRESETS.map((grad, index) => (
                    <button
                      key={index}
                      onClick={() => updateWallpaper({ currentWallpaperUrl: grad })}
                      className={`h-12 rounded-xl border transition-all ${
                        wallpaper.currentWallpaperUrl === grad
                          ? 'ring-2 ring-sky-400 border-white'
                          : 'border-white/10'
                      }`}
                      style={{ background: grad }}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Custom Image Upload */}
            {wallpaper.source === 'custom' && (
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-2">
                  {t.settings.uploadWallpaper}
                </label>
                <input
                  type="file"
                  ref={wallpaperUploadRef}
                  onChange={handleCustomWallpaperUpload}
                  accept="image/*"
                  className="hidden"
                />
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => wallpaperUploadRef.current?.click()}
                  className="gap-2"
                >
                  <Upload size={14} />
                  <span>{t.settings.chooseImage}</span>
                </Button>
              </div>
            )}

            {/* Sliders for Blur, Brightness, Overlay */}
            <div className="space-y-4 pt-2 border-t border-white/10">
              <div>
                <div className="flex justify-between text-xs text-slate-300 mb-1">
                  <span>{t.settings.wallpaperBlur}</span>
                  <span className="font-mono text-slate-400">{wallpaper.blur}px</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="20"
                  value={wallpaper.blur}
                  onChange={(e) => updateWallpaper({ blur: parseInt(e.target.value) || 0 })}
                  className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-sky-400"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs text-slate-300 mb-1">
                  <span>{t.settings.wallpaperBrightness}</span>
                  <span className="font-mono text-slate-400">
                    {Math.round(wallpaper.brightness * 100)}%
                  </span>
                </div>
                <input
                  type="range"
                  min="30"
                  max="120"
                  value={Math.round(wallpaper.brightness * 100)}
                  onChange={(e) => updateWallpaper({ brightness: parseInt(e.target.value) / 100 })}
                  className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-sky-400"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs text-slate-300 mb-1">
                  <span>{t.settings.overlayTint}</span>
                  <span className="font-mono text-slate-400">
                    {Math.round(wallpaper.overlayOpacity * 100)}%
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="80"
                  value={Math.round(wallpaper.overlayOpacity * 100)}
                  onChange={(e) => updateWallpaper({ overlayOpacity: parseInt(e.target.value) / 100 })}
                  className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-sky-400"
                />
              </div>
            </div>
          </div>
        )}

        {activeTab === 'appearance' && (
          <div className="space-y-5">
            {/* Dock Position */}
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-2">
                {t.settings.quickDockPos}
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { key: 'bottom', label: 'Bottom' },
                  { key: 'top', label: 'Top' },
                  { key: 'hidden', label: 'Hidden' },
                ].map((pos) => (
                  <button
                    key={pos.key}
                    type="button"
                    onClick={() => updateAppearance({ dockPosition: pos.key as any })}
                    className={`py-2 px-3 rounded-xl text-xs font-medium border capitalize transition-all ${
                      appearance.dockPosition === pos.key
                        ? 'bg-sky-500/20 border-sky-400 text-sky-200'
                        : 'bg-slate-800/40 border-white/10 text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    {pos.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Corner Radius */}
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-2">
                {t.settings.widgetCornerRounding}
              </label>
              <div className="grid grid-cols-4 gap-2">
                {[
                  { key: 'none', label: 'Sharp' },
                  { key: 'md', label: 'Medium' },
                  { key: '2xl', label: 'Rounded' },
                  { key: 'full', label: 'Ultra' },
                ].map((rad) => (
                  <button
                    key={rad.key}
                    type="button"
                    onClick={() => updateAppearance({ borderRadius: rad.key as any })}
                    className={`py-2 px-3 rounded-xl text-xs font-medium border transition-all ${
                      appearance.borderRadius === rad.key
                        ? 'bg-sky-500/20 border-sky-400 text-sky-200'
                        : 'bg-slate-800/40 border-white/10 text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    {rad.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Glassmorphism Blur Slider */}
            <div>
              <div className="flex justify-between text-xs text-slate-300 mb-1">
                <span>{t.settings.glassBlur}</span>
                <span className="font-mono text-slate-400">{appearance.glassBlur}px</span>
              </div>
              <input
                type="range"
                min="0"
                max="32"
                value={appearance.glassBlur}
                onChange={(e) => updateAppearance({ glassBlur: parseInt(e.target.value) || 0 })}
                className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-sky-400"
              />
            </div>
          </div>
        )}

        {activeTab === 'language' && (
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-3">
                {t.settings.languageSelect}
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {languageOptions.map((opt) => (
                  <button
                    key={opt.code}
                    type="button"
                    onClick={() => updateAppearance({ language: opt.code })}
                    className={`flex items-center justify-between p-3 rounded-xl border text-left transition-all ${
                      (appearance.language || 'auto') === opt.code
                        ? 'bg-sky-500/20 border-sky-400 text-sky-200 shadow-md shadow-sky-500/10'
                        : 'bg-slate-800/40 border-white/10 text-slate-300 hover:bg-slate-800/80 hover:border-white/20'
                    }`}
                  >
                    <div>
                      <div className="text-xs font-semibold text-white">{opt.nativeName}</div>
                      <div className="text-[10px] text-slate-400">{opt.label}</div>
                    </div>
                    {(appearance.language || 'auto') === opt.code && (
                      <span className="text-xs text-sky-400 font-bold">✓</span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'backup' && (
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-white/[0.03] border border-white/10 space-y-2">
              <h4 className="text-xs font-semibold text-white">{t.settings.exportTitle}</h4>
              <p className="text-xs text-slate-400">
                {t.settings.exportDesc}
              </p>
              <Button variant="secondary" size="sm" onClick={handleExport} className="gap-2 mt-2">
                <Download size={14} />
                <span>{t.settings.exportBtn}</span>
              </Button>
            </div>

            <div className="p-4 rounded-xl bg-white/[0.03] border border-white/10 space-y-2">
              <h4 className="text-xs font-semibold text-white">{t.settings.importTitle}</h4>
              <p className="text-xs text-slate-400">
                {t.settings.importDesc}
              </p>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleImportFile}
                accept=".json"
                className="hidden"
              />
              <Button
                variant="secondary"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                className="gap-2 mt-2"
              >
                <Upload size={14} />
                <span>{t.settings.importBtn}</span>
              </Button>
              {importStatus && (
                <p className="text-xs text-sky-400 font-medium mt-1">{importStatus}</p>
              )}
            </div>

            <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 space-y-2">
              <h4 className="text-xs font-semibold text-rose-300">{t.settings.resetTitle}</h4>
              <p className="text-xs text-slate-400">
                {t.settings.resetDesc}
              </p>
              <Button
                variant="danger"
                size="sm"
                onClick={() => {
                  if (confirm(t.settings.resetConfirm)) {
                    resetToDefault();
                  }
                }}
                className="gap-2 mt-2"
              >
                <RotateCcw size={14} />
                <span>{t.settings.resetBtn}</span>
              </Button>
            </div>
          </div>
        )}

        {activeTab === 'dock' && (
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
                    className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-800/40 border border-white/10"
                  >
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
              <h4 className="text-xs font-semibold text-white">{t.settings.dock.addTitle}</h4>

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
          </div>
        )}

        {activeTab === 'keys' && (
          <div className="space-y-5">
            <p className="text-xs text-slate-400">{t.settings.keys.desc}</p>

            <div className="space-y-2">
              {keyboardShortcuts.length === 0 && (
                <p className="text-xs text-slate-500 italic">{t.settings.keys.empty}</p>
              )}
              {keyboardShortcuts.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-800/40 border border-white/10"
                >
                  <span className="font-mono text-[10px] px-2 py-1 rounded-md bg-sky-500/15 text-sky-300 border border-sky-400/20 flex-shrink-0">
                    {item.combo}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-semibold text-white truncate">{item.label}</div>
                    <div className="text-[10px] text-slate-500 truncate">{item.url}</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeKeyboardShortcut(item.id)}
                    title={t.common.delete}
                    className="p-1.5 rounded-md text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              ))}
            </div>

            <div className="p-4 rounded-xl bg-white/[0.03] border border-white/10 space-y-3">
              <h4 className="text-xs font-semibold text-white">{t.settings.keys.addTitle}</h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">{t.settings.keys.labelField}</label>
                  <input
                    type="text"
                    value={newKeyLabel}
                    onChange={(e) => setNewKeyLabel(e.target.value)}
                    placeholder={t.settings.keys.labelPlaceholder}
                    className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900/60 border border-white/10 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-400/50"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">{t.settings.keys.urlField}</label>
                  <input
                    type="text"
                    value={newKeyUrl}
                    onChange={(e) => setNewKeyUrl(e.target.value)}
                    placeholder="example.com"
                    className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900/60 border border-white/10 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-400/50"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] text-slate-400 mb-1">{t.settings.keys.comboField}</label>
                <input
                  type="text"
                  readOnly
                  value={newKeyCombo}
                  onKeyDown={handleRecordCombo}
                  placeholder={t.settings.keys.comboPlaceholder}
                  className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900/60 border border-white/10 text-xs font-mono text-sky-300 placeholder-slate-500 focus:outline-none focus:border-sky-400/50 cursor-text"
                />
                <p className="text-[11px] text-slate-500 mt-1">{t.settings.keys.comboHint}</p>
              </div>

              <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={newKeyNewTab}
                  onChange={(e) => setNewKeyNewTab(e.target.checked)}
                  className="accent-sky-400"
                />
                {t.settings.keys.openInNewTab}
              </label>

              <Button
                variant="primary"
                size="sm"
                onClick={handleAddKeyboardShortcut}
                disabled={!newKeyLabel.trim() || !newKeyUrl.trim() || !newKeyCombo}
                className="gap-2"
              >
                <Plus size={14} />
                <span>{t.settings.keys.addBtn}</span>
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-end pt-4 border-t border-white/10">
        <Button variant="primary" size="sm" onClick={closeSettingsModal}>
          {t.common.done}
        </Button>
      </div>
    </Modal>
  );
};
