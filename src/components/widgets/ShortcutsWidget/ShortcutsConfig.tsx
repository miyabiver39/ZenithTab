import React from 'react';
import { Input } from '../../common/Input';
import { useTranslation } from '../../../i18n/i18n';
import type { ConfigFormProps } from '../configForm';

export const ShortcutsConfig: React.FC<ConfigFormProps> = ({ config, setConfig }) => {
  const { t } = useTranslation();
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between py-1">
        <span className="text-xs text-slate-300">{t.widgets.shortcuts.openInNewTab}</span>
        <input
          type="checkbox"
          checked={config.openInNewTab !== false}
          onChange={(e) => setConfig({ ...config, openInNewTab: e.target.checked })}
          className="w-4 h-4 rounded text-sky-500 bg-slate-800 border-white/20"
        />
      </div>
      <Input
        label={t.widgets.shortcuts.columns}
        type="number"
        min="2"
        max="8"
        value={config.columns || 4}
        onChange={(e) => setConfig({ ...config, columns: parseInt(e.target.value) || 4 })}
      />
    </div>
  );
};
