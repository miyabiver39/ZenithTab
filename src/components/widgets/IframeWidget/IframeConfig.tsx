import React from 'react';
import { Input } from '../../common/Input';
import { useTranslation } from '../../../i18n/i18n';
import { normalizeHttpUrl } from '../../../utils/url';
import type { ConfigFormProps } from '../configForm';

/**
 * Hand-typed embed URLs: assume https:// when the scheme is missing and
 * drop anything that still isn't http(s) rather than letting it reach an
 * <iframe src>.
 */
export function prepareIframeConfigForSave(config: Record<string, any>): Record<string, any> {
  if (typeof config.url !== 'string') return config;
  return { ...config, url: normalizeHttpUrl(config.url) || '' };
}

/** Target URL and scroll toggle. */
export const IframeConfig: React.FC<ConfigFormProps> = ({ config, setConfig }) => {
  const { t } = useTranslation();
  return (
    <div className="space-y-4">
      <Input
        label={t.widgets.iframe.targetUrl}
        value={config.url || ''}
        onChange={(e) => setConfig({ ...config, url: e.target.value })}
        placeholder="https://example.com"
      />
      <div className="flex items-center justify-between py-1">
        <span className="text-xs text-slate-300">{t.widgets.iframe.allowScroll}</span>
        <input
          type="checkbox"
          aria-label={t.widgets.iframe.allowScroll}
          checked={!!config.allowScroll}
          onChange={(e) => setConfig({ ...config, allowScroll: e.target.checked })}
          className="w-4 h-4 rounded text-sky-500 bg-slate-800 border-white/20"
        />
      </div>
    </div>
  );
};
