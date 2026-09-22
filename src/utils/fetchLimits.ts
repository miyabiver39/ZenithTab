/**
 * Reading a fetch response body without a cap means a feed the user (or a
 * shared-code / imported dashboard) pointed us at can tie up the tab —
 * `fetchWithTimeout`'s timeout only bounds how long the request takes to
 * *start* responding, not how much a fast, chatty server can send once it
 * does. `readTextWithLimit` reads the body in chunks and aborts as soon
 * as the total passes `maxBytes`, so a response is never fully buffered
 * past that point; a `Content-Length` over the limit is rejected before
 * any of the body is read at all.
 */

export class ResponseTooLarge extends Error {
  url: string;
  maxBytes: number;

  constructor(url: string, maxBytes: number) {
    super(`Response from ${url} exceeds the ${maxBytes}-byte limit.`);
    this.name = 'ResponseTooLarge';
    this.url = url;
    this.maxBytes = maxBytes;
  }
}

/** RSS/Atom feeds: article lists rarely run past a few hundred KB. */
export const MAX_RSS_BYTES = 2 * 1024 * 1024;
/** iCal feeds: a year of daily recurring events in text is still well under this. */
export const MAX_ICAL_BYTES = 5 * 1024 * 1024;

export async function readTextWithLimit(response: Response, maxBytes: number, url = response.url): Promise<string> {
  const declared = response.headers?.get?.('content-length');
  if (declared && Number(declared) > maxBytes) {
    throw new ResponseTooLarge(url, maxBytes);
  }

  // Some environments (older browsers, or a test's mocked Response) don't
  // expose a streaming body; read normally and check after the fact —
  // still safe, just not early-aborting on an oversized response.
  if (!response.body || typeof response.body.getReader !== 'function') {
    const text = await response.text();
    if (new TextEncoder().encode(text).length > maxBytes) throw new ResponseTooLarge(url, maxBytes);
    return text;
  }

  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.byteLength;
    if (total > maxBytes) {
      await reader.cancel();
      throw new ResponseTooLarge(url, maxBytes);
    }
    chunks.push(value);
  }

  const merged = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    merged.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return new TextDecoder('utf-8').decode(merged);
}
