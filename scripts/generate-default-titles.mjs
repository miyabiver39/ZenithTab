#!/usr/bin/env node
// Regenerates src/i18n/defaultTitles.ts from the real locale files.
//
// widgetTitle.ts needs every locale's stock title for every widget type
// (to recognise "this widget still has its default title" regardless of
// language) but must not import every locale to get it — i18n/resolve.ts
// loads locales other than the active one lazily, on demand, to keep the
// main bundle small (see #77). defaultTitles.ts is the small, always-
// bundled exception: static data checked into the repo instead of
// derived at runtime.
//
// Run whenever a widget's stock title wording changes in any locale:
//   node scripts/generate-default-titles.mjs
// tests/unit/utils/defaultTitles.test.ts fails if this drifts from the
// real locale files, as a reminder to re-run it.
import { writeFileSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { register } from 'node:module';
import path from 'node:path';

const root = path.dirname(fileURLToPath(import.meta.url));
const localesDir = path.join(root, '..', 'src', 'i18n', 'locales');

// The locale files import their sibling `en.ts` without an extension —
// valid under the project's `moduleResolution: bundler` (Vite/tsc), but
// Node's own resolver requires one. Rather than change source files just
// for this maintenance script, resolve the missing extension ourselves.
register(pathToFileURL(path.join(root, 'lib', 'ts-extension-loader.mjs')));

const importLocale = (file) => import(pathToFileURL(path.join(localesDir, file)).href);

const { en } = await importLocale('en.ts');
const { ja } = await importLocale('ja.ts');
const { zh } = await importLocale('zh.ts');
const { es } = await importLocale('es.ts');
const { fr } = await importLocale('fr.ts');
const { de } = await importLocale('de.ts');
const { ko } = await importLocale('ko.ts');

const LOCALES = { en, ja, 'zh-CN': zh, es, fr, de, ko };
const WIDGET_TYPES = [
  'clock', 'weather', 'bookmarks', 'rss', 'iframe', 'notes', 'search',
  'pomodoro', 'todo', 'shortcuts', 'qrcode', 'quickaccess', 'countdown',
  'habits', 'calendar',
];

const q = (s) => JSON.stringify(s);

let out = `/**
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
`;

for (const type of WIDGET_TYPES) {
  const row = [];
  for (const [code, locale] of Object.entries(LOCALES)) {
    const title = locale.widgets?.[type]?.title;
    if (title) row.push(`${q(code)}: ${q(title)}`);
  }
  if (row.length) out += `  ${type}: { ${row.join(', ')} },\n`;
}

out += `};\n\nexport const NEWS_TITLES: Record<LocaleCode, string> = {\n`;
for (const [code, locale] of Object.entries(LOCALES)) {
  out += `  ${q(code)}: ${q(locale.defaults.newsTitle)},\n`;
}
out += `};\n`;

const outPath = path.join(root, '..', 'src', 'i18n', 'defaultTitles.ts');
writeFileSync(outPath, out, 'utf-8');
console.log(`Wrote ${path.relative(path.join(root, '..'), outPath)}`);
