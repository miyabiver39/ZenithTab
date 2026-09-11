import { describe, it, expect } from 'vitest';
import { guessSearchUrlTemplate } from '../../src/utils/searchEnginePresets';

describe('guessSearchUrlTemplate', () => {
  it('実際に検索した結果のURLからクエリパラメータを {query} に置き換えられること', () => {
    // The exact scenario a user hits: pasting a real Yahoo! JAPAN search
    // results URL, not a hand-authored template.
    const real = 'https://search.yahoo.co.jp/search?p=%E3%83%86%E3%82%B9%E3%83%88&ei=UTF-8';
    expect(guessSearchUrlTemplate(real)).toBe('https://search.yahoo.co.jp/search?p={query}&ei=UTF-8');
  });

  it('既に {query} を含む場合は null を返すこと(変更不要)', () => {
    expect(guessSearchUrlTemplate('https://example.com/search?q={query}')).toBeNull();
  });

  it('クエリパラメータが見つからない場合は null を返すこと', () => {
    expect(guessSearchUrlTemplate('https://example.com/about')).toBeNull();
  });

  it('無効なURLの場合は null を返すこと', () => {
    expect(guessSearchUrlTemplate('not a url')).toBeNull();
    expect(guessSearchUrlTemplate('')).toBeNull();
  });

  it('一般的でないパラメータ名は変換しないこと', () => {
    expect(guessSearchUrlTemplate('https://example.com/page?id=123')).toBeNull();
  });
});
