'use strict';

const fs = require('fs');
const path = require('path');

const repoRoot = path.resolve(__dirname, '..');
const packageJsonPath = path.join(repoRoot, 'package.json');
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
const releaseTargets = [
  'darwin-universal',
  'win32-ia32',
  'win32-x64',
  'win32-arm64',
];

packageJson.optionalDependencies = Object.fromEntries(
  releaseTargets.map(target => [`${packageJson.name}-${target}`, packageJson.version])
);

fs.writeFileSync(packageJsonPath, `${JSON.stringify(packageJson, null, 2)}\n`);

console.log(`Synced optionalDependencies to ${packageJson.version}`);
