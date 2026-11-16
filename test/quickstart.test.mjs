import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import plugin from '../lib/plugin.js';

test('packaged quickstart resolves its bibliography and keeps code literal', async () => {
  const file = new URL('../examples/quickstart/quickstart.md', import.meta.url);
  const source = (await readFile(file, 'utf8')).replace(/^---\n[\s\S]*?\n---\n/, '');
  const html = await plugin.render(source, { path: fileURLToPath(file) });
  assert.match(html, /<svg/);
  assert.match(html, /statement theorem/);
  assert.match(html, /An External Example/);
  assert.match(html, /An Embedded Example/);
  assert.match(html, /this-file-is-not-opened.bib/);
  assert.doesNotMatch(html, /<style|Copy LaTeX/);
});
