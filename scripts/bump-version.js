import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const newVersion = process.argv[2];

if (!newVersion) {
  console.error('Usage: npm run version:bump <new-version> (e.g. npm run version:bump 1.0.1)');
  process.exit(1);
}

const cleanVersion = newVersion.replace(/^v/, '');

// 1. Update package.json
const pkgPath = path.resolve('package.json');
const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
pkg.version = cleanVersion;
fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n');
console.log(`Updated package.json version to ${cleanVersion}`);

// 2. Update manifest.json
const manifestPath = path.resolve('manifest.json');
const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
manifest.version = cleanVersion;
fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + '\n');
console.log(`Updated manifest.json version to ${cleanVersion}`);

// 3. Update package-lock.json's own version fields, otherwise the lockfile
//    keeps reporting the previous release until the next `npm install`.
const lockPath = path.resolve('package-lock.json');
if (fs.existsSync(lockPath)) {
  const lock = JSON.parse(fs.readFileSync(lockPath, 'utf-8'));
  lock.version = cleanVersion;
  if (lock.packages && lock.packages['']) lock.packages[''].version = cleanVersion;
  fs.writeFileSync(lockPath, JSON.stringify(lock, null, 2) + '
');
  console.log(`Updated package-lock.json version to ${cleanVersion}`);
}

// 4. Git commit & tag
try {
  execSync(`git add package.json manifest.json package-lock.json`);
  execSync(`git commit -m "chore(release): bump version to v${cleanVersion}"`);
  execSync(`git tag -a v${cleanVersion} -m "Release v${cleanVersion}"`);
  console.log(`\nCreated Git commit and tag: v${cleanVersion}`);
  console.log(`Run 'git push origin main --tags' to trigger automated GitHub Release build!`);
} catch (err) {
  console.error('Git commit/tagging failed:', err.message);
}
