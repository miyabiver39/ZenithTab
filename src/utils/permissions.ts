/**
 * Optional host-permission helpers.
 *
 * ZenithTab ships with a deliberately small set of granted hosts so that the
 * Chrome Web Store review stays fast and users are not asked to trust the whole
 * web up front. Anything the user points us at afterwards — a custom RSS/Atom
 * feed, for example — is requested at the moment they add it, one origin at a
 * time, via `optional_host_permissions`.
 */

interface PermissionsApi {
  contains(permissions: { origins?: string[]; permissions?: string[] }): Promise<boolean>;
  request(permissions: { origins?: string[]; permissions?: string[] }): Promise<boolean>;
}

function permissionsApi(): PermissionsApi | undefined {
  if (typeof chrome === 'undefined') return undefined;
  const api = (chrome as any).permissions;
  return api && typeof api.contains === 'function' ? (api as PermissionsApi) : undefined;
}

/** Turns any absolute URL into the `https://host/*` match pattern Chrome expects. */
export function originPatternFor(url: string): string | null {
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') return null;
    return `${parsed.protocol}//${parsed.hostname}/*`;
  } catch {
    return null;
  }
}

/**
 * True when we may fetch this URL. Hosts listed in `host_permissions` are
 * already granted, so this also covers the built-in news feed.
 */
export async function hasHostPermission(url: string): Promise<boolean> {
  const api = permissionsApi();
  const pattern = originPatternFor(url);
  if (!pattern) return false;
  // Outside the extension context (unit tests, dev server) there is nothing to
  // gate, so treat access as available and let fetch decide.
  if (!api) return true;

  try {
    return await api.contains({ origins: [pattern] });
  } catch {
    return false;
  }
}

/**
 * True when every listed API permission (e.g. "topSites") is granted.
 * Optional API permissions are the same story as optional hosts: declared
 * in `optional_permissions`, requested only when a feature needs them, so
 * an update never adds a warning that would disable the extension.
 */
export async function hasApiPermissions(permissions: string[]): Promise<boolean> {
  const api = permissionsApi();
  if (!api) return true;
  try {
    return await api.contains({ permissions });
  } catch {
    return false;
  }
}

/** Asks for API permissions. MUST run synchronously from a user gesture. */
export async function requestApiPermissions(permissions: string[]): Promise<boolean> {
  const api = permissionsApi();
  if (!api) return true;
  try {
    return await api.request({ permissions });
  } catch (error) {
    console.warn('[ZenithTab] Permission request failed:', error);
    return false;
  }
}

/**
 * Asks for several origins in one prompt (Chrome shows one dialog listing
 * them all). Same user-gesture rule as `requestHostPermission`.
 */
export async function requestHostPermissions(urls: string[]): Promise<boolean> {
  const api = permissionsApi();
  const origins = Array.from(new Set(urls.map(originPatternFor).filter((p): p is string => p !== null)));
  if (origins.length === 0) return false;
  if (!api) return true;

  try {
    return await api.request({ origins });
  } catch (error) {
    console.warn('[ZenithTab] Host permission request failed:', error);
    return false;
  }
}

/**
 * Asks the user to grant access to a single origin.
 * MUST be called synchronously from a user gesture (click / form submit),
 * otherwise Chrome rejects the request without showing a prompt.
 */
export async function requestHostPermission(url: string): Promise<boolean> {
  const api = permissionsApi();
  const pattern = originPatternFor(url);
  if (!pattern) return false;
  if (!api) return true;

  try {
    return await api.request({ origins: [pattern] });
  } catch (error) {
    console.warn('[ZenithTab] Host permission request failed:', error);
    return false;
  }
}
