import { describe, it, expect } from 'vitest';
import { getTranslation, detectBrowserLanguage, LOCALES } from '../../src/i18n/i18n';

describe('i18n Localization Engine', () => {
  it('日本語と英語の翻訳リソースが定義されていること', () => {
    expect(LOCALES.ja).toBeDefined();
    expect(LOCALES.en).toBeDefined();
    expect(LOCALES.ja.common.dashboard).toBe('ダッシュボード');
    expect(LOCALES.en.common.dashboard).toBe('Dashboard');
  });

  it('多言語（中国語、スペイン語、フランス語、ドイツ語、韓国語）をサポートしていること', () => {
    expect(LOCALES.zh).toBeDefined();
    expect(LOCALES.es).toBeDefined();
    expect(LOCALES.fr).toBeDefined();
    expect(LOCALES.de).toBeDefined();
    expect(LOCALES.ko).toBeDefined();
    expect(LOCALES.ko.common.dashboard).toBe('대시보드');
  });

  it('言語指定時に適切な翻訳オブジェクトを返すこと', () => {
    const jaT = getTranslation('ja');
    expect(jaT.common.addWidget).toBe('ウィジェット追加');

    const enT = getTranslation('en');
    expect(enT.common.addWidget).toBe('Add Widget');
  });

  it('auto指定時にブラウザ言語判定が動作すること', () => {
    const lang = detectBrowserLanguage();
    expect(typeof lang).toBe('string');
  });

  it('全ロケールが英語版と同一のキー構造を持つこと', () => {
    const collectKeys = (obj: any, prefix = ''): string[] =>
      Object.entries(obj).flatMap(([key, value]) =>
        value && typeof value === 'object' && !Array.isArray(value)
          ? collectKeys(value, `${prefix}${key}.`)
          : [`${prefix}${key}`]
      );

    const reference = collectKeys(LOCALES.en).sort();

    for (const [code, locale] of Object.entries(LOCALES)) {
      const keys = collectKeys(locale).sort();
      const missing = reference.filter((k) => !keys.includes(k));
      expect(missing, `${code} に不足しているキー: ${missing.join(', ')}`).toEqual([]);
    }
  });

  it('ロケールに応じた日付・時刻フォーマットが動作すること', async () => {
    const { formatDate } = await import('../../src/utils/date');
    const testDate = new Date('2026-08-25T12:00:00Z');
    const jaDate = formatDate(testDate, 'UTC', 'ja');
    const enDate = formatDate(testDate, 'UTC', 'en');

    expect(jaDate).toContain('2026');
    expect(enDate).toContain('2026');
    expect(enDate).toContain('Aug');
    expect(enDate).toContain('Tuesday');
  });
});
