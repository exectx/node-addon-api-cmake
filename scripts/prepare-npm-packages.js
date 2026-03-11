'use strict';

const fs = require('fs');
const path = require('path');

const repoRoot = path.resolve(__dirname, '..');
const artifactsRoot = path.resolve(repoRoot, process.argv[2] || 'artifacts');
const packageJsonPath = path.join(repoRoot, 'package.json');
const rootPackage = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
const npmRoot = path.join(repoRoot, 'npm');
const targets = {
  'darwin-universal': {
    os: ['darwin'],
    cpu: ['x64', 'arm64'],
  },
  'win32-ia32': {
    os: ['win32'],
    cpu: ['ia32'],
  },
  'win32-x64': {
    os: ['win32'],
    cpu: ['x64'],
  },
  'win32-arm64': {
    os: ['win32'],
    cpu: ['arm64'],
  },
};

const requestedTargets = process.argv.slice(3);
const selectedTargets = requestedTargets.length ? requestedTargets : Object.keys(targets);

for (const target of selectedTargets) {
  if (!targets[target]) {
    throw new Error(`Unknown target: ${target}`);
  }
}

if (!fs.existsSync(artifactsRoot)) {
  throw new Error(`Artifacts directory not found: ${artifactsRoot}`);
}

fs.mkdirSync(npmRoot, { recursive: true });

for (const target of selectedTargets) {
  const targetDir = path.join(npmRoot, target);
  const source = path.join(artifactsRoot, target, 'addon.node');
  const destination = path.join(targetDir, 'addon.node');
  const targetConfig = targets[target];

  if (!fs.existsSync(source)) {
    throw new Error(`Missing prebuilt artifact: ${source}`);
  }

  fs.rmSync(targetDir, { recursive: true, force: true });
  fs.mkdirSync(targetDir, { recursive: true });

  const packageManifest = {
    name: `${rootPackage.name}-${target}`,
    version: rootPackage.version,
    description: `${rootPackage.description} (${target})`,
    main: 'addon.node',
    files: ['addon.node'],
    os: targetConfig.os,
    cpu: targetConfig.cpu,
    license: rootPackage.license,
    repository: rootPackage.repository,
    publishConfig: rootPackage.publishConfig,
  };

  fs.writeFileSync(
    path.join(targetDir, 'package.json'),
    `${JSON.stringify(packageManifest, null, 2)}\n`
  );
  fs.copyFileSync(source, destination);
  console.log(`Prepared ${target}`);
}
