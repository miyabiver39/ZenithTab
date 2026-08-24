import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

/**
 * Post-build sanity check for the packed extension.
 *
 * Most Chrome Web Store rejections that are not policy calls come from a
 * manifest that points at a file the bundler did not emit, or metadata that
 * drifted away from the code. Those are cheap to catch here and expensive to
 * discover after a multi-day review, so `npm run build` should always be
 * followed by this.
 *
 * Usage: node scripts/verify-build.js [distDir]
 */

const EXPECTED_LOCALES = ['en', 'ja', 'zh_CN', 'es', 'fr', 'de', 'ko'];
const REQUIRED_MESSAGE_KEYS = ['extName', 'extDescription'];

// Chrome Web Store limits.
const MAX_NAME_LENGTH = 45;
const MAX_DESCRIPTION_LENGTH = 132;

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, 'utf-8'));
}

export function verifyBuild(distDir, options = {}) {
  const errors = [];
  const warnings = [];
  const notes = [];

  const manifestPath = path.join(distDir, 'manifest.json');
  if (!fs.existsSync(manifestPath)) {
    return { errors: [`dist/manifest.json is missing — did the build run?`], warnings, notes };
  }

  let manifest;
  try {
    manifest = readJson(manifestPath);
  } catch (error) {
    return { errors: [`dist/manifest.json is not valid JSON: ${error.message}`], warnings, notes };
  }

  notes.push(`manifest_version: ${manifest.manifest_version}`);
  notes.push(`version: ${manifest.version}`);

  if (options.version && manifest.version !== options.version) {
    errors.push(
      `Version mismatch: package.json is ${options.version} but dist/manifest.json is ${manifest.version}. Run "npm run version:bump <version>" so both stay in step.`
    );
  }

  // --- Referenced files must actually exist in the bundle -------------------
  const referenced = [];

  for (const [size, iconPath] of Object.entries(manifest.icons || {})) {
    referenced.push([`icons.${size}`, iconPath]);
  }
  if (manifest.chrome_url_overrides?.newtab) {
    referenced.push(['chrome_url_overrides.newtab', manifest.chrome_url_overrides.newtab]);
  }
  if (manifest.background?.service_worker) {
    referenced.push(['background.service_worker', manifest.background.service_worker]);
  }

  for (const [label, relativePath] of referenced) {
    const target = path.join(distDir, relativePath);
    if (!fs.existsSync(target)) {
      errors.push(`${label} points at "${relativePath}", which does not exist in dist/.`);
    }
  }

  // A TypeScript path surviving into the packed manifest means the bundler did
  // not rewrite the entry point — Chrome cannot execute it.
  const manifestText = JSON.stringify(manifest);
  if (/\.tsx?"/.test(manifestText)) {
    errors.push('dist/manifest.json still references a .ts/.tsx source file; the bundler did not rewrite the entry point.');
  }

  // --- Localisation ---------------------------------------------------------
  const usesMessages = /^__MSG_(.+)__$/.test(manifest.name || '') || /^__MSG_(.+)__$/.test(manifest.description || '');

  if (usesMessages && !manifest.default_locale) {
    errors.push('manifest uses __MSG_* placeholders but does not declare "default_locale".');
  }

  if (manifest.default_locale) {
    const localesDir = path.join(distDir, '_locales');
    if (!fs.existsSync(localesDir)) {
      errors.push('"default_locale" is set but dist/_locales/ is missing — Chrome will refuse to load the extension.');
    } else {
      const present = fs.readdirSync(localesDir).filter((entry) =>
        fs.statSync(path.join(localesDir, entry)).isDirectory()
      );

      if (!present.includes(manifest.default_locale)) {
        errors.push(`default_locale is "${manifest.default_locale}" but dist/_locales/${manifest.default_locale}/ does not exist.`);
      }

      for (const locale of EXPECTED_LOCALES) {
        if (!present.includes(locale)) {
          warnings.push(`No store listing translation for "${locale}" (dist/_locales/${locale}/messages.json).`);
        }
      }

      for (const locale of present) {
        const messagesPath = path.join(localesDir, locale, 'messages.json');
        if (!fs.existsSync(messagesPath)) {
          errors.push(`dist/_locales/${locale}/messages.json is missing.`);
          continue;
        }

        let messages;
        try {
          messages = readJson(messagesPath);
        } catch (error) {
          errors.push(`dist/_locales/${locale}/messages.json is not valid JSON: ${error.message}`);
          continue;
        }

        for (const key of REQUIRED_MESSAGE_KEYS) {
          if (!messages[key]?.message) {
            errors.push(`dist/_locales/${locale}/messages.json is missing the "${key}" message.`);
          }
        }

        const name = messages.extName?.message;
        const description = messages.extDescription?.message;

        if (name && [...name].length > MAX_NAME_LENGTH) {
          errors.push(`extName for "${locale}" is ${[...name].length} characters; the store limit is ${MAX_NAME_LENGTH}.`);
        }
        if (description && [...description].length > MAX_DESCRIPTION_LENGTH) {
          errors.push(
            `extDescription for "${locale}" is ${[...description].length} characters; the store limit is ${MAX_DESCRIPTION_LENGTH}.`
          );
        }
      }
    }
  }

  // --- Permissions ----------------------------------------------------------
  const permissions = manifest.permissions || [];
  notes.push(`permissions: ${permissions.join(', ') || '(none)'}`);
  notes.push(`host_permissions: ${(manifest.host_permissions || []).length}`);
  notes.push(`optional_host_permissions: ${(manifest.optional_host_permissions || []).length}`);

  // The weather widget calls navigator.geolocation, which extension pages can
  // only use when the permission is declared — there is no prompt to fall back
  // on, so a missing entry silently breaks the feature.
  if (!permissions.includes('geolocation')) {
    warnings.push('"geolocation" is not in permissions; the weather widget\'s location detection will fail.');
  }

  const broadHostGrant = (manifest.host_permissions || []).some((pattern) =>
    pattern.includes('://*/*') || pattern === '<all_urls>'
  );
  if (broadHostGrant) {
    warnings.push('host_permissions contains a broad match pattern, which lengthens Chrome Web Store review. Prefer optional_host_permissions.');
  }

  // --- Bundle size ----------------------------------------------------------
  const totalBytes = walkSize(distDir);
  notes.push(`unpacked size: ${(totalBytes / 1024 / 1024).toFixed(2)} MB`);

  return { errors, warnings, notes, manifest };
}

function walkSize(dir) {
  let total = 0;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) total += walkSize(full);
    else if (entry.isFile()) total += fs.statSync(full).size;
  }
  return total;
}

function main() {
  const distDir = path.resolve(process.argv[2] || 'dist');
  let expectedVersion;
  try {
    expectedVersion = JSON.parse(fs.readFileSync(path.resolve('package.json'), 'utf-8')).version;
  } catch {
    expectedVersion = undefined;
  }

  const { errors, warnings, notes } = verifyBuild(distDir, { version: expectedVersion });

  console.log(`\nVerifying ${distDir}\n`);
  for (const note of notes) console.log(`  · ${note}`);

  if (warnings.length > 0) {
    console.log('\nWarnings:');
    for (const warning of warnings) console.log(`  ! ${warning}`);
  }

  if (errors.length > 0) {
    console.log('\nErrors:');
    for (const error of errors) console.log(`  x ${error}`);
    console.log(`\nBuild verification FAILED (${errors.length} error(s)).\n`);
    process.exit(1);
  }

  console.log(`\nBuild verification passed${warnings.length ? ` with ${warnings.length} warning(s)` : ''}.\n`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main();
}
