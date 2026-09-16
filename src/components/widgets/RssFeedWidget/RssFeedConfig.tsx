import React from 'react';
import { Input } from '../../common/Input';
import { useTranslation } from '../../../i18n/i18n';
import { rssService, GOOGLE_NEWS_TOPICS } from '../../../services/rssService';
import { requestHostPermission } from '../../../utils/permissions';
import { GoogleNewsMode, GoogleNewsTopic } from '../../../types/widget';
import type { ConfigFormProps } from '../configForm';

/**
 * Save-time normalisation that used to live in WidgetConfigModal: derive
 * the Google News mode/URL for the current language, and — for a custom
 * feed — ask for its origin while the submit gesture is still in scope
 * (Chrome refuses to show the prompt from anywhere else).
 */
export function prepareRssConfigForSave(config: Record<string, any>, activeLanguageCode: string): Record<string, any> {
  const next = { ...config };
  if (next.isGoogleNews) {
    next.searchQuery = (next.searchQuery || '').trim();
    next.googleNewsMode = rssService.resolveGoogleNewsMode(next);
    next.feedUrl = rssService.buildGoogleNewsUrlForConfig(next, activeLanguageCode);
  } else if (next.feedUrl) {
    void requestHostPermission(next.feedUrl);
  }
  return next;
}

/** Google News mode / topic / keyword, custom feed URL, item count, display toggles. */
export const RssFeedConfig: React.FC<ConfigFormProps> = ({ config, setConfig }) => {
  const { t } = useTranslation();
  // What the user picked in this dialog, before the save-time
  // normalisation (an empty keyword only becomes 'headlines' on save,
  // so choosing 'Keyword search' doesn't snap straight back).
  const uiNewsMode: GoogleNewsMode = config.googleNewsMode || rssService.resolveGoogleNewsMode(config);
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between py-1">
        <div>
          <div className="text-xs font-medium text-slate-200">{t.widgets.rss.googleNewsFeed}</div>
          <div className="text-[11px] text-slate-400">{t.widgets.rss.googleNewsSub}</div>
        </div>
        <input
          type="checkbox"
          checked={!!config.isGoogleNews}
          onChange={(e) => setConfig({ ...config, isGoogleNews: e.target.checked })}
          className="w-4 h-4 rounded text-sky-500 bg-slate-800 border-white/20"
        />
      </div>

      {config.isGoogleNews ? (
        <div className="space-y-3">
          {/* Three ways to use Google News: the front page (needs no
              input at all), a topic section, or a free keyword. */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">{t.widgets.rss.mode}</label>
            <div className="grid grid-cols-3 gap-2">
              {(
                [
                  { key: 'headlines', label: t.widgets.rss.modeHeadlines },
                  { key: 'topic', label: t.widgets.rss.modeTopic },
                  { key: 'search', label: t.widgets.rss.modeSearch },
                ] as { key: GoogleNewsMode; label: string }[]
              ).map((m) => (
                <button
                  key={m.key}
                  type="button"
                  onClick={() =>
                    setConfig({
                      ...config,
                      googleNewsMode: m.key,
                      googleNewsTopic: m.key === 'topic' ? config.googleNewsTopic || 'TECHNOLOGY' : config.googleNewsTopic,
                    })
                  }
                  className={`py-2 px-2 rounded-lg text-xs font-medium border truncate transition-all ${
                    uiNewsMode === m.key
                      ? 'bg-sky-500/20 border-sky-400 text-sky-200 shadow'
                      : 'bg-slate-800/50 border-white/10 text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </div>

          {uiNewsMode === 'topic' && (
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">{t.widgets.rss.topicLabel}</label>
              <select
                value={config.googleNewsTopic || 'TECHNOLOGY'}
                onChange={(e) => setConfig({ ...config, googleNewsTopic: e.target.value as GoogleNewsTopic })}
                className="w-full px-3 py-2 rounded-xl bg-slate-800/50 border border-white/10 text-sm text-white focus:outline-none focus:ring-2 focus:ring-sky-400/50"
              >
                {GOOGLE_NEWS_TOPICS.map((topic) => (
                  <option key={topic} value={topic} className="bg-slate-900">
                    {t.widgets.rss.topics[topic]}
                  </option>
                ))}
              </select>
            </div>
          )}

          {uiNewsMode === 'search' && (
            <div className="space-y-1.5">
              <Input
                label={t.widgets.rss.searchPlaceholder}
                value={config.searchQuery || ''}
                onChange={(e) => setConfig({ ...config, searchQuery: e.target.value })}
                placeholder="e.g. artificial intelligence, technology, web dev"
              />
              <p className="text-[11px] text-slate-400 leading-relaxed">{t.widgets.rss.searchHint}</p>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-1.5">
          <Input
            label={t.widgets.rss.customUrl}
            value={config.feedUrl || ''}
            onChange={(e) => setConfig({ ...config, feedUrl: e.target.value })}
            placeholder="https://example.com/feed.xml"
          />
          <p className="text-[11px] text-slate-400 leading-relaxed">{t.widgets.rss.permissionHint}</p>
        </div>
      )}

      <Input
        label={t.widgets.rss.maxItems}
        type="number"
        min="3"
        max="25"
        value={config.maxItems || 8}
        onChange={(e) => setConfig({ ...config, maxItems: parseInt(e.target.value) || 8 })}
      />

      <div className="flex items-center justify-between py-1">
        <span className="text-xs text-slate-300">{t.widgets.rss.showThumbnails}</span>
        <input
          type="checkbox"
          checked={!!config.showThumbnail}
          onChange={(e) => setConfig({ ...config, showThumbnail: e.target.checked })}
          className="w-4 h-4 rounded text-sky-500 bg-slate-800 border-white/20"
        />
      </div>

      <div className="flex items-center justify-between py-1">
        <span className="text-xs text-slate-300">{t.widgets.rss.showSnippet}</span>
        <input
          type="checkbox"
          checked={!!config.showDescription}
          onChange={(e) => setConfig({ ...config, showDescription: e.target.checked })}
          className="w-4 h-4 rounded text-sky-500 bg-slate-800 border-white/20"
        />
      </div>
    </div>
  );
};
