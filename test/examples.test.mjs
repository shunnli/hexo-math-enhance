import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import plugin from '../lib/plugin.js';

const examples = [
  ['matrix-analysis', /data-mml-node="mtable"/, 10],
  ['nested-statements', /statement lemma/, 8]
];

for (const [name, expected, minimumMathCount] of examples) {
  test('synthetic article: ' + name, async () => {
    const file = new URL('../examples/' + name + '.md', import.meta.url);
    const source = (await readFile(file, 'utf8')).replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n/, '');
    const html = await plugin.render(source, { path: file.pathname });
    assert.match(html, expected);
    assert.ok((html.match(/<mjx-container/g) || []).length >= minimumMathCount);
    assert.doesNotMatch(html, /data-mjx-error/);
    // Every generated local hyperlink must resolve, including SVG glyph uses.
    const ids = new Set([...html.matchAll(/\bid="([^"]+)"/g)].map(match => match[1]));
    for (const match of html.matchAll(/\b(?:xlink:)?href="#([^"]+)"/g)) {
      assert.ok(ids.has(decodeURIComponent(match[1])), 'Unresolved anchor: ' + match[1]);
    }
  });
}
