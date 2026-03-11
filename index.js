'use strict';

const path = require('path');
const fs = require('fs');
const packageName = require('./package.json').name;

function getTarget(platform, arch) {
  if (platform === 'darwin' && (arch === 'x64' || arch === 'arm64')) {
    return 'darwin-universal';
  }

  if (platform === 'win32') {
    if (arch === 'x64') {
      return 'win32-x64';
    }

    if (arch === 'arm64') {
      return 'win32-arm64';
    }
  }

  return null;
}

const candidates = [];
const target = getTarget(process.platform, process.arch);
let addon;
let loadError = null;

candidates.push(
  path.join(__dirname, 'build', 'addon.node'),
  path.join(__dirname, 'build', 'Release', 'addon.node'),
  path.join(__dirname, 'build', 'Debug', 'addon.node')
);

if (target) {
  candidates.push(
    path.join(__dirname, `addon.${target}.node`),
    path.join(__dirname, 'npm', target, 'addon.node')
  );
}

for (const p of candidates) {
  if (!fs.existsSync(p)) {
    continue;
  }

  try {
    addon = require(p);
    break;
  } catch (error) {
    loadError = error;
  }
}

if (!addon && target) {
  try {
    addon = require(`${packageName}-${target}`);
  } catch (error) {
    loadError = error;
  }
}

if (!addon) {
  const platformLabel = `${process.platform}-${process.arch}`;
  const packageLabel = target ? `${packageName}-${target}` : 'n/a';
  const targetMessage = target
    ? `No native package matched ${platformLabel}.`
    : `Platform ${platformLabel} is not packaged by this module.`;

  if (loadError) {
    loadError.message = `${targetMessage} Tried local binaries and package ${packageLabel}.\n${loadError.message}`;
    throw loadError;
  }

  throw new Error(
    `${targetMessage} For local development, run \`npm run build\`.\n` +
    `Searched:\n${candidates.map(p => '  ' + p).join('\n')}\n` +
    `Package: ${packageLabel}`
  );
}

module.exports = addon;
