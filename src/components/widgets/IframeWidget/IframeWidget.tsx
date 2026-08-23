import React, { useState } from 'react';
import { ExternalLink, Globe } from 'lucide-react';
import { IframeWidgetConfig } from '../../../types/widget';
import { getFaviconUrl } from '../../../utils/favicon';
import { useTranslation } from '../../../i18n/i18n';

interface IframeWidgetProps {
  config: IframeWidgetConfig;
}

export const IframeWidget: React.FC<IframeWidgetProps> = ({ config }) => {
  const { url = 'https://developer.mozilla.org', title = 'Web Tool', allowScroll = true } = config;
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const { t } = useTranslation();

  const hostname = url ? new URL(url).hostname : '';
  const faviconUrl = getFaviconUrl(url);

  return (
    <div className="w-full h-full flex flex-col relative rounded-lg overflow-hidden bg-slate-950/40">
      {hasError ? (
        /* Fallback Card for CSP / X-Frame-Options blocked origins */
        <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center select-none bg-slate-900/60">
          <div className="w-12 h-12 rounded-2xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center mb-3">
            {faviconUrl ? (
              <img src={faviconUrl} alt="" className="w-6 h-6 rounded" />
            ) : (
              <Globe size={24} className="text-sky-400" />
            )}
          </div>
          <h3 className="text-sm font-semibold text-white mb-1">{title || hostname}</h3>
          <p className="text-xs text-slate-400 max-w-xs mb-4">
            {t.widgets.iframe.restrictedDesc}
          </p>
          <div className="flex items-center gap-2">
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-white text-xs font-medium transition-colors shadow-lg shadow-sky-500/25"
            >
              <span>{t.widgets.iframe.openNewTab}</span>
              <ExternalLink size={13} />
            </a>
            <button
              onClick={() => {
                setHasError(false);
                setIsLoading(true);
              }}
              className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-slate-200 text-xs font-medium transition-colors"
            >
              {t.common.retry}
            </button>
          </div>
        </div>
      ) : (
        <>
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm z-10 text-xs text-slate-400">
              {t.widgets.iframe.loadingPreview}
            </div>
          )}

          <iframe
            src={url}
            title={title}
            sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
            scrolling={allowScroll ? 'yes' : 'no'}
            className="w-full h-full border-0 rounded-lg"
            onLoad={() => setIsLoading(false)}
            onError={() => {
              setIsLoading(false);
              setHasError(true);
            }}
          />

          {/* Quick link button overlay */}
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="absolute bottom-2 right-2 p-1.5 bg-slate-900/80 hover:bg-slate-900 text-slate-300 hover:text-white rounded-lg border border-white/10 shadow-lg backdrop-blur-md transition-all z-20"
            title={t.widgets.iframe.openNewTab}
          >
            <ExternalLink size={12} />
          </a>
        </>
      )}
    </div>
  );
};
