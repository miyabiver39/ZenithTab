/**
 * Every locale's stock title for each widget type, and the default news
 * widget's title, extracted from the locale files so this stays small
 * and always bundled without importing every locale — see i18n/resolve.ts,
 * where the other locales load lazily on demand. Regenerated (not
 * hand-edited) by scripts/generate-default-titles.mjs whenever a widget's
 * stock title wording changes in any locale; drift from the real locale
 * files is caught by tests/unit/utils/defaultTitles.test.ts.
 *
 * widgetTitle.ts is the only consumer: it uses this to recognise a
 * widget's stored title as a stock one (so it can follow the language
 * setting) versus something the user typed themselves.
 */
import type { WidgetType } from '../types/widget';
import type { SupportedLanguage } from './resolve';

type LocaleCode = Exclude<SupportedLanguage, 'auto'>;

export const CATALOG_TITLES: Partial<Record<WidgetType, Record<LocaleCode, string>>> = {
  clock: { "en": "Clock", "ja": "時計", "zh-CN": "时钟", "es": "Reloj", "fr": "Horloge", "de": "Uhrzeit", "ko": "시계" },
  weather: { "en": "Weather", "ja": "天気情報", "zh-CN": "天气", "es": "Clima", "fr": "Météo", "de": "Wetter", "ko": "날씨 정보" },
  bookmarks: { "en": "Bookmarks", "ja": "ブックマーク", "zh-CN": "书签", "es": "Marcadores", "fr": "Favoris", "de": "Lesezeichen", "ko": "북마크" },
  rss: { "en": "RSS & News", "ja": "ニュース & RSS", "zh-CN": "新闻与RSS", "es": "Noticias y RSS", "fr": "Actualités & RSS", "de": "Nachrichten & RSS", "ko": "뉴스 & RSS" },
  iframe: { "en": "Web Embed", "ja": "Web埋め込み", "zh-CN": "网页嵌入", "es": "Incrustar web", "fr": "Intégration Web", "de": "Web-Einbettung", "ko": "웹 임베드" },
  notes: { "en": "Quick Notes", "ja": "クイックメモ", "zh-CN": "便签笔记", "es": "Notas rápidas", "fr": "Notes rapides", "de": "Notizen", "ko": "빠른 메모" },
  search: { "en": "Quick Search", "ja": "クイック検索", "zh-CN": "快捷搜索", "es": "Búsqueda rápida", "fr": "Recherche rapide", "de": "Schnellsuche", "ko": "빠른 검색" },
  pomodoro: { "en": "Focus Timer", "ja": "集中タイマー", "zh-CN": "番茄时钟", "es": "Temporizador", "fr": "Minuteur Focus", "de": "Fokus-Timer", "ko": "포모도로 타이머" },
  todo: { "en": "Todo List", "ja": "タスク管理", "zh-CN": "待办任务", "es": "Tareas", "fr": "Tâches To-Do", "de": "Aufgabenliste", "ko": "할 일 목록" },
  shortcuts: { "en": "Shortcuts", "ja": "ショートカット", "zh-CN": "快捷应用", "es": "Accesos directos", "fr": "Raccourcis", "de": "Verknüpfungen", "ko": "바로가기" },
  qrcode: { "en": "QR Code", "ja": "QRコード", "zh-CN": "二维码", "es": "Código QR", "fr": "Code QR", "de": "QR-Code", "ko": "QR 코드" },
  quickaccess: { "en": "Quick Access", "ja": "クイックアクセス", "zh-CN": "快速访问", "es": "Acceso rápido", "fr": "Accès rapide", "de": "Schnellzugriff", "ko": "빠른 접근" },
  countdown: { "en": "Countdown", "ja": "カウントダウン", "zh-CN": "倒计时", "es": "Cuenta atrás", "fr": "Compte à rebours", "de": "Countdown", "ko": "카운트다운" },
  habits: { "en": "Habit Tracker", "ja": "習慣トラッカー", "zh-CN": "习惯打卡", "es": "Hábitos", "fr": "Habitudes", "de": "Gewohnheiten", "ko": "습관 트래커" },
  calendar: { "en": "Calendar", "ja": "カレンダー", "zh-CN": "日历", "es": "Calendario", "fr": "Calendrier", "de": "Kalender", "ko": "캘린더" },
};

export const NEWS_TITLES: Record<LocaleCode, string> = {
  "en": "News",
  "ja": "ニュース",
  "zh-CN": "新闻",
  "es": "Noticias",
  "fr": "Actualités",
  "de": "Nachrichten",
  "ko": "뉴스",
};
