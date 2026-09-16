import React from 'react';
import {
  Bookmark,
  CheckSquare,
  Clock,
  CloudSun,
  FileText,
  Globe,
  History,
  Newspaper,
  QrCode,
  Search,
  Timer,
} from 'lucide-react';
import { WidgetType } from '../../types/widget';
import { WIDGET_DEFINITIONS, WidgetDefinitionMeta } from './widgetDefinitions';
import type { ConfigFormProps } from './configForm';

import { SearchWidget } from './SearchWidget/SearchWidget';
import { SearchConfig } from './SearchWidget/SearchConfig';
import { ShortcutsWidget } from './ShortcutsWidget/ShortcutsWidget';
import { ShortcutsConfig } from './ShortcutsWidget/ShortcutsConfig';
import { ClockWidget } from './ClockWidget/ClockWidget';
import { ClockConfig } from './ClockWidget/ClockConfig';
import { WeatherWidget } from './WeatherWidget/WeatherWidget';
import { WeatherConfig } from './WeatherWidget/WeatherConfig';
import { BookmarkWidget } from './BookmarkWidget/BookmarkWidget';
import { BookmarkConfig } from './BookmarkWidget/BookmarkConfig';
import { RssFeedWidget } from './RssFeedWidget/RssFeedWidget';
import { RssFeedConfig, prepareRssConfigForSave } from './RssFeedWidget/RssFeedConfig';
import { PomodoroWidget } from './PomodoroWidget/PomodoroWidget';
import { PomodoroConfig } from './PomodoroWidget/PomodoroConfig';
import { TodoWidget } from './TodoWidget/TodoWidget';
import { QuickNotesWidget } from './QuickNotesWidget/QuickNotesWidget';
import { QuickNotesConfig } from './QuickNotesWidget/QuickNotesConfig';
import { IframeWidget } from './IframeWidget/IframeWidget';
import { IframeConfig, prepareIframeConfigForSave } from './IframeWidget/IframeConfig';
import { QuickAccessWidget } from './QuickAccessWidget/QuickAccessWidget';
import { QuickAccessConfig } from './QuickAccessWidget/QuickAccessConfig';
import { QrCodeWidget } from './QrCodeWidget/QrCodeWidget';

/**
 * The single place that knows what a widget type looks like on screen.
 *
 * Adding a widget = one entry in `widgetDefinitions.ts` (size, default
 * config, URL keys) + one entry here (icon, colour, component, settings
 * form) + `t.widgets.<type>.{title,desc}` in all 7 locales. AddWidgetModal,
 * WidgetConfigModal, GridContainer and the store all read from these two
 * tables instead of carrying their own switch statements.
 */
export interface WidgetDefinition extends WidgetDefinitionMeta {
  /** Catalogue card icon. */
  icon: React.ElementType;
  /** Tailwind classes for the catalogue card's icon badge. */
  color: string;
  /** The widget body. Widgets that don't need `widgetId` simply ignore it. */
  Component: React.ComponentType<{ widgetId: string; config: any }>;
  /** Settings form; omitted for widgets with nothing to configure beyond the title. */
  ConfigForm?: React.ComponentType<ConfigFormProps>;
  /** Save-time normalisation applied to the form's draft config. */
  beforeSave?: (config: Record<string, any>, ctx: { activeLanguageCode: string }) => Record<string, any>;
}

// Catalogue order — this is the order the "Add Widget" dialog shows.
export const WIDGET_REGISTRY: WidgetDefinition[] = [
  {
    ...WIDGET_DEFINITIONS.search,
    icon: Search,
    color: 'text-sky-400 bg-sky-400/10 border-sky-400/20',
    Component: SearchWidget,
    ConfigForm: SearchConfig,
  },
  {
    ...WIDGET_DEFINITIONS.shortcuts,
    icon: Globe,
    color: 'text-cyan-400 bg-cyan-400/10 border-cyan-400/20',
    Component: ShortcutsWidget,
    ConfigForm: ShortcutsConfig,
  },
  {
    ...WIDGET_DEFINITIONS.clock,
    icon: Clock,
    color: 'text-indigo-400 bg-indigo-400/10 border-indigo-400/20',
    Component: ClockWidget,
    ConfigForm: ClockConfig,
  },
  {
    ...WIDGET_DEFINITIONS.weather,
    icon: CloudSun,
    color: 'text-amber-400 bg-amber-400/10 border-amber-400/20',
    Component: WeatherWidget,
    ConfigForm: WeatherConfig,
  },
  {
    ...WIDGET_DEFINITIONS.bookmarks,
    icon: Bookmark,
    color: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20',
    Component: BookmarkWidget,
    ConfigForm: BookmarkConfig,
  },
  {
    ...WIDGET_DEFINITIONS.rss,
    icon: Newspaper,
    color: 'text-violet-400 bg-violet-400/10 border-violet-400/20',
    Component: RssFeedWidget,
    ConfigForm: RssFeedConfig,
    beforeSave: (config, { activeLanguageCode }) => prepareRssConfigForSave(config, activeLanguageCode),
  },
  {
    ...WIDGET_DEFINITIONS.pomodoro,
    icon: Timer,
    color: 'text-orange-400 bg-orange-400/10 border-orange-400/20',
    Component: PomodoroWidget,
    ConfigForm: PomodoroConfig,
  },
  {
    ...WIDGET_DEFINITIONS.todo,
    icon: CheckSquare,
    color: 'text-teal-400 bg-teal-400/10 border-teal-400/20',
    Component: TodoWidget,
  },
  {
    ...WIDGET_DEFINITIONS.notes,
    icon: FileText,
    color: 'text-pink-400 bg-pink-400/10 border-pink-400/20',
    Component: QuickNotesWidget,
    ConfigForm: QuickNotesConfig,
  },
  {
    ...WIDGET_DEFINITIONS.iframe,
    icon: Globe,
    color: 'text-blue-400 bg-blue-400/10 border-blue-400/20',
    Component: IframeWidget,
    ConfigForm: IframeConfig,
    beforeSave: (config) => prepareIframeConfigForSave(config),
  },
  {
    ...WIDGET_DEFINITIONS.quickaccess,
    icon: History,
    color: 'text-teal-400 bg-teal-400/10 border-teal-400/20',
    Component: QuickAccessWidget,
    ConfigForm: QuickAccessConfig,
  },
  {
    ...WIDGET_DEFINITIONS.qrcode,
    icon: QrCode,
    color: 'text-fuchsia-400 bg-fuchsia-400/10 border-fuchsia-400/20',
    Component: QrCodeWidget,
  },
];

const BY_TYPE = new Map<string, WidgetDefinition>(WIDGET_REGISTRY.map((def) => [def.type, def]));

/** Undefined for a type this build doesn't know (old or corrupted data). */
export function getWidgetDefinition(type: WidgetType | string): WidgetDefinition | undefined {
  return BY_TYPE.get(type);
}
