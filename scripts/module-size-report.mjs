#!/usr/bin/env node
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.resolve(__dirname, '..');

function gitLsFiles(patterns) {
  return execFileSync('git', ['ls-files', ...patterns], {
    cwd: root,
    encoding: 'utf8',
  })
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
}

const files = gitLsFiles(['*.js', '*.mjs', '*.html', '*.css'])
  .map((file) => {
    const absolutePath = path.join(root, file);
    const text = fs.readFileSync(absolutePath, 'utf8');
    return {
      file,
      lines: text.split(/\r?\n/).length,
      bytes: Buffer.byteLength(text),
    };
  })
  .sort((left, right) => right.lines - left.lines || right.bytes - left.bytes);

for (const row of files.slice(0, 30)) {
  console.log(`${String(row.lines).padStart(6)} ${String(row.bytes).padStart(8)} ${row.file}`);
}
