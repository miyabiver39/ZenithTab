import { normalizeHttpUrl, hostnameOf } from './url';

export interface DroppedLink {
  title: string;
  url: string;
}

/**
 * Reads a link out of a drag's DataTransfer: a page link dragged from
 * another tab (`text/uri-list` plus the anchor as `text/html`), the
 * address bar (`text/plain`), or a bookmark. Returns null for anything
 * that is not an http(s) URL so text drops are left to the browser.
 *
 * With `peek` (from dragover, where Chrome hides the data) only the
 * advertised types are checked, which is enough to decide whether to
 * accept the drag.
 */
export function readDroppedLink(dt: DataTransfer | null, options: { peek?: boolean } = {}): DroppedLink | null {
  if (!dt) return null;
  const types = Array.from(dt.types || []);
  if (options.peek) {
    return types.includes('text/uri-list') || types.includes('text/plain') ? { title: '', url: '' } : null;
  }
  const raw = (dt.getData('text/uri-list') || dt.getData('text/plain') || '')
    .split(/\r?\n/)
    .map((line) => line.trim())
    .find((line) => line && !line.startsWith('#'));
  if (!raw) return null;
  const url = normalizeHttpUrl(raw);
  if (!url) return null;

  // The dragged anchor's text, when the browser supplied the HTML fragment.
  let title = '';
  const html = dt.getData('text/html');
  if (html) {
    const doc = new DOMParser().parseFromString(html, 'text/html');
    title = (doc.querySelector('a')?.textContent || doc.body?.textContent || '').trim();
  }
  if (!title || title.length > 60 || /^https?:\/\//i.test(title)) title = hostnameOf(url).replace(/^www\./, '');
  return { title, url };
}
