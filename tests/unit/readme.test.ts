import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';

/**
 * The README exists in 7 languages. Translations drift silently, so this
 * pins the things that must stay in step: the section structure, the
 * language switcher, and every relative link/image resolving to a real
 * file from where that README lives.
 */
const ROOT = resolve(__dirname, '../..');
const READMES: Record<string, string> = {
  en: 'README.md',
  ja: 'docs/readme/README.ja.md',
  'zh-CN': 'docs/readme/README.zh-CN.md',
  es: 'docs/readme/README.es.md',
  fr: 'docs/readme/README.fr.md',
  de: 'docs/readme/README.de.md',
  ko: 'docs/readme/README.ko.md',
};

const read = (rel: string) => readFileSync(resolve(ROOT, rel), 'utf8');
const headingShape = (md: string) => md.split('\n').filter((l) => /^#{2,3} /.test(l)).map((l) => l.replace(/^(#+) .*/, '$1'));
const localLinks = (md: string) =>
  Array.from(md.matchAll(/(?:\]\(|src=")([^)"#\s]+)/g))
    .map((m) => m[1])
    .filter((target) => !/^https?:/.test(target) && !target.startsWith('mailto:'));

describe('README translations', () => {
  it('all 7 languages exist and share the English section structure', () => {
    const shape = headingShape(read(READMES.en));
    expect(shape.length).toBeGreaterThan(8);
    for (const [lang, rel] of Object.entries(READMES)) {
      expect(existsSync(resolve(ROOT, rel)), rel).toBe(true);
      expect(headingShape(read(rel)), `${lang} headings`).toEqual(shape);
    }
  });

  it('every README links to every other language and to itself in bold', () => {
    for (const [lang, rel] of Object.entries(READMES)) {
      const md = read(rel);
      for (const [other, otherRel] of Object.entries(READMES)) {
        if (other === lang) continue;
        const expected = lang === 'en' ? otherRel : other === 'en' ? '../../README.md' : otherRel.replace('docs/readme/', '');
        expect(md, `${lang} → ${other}`).toContain(`](${expected})`);
      }
    }
  });

  it('relative links and images resolve to existing files', () => {
    for (const [lang, rel] of Object.entries(READMES)) {
      const base = dirname(resolve(ROOT, rel));
      for (const target of localLinks(read(rel))) {
        expect(existsSync(resolve(base, target)), `${lang}: ${target}`).toBe(true);
      }
    }
  });

  it('the English README mentions every registered widget type', async () => {
    const { WIDGET_TYPES } = await import('../../src/components/widgets/widgetDefinitions');
    const md = read(READMES.en).toLowerCase();
    const names: Record<string, string> = {
      search: 'quick search',
      shortcuts: 'shortcuts',
      clock: 'clock',
      weather: 'weather',
      bookmarks: 'bookmarks',
      rss: 'rss',
      pomodoro: 'focus timer',
      todo: 'tasks',
      notes: 'quick notes',
      iframe: 'web embed',
      quickaccess: 'quick access',
      qrcode: 'qr code',
      countdown: 'countdown',
      habits: 'habit tracker',
      calendar: 'calendar',
    };
    for (const type of WIDGET_TYPES) {
      expect(names[type], `README name for widget type "${type}" — add it to this test and to README.md`).toBeDefined();
      expect(md, type).toContain(names[type]);
    }
  });
});
