(() => {
  'use strict';
  if (window.__mathEnhanceAnchors) return;
  window.__mathEnhanceAnchors = true;

  function equationTarget(hash) {
    let id;
    try { id = decodeURIComponent(hash.slice(1)); } catch { return null; }
    if (!id.includes('-mjx-eqn:')) return null;
    const target = document.getElementById(id);
    return target?.closest('.math-enhance') ? target : null;
  }

  function center(target, smooth = false) {
    // An AMS align block can contain many numbered rows; use the target label
    // position rather than the middle of the entire block.
    const box = target.getBoundingClientRect();
    const top = window.scrollY + box.top + box.height / 2 - window.innerHeight / 2;
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    window.scrollTo({ top: Math.max(0, top), behavior: smooth && !reducedMotion ? 'smooth' : 'instant' });
  }

  document.addEventListener('click', event => {
    if (event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
    const link = event.target.closest?.('a[href]');
    if (!link?.closest('.math-enhance') || link.hasAttribute('download') || link.getAttribute('target') === '_blank') return;
    const url = new URL(link.getAttribute('href'), location.href);
    if (url.origin !== location.origin || url.pathname !== location.pathname || url.search !== location.search) return;
    const target = equationTarget(url.hash);
    if (!target) return;
    event.preventDefault();
    event.stopPropagation();
    if (location.hash !== url.hash) history.pushState(history.state, '', url.href);
    center(target, true);
  }, true);

  const followHash = () => {
    const target = equationTarget(location.hash);
    if (target) requestAnimationFrame(() => center(target));
  };
  window.addEventListener('hashchange', followHash);
  window.addEventListener('load', followHash);
  document.addEventListener('pjax:complete', followHash);
  if (document.readyState === 'complete') followHash();
})();
