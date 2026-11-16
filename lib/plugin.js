'use strict';

const { readFile } = require('node:fs/promises');
const { readFileSync } = require('node:fs');
const { dirname, resolve, extname } = require('node:path');
const { createHash } = require('node:crypto');
const { referenceOptions, siteOptions } = require('./config');
const renderedContent = Symbol('math-enhance-rendered');
let queue = Promise.resolve();
let styles;
let mathStyles;

function enabled(data, config) {
  if (data.math_enhance !== undefined && typeof data.math_enhance !== 'boolean') {
    throw new Error('Article math_enhance must be a boolean');
  }
  return typeof data.math_enhance === 'boolean' ? data.math_enhance : config.enable;
}

async function render(text, options = {}) {
  // MathJax has process-wide registries; serialize documents, including failures.
  const job = queue.then(async () => {
    const { renderMarkdown } = await import('../core/node.mjs');
    const result = await renderMarkdown(text, {
      renderCode: options.renderCode,
      references: referenceOptions(options.references),
      loadBibliography(file) {
        if (extname(file).toLowerCase() !== '.bib') throw new Error('bibtex file must name a .bib file');
        if (!options.path) throw new Error('External bibliography requires an article path');
        return readFileSync(resolve(dirname(options.path), file), 'utf8');
      }
    });
    mathStyles ??= result.css;
    // Namespace generated IDs so separate articles on an index do not collide.
    const prefix = 'mn-' + createHash('sha256').update(options.path || text).digest('hex').slice(0, 12) + '-';
    const ids = new Set([...result.html.matchAll(/\bid="([^"]+)"/g)].map(match => match[1]));
    let html = result.html.replace(/\bid="([^"]+)"/g, (_, id) => `id="${prefix}${id}"`)
      .replace(/\b((?:xlink:)?href)="#([^"]+)"/g, (whole, attr, id) => {
        let decoded;
        try { decoded = decodeURIComponent(id); } catch { return whole; }
        return ids.has(decoded) ? `${attr}="#${prefix}${id}"` : whole;
      })
      .replace(/\b(aria-labelledby|aria-describedby)="([^"]+)"/g, (_, attr, values) =>
        `${attr}="${values.split(/\s+/).map(id => ids.has(id) ? prefix + id : id).join(' ')}"`);
    // The host theme must not typeset server-rendered math a second time.
    const open = '<div class="math-enhance mathjax_ignore tex2jax_ignore">';
    // Both excerpt and more remain balanced fragments after Hexo splits them.
    html = html.replace('<!-- more -->', '</div><!-- more -->' + open);
    return open + html + '</div>';
  });
  queue = job.catch(() => {});
  return job;
}

async function stylesheet() {
  if (mathStyles === undefined) await render('');
  styles ??= await readFile(resolve(__dirname, '../styles.css'), 'utf8');
  return mathStyles + '\n' + styles;
}

function register(hexo) {
  const config = siteOptions(hexo.config.math_enhance);
  const references = config.references;
  // Keep CSS and behavior out of post content: themes often strip HTML tags
  // to make excerpts, which leaves style/script source as visible text.
  const root = (hexo.config.root || '/').replace(/\/?$/, '/');
  const escapeAttr = value => value.replace(/&/g, '&amp;').replace(/"/g, '&quot;');
  hexo.extend.filter.register('after_render:html', html => {
    if (!/class="math-enhance(?:\s|")/.test(html) || !/<\/head>/i.test(html)) return html;
    const css = `<link data-math-enhance rel="stylesheet" href="${escapeAttr(root)}css/math-enhance.css">`;
    const js = `<script data-math-enhance defer src="${escapeAttr(root)}js/math-enhance.js"></script>`;
    if (!html.includes('data-math-enhance')) {
      // Defer runs after parsing. Keep both assets in the real head: themes
      // can contain literal </body> strings inside client-side templates.
      html = html.replace(/<\/head>/i, css + js + '</head>');
    }
    return html;
  });
  hexo.extend.generator.register('math-enhance-assets', async () => [
    { path: 'css/math-enhance.css', data: await stylesheet() },
    { path: 'js/math-enhance.js', data: await readFile(resolve(__dirname, '../assets/anchors.js'), 'utf8') }
  ]);
  const highlighter = hexo.config.syntax_highlighter;
  const renderCode = highlighter && hexo.extend.highlight?.query(highlighter)
    ? (code, info) => hexo.extend.highlight.exec(highlighter, {
      context: hexo,
      args: [code.replace(/\n$/, ''), {
        lang: info.trim().split(/\s+/)[0],
        lines_length: code.trimEnd().split('\n').length
      }]
    })
    : undefined;

  const renderer = (data, options = {}) => render(data.text, { references, renderCode, ...options, path: data.path });
  renderer.disableNunjucks = true;
  hexo.extend.renderer.register('mathenhance', 'html', renderer);

  hexo.extend.filter.register('before_post_render', async data => {
    const path = data.full_source || (data.source && resolve(hexo.source_dir, data.source));
    if (!/\.(md|markdown|mkd|mkdn|mdown)$/i.test(path || '')) return data;
    try {
      if (!enabled(data, config)) return data;
      data[renderedContent] = await render(data.content, { path, references, renderCode });
      // Hide the source from Hexo's code and Nunjucks preprocessors. Restore
      // before excerpt, asset, encryption and other after-render filters.
      data.content = '';
    } catch (error) {
      throw new Error(`Math Enhance (${path}): ${error.message}`, { cause: error });
    }
    return data;
  }, 0);

  hexo.extend.filter.register('after_post_render', data => {
    if (data[renderedContent] !== undefined) {
      data.content = data[renderedContent];
      delete data[renderedContent];
    }
    return data;
  }, 0);
}

module.exports = { register, render, enabled, stylesheet };
