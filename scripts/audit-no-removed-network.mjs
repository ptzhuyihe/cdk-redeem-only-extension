import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const ROOT_DIR = process.cwd();
const TARGET_FILES = [
  'background.js',
  'background/message-router.js',
  'sidepanel/sidepanel.js',
  'sidepanel/sidepanel.html',
  'sidepanel/styles/settings.css',
  'scripts/audit-smoke-tests.mjs',
];

const REMNANT_PATTERNS = [
  { label: 'removedNetwork identifier', pattern: /removedNetwork/ },
  { label: 'RemovedNetwork identifier', pattern: /RemovedNetwork/ },
  { label: 'REMOVED_NETWORK constant', pattern: /REMOVED_NETWORK/ },
  { label: 'removed-network token', pattern: /removed-network/i },
  { label: 'Removed Network label', pattern: /Removed\s+Network/i },
  { label: 'IP proxy pool text', pattern: /(?:IP\s*代理|IP\s*proxy|proxy\s+pool|代理池)/i },
];

const matches = [];

for (const relativePath of TARGET_FILES) {
  const absolutePath = path.join(ROOT_DIR, relativePath);
  if (!fs.existsSync(absolutePath)) {
    throw new Error(`Missing audit target: ${relativePath}`);
  }

  const lines = fs.readFileSync(absolutePath, 'utf8').split(/\r?\n/);
  lines.forEach((line, index) => {
    for (const { label, pattern } of REMNANT_PATTERNS) {
      if (pattern.test(line)) {
        matches.push({
          file: relativePath,
          line: index + 1,
          label,
          text: line.trim(),
        });
      }
    }
  });
}

if (matches.length) {
  console.error('Removed Network remnants found:');
  for (const match of matches) {
    console.error(`${match.file}:${match.line}: ${match.label}: ${match.text}`);
  }
  process.exit(1);
}

console.log('No Removed Network remnants found.');
