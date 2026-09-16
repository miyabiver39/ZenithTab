/**
 * Props every per-widget settings form receives from WidgetConfigModal.
 * Forms edit a draft copy of the widget's config; the modal persists it on
 * save (after the widget definition's `beforeSave`, if any).
 */
export interface ConfigFormProps<C extends Record<string, any> = Record<string, any>> {
  widgetId: string;
  config: C;
  setConfig: React.Dispatch<React.SetStateAction<C>>;
}
