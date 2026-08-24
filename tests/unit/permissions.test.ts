import { describe, it, expect } from 'vitest';
import { originPatternFor, hasHostPermission, requestHostPermission } from '../../src/utils/permissions';

describe('optional host permissions', () => {
  it('URLからChromeのマッチパターンを生成すること', () => {
    expect(originPatternFor('https://example.com/feed.xml')).toBe('https://example.com/*');
    expect(originPatternFor('https://news.google.com/rss/search?q=ai')).toBe('https://news.google.com/*');
    expect(originPatternFor('http://blog.example.co.jp/atom')).toBe('http://blog.example.co.jp/*');
  });

  it('http(s)以外やURLでない文字列を拒否すること', () => {
    expect(originPatternFor('javascript:alert(1)')).toBeNull();
    expect(originPatternFor('data:text/html,<h1>hi</h1>')).toBeNull();
    expect(originPatternFor('chrome://extensions')).toBeNull();
    expect(originPatternFor('not a url')).toBeNull();
  });

  it('不正なURLに対しては権限を確認も要求もしないこと', async () => {
    await expect(hasHostPermission('javascript:alert(1)')).resolves.toBe(false);
    await expect(requestHostPermission('javascript:alert(1)')).resolves.toBe(false);
  });

  it('正常なURLではchrome.permissionsに問い合わせること', async () => {
    await expect(hasHostPermission('https://example.com/feed.xml')).resolves.toBe(true);
  });
});
