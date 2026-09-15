import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const pkg = JSON.parse(fs.readFileSync(path.resolve('package.json'), 'utf-8'));
const version = pkg.version;
const releaseDir = path.resolve('release');

if (!fs.existsSync(releaseDir)) {
  fs.mkdirSync(releaseDir, { recursive: true });
}

const sbomFileName = `zenith-tab-v${version}-sbom.cdx.json`;
const sbomFilePath = path.join(releaseDir, sbomFileName);
const standardSbomFilePath = path.join(releaseDir, 'sbom.cdx.json');

console.log(`\nGenerating CycloneDX SBOM for ZenithTab v${version}...`);

try {
  // Generate SBOM omitting devDependencies (focus on production dependencies packaged into the extension)
  execSync(
    `npx cyclonedx-npm --omit dev --output-format JSON --spec-version 1.6 --mc-type application --output-file "${sbomFilePath}"`,
    { stdio: 'inherit' }
  );

  // Also copy to release/sbom.cdx.json as a canonical reference
  fs.copyFileSync(sbomFilePath, standardSbomFilePath);

  const stats = fs.statSync(sbomFilePath);
  const sizeKB = (stats.size / 1024).toFixed(2);

  console.log('========================================');
  console.log('ZenithTab SBOM generated successfully');
  console.log(`  File:    ${sbomFileName}`);
  console.log(`  Path:    ${sbomFilePath}`);
  console.log(`  Size:    ${sizeKB} KB`);
  console.log(`  Format:  CycloneDX JSON 1.6`);
  console.log('========================================\n');
} catch (error) {
  console.error('Failed to generate SBOM:', error.message);
  process.exit(1);
}
