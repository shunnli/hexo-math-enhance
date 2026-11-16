import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import Hexo from 'hexo';
import plugin from '../lib/plugin.js';

test('math, nested statements, references and literal code', async () => {
  const html = await plugin.render(String.raw`
See \(\eqref{eq:e}\).

\begin{align}
E &= mc^2 \label{eq:e}
\end{align}

{% theorem begin Test %}
**Strong** and $x$.

{% proof begin %}
Done.
{% proof end %}
{% theorem end %}

See [@book].

{% bibtex begin %}
@book{book, author={Doe, Jane}, title={Test Book}, year={2026}, publisher={Press}}
{% bibtex end %}

${'`{% theorem begin literal %}`'}

~~~tex
\begin{align}
[@missing]
{% invalid begin %}
~~~
`);
  assert.match(html, /<svg/);
  assert.match(html, /class="statement theorem"/);
  assert.match(html, /class="statement proof"/);
  assert.match(html, /<strong>Strong<\/strong>/);
  assert.match(html, /Test Book/);
  assert.match(html, /doc-biblioref/);
  assert.match(html, /\[@missing\]/);
  assert.doesNotMatch(html, /data-mjx-error/);
});

test('external BibLaTeX data and actionable failures', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'math-enhance-bib-'));
  try {
    await writeFile(join(dir, 'refs.bib'), '@book{book, author={Doe, Jane}, title={External Book}, date={2024-01-01}, publisher={Press}}');
    const html = await plugin.render('See [@book].\n\n{% bibtex file refs.bib %}', { path: join(dir, 'post.md') });
    assert.match(html, /External Book/);
    assert.match(html, /2024/);
    await assert.rejects(plugin.render('[@missing]'), /Unknown citation key/);
    await assert.rejects(plugin.render('{% theorem begin %}\nUnclosed'), /Unclosed/);
    await assert.rejects(plugin.render('$\\unknowncommand{x}$'), /LaTeX/);
    assert.match(await plugin.render('$x$'), /<svg/); // Failure does not poison queue.
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test('document state and IDs are isolated under concurrent renders', async () => {
  const source = String.raw`\begin{equation}
x=1 \label{eq:x}
\end{equation}

\(\eqref{eq:x}\)`;
  const results = await Promise.all(['a', 'b'].map(name => plugin.render(source, { path: name + '.md' })));
  const ids = results.map(html => [...html.matchAll(/\bid="([^"]+)"/g)].map(m => m[1]));
  assert.ok(ids[0].length);
  assert.ok(!ids[0].some(id => ids[1].includes(id)));
  for (const html of results) assert.doesNotMatch(html, /data-mjx-error/);
});

test('real Hexo pipeline preserves opt-out, tags, excerpts and downstream filters', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'math-enhance-hexo-'));
  const hexo = new Hexo(dir, { silent: true });
  try {
    await hexo.init();
    // Minimal legacy renderer allows us to detect whether delegation occurred.
    hexo.extend.renderer.register('md', 'html', data => `<p>LEGACY:${data.text}</p>`, true);
    plugin.register(hexo);
    hexo.extend.filter.register('after_post_render', data => {
      data.downstreamSawSvg = data.content.includes('<svg');
      return data;
    }, 5);
    const source = join(dir, 'source/post.md');
    const content = 'Intro $x$.\n\n<!-- more -->\n\n{% theorem begin %}\nBody.\n{% theorem end %}\n\n`{{ literal }}`';
    const result = await hexo.post.render(source, { source: 'post.md', math_enhance: true, content });
    assert.ok(result.downstreamSawSvg);
    assert.match(result.content, /statement theorem/);
    assert.match(result.content, /\{\{ literal \}\}/);
    assert.match(result.excerpt, /<svg/);
    assert.doesNotMatch(result.excerpt, /statement theorem/);
    assert.match(result.more, /statement theorem/);
    assert.doesNotMatch(result.content, /LEGACY:/);
    for (const value of [false, undefined]) {
      const legacy = await hexo.post.render(source, { source: 'post.md', math_enhance: value, content: 'plain' });
      assert.match(legacy.content, /LEGACY:plain/);
    }
    const direct = await hexo.render.render({ text: '$x$', engine: 'mathenhance' });
    assert.match(direct, /<svg/);
    const code = await hexo.post.render(source, {
      source: 'post.md', math_enhance: true,
      content: '```js\nconst answer = 42;\n```'
    });
    assert.match(code.content, /<figure class="highlight/);
    assert.doesNotMatch(code.content, /class="code-block"|copy-code|code-toolbar/);
  } finally {
    await hexo.exit();
    await rm(dir, { recursive: true, force: true });
  }
});

test('article boolean overrides the site default in both directions', () => {
  assert.equal(plugin.enabled({}, { enable: false }), false);
  assert.equal(plugin.enabled({ math_enhance: true }, { enable: false }), true);
  assert.equal(plugin.enabled({}, { enable: true }), true);
  assert.equal(plugin.enabled({ math_enhance: false }, { enable: true }), false);
  assert.equal(plugin.enabled({ math_enhance: true }, { enable: true }), true);
  assert.equal(plugin.enabled({ math_enhance: false }, { enable: false }), false);
  assert.throws(() => plugin.register({ config: { math_enhance: { enable: 'false' } } }), /enable must be a boolean/);
});
