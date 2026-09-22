import { describe, it, expect } from 'vitest';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

/**
 * Regression guard for #75: an icon-only button's `title`/`aria-label`,
 * or a field's `placeholder`, hardcoded as a literal string instead of
 * going through `t.*` reads as English regardless of the dashboard
 * language and gives screen-reader users an English-only accessible
 * name. This is a coarse heuristic (a literal JSX attribute value of two
 * or more words), not a full audit, but it catches the exact shape of
 * mistake #75 found and costs nothing to keep passing.
 *
 * A short allowlist covers the deliberate exceptions CLAUDE.md and #75
 * itself call out: technical, language-neutral examples (IANA time zone
 * IDs, URLs) that read the same regardless of UI language.
 */

const SRC_DIR = join(__dirname, '..', '..', 'src', 'components');

const ATTR_PATTERN = /\b(title|placeholder|aria-label)="([^"]*)"/g;

const ALLOWLIST = new Set<string>([
  // IANA time zone identifiers are not translatable text — see CLAUDE.md
  // §7 / issue #75's own carve-out.
  'src/components/widgets/ClockWidget/ClockConfig.tsx::placeholder::e.g. Asia/Tokyo, America/New_York, UTC',
]);

function listTsxFiles(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    const stat = statSync(full);
    if (stat.isDirectory()) out.push(...listTsxFiles(full));
    else if (entry.endsWith('.tsx')) out.push(full);
  }
  return out;
}

describe('i18n: no hardcoded multi-word title / placeholder / aria-label', () => {
  it('src/components 配下に、複数単語のハードコードされた英語リテラルが無いこと', () => {
    const offenders: string[] = [];

    for (const file of listTsxFiles(SRC_DIR)) {
      const relPath = relative(join(__dirname, '..', '..'), file).replace(/\\/g, '/');
      const text = readFileSync(file, 'utf-8');
      for (const match of text.matchAll(ATTR_PATTERN)) {
        const [, attr, value] = match;
        // Two or more space-separated words: catches "Widget Settings" and
        // "e.g. Tokyo, Shinjuku" while leaving single tokens (URLs, a bare
        // placeholder like "https://example.com") alone.
        if (!/\S+\s+\S+/.test(value)) continue;
        const key = `${relPath}::${attr}::${value}`;
        if (ALLOWLIST.has(key)) continue;
        offenders.push(`${relPath} — ${attr}="${value}"`);
      }
    }

    expect(offenders, offenders.join('\n')).toEqual([]);
  });

  it('許可リストの項目は実在するコードを指していること(コードが変わったら更新が必要)', () => {
    const seen = new Set<string>();
    for (const file of listTsxFiles(SRC_DIR)) {
      const relPath = relative(join(__dirname, '..', '..'), file).replace(/\\/g, '/');
      const text = readFileSync(file, 'utf-8');
      for (const match of text.matchAll(ATTR_PATTERN)) {
        const [, attr, value] = match;
        seen.add(`${relPath}::${attr}::${value}`);
      }
    }
    for (const entry of ALLOWLIST) {
      expect(seen.has(entry), `stale allowlist entry (no longer present in source): ${entry}`).toBe(true);
    }
  });
});
