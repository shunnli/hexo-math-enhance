import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import plugin from '../lib/plugin.js';

test('file markers mix with embedded entries anywhere in the body', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'math-enhance-files-'));
  try {
    await writeFile(join(dir, 'first refs.bib'), '@book{a, title={External First}, date={2025}, author={Doe, Jane}}');
    await writeFile(join(dir, 'second.bib'), '@book{b, title={External Second}, year={2026}, author={Doe, Jane}}');
    const source = `[@a; @b; @c].

{% bibtex file "first refs.bib" %}

Middle paragraph.

{% bibtex begin %}
@book{c, title={Inline Third}, year={2024}, author={Doe, Jane}}
{% bibtex end %}

{% bibtex file second.bib %}

After bibliography data.`;
    const options = { path: join(dir, 'post.md') };
    const html = await plugin.render(source, options);
    for (const title of ['External First', 'External Second', 'Inline Third', 'Middle paragraph', 'After bibliography data']) assert.ok(html.includes(title));
    assert.doesNotMatch(html, /\{% bibtex/);
    await assert.rejects(plugin.render('{% bibtex file missing.bib %}', options), /BibTeX file at line 1/);
    await assert.rejects(plugin.render('{% bibtex file bad.txt %}', options), /must name a .bib file/);
    await assert.rejects(plugin.render(source + '\n\n{% bibtex file second.bib %}', options), /Duplicate BibTeX key/);
    await assert.rejects(plugin.render('{% bibtex file second.bib %}'), /requires an article path/);
  } finally { await rm(dir, { recursive: true, force: true }); }
});

test('file directives in code are never opened', async () => {
  const source = '```text\n{% bibtex file missing.bib %}\n```\n\n`{% bibtex file also-missing.bib %}`';
  const html = await plugin.render(source);
  assert.match(html, /missing.bib/);
  assert.match(html, /also-missing.bib/);
  assert.doesNotMatch(html, /doc-bibliography/);
});
