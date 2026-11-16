'use strict';

const assert = require('node:assert/strict');
const { createServer } = require('node:http');
const { readFile } = require('node:fs/promises');
const { join } = require('node:path');
const { chromium } = require('playwright');
const plugin = require('../lib/plugin');

async function main() {
  const body = await plugin.render(String.raw`Inline $A_{11}\in\mathbb R^{m\times m}$ and reference \(\eqref{eq:target}\).

${'A paragraph providing room to scroll.\n\n'.repeat(35)}
\begin{align}
x &= 1 \label{eq:first} \\
y &= 2 \label{eq:target}
\end{align}

\[${Array.from({ length: 30 }, (_, i) => `a_{${i}}`).join('+')}=0\]

${'Trailing paragraph providing room to center.\n\n'.repeat(35)}`);
  const css = await plugin.stylesheet();
  const script = await readFile(join(__dirname, '../assets/anchors.js'), 'utf8');
  const html = `<!doctype html><html><head><meta name="viewport" content="width=device-width, initial-scale=1"><style>
    body { margin: 16px; font-size: 16px; line-height: 1.6; }
    mjx-container:not([display]) { display: inline-grid !important; overflow: auto; padding: 8px; }
    ${css}</style><script defer src="/anchors.js"></script></head><body>${body}</body></html>`;
  const server = createServer((req, res) => {
    res.setHeader('Content-Type', req.url === '/anchors.js' ? 'text/javascript' : 'text/html; charset=utf-8');
    res.end(req.url === '/anchors.js' ? script : html);
  });
  let browser;
  try {
    await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
    browser = await chromium.launch({ executablePath: process.env.BROWSER_EXECUTABLE || undefined });
    const page = await browser.newPage({ viewport: { width: 1000, height: 800 }, reducedMotion: 'reduce' });
    await page.goto(`http://127.0.0.1:${server.address().port}`);
    const inline = await page.locator('.math-inline mjx-container').first().evaluate(el => ({
      display: getComputedStyle(el).display, overflow: getComputedStyle(el).overflow,
      height: el.getBoundingClientRect().height
    }));
    assert.equal(inline.display, 'inline');
    assert.equal(inline.overflow, 'visible');
    const link = page.locator('a[href*="mjx-eqn"]').first();
    await link.click();
    const centerError = () => page.evaluate(() => {
      const box = document.getElementById(decodeURIComponent(location.hash.slice(1))).getBoundingClientRect();
      return Math.abs(box.top + box.height / 2 - innerHeight / 2);
    });
    assert.ok(await centerError() < 2, 'equation click should center the target row');
    await page.reload();
    await page.waitForFunction(() => {
      const box = document.getElementById(decodeURIComponent(location.hash.slice(1))).getBoundingClientRect();
      return Math.abs(box.top + box.height / 2 - innerHeight / 2) < 2;
    });
    await page.setViewportSize({ width: 375, height: 812 });
    const mobile = await page.evaluate(() => ({
      width: document.documentElement.scrollWidth, viewport: innerWidth,
      hasScroll: [...document.querySelectorAll('.math-scroll')].some(el => el.scrollWidth > el.clientWidth)
    }));
    assert.ok(mobile.width <= mobile.viewport, 'math must not widen the mobile page');
    assert.ok(mobile.hasScroll, 'long display math should scroll in its own container');
    console.log('Browser checks passed: inline layout, equation centering, direct hash, mobile overflow.');
  } finally {
    if (browser) await browser.close();
    await new Promise(resolve => server.close(resolve));
  }
}

main().catch(error => { console.error(error); process.exitCode = 1; });
