import React, { useCallback, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Calculator, Ruler, Binary, Dices, Coins, Shuffle, ListChecks, CalendarDays, Percent, Copy, Check, RefreshCw } from 'lucide-react';
import { useTranslation } from '../../../i18n/i18n';
import { SmartResult, REROLLABLE_KINDS } from '../../../utils/smartInput';
import { cn } from '../../../utils/cn';

interface SmartResultCardProps {
  result: SmartResult;
  /** The search bar the card hangs under. */
  anchorRef: React.RefObject<HTMLElement | null>;
  onReroll: () => void;
}

const ICONS: Record<SmartResult['kind'], React.ElementType> = {
  calc: Calculator,
  percent: Percent,
  unit: Ruler,
  base: Binary,
  dice: Dices,
  coin: Coins,
  random: Shuffle,
  choose: ListChecks,
  days: CalendarDays,
};

/**
 * The inline answer under the search bar. Portaled to <body> like the
 * engine menu, because the widget card clips anything that overflows its
 * one-row height. Click to copy; the random kinds get a "roll again".
 */
export const SmartResultCard: React.FC<SmartResultCardProps> = ({ result, anchorRef, onReroll }) => {
  const { t } = useTranslation();
  const [rect, setRect] = useState<{ top: number; left: number; width: number } | null>(null);
  const [copied, setCopied] = useState(false);

  const updatePosition = useCallback(() => {
    const box = anchorRef.current?.getBoundingClientRect();
    if (box) setRect({ top: box.bottom + 6, left: box.left, width: box.width });
  }, [anchorRef]);

  useEffect(() => {
    updatePosition();
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition, true);
    return () => {
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition, true);
    };
  }, [updatePosition, result]);

  const smart = t.widgets.search.smart;
  const view = describe(result, smart);
  const Icon = ICONS[result.kind];
  const rerollable = REROLLABLE_KINDS.includes(result.kind);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(view.copyText);
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    } catch {
      // Clipboard denied — the value is still on screen.
    }
  };

  if (!rect) return null;

  return createPortal(
    <div
      role="status"
      data-testid="smart-result"
      style={{ position: 'fixed', top: rect.top, left: rect.left, width: rect.width }}
      className="z-[9998] flex items-center gap-3 px-3 py-2 rounded-2xl bg-slate-900/95 border border-white/15 shadow-2xl backdrop-blur-2xl animate-fade-in"
    >
      <span className="w-8 h-8 rounded-xl bg-sky-500/15 text-sky-300 flex items-center justify-center flex-shrink-0">
        <Icon size={16} />
      </span>
      <button type="button" onClick={() => void handleCopy()} title={smart.copy} className="flex-1 min-w-0 text-left group">
        <div className="text-lg font-bold text-white leading-tight truncate tabular-nums">{view.primary}</div>
        {view.secondary && <div className="text-[11px] text-slate-400 truncate">{view.secondary}</div>}
      </button>
      <span className={cn('text-[10px] flex items-center gap-1 flex-shrink-0', copied ? 'text-emerald-400' : 'text-slate-500')}>
        {copied ? <Check size={12} /> : <Copy size={12} />}
        {copied ? smart.copied : smart.copy}
      </span>
      {rerollable && (
        <button
          type="button"
          onClick={onReroll}
          title={smart.reroll}
          className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition-colors flex-shrink-0"
        >
          <RefreshCw size={13} />
        </button>
      )}
    </div>,
    document.body
  );
};

interface SmartLabels {
  heads: string;
  tails: string;
  daysUntil: string;
  daysSince: string;
  daysToday: string;
  rolled: string;
  randomRange: string;
  chosen: string;
}

/** Turns the language-neutral result into the two lines shown on the card. */
export function describe(result: SmartResult, labels: SmartLabels): { primary: string; secondary?: string; copyText: string } {
  switch (result.kind) {
    case 'calc':
      return { primary: result.value, secondary: `${result.expression} =`, copyText: result.value };
    case 'percent':
      return { primary: result.value, secondary: result.expression, copyText: result.value };
    case 'unit':
      return { primary: `${result.value} ${result.unit}`, secondary: result.from, copyText: result.value };
    case 'base':
      return { primary: result.dec, secondary: `${result.hex} · ${result.bin} · ${result.oct}`, copyText: result.dec };
    case 'dice':
      return {
        primary: String(result.total),
        secondary: labels.rolled.replace('{notation}', result.notation).replace('{rolls}', result.rolls.join(' + ')),
        copyText: String(result.total),
      };
    case 'coin': {
      const side = result.side === 'heads' ? labels.heads : labels.tails;
      return { primary: side, copyText: side };
    }
    case 'random':
      return { primary: String(result.value), secondary: labels.randomRange.replace('{min}', String(result.min)).replace('{max}', String(result.max)), copyText: String(result.value) };
    case 'choose':
      return { primary: result.pick, secondary: labels.chosen.replace('{options}', result.options.join(' / ')), copyText: result.pick };
    case 'days': {
      const primary =
        result.days === 0
          ? labels.daysToday
          : result.days > 0
            ? labels.daysUntil.replace('{n}', String(result.days))
            : labels.daysSince.replace('{n}', String(-result.days));
      return { primary, secondary: result.date, copyText: String(result.days) };
    }
  }
}
