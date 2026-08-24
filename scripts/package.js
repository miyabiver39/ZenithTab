import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { zipDirectory } from './lib/zip.js';
import { verifyBuild } from './verify-build.js';

const pkg = JSON.parse(fs.readFileSync(path.resolve('package.json'), 'utf-8'));
const version = pkg.version;

const distDir = path.resolve('dist');
if (!fs.existsSync(distDir) || !fs.existsSync(path.join(distDir, 'manifest.json'))) {
  console.log('dist/ not found or incomplete. Building project first...');
  execSync('npm run build', { stdio: 'inherit' });
}

// Never ship an archive we have not checked. A broken manifest costs days of
// Chrome Web Store review time, so it is worth failing loudly right here.
const { errors } = verifyBuild(distDir, { version });
if (errors.length > 0) {
  console.error('\nRefusing to package: the build did not pass verification.');
  process.exit(1);
}

const releaseDir = path.resolve('release');
const zipFileName = `zenith-tab-v${version}.zip`;
const zipFilePath = path.join(releaseDir, zipFileName);

if (fs.existsSync(zipFilePath)) fs.unlinkSync(zipFilePath);

console.log(`\nPackaging ZenithTab v${version}...`);

try {
  const entries = zipDirectory(distDir, zipFilePath);
  const sizeKB = (fs.statSync(zipFilePath).size / 1024).toFixed(2);

  console.log('========================================');
  console.log('ZenithTab extension package created');
  console.log(`  File:    ${zipFileName}`);
  console.log(`  Path:    ${zipFilePath}`);
  console.log(`  Entries: ${entries.length}`);
  console.log(`  Size:    ${sizeKB} KB`);
  console.log('========================================\n');
  console.log('Next steps:');
  console.log('  - Local test: chrome://extensions -> Developer mode -> "Load unpacked" -> select dist/');
  console.log(`  - Store upload: upload release/${zipFileName} in the Chrome Web Store Developer Dashboard`);
} catch (error) {
  console.error('Packaging failed:', error.message);
  process.exit(1);
}
