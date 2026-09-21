import React, { useEffect, useRef, useState } from 'react';
import QRCode from 'qrcode';
import { Share2, Copy, Check, Download, QrCode, Cloud, AlertTriangle } from 'lucide-react';
import { Button } from '../../common/Button';
import { Modal } from '../../common/Modal';
import { useDashboardStore } from '../../../store/useDashboardStore';
import { useUndoStore } from '../../../store/useUndoStore';
import { useTranslation } from '../../../i18n/i18n';
import {
  buildSharePayload,
  encodeShareCode,
  decodeShareCode,
  pageFromPayload,
  QR_MAX_LENGTH,
  type SharePayload,
} from '../../../services/shareService';
import { syncService, type SyncedKey } from '../../../services/syncService';

/**
 * Settings > Backup: "share this layout" (a pasteable code / QR for the
 * current page, personal content removed) and the opt-in settings sync
 * through the Chrome account.
 */
export const ShareSettings: React.FC = () => {
  const { t } = useTranslation();
  const pages = useDashboardStore((s) => s.pages);
  const activePageId = useDashboardStore((s) => s.activePageId);
  const widgets = useDashboardStore((s) => s.widgets);
  const layouts = useDashboardStore((s) => s.layouts);
  const dockItems = useDashboardStore((s) => s.dockItems);
  const addPage = useDashboardStore((s) => s.addPage);
  const replaceDockItems = useDashboardStore((s) => s.replaceDockItems);
  const closeSettingsModal = useDashboardStore((s) => s.closeSettingsModal);

  const [includeDock, setIncludeDock] = useState(false);
  const [code, setCode] = useState<string | null>(null);

  const [pasted, setPasted] = useState('');
  const [preview, setPreview] = useState<{ payload: SharePayload } | { error: true } | null>(null);
  const [replaceDock, setReplaceDock] = useState(false);

  // Decode as the user pastes, so the button can say what it will add.
  useEffect(() => {
    const text = pasted.trim();
    if (!text) {
      setPreview(null);
      return;
    }
    let cancelled = false;
    decodeShareCode(text)
      .then((payload) => !cancelled && setPreview({ payload }))
      .catch(() => !cancelled && setPreview({ error: true }));
    return () => {
      cancelled = true;
    };
  }, [pasted]);

  const createCode = async () => {
    // A page the user never named travels unnamed, so the recipient gets
    // their own "Page N" instead of ours.
    const pageName = pages.find((p) => p.id === activePageId)?.name || '';
    const payload = buildSharePayload({ pageName, widgets, layouts, dockItems }, { includeDock });
    setCode(await encodeShareCode(payload));
  };

  const importCode = () => {
    if (!preview || !('payload' in preview)) return;
    const { payload } = preview;
    addPage({ name: payload.page.name, template: pageFromPayload(payload) });
    if (replaceDock && payload.dock) replaceDockItems(payload.dock);
    useUndoStore.getState().notify(t.share.imported.replace('{n}', String(payload.page.widgets.length)));
    setPasted('');
    closeSettingsModal();
  };

  return (
    <>
      <div className="p-4 rounded-xl bg-white/[0.03] border border-white/10 space-y-3">
        <div>
          <h4 className="text-xs font-semibold text-white">{t.share.title}</h4>
          <p className="text-xs text-slate-400 mt-1">{t.share.desc}</p>
        </div>
        <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer select-none">
          <input type="checkbox" checked={includeDock} onChange={(e) => setIncludeDock(e.target.checked)} className="accent-sky-400" />
          {t.share.includeDock}
        </label>
        <Button variant="secondary" size="sm" onClick={() => void createCode()} className="gap-2">
          <Share2 size={14} />
          <span>{t.share.create}</span>
        </Button>

        <div className="pt-3 border-t border-white/10 space-y-2">
          <label className="block text-xs font-medium text-slate-300" htmlFor="share-code-input">
            {t.share.importTitle}
          </label>
          <textarea
            id="share-code-input"
            value={pasted}
            onChange={(e) => setPasted(e.target.value)}
            placeholder="zt1.…"
            rows={2}
            spellCheck={false}
            className="w-full px-3 py-2 rounded-xl bg-slate-900/60 border border-white/10 text-xs font-mono text-white placeholder-slate-500 focus:outline-none focus:border-sky-400/50 resize-y"
          />
          {preview && 'error' in preview && <p className="text-xs text-rose-400">{t.share.invalid}</p>}
          {preview && 'payload' in preview && (
            <div className="space-y-2">
              <p className="text-xs text-slate-300" data-testid="share-preview">
                {t.share.preview
                  .replace('{name}', preview.payload.page.name || t.pages.defaultName.replace('{n}', String(pages.length + 1)))
                  .replace('{widgets}', String(preview.payload.page.widgets.length))}
                {preview.payload.dock ? ` · ${t.share.previewDock.replace('{n}', String(preview.payload.dock.length))}` : ''}
              </p>
              {preview.payload.dock && (
                <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer select-none">
                  <input type="checkbox" checked={replaceDock} onChange={(e) => setReplaceDock(e.target.checked)} className="accent-sky-400" />
                  {t.share.replaceDock}
                </label>
              )}
              <Button variant="primary" size="sm" onClick={importCode} className="gap-2">
                <Download size={14} />
                <span>{t.share.addAsPage}</span>
              </Button>
            </div>
          )}
        </div>
      </div>

      <SyncSettings />

      {code !== null && <ShareCodeModal code={code} onClose={() => setCode(null)} />}
    </>
  );
};

const ShareCodeModal: React.FC<{ code: string; onClose: () => void }> = ({ code, onClose }) => {
  const { t } = useTranslation();
  const [copied, setCopied] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fitsQr = code.length <= QR_MAX_LENGTH;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !fitsQr) return;
    QRCode.toCanvas(canvas, code, { width: 240, margin: 1, errorCorrectionLevel: 'L', color: { dark: '#0f172a', light: '#ffffff' } })
      .then(() => {
        canvas.style.width = '';
        canvas.style.height = '';
      })
      .catch((err: unknown) => console.warn('[ZenithTab] QR render failed:', err));
  }, [code, fitsQr]);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard denied — the code is still selectable below.
    }
  };

  return (
    <Modal isOpen onClose={onClose} title={t.share.codeTitle} maxWidth="md">
      <div className="space-y-3">
        <p className="text-xs text-slate-400">{t.share.codeDesc}</p>
        <textarea
          readOnly
          value={code}
          rows={4}
          aria-label={t.share.codeTitle}
          onFocus={(e) => e.currentTarget.select()}
          className="w-full px-3 py-2 rounded-xl bg-slate-900/60 border border-white/10 text-[11px] font-mono text-slate-200 break-all resize-none focus:outline-none focus:border-sky-400/50"
        />
        <div className="flex items-center justify-between gap-3">
          <span className="text-[11px] text-slate-500">{t.share.codeSize.replace('{n}', String(code.length))}</span>
          <Button variant="primary" size="sm" onClick={() => void copy()} className="gap-2">
            {copied ? <Check size={14} /> : <Copy size={14} />}
            <span>{copied ? t.share.copied : t.share.copy}</span>
          </Button>
        </div>
        {fitsQr ? (
          <div className="flex flex-col items-center gap-2 pt-2">
            <div className="p-2 rounded-xl bg-white">
              <canvas ref={canvasRef} data-testid="share-qr" className="w-[240px] h-[240px] max-w-full" />
            </div>
            <p className="text-[11px] text-slate-500 flex items-center gap-1">
              <QrCode size={12} />
              {t.share.qrHint}
            </p>
          </div>
        ) : (
          <p className="text-[11px] text-slate-500">{t.share.qrTooLong}</p>
        )}
      </div>
    </Modal>
  );
};

const SYNC_KEY_LABEL: Record<SyncedKey, (t: ReturnType<typeof useTranslation>['t']) => string> = {
  appearance: (t) => t.settings.tabs.appearance,
  dockItems: (t) => t.settings.tabs.dock,
  keyboardShortcuts: (t) => t.settings.tabs.keyboardShortcuts,
};

const SyncSettings: React.FC = () => {
  const { t } = useTranslation();
  const backupSettings = useDashboardStore((s) => s.backupSettings);
  const updateBackupSettings = useDashboardStore((s) => s.updateBackupSettings);
  const syncSkipped = useDashboardStore((s) => s.syncSkipped);
  const available = syncService.isAvailable();
  const enabled = !!backupSettings.syncSettings;

  const toggle = async (on: boolean) => {
    await updateBackupSettings({ syncSettings: on });
    // Turning it off also clears what this account had stored.
    if (!on) await syncService.clear();
  };

  return (
    <div className="p-4 rounded-xl bg-white/[0.03] border border-white/10 space-y-2">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h4 className="text-xs font-semibold text-white flex items-center gap-1.5">
            <Cloud size={13} className="text-sky-300" />
            {t.sync.title}
          </h4>
          <p className="text-xs text-slate-400 mt-1">{t.sync.desc}</p>
        </div>
        <label className="flex items-center gap-2 text-[11px] text-slate-300 whitespace-nowrap cursor-pointer flex-shrink-0">
          <input
            type="checkbox"
            checked={enabled}
            disabled={!available}
            onChange={(e) => void toggle(e.target.checked)}
            aria-label={t.sync.enable}
            className="w-4 h-4 rounded text-sky-500 bg-slate-800 border-white/20 disabled:opacity-40"
          />
          <span>{t.sync.enable}</span>
        </label>
      </div>
      {!available && <p className="text-[11px] text-slate-500">{t.sync.unavailable}</p>}
      {enabled && syncSkipped.length > 0 && (
        <p className="text-[11px] text-amber-300/90 flex items-start gap-1.5" role="alert">
          <AlertTriangle size={12} className="flex-shrink-0 mt-0.5" />
          <span>{t.sync.skipped.replace('{items}', syncSkipped.map((k) => SYNC_KEY_LABEL[k](t)).join(', '))}</span>
        </p>
      )}
    </div>
  );
};
