'use strict';

function referenceOptions(value = {}) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error('math_enhance.references must be an object');
  }
  const links = value.links === undefined ? {} : value.links;
  if (!links || typeof links !== 'object' || Array.isArray(links)) {
    throw new Error('math_enhance.references.links must be an object');
  }
  const result = {
    title: 'References',
    backlinks: false,
    ...value,
    links: { doi: true, url: true, google_scholar: true, ...links }
  };
  if (typeof result.title !== 'string' || !result.title.trim()) {
    throw new Error('math_enhance.references.title must be a nonempty string');
  }
  if (typeof result.backlinks !== 'boolean') {
    throw new Error('math_enhance.references.backlinks must be a boolean');
  }
  for (const [key, flag] of Object.entries(result.links)) {
    if (typeof flag !== 'boolean') throw new Error(`math_enhance.references.links.${key} must be a boolean`);
  }
  return result;
}

function siteOptions(value = {}) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error('math_enhance must be an object with an enable boolean');
  }
  const config = { enable: false, ...value };
  if (typeof config.enable !== 'boolean') throw new Error('math_enhance.enable must be a boolean');
  config.references = referenceOptions(config.references);
  return config;
}

module.exports = { referenceOptions, siteOptions };
