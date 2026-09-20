import React, { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { useTranslation } from '../../../i18n/i18n';
import { calendarService } from '../../../services/calendarService';
import { requestHostPermissions } from '../../../utils/permissions';
import { uniqueId } from '../../../utils/id';
import { CalendarFeed, CalendarDaysAhead } from '../../../types/widget';
import type { ConfigFormProps } from '../configForm';

/** A few distinguishable dots; the user picks one per feed. */
export const FEED_COLORS = ['#38bdf8', '#f472b6', '#a3e635', '#fb923c', '#c084fc', '#facc15', '#2dd4bf', '#f87171'];

/**
 * Save-time normalisation: `webcal://` → `https://`, drop feeds whose URL
 * isn't http(s), and ask for every feed's origin while the save gesture
 * is still in scope (one prompt listing them all).
 */
export function prepareCalendarConfigForSave(config: Record<string, any>): Record<string, any> {
  const feeds: CalendarFeed[] = Array.isArray(config.feeds) ? config.feeds : [];
  const normalised = feeds
    .map((feed) => ({ ...feed, url: calendarService.normalizeCalendarUrl(feed.url || '') }))
    .filter((feed): feed is CalendarFeed => typeof feed.url === 'string');
  if (normalised.length > 0) void requestHostPermissions(normalised.map((f) => f.url));
  return { ...config, feeds: normalised };
}

export const CalendarConfig: React.FC<ConfigFormProps> = ({ config, setConfig }) => {
  const { t } = useTranslation();
  const feeds: CalendarFeed[] = Array.isArray(config.feeds) ? config.feeds : [];
  const [label, setLabel] = useState('');
  const [url, setUrl] = useState('');
  const [color, setColor] = useState(FEED_COLORS[feeds.length % FEED_COLORS.length]);
  const [error, setError] = useState<string | null>(null);
  // What the link will become on save (Google's embed / "add by URL" links are unwrapped).
  const normalisedPreview = calendarService.normalizeCalendarUrl(url);
  const unwrapped = normalisedPreview !== null && normalisedPreview !== url.trim().replace(/^webcal:\/\//i, 'https://');
  const suspicious = normalisedPreview !== null && !calendarService.looksLikeICalUrl(normalisedPreview);

  const addFeed = () => {
    const normalised = calendarService.normalizeCalendarUrl(url);
    if (!normalised) {
      setError(t.widgets.calendar.invalidUrl);
      return;
    }
    const feed: CalendarFeed = { id: uniqueId('cal'), url: normalised, label: label.trim() || t.widgets.calendar.defaultLabel, color };
    setConfig({ ...config, feeds: [...feeds, feed] });
    setLabel('');
    setUrl('');
    setError(null);
    setColor(FEED_COLORS[(feeds.length + 1) % FEED_COLORS.length]);
  };

  const removeFeed = (id: string) => setConfig({ ...config, feeds: feeds.filter((f) => f.id !== id) });

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <label className="block text-xs font-medium text-slate-300">{t.widgets.calendar.feeds}</label>
        {feeds.length === 0 && <p className="text-[11px] text-slate-500 italic">{t.widgets.calendar.noFeedsConfig}</p>}
        {feeds.map((feed) => (
          <div key={feed.id} className="flex items-center gap-2 p-2 rounded-lg bg-slate-800/40 border border-white/10">
            <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: feed.color }} />
            <div className="flex-1 min-w-0">
              <div className="text-xs text-white truncate">{feed.label}</div>
              <div className="text-[10px] text-slate-500 truncate">{feed.url}</div>
            </div>
            <button
              type="button"
              onClick={() => removeFeed(feed.id)}
              title={t.common.delete}
              className="p-1.5 rounded-md text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
            >
              <Trash2 size={13} />
            </button>
          </div>
        ))}
      </div>

      <div className="p-3 rounded-xl bg-white/[0.03] border border-white/10 space-y-2">
        <div className="text-xs font-semibold text-white">{t.widgets.calendar.addFeed}</div>
        <p className="text-[11px] text-slate-400 leading-relaxed">{t.widgets.calendar.addFeedHelp}</p>
        <input
          type="text"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          placeholder={t.widgets.calendar.labelPlaceholder}
          aria-label={t.widgets.calendar.labelField}
          className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900/60 border border-white/10 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-400/50"
        />
        <input
          type="url"
          value={url}
          onChange={(e) => {
            setUrl(e.target.value);
            setError(null);
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              addFeed();
            }
          }}
          placeholder="https://calendar.google.com/calendar/ical/…/basic.ics"
          aria-label={t.widgets.calendar.urlField}
          className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900/60 border border-white/10 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-400/50"
        />
        {error && <p className="text-[11px] text-rose-400">{error}</p>}
        {!error && unwrapped && normalisedPreview && (
          <p className="text-[11px] text-emerald-300 break-all" data-testid="calendar-url-preview">
            {t.widgets.calendar.willUse} {normalisedPreview}
          </p>
        )}
        {!error && suspicious && <p className="text-[11px] text-amber-300">{t.widgets.calendar.notIcsHint}</p>}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1" role="radiogroup" aria-label={t.widgets.calendar.colorField}>
            {FEED_COLORS.map((c) => (
              <button
                key={c}
                type="button"
                role="radio"
                aria-checked={color === c}
                aria-label={c}
                onClick={() => setColor(c)}
                className={`w-4 h-4 rounded-full border-2 transition-transform ${color === c ? 'border-white scale-110' : 'border-transparent'}`}
                style={{ backgroundColor: c }}
              />
            ))}
          </div>
          <button
            type="button"
            onClick={addFeed}
            disabled={!url.trim()}
            className="flex items-center gap-1 text-xs px-3 py-1.5 bg-sky-500 hover:bg-sky-400 disabled:opacity-50 text-white rounded-lg transition-colors font-medium"
          >
            <Plus size={12} />
            {t.widgets.calendar.addBtn}
          </button>
        </div>
      </div>

      <div>
        <label className="block text-xs font-medium text-slate-300 mb-1.5">{t.widgets.calendar.daysAhead}</label>
        <div className="grid grid-cols-3 gap-2">
          {([1, 3, 7] as CalendarDaysAhead[]).map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => setConfig({ ...config, daysAhead: n })}
              className={`py-2 px-3 rounded-lg text-xs font-medium border transition-all ${
                (config.daysAhead || 3) === n ? 'bg-sky-500/20 border-sky-400 text-sky-200' : 'bg-slate-800/50 border-white/10 text-slate-300 hover:bg-slate-800'
              }`}
            >
              {t.widgets.calendar.daysAheadOption.replace('{n}', String(n))}
            </button>
          ))}
        </div>
      </div>

      <label className="flex items-center justify-between py-1 cursor-pointer">
        <span className="text-xs text-slate-300">{t.widgets.calendar.showLocation}</span>
        <input
          type="checkbox"
          checked={config.showLocation !== false}
          onChange={(e) => setConfig({ ...config, showLocation: e.target.checked })}
          aria-label={t.widgets.calendar.showLocation}
          className="w-4 h-4 rounded text-sky-500 bg-slate-800 border-white/20"
        />
      </label>
    </div>
  );
};
