import { test } from 'node:test';
import assert from 'node:assert/strict';
import config from '../lib/config.js';
import plugin from '../lib/plugin.js';

test('configuration fails clearly instead of silently ignoring mistyped switches', () => {
  for (const value of [false, null, [], 'true']) assert.throws(() => config.siteOptions(value), /math_enhance must be an object/);
  assert.throws(() => config.siteOptions({ enable: 'false' }), /math_enhance.enable must be a boolean/);
  assert.throws(() => config.siteOptions({ references: { links: { doi: 'false' } } }), /math_enhance.references.links.doi/);
  assert.throws(() => plugin.enabled({ math_enhance: 'true' }, { enable: false }), /Article math_enhance must be a boolean/);
  assert.equal(config.siteOptions().enable, false);
  assert.equal(config.siteOptions({ references: { links: { doi: false } } }).references.links.url, true);
});
