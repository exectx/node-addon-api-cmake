'use strict';

const path = require('path');
const fs = require('fs');

function getPrebuildFolder(platform, arch) {
  if (platform === 'darwin' && (arch === 'x64' || arch === 'arm64')) {
    return 'darwin-universal';
  }

  if (platform === 'win32') {
    if (arch === 'ia32') {
      return 'win32-ia32';
    }

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
const prebuildFolder = getPrebuildFolder(process.platform, process.arch);

if (prebuildFolder) {
  candidates.push(path.join(__dirname, 'prebuilds', prebuildFolder, 'addon.node'));
}

candidates.push(
  path.join(__dirname, 'build', 'addon.node'),
  path.join(__dirname, 'build', 'Release', 'addon.node'),
  path.join(__dirname, 'build', 'Debug', 'addon.node')
);

let addon;
for (const p of candidates) {
  if (fs.existsSync(p)) {
    addon = require(p);
    break;
  }
}

if (!addon) {
  const platformLabel = `${process.platform}-${process.arch}`;
  const prebuildMessage = prebuildFolder
    ? `No bundled prebuild matched ${platformLabel}.`
    : `Platform ${platformLabel} is not packaged by this module.`;

  throw new Error(
    `${prebuildMessage} For local development, run \`npm run build\`.\n` +
    `Searched:\n${candidates.map(p => '  ' + p).join('\n')}`
  );
}

module.exports = addon;
