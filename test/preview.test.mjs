import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import Hexo from 'hexo';
import { stripHTML } from 'hexo-util';
import plugin from '../lib/plugin.js';

test('theme auto excerpts contain prose, not stylesheet or hidden controls', async () => {
  const html = await plugin.render('这是文章摘要。$x=1$\n\n<!-- more -->\n\n\\[x^2=1\\]');
  const preview = stripHTML(html).replace(/\n/g, ' ');
  assert.ok(preview.startsWith('这是文章摘要。'));
  assert.doesNotMatch(preview, /mjx-container|font-face|base64|Copy LaTeX|overflow/);
  assert.doesNotMatch(html, /<style|<script|<button/);
  assert.match(html, /<svg/);
});

test('assets are generated even for cached posts and injected only into enhanced pages', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'math-enhance-preview-'));
  const hexo = new Hexo(dir, { silent: true });
  try {
    await hexo.init();
    hexo.config.meta_generator = false;
    hexo.config.root = '/blog/';
    plugin.register(hexo);
    const assets = await hexo.extend.generator.get('math-enhance-assets').call(hexo);
    assert.match(assets.find(x => x.path.endsWith('.css')).data, /\.math-enhance/);
    assert.match(assets.find(x => x.path.endsWith('.js')).data, /innerHeight \/ 2/);
    const page = '<html><head></head><body><div class="math-enhance">正文</div><script>const template = `</body></html>`;</script></body></html>';
    // Hexo stores the public after_render:html hook under this internal alias.
    const html = await hexo.execFilter('_after_html_render', page, { context: hexo });
    assert.match(html, /href="\/blog\/css\/math-enhance.css"/);
    assert.match(html, /src="\/blog\/js\/math-enhance.js"/);
    assert.ok(html.indexOf('src="/blog/js/math-enhance.js"') < html.indexOf('</head>'));
    assert.ok(html.includes('const template = `</body></html>`;'));
    assert.equal(await hexo.execFilter('_after_html_render', html, { context: hexo }), html);
    const legacy = '<html><head></head><body>普通文章</body></html>';
    assert.equal(await hexo.execFilter('_after_html_render', legacy, { context: hexo }), legacy);
  } finally { await hexo.exit(); await rm(dir, { recursive: true, force: true }); }
});
