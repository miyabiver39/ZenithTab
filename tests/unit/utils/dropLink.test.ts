import { describe, it, expect } from 'vitest';
import { readDroppedLink } from '../../../src/utils/dropLink';

function dt(data: Record<string, string>): DataTransfer {
  return {
    types: Object.keys(data),
    getData: (type: string) => data[type] || '',
  } as unknown as DataTransfer;
}

describe('readDroppedLink', () => {
  it('uri-list とアンカーの文字列からリンクを作ること', () => {
    const link = readDroppedLink(dt({ 'text/uri-list': 'https://example.com/page\r\n', 'text/html': '<a href="https://example.com/page">Example Page</a>' }));
    expect(link).toEqual({ title: 'Example Page', url: 'https://example.com/page' });
  });

  it('プレーンテキストの URL はホスト名をタイトルにし、スキームを補うこと', () => {
    expect(readDroppedLink(dt({ 'text/plain': 'www.wikipedia.org' }))).toEqual({ title: 'wikipedia.org', url: 'https://www.wikipedia.org/' });
  });

  it('URL でないテキストや危険なスキームは無視すること', () => {
    expect(readDroppedLink(dt({ 'text/plain': 'hello world' }))).toBeNull();
    expect(readDroppedLink(dt({ 'text/uri-list': 'javascript:alert(1)' }))).toBeNull();
    expect(readDroppedLink(dt({ 'text/uri-list': '# comment only' }))).toBeNull();
    expect(readDroppedLink(null)).toBeNull();
  });

  it('アンカー文字列が URL そのものや長すぎる場合はホスト名に戻すこと', () => {
    expect(readDroppedLink(dt({ 'text/uri-list': 'https://a.example.com/x', 'text/html': '<a href="#">https://a.example.com/x</a>' }))!.title).toBe('a.example.com');
    expect(readDroppedLink(dt({ 'text/uri-list': 'https://a.example.com/x', 'text/html': `<a href="#">${'x'.repeat(80)}</a>` }))!.title).toBe('a.example.com');
  });

  it('peek では型の有無だけで判定すること', () => {
    expect(readDroppedLink(dt({ 'text/uri-list': '' }), { peek: true })).not.toBeNull();
    expect(readDroppedLink(dt({ 'text/html': '<b>x</b>' }), { peek: true })).toBeNull();
  });
});
