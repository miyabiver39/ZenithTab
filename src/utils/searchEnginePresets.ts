// Ready-made engines (the former one-click presets) live in
// config/catalog/searchEngineCatalog.ts; this file keeps the URL helper.

const COMMON_QUERY_PARAM_NAMES = ['q', 'p', 'query', 'wd', 'text', 'search', 'keyword', 'k', 's'];

/**
 * Most users won't hand-author a `{query}`-templated URL — they'll paste a
 * real search-results URL copied from their address bar after actually
 * searching something. Detect that case and swap the query parameter's
 * value for the placeholder automatically. Returns null when no confident
 * guess can be made (caller should leave the input untouched).
 */
export function guessSearchUrlTemplate(url: string): string | null {
  const trimmed = url.trim();
  if (!trimmed || trimmed.includes('{query}')) return null;

  let parsed: URL;
  try {
    parsed = new URL(trimmed);
  } catch {
    return null;
  }

  for (const name of COMMON_QUERY_PARAM_NAMES) {
    const value = parsed.searchParams.get(name);
    if (value) {
      parsed.searchParams.set(name, '{query}');
      // URL's own serializer percent-encodes the braces; decode them back
      // so the stored template stays human-readable and still matches the
      // literal "{query}".replace() check used elsewhere.
      return parsed.toString().replace(/%7B/gi, '{').replace(/%7D/gi, '}');
    }
  }

  return null;
}
