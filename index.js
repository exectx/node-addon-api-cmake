'use strict';
/**
 * index.js
 * Loads the compiled .node binary from the CMake build output directory.
 */

const path = require('path');
const fs   = require('fs');

const candidates = [
  path.join(__dirname, 'build', 'addon.node'),
  path.join(__dirname, 'build', 'Release', 'addon.node'),
  path.join(__dirname, 'build', 'Debug',   'addon.node'),
];

let addon;
for (const p of candidates) {
  if (fs.existsSync(p)) { addon = require(p); break; }
}

if (!addon) {
  throw new Error(
    'Could not find addon.node. Did you run `npm run build`?\n' +
    `Searched:\n${candidates.map(p => '  ' + p).join('\n')}`
  );
}

module.exports = addon;
