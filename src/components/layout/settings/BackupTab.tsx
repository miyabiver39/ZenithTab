import React, { useEffect, useRef, useState } from 'react';
import { Download, Upload, RotateCcw, Trash2, Undo2, History, Save } from 'lucide-react';
import { Button } from '../../common/Button';
import { formatDateTime } from '../../../utils/date';
import { useUndoStore } from '../../../store/useUndoStore';
import {
  SNAPSHOT_RETENTION,
  MAX_SNAPSHOT_TOTAL_BYTES,
  type SnapshotReason,
} from '../../../services/snapshotService';
import { useDashboardStore } from '../../../store/useDashboardStore';
import { useTranslation } from '../../../i18n/i18n';
import type { ConfirmApi } from './confirm';
import { ShareSettings } from './ShareSettings';

/** Export / import, automatic and manual backups, and the full reset. */
export const BackupTab: React.FC<ConfirmApi> = ({ requestConfirm, closeConfirm }) => {
  const resetToDefault = useDashboardStore((s) => s.resetToDefault);
  const exportConfig = useDashboardStore((s) => s.exportConfig);
  const importConfig = useDashboardStore((s) => s.importConfig);
  const snapshots = useDashboardStore((s) => s.snapshots);
  const backupSettings = useDashboardStore((s) => s.backupSettings);
  const refreshSnapshots = useDashboardStore((s) => s.refreshSnapshots);
  const takeSnapshot = useDashboardStore((s) => s.takeSnapshot);
  const restoreSnapshot = useDashboardStore((s) => s.restoreSnapshot);
  const deleteSnapshot = useDashboardStore((s) => s.deleteSnapshot);
  const updateBackupSettings = useDashboardStore((s) => s.updateBackupSettings);
  const { t, activeLanguageCode } = useTranslation();
  const [importStatus, setImportStatus] = useState<string | null>(null);
  const [backupStatus, setBackupStatus] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Snapshots are only read when someone actually looks at them (this tab
  // is mounted only while selected).
  useEffect(() => {
    void refreshSnapshots();
  }, [refreshSnapshots]);

  const flashBackupStatus = (text: string) => {
    setBackupStatus(text);
    setTimeout(() => setBackupStatus(null), 3000);
  };

  const reasonLabel = (reason: SnapshotReason) =>
    ({
      auto: t.backup.reason.auto,
      manual: t.backup.reason.manual,
      'before-reset': t.backup.reason.beforeReset,
      'before-import': t.backup.reason.beforeImport,
      'before-restore': t.backup.reason.beforeRestore,
      'before-migration': t.backup.reason.beforeMigration,
    })[reason];

  const formatBytes = (bytes: number) =>
    bytes >= 1024 * 1024 ? `${(bytes / (1024 * 1024)).toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`;

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
    reader.onload = (event) => {
      const content = event.target?.result as string;
      // Importing replaces the whole dashboard; ask before applying.
      requestConfirm({
        title: t.confirm.importTitle,
        body: t.confirm.importBody,
        confirmLabel: t.settings.importBtn,
        onConfirm: async () => {
          closeConfirm();
          const success = await importConfig(content);
          if (success) {
            setImportStatus(t.settings.importSuccess);
            setTimeout(() => setImportStatus(null), 3000);
          } else {
            setImportStatus(t.settings.importFail);
          }
        },
      });
    };
    reader.readAsText(file);
    // Let the same file be picked again after a cancel.
    e.target.value = '';
  };

  return (
    <div className="space-y-4">
      <div className="p-4 rounded-xl bg-white/[0.03] border border-white/10 space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h4 className="text-xs font-semibold text-white">{t.backup.title}</h4>
            <p className="text-xs text-slate-400 mt-1">{t.backup.desc}</p>
          </div>
          <label className="flex items-center gap-2 text-[11px] text-slate-300 whitespace-nowrap cursor-pointer flex-shrink-0">
            <input
              type="checkbox"
              checked={backupSettings.autoSnapshot}
              onChange={(e) => updateBackupSettings({ autoSnapshot: e.target.checked })}
              aria-label={t.backup.autoEnable}
              className="w-4 h-4 rounded text-sky-500 bg-slate-800 border-white/20"
            />
            <span>{t.backup.autoEnable}</span>
          </label>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="secondary"
            size="sm"
            onClick={async () => {
              const taken = await takeSnapshot();
              flashBackupStatus(taken ? t.backup.taken : t.backup.nothingToBackUp);
            }}
            className="gap-2"
          >
            <Save size={14} />
            <span>{t.backup.takeNow}</span>
          </Button>
          {backupStatus && <p className="text-xs text-sky-400 font-medium">{backupStatus}</p>}
        </div>

        {snapshots === null ? (
          <p className="text-xs text-slate-500 italic">{t.backup.loading}</p>
        ) : snapshots.length === 0 ? (
          <p className="text-xs text-slate-500 italic">{t.backup.empty}</p>
        ) : (
          // The list scrolls on its own so the export / import / reset
          // sections below stay within reach however many backups there are.
          <ul className="space-y-2 max-h-72 overflow-y-auto custom-scrollbar pr-1" aria-label={t.backup.title}>
            {snapshots.map((snap) => {
              const date = formatDateTime(new Date(snap.takenAt), activeLanguageCode);
              return (
                <li
                  key={snap.id}
                  className="flex items-center gap-3 p-2.5 rounded-xl bg-slate-800/40 border border-white/10"
                >
                  <span className="p-1.5 rounded-lg bg-white/5 text-slate-300 flex-shrink-0">
                    <History size={14} />
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-semibold text-white truncate">
                      {date}
                      <span className="ml-2 px-1.5 py-0.5 rounded-md bg-white/10 text-[10px] font-medium text-slate-300">
                        {reasonLabel(snap.reason)}
                      </span>
                    </div>
                    <div className="text-[10px] text-slate-500 truncate">
                      {t.backup.summary
                        .replace('{pages}', String(snap.summary.pages))
                        .replace('{widgets}', String(snap.summary.widgets))
                        .replace('{size}', formatBytes(snap.summary.bytes))}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      requestConfirm({
                        title: t.backup.restoreConfirmTitle,
                        body: t.backup.restoreConfirmBody.replace('{date}', date),
                        confirmLabel: t.backup.restore,
                        onConfirm: async () => {
                          closeConfirm();
                          const ok = await restoreSnapshot(snap.id);
                          if (ok) {
                            useUndoStore.getState().notify(t.backup.restored.replace('{date}', date));
                          } else {
                            flashBackupStatus(t.backup.restoreFailed);
                          }
                        },
                      })
                    }
                    title={t.backup.restore}
                    aria-label={t.backup.restore + ': ' + date}
                    className="p-1.5 rounded-md text-slate-400 hover:text-sky-300 hover:bg-sky-500/10 transition-colors"
                  >
                    <Undo2 size={14} />
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      requestConfirm({
                        title: t.backup.deleteConfirmTitle,
                        body: t.backup.deleteConfirmBody.replace('{date}', date),
                        confirmLabel: t.backup.delete,
                        danger: true,
                        onConfirm: () => {
                          closeConfirm();
                          void deleteSnapshot(snap.id);
                        },
                      })
                    }
                    title={t.backup.delete}
                    aria-label={t.backup.delete + ': ' + date}
                    className="p-1.5 rounded-md text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                  >
                    <Trash2 size={14} />
                  </button>
                </li>
              );
            })}
          </ul>
        )}
        <p className="text-[11px] text-slate-500">
          {t.backup.retention
            .replace('{auto}', String(SNAPSHOT_RETENTION.auto))
            .replace('{manual}', String(SNAPSHOT_RETENTION.manual))
            .replace('{other}', String(SNAPSHOT_RETENTION['before-reset']))
            .replace('{size}', formatBytes(MAX_SNAPSHOT_TOTAL_BYTES))}
        </p>
      </div>

      <ShareSettings />

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
          aria-label={t.settings.importBtn}
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
          onClick={() =>
            requestConfirm({
              title: t.confirm.resetTitle,
              body: t.confirm.resetBody,
              confirmLabel: t.settings.resetBtn,
              danger: true,
              onConfirm: () => {
                closeConfirm();
                resetToDefault();
              },
            })
          }
          className="gap-2 mt-2"
        >
          <RotateCcw size={14} />
          <span>{t.settings.resetBtn}</span>
        </Button>
      </div>
    </div>
  );
};
