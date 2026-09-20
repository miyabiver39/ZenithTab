import React, { useState } from 'react';
import { Check } from 'lucide-react';
import { useTranslation } from '../../../i18n/i18n';
import { SMART_INPUT_EXAMPLES, SmartResult } from '../../../utils/smartInput';
import { cn } from '../../../utils/cn';

interface SmartInputExamplesProps {
  /** Called with the example the user clicked; the default copies it to the clipboard. */
  onPick?: (input: string) => void;
  compact?: boolean;
}

/**
 * The cheat sheet for smart answers: one row per kind with clickable
 * examples. Used in the search widget's settings and in the "?" card under
 * the search bar, so both always show the same, tested examples.
 */
export const SmartInputExamples: React.FC<SmartInputExamplesProps> = ({ onPick, compact = false }) => {
  const { t } = useTranslation();
  const [copied, setCopied] = useState<string | null>(null);
  const labels = t.widgets.search.smart.kinds as Record<SmartResult['kind'], string>;

  const pick = async (input: string) => {
    if (onPick) {
      onPick(input);
      return;
    }
    try {
      await navigator.clipboard.writeText(input);
      setCopied(input);
      setTimeout(() => setCopied(null), 1200);
    } catch {
      // Clipboard denied — the example is still readable.
    }
  };

  return (
    <dl className={cn('grid gap-x-3', compact ? 'grid-cols-[auto_1fr] gap-y-1' : 'grid-cols-[auto_1fr] gap-y-1.5')} data-testid="smart-input-examples">
      {SMART_INPUT_EXAMPLES.map(({ kind, inputs }) => (
        <React.Fragment key={kind}>
          <dt className={cn('text-slate-400 whitespace-nowrap', compact ? 'text-[10px] leading-5' : 'text-[11px] leading-6')}>{labels[kind]}</dt>
          <dd className="flex flex-wrap gap-1 min-w-0">
            {inputs.map((input) => (
              <button
                key={input}
                type="button"
                onClick={() => void pick(input)}
                title={onPick ? undefined : t.widgets.search.smart.copyExample}
                className={cn(
                  'font-mono rounded-md border border-white/10 bg-slate-800/70 text-slate-200 hover:bg-slate-700 hover:text-white transition-colors flex items-center gap-1',
                  compact ? 'text-[10px] px-1.5 py-0.5' : 'text-[11px] px-2 py-0.5'
                )}
              >
                {copied === input && <Check size={10} className="text-emerald-400" />}
                {input}
              </button>
            ))}
          </dd>
        </React.Fragment>
      ))}
    </dl>
  );
};
