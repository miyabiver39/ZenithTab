import { describe, it, expect } from 'vitest';
import { readTextWithLimit, ResponseTooLarge } from '../../../src/utils/fetchLimits';

/** A real streaming Response, chunked so the reader sees more than one read(). */
function streamedResponse(text: string, chunkSize = 8, headers: Record<string, string> = {}): Response {
  const bytes = new TextEncoder().encode(text);
  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      for (let i = 0; i < bytes.length; i += chunkSize) {
        controller.enqueue(bytes.slice(i, i + chunkSize));
      }
      controller.close();
    },
  });
  return new Response(stream, { headers });
}

describe('readTextWithLimit', () => {
  it('制限内の応答はそのままデコードして返すこと', async () => {
    const text = await readTextWithLimit(streamedResponse('hello world'), 1024, 'https://x.example');
    expect(text).toBe('hello world');
  });

  it('本文の合計が上限を超えたら途中で読むのをやめ ResponseTooLarge を投げること', async () => {
    const err = await readTextWithLimit(streamedResponse('x'.repeat(1000), 16), 100, 'https://x.example').catch((e) => e);
    expect(err).toBeInstanceOf(ResponseTooLarge);
    expect(err.url).toBe('https://x.example');
    expect(err.maxBytes).toBe(100);
  });

  it('Content-Length が上限を超えていれば本文を読まずに拒否すること', async () => {
    // A body that would throw if it were ever actually read, proving the
    // declared Content-Length alone was enough to refuse.
    const stream = new ReadableStream<Uint8Array>({
      pull() {
        throw new Error('body should never be pulled');
      },
    });
    const response = new Response(stream, { headers: { 'content-length': String(10 * 1024 * 1024) } });
    await expect(readTextWithLimit(response, 1024, 'https://x.example')).rejects.toThrow(/exceeds the 1024-byte limit/);
  });

  it('ストリーミング本文を持たない Response(テストのモック等)でも、読んだ後にサイズを確認すること', async () => {
    const small = { text: async () => 'ok' } as Response;
    expect(await readTextWithLimit(small, 100, 'https://x.example')).toBe('ok');

    const big = { text: async () => 'y'.repeat(200) } as Response;
    await expect(readTextWithLimit(big, 100, 'https://x.example')).rejects.toBeInstanceOf(ResponseTooLarge);
  });

  it('ちょうど上限のサイズは通ること(境界値)', async () => {
    const exact = 'z'.repeat(100);
    await expect(readTextWithLimit(streamedResponse(exact, 30), 100, 'https://x.example')).resolves.toBe(exact);
  });
});
