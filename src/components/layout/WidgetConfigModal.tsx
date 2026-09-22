import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { Input } from '../common/Input';
import { Button } from '../common/Button';
import { useDashboardStore } from '../../store/useDashboardStore';
import { getLocalizedWidgetTitle } from '../../utils/widgetTitle';
import { useTranslation } from '../../i18n/i18n';
import { getWidgetDefinition } from '../widgets/registry';

/**
 * Shared frame for every widget's settings: title field, the widget's own
 * form from the registry, cancel / save. Per-widget fields live next to
 * their widget in `<Type>Config.tsx`; save-time normalisation in the
 * definition's `beforeSave`.
 */
export const WidgetConfigModal: React.FC = () => {
  const activeSettingsModal = useDashboardStore((s) => s.activeSettingsModal);
  const editingWidgetId = useDashboardStore((s) => s.editingWidgetId);
  const widgets = useDashboardStore((s) => s.widgets);
  const closeSettingsModal = useDashboardStore((s) => s.closeSettingsModal);
  const updateWidgetConfig = useDashboardStore((s) => s.updateWidgetConfig);

  const { t, activeLanguageCode } = useTranslation();
  const isOpen = activeSettingsModal === 'editWidget' && !!editingWidgetId;
  const targetWidget = widgets.find((w) => w.id === editingWidgetId);

  const [title, setTitle] = useState('');
  const [config, setConfig] = useState<Record<string, any>>({});

  useEffect(() => {
    if (targetWidget) {
      // Show (and, if left untouched, re-save) the stock title in the
      // current language so the field never looks stale after a language switch.
      setTitle(getLocalizedWidgetTitle(targetWidget, t));
      setConfig({ ...targetWidget.config });
    }
  }, [targetWidget, t]);

  if (!targetWidget) return null;

  const definition = getWidgetDefinition(targetWidget.type);
  const ConfigForm = definition?.ConfigForm;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingWidgetId) return;
    const prepared = definition?.beforeSave ? definition.beforeSave(config, { activeLanguageCode }) : config;
    updateWidgetConfig(editingWidgetId, prepared, title);
    closeSettingsModal();
  };

  return (
    <Modal isOpen={isOpen} onClose={closeSettingsModal} title={t.settings.configureWidget.replace('{name}', getLocalizedWidgetTitle(targetWidget, t))} maxWidth="md">
      <form onSubmit={handleSave} className="space-y-5">
        <Input
          label={t.settings.widgetTitleLabel}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder={t.settings.widgetTitlePlaceholder}
        />

        {ConfigForm && <ConfigForm widgetId={targetWidget.id} config={config} setConfig={setConfig} />}

        <div className="flex items-center justify-end gap-2 pt-4 border-t border-white/10">
          <Button type="button" variant="ghost" size="sm" onClick={closeSettingsModal}>
            {t.common.cancel}
          </Button>
          <Button type="submit" variant="primary" size="sm">
            {t.common.saveChanges}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
