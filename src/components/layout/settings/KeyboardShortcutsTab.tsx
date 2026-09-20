import React, { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { Button } from '../../common/Button';
import { useDashboardStore } from '../../../store/useDashboardStore';
import { useTranslation } from '../../../i18n/i18n';
import { getComboFromEvent, BUILT_IN_SHORTCUTS, comboToKeyLabels, displayCombos, isMacPlatform } from '../../../utils/keyboardShortcuts';

/** Built-in shortcut reference plus the user's own URL key bindings. */
export const KeyboardShortcutsTab: React.FC = () => {
  const keyboardShortcuts = useDashboardStore((s) => s.keyboardShortcuts);
  const addKeyboardShortcut = useDashboardStore((s) => s.addKeyboardShortcut);
  const removeKeyboardShortcut = useDashboardStore((s) => s.removeKeyboardShortcut);
  const { t } = useTranslation();
  // Resolved once: the key-cap labels differ on macOS (⌘ / ⌥).
  const [isMac] = useState(() => isMacPlatform());

  const [newKeyLabel, setNewKeyLabel] = useState('');
  const [newKeyUrl, setNewKeyUrl] = useState('');
  const [newKeyCombo, setNewKeyCombo] = useState('');
  const [newKeyNewTab, setNewKeyNewTab] = useState(true);

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


  return (
    <div className="space-y-5">
      {/* Read-only reference for the shortcuts that ship with ZenithTab;
          the "/" and Ctrl+Alt+arrow combos were otherwise undiscoverable. */}
      <section data-testid="builtin-shortcuts" className="p-4 rounded-xl bg-white/[0.03] border border-white/10 space-y-3">
        <div>
          <h4 className="text-xs font-semibold text-white">{t.settings.keys.builtInTitle}</h4>
          <p className="text-[11px] text-slate-400 mt-0.5">{t.settings.keys.builtInDesc}</p>
        </div>
        <ul className="space-y-1.5">
          {BUILT_IN_SHORTCUTS.map((shortcut) => (
            <li key={shortcut.id} className="flex items-center gap-3">
              <div className="flex items-center gap-1 flex-shrink-0 min-w-[9rem]">
                {displayCombos(shortcut, isMac).map((combo, index) => (
                  <React.Fragment key={combo}>
                    {index > 0 && <span className="text-[10px] text-slate-500 px-0.5">/</span>}
                    <span className="flex items-center gap-0.5">
                      {comboToKeyLabels(combo, isMac).map((label, i) => (
                        <kbd
                          key={`${combo}-${i}`}
                          className="font-mono text-[10px] leading-none px-1.5 py-1 rounded-md bg-slate-800/80 text-slate-200 border border-white/10 border-b-2 shadow-sm"
                        >
                          {label}
                        </kbd>
                      ))}
                    </span>
                  </React.Fragment>
                ))}
              </div>
              <span className="text-xs text-slate-300 min-w-0">{t.settings.keys.builtIn[shortcut.id]}</span>
            </li>
          ))}
        </ul>
      </section>

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
  );
};
