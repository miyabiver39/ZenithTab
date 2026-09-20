import React, { useState, useEffect } from 'react';
import { Image, Palette, Download, Languages, Dock as DockIcon, Trash2, Keyboard } from 'lucide-react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { ConfirmDialog } from '../common/ConfirmDialog';
import { useDashboardStore } from '../../store/useDashboardStore';
import { useTranslation } from '../../i18n/i18n';
import { WallpaperTab } from './settings/WallpaperTab';
import { AppearanceTab } from './settings/AppearanceTab';
import { LanguageTab } from './settings/LanguageTab';
import { BackupTab } from './settings/BackupTab';
import { TrashTab } from './settings/TrashTab';
import { DockTab } from './settings/DockTab';
import { KeyboardShortcutsTab } from './settings/KeyboardShortcutsTab';
import type { ConfirmRequest } from './settings/confirm';

type SettingsTab = 'wallpaper' | 'appearance' | 'language' | 'backup' | 'dock' | 'keys' | 'trash';

/**
 * The settings dialog: the tab strip, the shared confirm dialog and the
 * footer. Each tab's UI, state and handlers live in ./settings/<Tab>.tsx.
 */
export const SettingsPanel: React.FC = () => {
  const activeSettingsModal = useDashboardStore((s) => s.activeSettingsModal);
  const editingWidgetId = useDashboardStore((s) => s.editingWidgetId);
  const closeSettingsModal = useDashboardStore((s) => s.closeSettingsModal);
  const trash = useDashboardStore((s) => s.trash);
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<SettingsTab>('wallpaper');
  // One dialog for every "are you sure": whoever needs it fills this in.
  const [confirmState, setConfirmState] = useState<ConfirmRequest | null>(null);
  const closeConfirm = () => setConfirmState(null);

  const isOpen = activeSettingsModal === 'settings';

  // The Dock's own gear icon opens straight to this tab (signaled via
  // editingWidgetId, since this modal has no dedicated "open on tab X" field).
  useEffect(() => {
    if (isOpen && editingWidgetId === 'dock') {
      setActiveTab('dock');
    }
  }, [isOpen, editingWidgetId]);

  return (
    <Modal isOpen={isOpen} onClose={closeSettingsModal} title={t.settings.modalTitle} maxWidth="2xl">
      {/* Navigation Tabs — ordered by how often a user typically revisits
          each one: visual/interactive tabs first, one-time setup (language)
          near the end, backup/reset last since it's touched least. */}
      <div className="flex items-center gap-1 pb-4 border-b border-white/10 select-none overflow-x-auto custom-scrollbar">
        {(
          [
            { key: 'wallpaper', icon: Image, label: t.settings.tabs.wallpaper },
            { key: 'appearance', icon: Palette, label: t.settings.tabs.appearance },
            { key: 'dock', icon: DockIcon, label: t.settings.tabs.dock },
            { key: 'keys', icon: Keyboard, label: t.settings.tabs.keyboardShortcuts },
            { key: 'language', icon: Languages, label: t.settings.tabs.language },
            { key: 'backup', icon: Download, label: t.settings.tabs.backup },
            { key: 'trash', icon: Trash2, label: t.settings.tabs.trash },
          ] as const
        ).map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium whitespace-nowrap transition-all ${
                activeTab === tab.key
                  ? 'bg-sky-500/20 text-sky-300 border border-sky-400/30'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Icon size={15} />
              <span>{tab.label}</span>
              {tab.key === 'trash' && trash.length > 0 && (
                <span className="px-1.5 py-0.5 rounded-full bg-white/10 text-[10px] leading-none">{trash.length}</span>
              )}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      <div className="py-4 space-y-6">
        {activeTab === 'wallpaper' && <WallpaperTab />}
        {activeTab === 'appearance' && <AppearanceTab />}
        {activeTab === 'language' && <LanguageTab />}
        {activeTab === 'backup' && <BackupTab requestConfirm={setConfirmState} closeConfirm={closeConfirm} />}
        {activeTab === 'trash' && <TrashTab requestConfirm={setConfirmState} closeConfirm={closeConfirm} />}
        {activeTab === 'dock' && <DockTab />}
        {activeTab === 'keys' && <KeyboardShortcutsTab />}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-end pt-4 border-t border-white/10">
        <Button variant="primary" size="sm" onClick={closeSettingsModal}>
          {t.common.done}
        </Button>
      </div>

      <ConfirmDialog
        isOpen={confirmState !== null}
        title={confirmState?.title || ''}
        body={confirmState?.body || ''}
        confirmLabel={confirmState?.confirmLabel}
        danger={confirmState?.danger}
        onConfirm={() => confirmState?.onConfirm()}
        onCancel={closeConfirm}
      />
    </Modal>
  );
};
