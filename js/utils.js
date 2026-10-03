/* Shared helpers. Everything hangs off one namespace to keep globals tidy. */
window.AF = window.AF || {};

(function (AF) {
  'use strict';

  const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');

  const util = {
    $: (sel, root = document) => root.querySelector(sel),
    $$: (sel, root = document) => Array.from(root.querySelectorAll(sel)),

    reducedMotion: () => motionQuery.matches,

    clamp: (v, min, max) => Math.min(max, Math.max(min, v)),
    lerp: (a, b, t) => a + (b - a) * t,
    easeOutCubic: (t) => 1 - Math.pow(1 - t, 3),
    easeInOut: (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2),
    wait: (ms) => new Promise((r) => setTimeout(r, ms)),

    /**
     * Build DOM safely. Text is always assigned via textContent, never innerHTML.
     * el('a', { href: '#', class: 'x', dataset: { id: 1 } }, ['child', otherNode])
     */
    el(tag, attrs = {}, children = []) {
      const node = document.createElement(tag);
      for (const [k, v] of Object.entries(attrs)) {
        if (v === undefined || v === null || v === false) continue;
        if (k === 'class') node.className = v;
        else if (k === 'text') node.textContent = v;
        else if (k === 'dataset') Object.assign(node.dataset, v);
        else if (k.startsWith('on') && typeof v === 'function') node.addEventListener(k.slice(2), v);
        else node.setAttribute(k, v === true ? '' : v);
      }
      (Array.isArray(children) ? children : [children]).forEach((c) => {
        if (c === null || c === undefined || c === false) return;
        node.append(c instanceof Node ? c : document.createTextNode(String(c)));
      });
      return node;
    },

    /** replaceChildren that skips null/false (replaceChildren would print them as text). */
    fill(node, ...kids) {
      node.replaceChildren(...kids.filter((k) => k !== null && k !== undefined && k !== false));
      return node;
    },

    svg(tag, attrs = {}) {
      const node = document.createElementNS('http://www.w3.org/2000/svg', tag);
      for (const [k, v] of Object.entries(attrs)) {
        if (k === 'text') node.textContent = v;
        else node.setAttribute(k, v);
      }
      return node;
    },

    /** Safe external link with noopener. */
    extLink(href, text, cls) {
      return util.el('a', { href: AF.safeUrl ? AF.safeUrl(href) : href, class: cls, target: '_blank', rel: 'noopener noreferrer' }, [text]);
    },

    toast(message, isError = false) {
      const t = util.$('[data-toast]');
      if (!t) return;
      t.textContent = message;
      t.classList.toggle('is-error', isError);
      t.classList.add('is-visible');
      clearTimeout(util._toastTimer);
      util._toastTimer = setTimeout(() => t.classList.remove('is-visible'), 2200);
    },

    async copyText(text) {
      try {
        if (navigator.clipboard && window.isSecureContext) {
          await navigator.clipboard.writeText(text);
          return true;
        }
      } catch (_) { /* fall through to legacy path */ }
      try {
        const ta = util.el('textarea', { readonly: true, 'aria-hidden': 'true' });
        ta.value = text;
        ta.style.cssText = 'position:fixed;opacity:0;top:0;left:0';
        document.body.append(ta);
        ta.select();
        const ok = document.execCommand('copy');
        ta.remove();
        return ok;
      } catch (_) {
        return false;
      }
    },

    async copyEmail(email) {
      const ok = await util.copyText(email);
      if (ok) util.toast('Email copied.');
      else util.toast(`Copy blocked — email is ${email}`, true);
      return ok;
    },

    storage: {
      get(key, fallback = null) {
        try {
          const v = window.localStorage.getItem(key);
          return v === null ? fallback : v;
        } catch (_) { return fallback; }
      },
      set(key, value) {
        try { window.localStorage.setItem(key, value); } catch (_) { /* storage unavailable */ }
      }
    },

    session: {
      get(key) { try { return window.sessionStorage.getItem(key); } catch (_) { return null; } },
      set(key, value) { try { window.sessionStorage.setItem(key, value); } catch (_) { /* ignore */ } }
    },

    /** Run cb once when element enters viewport. */
    onVisible(element, cb, options = { threshold: 0.25 }) {
      if (!element) return;
      if (!('IntersectionObserver' in window)) { cb(element); return; }
      const io = new IntersectionObserver((entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) { cb(e.target); io.unobserve(e.target); }
        });
      }, options);
      io.observe(element);
    }
  };

  AF.util = util;
})(window.AF);
