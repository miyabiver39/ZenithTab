import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const pkgPath = path.resolve('package.json');
const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
const version = pkg.version;

const distDir = path.resolve('dist');
if (!fs.existsSync(distDir) || !fs.existsSync(path.join(distDir, 'manifest.json'))) {
  console.log('dist directory not found or incomplete. Building project first...');
  execSync('npm run build', { stdio: 'inherit' });
}

const releaseDir = path.resolve('release');
if (!fs.existsSync(releaseDir)) {
  fs.mkdirSync(releaseDir, { recursive: true });
}

const zipFileName = `zenith-tab-v${version}.zip`;
const zipFilePath = path.join(releaseDir, zipFileName);
const rootZipFilePath = path.join(path.resolve('.'), zipFileName);

// Remove existing archives if any
if (fs.existsSync(zipFilePath)) fs.unlinkSync(zipFilePath);
if (fs.existsSync(rootZipFilePath)) fs.unlinkSync(rootZipFilePath);

console.log(`Packaging ZenithTab v${version}...`);

try {
  execSync(`cd dist && zip -r "${zipFilePath}" ./*`, { stdio: 'inherit' });
  // Also copy to root for convenience
  fs.copyFileSync(zipFilePath, rootZipFilePath);

  const stats = fs.statSync(zipFilePath);
  const sizeKB = (stats.size / 1024).toFixed(2);

  console.log('\n========================================');
  console.log(`🎉 ZenithTab Extension Package Created!`);
  console.log(`📦 File: ${zipFileName}`);
  console.log(`📍 Location: ${zipFilePath}`);
  console.log(`📍 Root Copy: ${rootZipFilePath}`);
  console.log(`📊 Size: ${sizeKB} KB`);
  console.log('========================================\n');
  console.log('Installation options:');
  console.log(' 1. Chrome Unpacked: Open chrome://extensions/ -> Developer mode ON -> "Load unpacked" -> select "dist/" folder');
  console.log(' 2. Zip Distribution: Extract zenith-tab-v' + version + '.zip and load unpacked, or upload directly to Chrome Web Store Developer Dashboard.');
} catch (error) {
  console.error('Packaging failed:', error.message);
  process.exit(1);
}
