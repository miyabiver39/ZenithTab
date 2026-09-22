// Node module-resolution hook used only by generate-default-titles.mjs.
//
// The i18n locale files import their sibling module without an extension
// (`import { en } from './en'`), which is valid under the project's
// `moduleResolution: bundler` (Vite, tsc) but not under Node's own
// resolver, which requires one. Rather than change the locale files'
// import style just so a maintenance script can run under plain Node,
// this hook retries an unresolvable extensionless relative specifier
// with `.ts` appended.
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

export async function resolve(specifier, context, nextResolve) {
  try {
    return await nextResolve(specifier, context);
  } catch (err) {
    if (err?.code !== 'ERR_MODULE_NOT_FOUND' || !specifier.startsWith('.')) throw err;
    const retried = `${specifier}.ts`;
    const candidateUrl = new URL(retried, context.parentURL);
    if (!existsSync(fileURLToPath(candidateUrl))) throw err;
    return nextResolve(retried, context);
  }
}
