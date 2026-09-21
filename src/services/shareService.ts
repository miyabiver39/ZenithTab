import type { DashboardWidget, DashboardPageData, ResponsiveLayouts } from '../types/widget';
import type { DockItem } from '../types/settings';
import { getWidgetMeta } from '../components/widgets/widgetDefinitions';
import { sanitizeWidget, currentVersion } from './storageService';
import { sanitizeResponsiveLayouts } from '../utils/layout';
import { isSafeHttpUrl } from '../utils/url';
import { uniqueId } from '../utils/id';

/**
 * "Share this layout" codes: one page (widgets + layouts, personal content
 * removed) and optionally the Dock, as JSON → deflate → base64url with a
 * `zt1.` prefix. Short enough for a chat message; under ~2.9 KB it also
 * fits a QR code. Import goes through the same sanitising as a config
 * file and always lands as a *new* page, so a pasted code can never
 * replace anything the recipient has.
 */

export const SHARE_PREFIX = 'zt1.';
/** Uncompressed variant, for environments without CompressionStream. */
const RAW_PREFIX = 'zt1r.';
/** Longest payload the QR renderer will accept comfortably (alphanumeric-ish, level L). */
export const QR_MAX_LENGTH = 2900;

export interface SharePayload {
  v: 1;
  app: string;
  page: { name: string; widgets: DashboardWidget[]; layouts: ResponsiveLayouts };
  dock?: DockItem[];
}

export interface ShareSource {
  pageName: string;
  widgets: DashboardWidget[];
  layouts: ResponsiveLayouts;
  dockItems: DockItem[];
}

/** Widgets with everything personal taken out; unknown types are dropped. */
export function stripWidgetsForShare(widgets: DashboardWidget[]): DashboardWidget[] {
  const out: DashboardWidget[] = [];
  for (const widget of widgets) {
    const meta = getWidgetMeta(widget.type);
    if (!meta) continue;
    const config = meta.stripForShare ? meta.stripForShare({ ...widget.config }) : { ...widget.config };
    out.push({ id: widget.id, type: widget.type, title: widget.title, config, layout: widget.layout });
  }
  return out;
}

export function buildSharePayload(source: ShareSource, options: { includeDock: boolean }): SharePayload {
  const widgets = stripWidgetsForShare(source.widgets);
  const keep = new Set(widgets.map((w) => w.id));
  const layouts = Object.fromEntries(
    Object.entries(source.layouts).map(([bp, list]) => [bp, (list || []).filter((l) => keep.has(l.i))])
  ) as ResponsiveLayouts;
  const payload: SharePayload = {
    v: 1,
    app: currentVersion(),
    page: { name: source.pageName, widgets, layouts },
  };
  if (options.includeDock) payload.dock = source.dockItems.map(({ id, label, url, icon, openInNewTab }) => ({ id, label, url, icon, openInNewTab }));
  return payload;
}

// --- Encoding -------------------------------------------------------------

const toBase64Url = (bytes: Uint8Array) => {
  let bin = '';
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
};

const fromBase64Url = (s: string): Uint8Array => {
  const b64 = s.replace(/-/g, '+').replace(/_/g, '/') + '='.repeat((4 - (s.length % 4)) % 4);
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
};

async function pipeThrough(bytes: Uint8Array, stream: GenericTransformStream): Promise<Uint8Array> {
  const source = new ReadableStream<Uint8Array>({
    start(controller) {
      controller.enqueue(bytes);
      controller.close();
    },
  });
  const buffer = await new Response(source.pipeThrough(stream)).arrayBuffer();
  return new Uint8Array(buffer);
}

const hasCompression = () => typeof CompressionStream === 'function' && typeof DecompressionStream === 'function';

export async function encodeShareCode(payload: SharePayload): Promise<string> {
  const json = new TextEncoder().encode(JSON.stringify(payload));
  if (!hasCompression()) return RAW_PREFIX + toBase64Url(json);
  const packed = await pipeThrough(json, new CompressionStream('deflate-raw'));
  return SHARE_PREFIX + toBase64Url(packed);
}

export class InvalidShareCode extends Error {
  constructor() {
    super('Not a ZenithTab share code.');
    this.name = 'InvalidShareCode';
  }
}

/** Parses and sanitises a code. Throws InvalidShareCode for anything that isn't one. */
export async function decodeShareCode(input: string): Promise<SharePayload> {
  const code = input.trim().replace(/\s+/g, '');
  let bytes: Uint8Array;
  try {
    if (code.startsWith(SHARE_PREFIX)) {
      if (!hasCompression()) throw new InvalidShareCode();
      bytes = await pipeThrough(fromBase64Url(code.slice(SHARE_PREFIX.length)), new DecompressionStream('deflate-raw'));
    } else if (code.startsWith(RAW_PREFIX)) {
      bytes = fromBase64Url(code.slice(RAW_PREFIX.length));
    } else {
      throw new InvalidShareCode();
    }
    const parsed = JSON.parse(new TextDecoder().decode(bytes));
    return sanitizePayload(parsed);
  } catch (err) {
    if (err instanceof InvalidShareCode) throw err;
    throw new InvalidShareCode();
  }
}

function sanitizePayload(raw: any): SharePayload {
  if (!raw || raw.v !== 1 || !raw.page || !Array.isArray(raw.page.widgets)) throw new InvalidShareCode();
  const widgets = (raw.page.widgets as unknown[]).map(sanitizeWidget).filter((w): w is DashboardWidget => w !== null && !!getWidgetMeta(w.type));
  const layouts = sanitizeResponsiveLayouts(raw.page.layouts || {});
  const payload: SharePayload = {
    v: 1,
    app: typeof raw.app === 'string' ? raw.app : '',
    page: { name: typeof raw.page.name === 'string' ? raw.page.name.slice(0, 60) : '', widgets, layouts },
  };
  if (Array.isArray(raw.dock)) {
    payload.dock = raw.dock.filter(
      (item: any): item is DockItem =>
        !!item && typeof item.id === 'string' && typeof item.label === 'string' && typeof item.icon === 'string' && isSafeHttpUrl(item.url)
    );
  }
  return payload;
}

/** The shared page with fresh widget ids, ready for addPage({ template }). */
export function pageFromPayload(payload: SharePayload): DashboardPageData {
  const idMap = new Map<string, string>();
  const widgets = payload.page.widgets.map((w) => {
    const id = uniqueId(`widget-${w.type}`);
    idMap.set(w.id, id);
    return { ...w, id, layout: { ...w.layout, i: id } };
  });
  const layouts = Object.fromEntries(
    Object.entries(payload.page.layouts).map(([bp, list]) => [bp, (list || []).filter((l) => idMap.has(l.i)).map((l) => ({ ...l, i: idMap.get(l.i)! }))])
  ) as ResponsiveLayouts;
  // A breakpoint the sender never had is derived from the widgets' own layout.
  for (const bp of ['lg', 'md', 'sm', 'xs', 'xxs'] as const) {
    if (!layouts[bp] || layouts[bp].length === 0) layouts[bp] = widgets.map((w) => w.layout);
  }
  return { widgets, layouts };
}
