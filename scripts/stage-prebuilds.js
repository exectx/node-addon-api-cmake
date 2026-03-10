'use strict';

const fs = require('fs');
const path = require('path');

const repoRoot = path.resolve(__dirname, '..');
const artifactsRoot = path.resolve(repoRoot, process.argv[2] || 'artifacts');
const prebuildsRoot = path.join(repoRoot, 'prebuilds');
const targets = [
  'darwin-universal',
  'win32-ia32',
  'win32-x64',
  'win32-arm64',
];

if (!fs.existsSync(artifactsRoot)) {
  throw new Error(`Artifacts directory not found: ${artifactsRoot}`);
}

fs.rmSync(prebuildsRoot, { recursive: true, force: true });

for (const target of targets) {
  const source = path.join(artifactsRoot, target, 'addon.node');
  const destination = path.join(prebuildsRoot, target, 'addon.node');

  if (!fs.existsSync(source)) {
    throw new Error(`Missing prebuilt artifact: ${source}`);
  }

  fs.mkdirSync(path.dirname(destination), { recursive: true });
  fs.copyFileSync(source, destination);
  console.log(`Staged ${target}`);
}
