import React, { useMemo, useState } from 'react';
import { Check, ChevronLeft, ChevronRight, Sparkles, LayoutDashboard, Briefcase, GraduationCap, Newspaper, Minus } from 'lucide-react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { useDashboardStore } from '../../store/useDashboardStore';
import { useTranslation, type SupportedLanguage } from '../../i18n/i18n';
import { getTranslation, resolveLanguageCode } from '../../i18n/resolve';
import { PAGE_TEMPLATE_IDS, getPageTemplate, type PageTemplateId } from '../../config/templates/pageTemplates';
import { SETUP_INTERESTS, DEFAULT_SETUP_CHOICES } from '../../config/setup/applySetup';
import type { GoogleNewsTopic } from '../../types/widget';
import { cn } from '../../utils/cn';

const LANGUAGES: { code: Exclude<SupportedLanguage, 'auto'>; native: string }[] = [
  { code: 'en', native: 'English' },
  { code: 'ja', native: '日本語' },
  { code: 'zh-CN', native: '简体中文' },
  { code: 'ko', native: '한국어' },
  { code: 'es', native: 'Español' },
  { code: 'fr', native: 'Français' },
  { code: 'de', native: 'Deutsch' },
];

const TEMPLATE_ICONS = {
  'layout-dashboard': LayoutDashboard,
  briefcase: Briefcase,
  'graduation-cap': GraduationCap,
  newspaper: Newspaper,
  minus: Minus,
} as const;

type Step = 0 | 1 | 2;

/**
 * Three-step first-run setup: language → interests → purpose. Every step
 * can be skipped (the defaults reproduce the stock dashboard), and the
 * whole thing can be run again from Settings > Language. Text follows the
 * language picked in step 1 immediately, before anything is saved.
 */
export const OnboardingModal: React.FC = () => {
  const isOpen = useDashboardStore((s) => s.isOnboardingOpen);
  const appearance = useDashboardStore((s) => s.appearance);
  const applySetup = useDashboardStore((s) => s.applySetup);
  const skipSetup = useDashboardStore((s) => s.skipSetup);
  const { activeLanguageCode } = useTranslation();

  // Start from the language in use (the browser's on a fresh install).
  const [language, setLanguage] = useState<Exclude<SupportedLanguage, 'auto'>>(() => {
    const current = resolveLanguageCode(appearance.language) || activeLanguageCode;
    return (LANGUAGES.find((l) => l.code === current)?.code ?? 'en') as Exclude<SupportedLanguage, 'auto'>;
  });
  const [interests, setInterests] = useState<GoogleNewsTopic[]>(DEFAULT_SETUP_CHOICES.interests);
  const [purpose, setPurpose] = useState<PageTemplateId>(DEFAULT_SETUP_CHOICES.purpose);
  const [step, setStep] = useState<Step>(0);
  const [busy, setBusy] = useState(false);

  // The wizard speaks the language being chosen, not the one saved so far.
  const t = useMemo(() => getTranslation(language), [language]);

  const toggleInterest = (topic: GoogleNewsTopic) =>
    setInterests((prev) => (prev.includes(topic) ? prev.filter((x) => x !== topic) : [...prev, topic]));

  const finish = async () => {
    setBusy(true);
    try {
      await applySetup({ interests, purpose }, language);
    } finally {
      setBusy(false);
    }
  };

  const steps = [
    { title: t.setup.stepRegion, desc: t.setup.stepRegionDesc },
    { title: t.setup.stepInterests, desc: t.setup.stepInterestsDesc },
    { title: t.setup.stepPurpose, desc: t.setup.stepPurposeDesc },
  ];

  return (
    <Modal isOpen={isOpen} onClose={() => void skipSetup()} title={t.setup.title} maxWidth="xl">
      <div className="space-y-5">
        <div className="flex items-start gap-3">
          <span className="p-2 rounded-xl bg-sky-500/15 border border-sky-400/20 text-sky-300 flex-shrink-0">
            <Sparkles size={16} />
          </span>
          <div className="flex-1 min-w-0">
            <p className="text-xs text-slate-300 leading-relaxed">{t.setup.subtitle}</p>
            {/* Progress dots */}
            <ol className="flex items-center gap-1.5 mt-2" aria-label={t.setup.progress.replace('{n}', String(step + 1)).replace('{total}', '3')}>
              {steps.map((s, i) => (
                <li
                  key={s.title}
                  aria-current={i === step ? 'step' : undefined}
                  className={cn('h-1.5 rounded-full transition-all', i === step ? 'w-6 bg-sky-400' : i < step ? 'w-3 bg-sky-400/50' : 'w-3 bg-white/15')}
                />
              ))}
            </ol>
          </div>
        </div>

        <section aria-labelledby="setup-step-title">
          <h3 id="setup-step-title" className="text-sm font-semibold text-white">
            {steps[step].title}
          </h3>
          <p className="text-[11px] text-slate-400 mt-0.5 mb-3">{steps[step].desc}</p>

          {step === 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2" role="radiogroup" aria-label={t.setup.stepRegion}>
              {LANGUAGES.map((l) => (
                <button
                  key={l.code}
                  type="button"
                  role="radio"
                  aria-checked={language === l.code}
                  onClick={() => setLanguage(l.code)}
                  className={cn(
                    'px-3 py-2.5 rounded-xl border text-sm font-medium transition-all text-left flex items-center justify-between gap-2',
                    language === l.code ? 'bg-sky-500/20 border-sky-400/60 text-white' : 'bg-white/[0.04] hover:bg-white/[0.08] border-white/10 text-slate-200'
                  )}
                >
                  <span>{l.native}</span>
                  {language === l.code && <Check size={14} className="text-sky-300 flex-shrink-0" />}
                </button>
              ))}
            </div>
          )}

          {step === 1 && (
            <div className="flex flex-wrap gap-2">
              {SETUP_INTERESTS.map((topic) => {
                const on = interests.includes(topic);
                return (
                  <button
                    key={topic}
                    type="button"
                    aria-pressed={on}
                    onClick={() => toggleInterest(topic)}
                    className={cn(
                      'px-3 py-2 rounded-xl border text-xs font-medium transition-all',
                      on ? 'bg-sky-500/20 border-sky-400/60 text-white' : 'bg-white/[0.04] hover:bg-white/[0.08] border-white/10 text-slate-200'
                    )}
                  >
                    <span>{t.widgets.rss.topics[topic]}</span>
                  </button>
                );
              })}
            </div>
          )}

          {step === 2 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2" role="radiogroup" aria-label={t.setup.stepPurpose}>
              {PAGE_TEMPLATE_IDS.map((id) => {
                const Icon = TEMPLATE_ICONS[getPageTemplate(id).icon];
                const on = purpose === id;
                return (
                  <button
                    key={id}
                    type="button"
                    role="radio"
                    aria-checked={on}
                    onClick={() => setPurpose(id)}
                    className={cn(
                      'p-3 rounded-xl border text-left transition-all flex items-start gap-2.5',
                      on ? 'bg-sky-500/20 border-sky-400/60' : 'bg-white/[0.04] hover:bg-white/[0.08] border-white/10'
                    )}
                  >
                    <span className={cn('p-1.5 rounded-lg border flex-shrink-0', on ? 'bg-sky-500/20 border-sky-400/40 text-sky-200' : 'bg-white/5 border-white/10 text-slate-300')}>
                      <Icon size={15} />
                    </span>
                    <span className="min-w-0">
                      <span className="block text-xs font-semibold text-white">{t.templates.items[id].name}</span>
                      <span className="block text-[11px] text-slate-400 leading-snug mt-0.5">{t.templates.items[id].desc}</span>
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </section>

        <div className="flex items-center justify-between gap-2 pt-3 border-t border-white/10">
          <Button type="button" variant="ghost" size="sm" onClick={() => void skipSetup()} disabled={busy}>
            {t.setup.skip}
          </Button>
          <div className="flex items-center gap-2">
            {step > 0 && (
              <Button type="button" variant="secondary" size="sm" onClick={() => setStep((step - 1) as Step)} disabled={busy} className="gap-1">
                <ChevronLeft size={14} />
                <span>{t.setup.back}</span>
              </Button>
            )}
            {step < 2 ? (
              <Button type="button" variant="primary" size="sm" onClick={() => setStep((step + 1) as Step)} className="gap-1">
                <span>{t.setup.next}</span>
                <ChevronRight size={14} />
              </Button>
            ) : (
              <Button type="button" variant="primary" size="sm" onClick={() => void finish()} disabled={busy} className="gap-1">
                <Check size={14} />
                <span>{t.setup.finish}</span>
              </Button>
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
};
