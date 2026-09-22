import React from 'react';
import { Sparkles } from 'lucide-react';
import { Button } from '../../common/Button';
import { useDashboardStore } from '../../../store/useDashboardStore';
import { useTranslation, SupportedLanguage } from '../../../i18n/i18n';

/** Interface language picker. */
export const LanguageTab: React.FC = () => {
  const appearance = useDashboardStore((s) => s.appearance);
  const updateAppearance = useDashboardStore((s) => s.updateAppearance);
  const setOnboardingOpen = useDashboardStore((s) => s.setOnboardingOpen);
  const closeSettingsModal = useDashboardStore((s) => s.closeSettingsModal);
  const { t } = useTranslation();

  const languageOptions: Array<{ code: SupportedLanguage; label: string; nativeName: string }> = [
    // Both follow the current UI language, unlike the other rows below —
    // "自動" only makes sense translated, whereas "Japanese"/"日本語" name
    // a specific language and are conventionally shown in their own script
    // regardless of the interface language (as in Chrome's own picker).
    { code: 'auto', label: t.settings.autoLanguageOption, nativeName: t.settings.autoLanguage },
    { code: 'ja', label: 'Japanese', nativeName: '日本語' },
    { code: 'en', label: 'English', nativeName: 'English (US)' },
    { code: 'zh-CN', label: 'Chinese (Simplified)', nativeName: '简体中文' },
    { code: 'es', label: 'Spanish', nativeName: 'Español' },
    { code: 'fr', label: 'French', nativeName: 'Français' },
    { code: 'de', label: 'German', nativeName: 'Deutsch' },
    { code: 'ko', label: 'Korean', nativeName: '한국어' },
  ];

  return (
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

      {/* The first-run wizard, on demand. It replaces the dashboard, so it
          snapshots first and says so. */}
      <div className="p-4 rounded-xl bg-white/[0.03] border border-white/10 space-y-2">
        <h4 className="text-xs font-semibold text-white">{t.setup.again}</h4>
        <p className="text-xs text-slate-400">{t.setup.againDesc}</p>
        <Button
          variant="secondary"
          size="sm"
          onClick={() => {
            closeSettingsModal();
            setOnboardingOpen(true);
          }}
          className="gap-2 mt-2"
        >
          <Sparkles size={14} />
          <span>{t.setup.againBtn}</span>
        </Button>
      </div>
    </div>
  );
};
