import { test } from 'node:test';
import assert from 'node:assert/strict';
import plugin from '../lib/plugin.js';

const source = `See [@paper], again [@paper].

{% bibtex begin %}
@article{paper,
  author={Doe, Jane}, title={A Sample Paper}, year={2026},
  journal={Test Journal}, doi={10.1234/example}, url={https://example.org/paper.pdf}
}
{% bibtex end %}`;

test('default references retain external links without backlinks', async () => {
  const html = await plugin.render(source);
  assert.match(html, /href="https:\/\/doi.org\/10.1234\/example"/);
  assert.match(html, /href="https:\/\/example.org\/paper.pdf"/);
  assert.match(html, /https:\/\/scholar.google.com\/scholar\?q=A%20Sample%20Paper/);
  assert.match(html, /doc-biblioref/);
  assert.doesNotMatch(html, /doc-backlink|class="reference-backlinks"/);
});

test('each external link can be disabled independently', async () => {
  const patterns = { doi: /href="https:\/\/doi.org\//, url: /href="https:\/\/example.org\//, google_scholar: /href="https:\/\/scholar.google.com\// };
  for (const disabled of Object.keys(patterns)) {
    const html = await plugin.render(source, { references: { links: { [disabled]: false } } });
    for (const [name, pattern] of Object.entries(patterns)) {
      if (name === disabled) assert.doesNotMatch(html, pattern);
      else assert.match(html, pattern);
    }
  }
});

test('backlinks are opt-in, titles are escaped, and options do not leak', async () => {
  const html = await plugin.render(source, { references: {
    backlinks: true, title: '<参考文献>', links: { doi: false, url: false, google_scholar: false }
  } });
  assert.equal((html.match(/role="doc-backlink"/g) || []).length, 2);
  assert.match(html, /&lt;参考文献&gt;/);
  assert.doesNotMatch(html, /class="reference-links"/);
  assert.doesNotMatch(await plugin.render(source), /doc-backlink/);
  await assert.rejects(plugin.render(source, { references: { backlinks: 'false' } }), /must be a boolean/);
  await assert.rejects(plugin.render(source, { references: { links: null } }), /must be an object/);
});

test('Hexo config reaches both post hooks and explicit renderer', async () => {
  const filters = {}, renderers = {};
  plugin.register({
    config: { math_enhance: { references: { title: '文献', links: { google_scholar: false } } } },
    source_dir: '/notes/',
    extend: {
      injector: { register() {} },
      generator: { register() {} },
      filter: { register: (name, fn) => { filters[name] = fn; } },
      renderer: { register: (name, output, fn) => { renderers[name] = fn; } }
    }
  });
  const data = { source: 'sample.md', content: source, math_enhance: true };
  await filters.before_post_render(data);
  filters.after_post_render(data);
  const direct = await renderers.mathenhance({ text: source });
  for (const html of [data.content, direct]) {
    assert.match(html, />文献<\/h2>/);
    assert.doesNotMatch(html, /scholar.google.com|doc-backlink/);
    assert.match(html, /doi.org/);
  }
});
