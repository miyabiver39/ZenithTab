import React, { useState, useEffect, useRef } from 'react';
import QRCode from 'qrcode';
import { Link2, Phone, Type, Download, Copy, Check } from 'lucide-react';
import { QrCodeWidgetConfig } from '../../../types/widget';
import { useDashboardStore } from '../../../store/useDashboardStore';
import { useTranslation } from '../../../i18n/i18n';
import { cn } from '../../../utils/cn';

interface QrCodeWidgetProps {
  widgetId: string;
  config: QrCodeWidgetConfig;
}

export const QrCodeWidget: React.FC<QrCodeWidgetProps> = ({ widgetId, config }) => {
  const { mode = 'url', value = '' } = config;
  const { updateWidgetConfig } = useDashboardStore();
  const { t } = useTranslation();
  const [input, setInput] = useState(value);
  const [copied, setCopied] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => setInput(value), [value]);

  // What actually gets encoded depends on the selected mode: a bare URL
  // gets a scheme, a phone number becomes a `tel:` link so scanning it
  // offers to dial directly, plain text is encoded as-is.
  const payload = (() => {
    const v = input.trim();
    if (!v) return '';
    if (mode === 'url') return /^[a-z][a-z0-9+.-]*:\/\//i.test(v) ? v : `https://${v}`;
    if (mode === 'phone') return `tel:${v.replace(/[^\d+]/g, '')}`;
    return v;
  })();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    if (!payload) {
      canvas.getContext('2d')?.clearRect(0, 0, canvas.width, canvas.height);
      return;
    }
    QRCode.toCanvas(canvas, payload, {
      width: 220,
      margin: 1,
      color: { dark: '#0f172a', light: '#ffffff' },
    }).catch(() => {
      // Invalid/oversized payload for a QR code — leave the previous canvas as-is.
    });
  }, [payload]);

  const handleInputChange = (val: string) => {
    setInput(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      updateWidgetConfig(widgetId, { value: val });
    }, 400);
  };

  const handleModeChange = (nextMode: QrCodeWidgetConfig['mode']) => {
    updateWidgetConfig(widgetId, { mode: nextMode });
  };

  const handleDownload = () => {
    const canvas = canvasRef.current;
    if (!canvas || !payload) return;
    const link = document.createElement('a');
    link.download = 'qrcode.png';
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  const handleCopy = async () => {
    if (!payload) return;
    try {
      await navigator.clipboard.writeText(payload);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard permission denied — nothing we can recover here.
    }
  };

  const modes: { key: QrCodeWidgetConfig['mode']; label: string; icon: React.ElementType }[] = [
    { key: 'url', label: t.widgets.qrcode.modeUrl, icon: Link2 },
    { key: 'phone', label: t.widgets.qrcode.modePhone, icon: Phone },
    { key: 'text', label: t.widgets.qrcode.modeText, icon: Type },
  ];

  return (
    <div className="w-full h-full flex flex-col gap-2 min-h-0">
      <div className="flex items-center gap-1 flex-shrink-0">
        {modes.map((m) => {
          const Icon = m.icon;
          return (
            <button
              key={m.key}
              type="button"
              onClick={() => handleModeChange(m.key)}
              className={cn(
                'flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-medium transition-colors',
                mode === m.key
                  ? 'bg-sky-500/20 text-sky-200 border border-sky-400/30'
                  : 'bg-white/5 text-slate-400 hover:text-white hover:bg-white/10 border border-transparent'
              )}
            >
              <Icon size={11} />
              {m.label}
            </button>
          );
        })}
      </div>

      <input
        type={mode === 'phone' ? 'tel' : 'text'}
        value={input}
        onChange={(e) => handleInputChange(e.target.value)}
        placeholder={
          mode === 'url'
            ? t.widgets.qrcode.urlPlaceholder
            : mode === 'phone'
              ? t.widgets.qrcode.phonePlaceholder
              : t.widgets.qrcode.textPlaceholder
        }
        className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900/60 border border-white/10 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-400/50 flex-shrink-0"
      />

      <div className="flex-1 min-h-0 flex items-center justify-center">
        {payload ? (
          <canvas ref={canvasRef} className="rounded-lg bg-white p-1.5 max-w-full max-h-full" />
        ) : (
          <p className="text-[11px] text-slate-500 text-center px-4">{t.widgets.qrcode.empty}</p>
        )}
      </div>

      {payload && (
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <button
            type="button"
            onClick={handleDownload}
            className="flex-1 flex items-center justify-center gap-1 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white text-[10px] font-medium transition-colors"
          >
            <Download size={11} />
            {t.widgets.qrcode.download}
          </button>
          <button
            type="button"
            onClick={handleCopy}
            className="flex-1 flex items-center justify-center gap-1 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white text-[10px] font-medium transition-colors"
          >
            {copied ? <Check size={11} className="text-emerald-400" /> : <Copy size={11} />}
            {copied ? t.widgets.qrcode.copied : t.widgets.qrcode.copy}
          </button>
        </div>
      )}
    </div>
  );
};
