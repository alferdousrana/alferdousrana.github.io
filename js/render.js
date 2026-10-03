/* Renders the content-driven sections: hero, about, recognition, gallery, contact, footer. */
(function (AF) {
  'use strict';
  const { $, $$, el, fill } = AF.util;
  const D = window.PORTFOLIO;
  const text = (sel, value) => { const n = $(sel); if (n && value) n.textContent = value; };

  /* ---------- hero ---------- */
  function hero() {
    const p = D.person;
    const h1 = $('[data-hero-name]');
    if (h1 && p.name) {
      const words = p.name.trim().split(/\s+/);
      const last = words.length > 1 ? words.pop() : '';
      fill(h1, 
        el('span', { class: 'hero__title-line' }, [words.join(' ')]),
        last ? el('span', { class: 'hero__title-line' }, [last]) : null
      );
    }
    text('[data-hero-role]', p.role);
    const stack = $('[data-hero-stack]');
    if (stack && p.stack) {
      const parts = p.stack.split(/\s*[•·|]\s*/).filter(Boolean);
      fill(stack, ...parts.flatMap((part, i) => (i ? [el('i', {}, ['•']), ` ${part} `] : [`${part} `])));
    }
    text('[data-hero-tagline]', p.tagline);
    const facts = $('[data-hero-facts]');
    if (facts) {
      fill(facts, ...(D.hero.facts || []).filter((f) => f.text).map((f) =>
        el('div', {}, [el('dt', { class: 'mono' }, [f.label || '']), el('dd', {}, [f.text])])));
      facts.hidden = !facts.children.length;
    }
  }

  /* ---------- about + portrait ---------- */
  function about() {
    text('[data-about-title]', D.about.title);
    const box = $('[data-about-text]');
    if (box) {
      fill(box, 
        D.about.lede ? el('p', { class: 'about__lede' }, [D.about.lede]) : null,
        ...(D.about.paragraphs || []).filter(Boolean).map((t) => el('p', {}, [t]))
      );
    }
    const metrics = $('[data-metrics]');
    if (metrics) {
      fill(metrics, ...D.metrics.map((m) => el('div', { class: 'metric' }, [
        el('span', { class: 'metric__value' }, [
          el('span', { dataset: { count: String(Number(m.value) || 0) } }, [(Number(m.value) || 0).toLocaleString('en-US')]),
          m.suffix || ''
        ]),
        el('span', { class: 'metric__label' }, [m.label || ''])
      ])));
      metrics.hidden = !D.metrics.length;
    }

    const fig = $('[data-photo]');
    const src = AF.img(D.person.photo);
    if (fig && src) {
      const img = $('[data-photo-img]', fig);
      img.src = src;
      img.alt = D.person.photoAlt || D.person.name || '';
      img.addEventListener('error', () => { fig.hidden = true; });
      $('[data-photo-caption]', fig).textContent = [D.person.name, D.person.location].filter(Boolean).join(' · ');
      fig.hidden = false;
    }
  }

  /* ---------- recognition ---------- */
  function recognition() {
    const awards = $('[data-awards]');
    if (awards) {
      fill(awards, ...D.awards.map((a) => el('article', { class: `award${a.featured ? ' award--lead' : ''}`, dataset: { reveal: '' } }, [
        a.top ? el('p', { class: 'award__year' }, [a.top]) : null,
        el('h3', { class: 'award__name' }, [a.name || '']),
        a.honour ? el('p', { class: 'award__honour' }, [a.honour]) : null,
        a.issuer ? el('p', { class: 'award__issuer mono' }, [a.issuer]) : null
      ])));
      awards.hidden = !D.awards.length;
    }

    const edu = $('[data-education]');
    if (edu) {
      fill(edu, ...D.education.map((e) => {
        const ratio = Math.min(Math.max((parseFloat(e.cgpa) || 0) / (parseFloat(e.scale) || 4), 0), 1);
        const gauge = AF.util.svg('svg', { class: 'edu__gauge', viewBox: '0 0 120 120', 'aria-hidden': 'true' });
        gauge.append(AF.util.svg('circle', { cx: 60, cy: 60, r: 50, class: 'edu__gauge-track' }));
        const fill = AF.util.svg('circle', { cx: 60, cy: 60, r: 50, class: 'edu__gauge-fill' });
        fill.dataset.gauge = String(ratio);
        gauge.append(fill);
        return el('article', { class: 'edu panel', dataset: { reveal: '' } }, [
          e.cgpa ? gauge : null,
          el('div', { class: 'edu__body' }, [
            el('p', { class: 'mono edu__label' }, ['education']),
            el('h3', { class: 'edu__degree' }, [e.degree || '']),
            el('p', { class: 'edu__school' }, [e.school || '']),
            e.cgpa ? el('p', { class: 'edu__cgpa' }, [el('strong', {}, [e.cgpa]), ' ', el('span', { class: 'mono' }, [`/ ${e.scale || '4.00'} CGPA`])]) : null
          ])
        ]);
      }));
    }

    const certs = $('[data-certs]');
    if (certs) {
      fill(certs, ...D.certifications.map((c) => el('li', {}, [
        el('span', {}, [c.name || '']),
        el('span', { class: 'mono' }, [[c.issuer, c.year].filter(Boolean).join(' · ')])
      ])));
      certs.closest('.certs').hidden = !D.certifications.length;
    }
  }

  /* ---------- gallery + lightbox ---------- */
  const Lightbox = {
    init(items) {
      this.items = items;
      this.dialog = $('[data-lightbox]');
      if (!this.dialog) return;
      this.img = $('[data-lightbox-img]', this.dialog);
      this.cap = $('[data-lightbox-caption]', this.dialog);
      this.count = $('[data-lightbox-count]', this.dialog);
      $('[data-lightbox-close]', this.dialog).addEventListener('click', () => this.dialog.close());
      $('[data-lightbox-prev]', this.dialog).addEventListener('click', () => this.show(this.i - 1));
      $('[data-lightbox-next]', this.dialog).addEventListener('click', () => this.show(this.i + 1));
      this.dialog.addEventListener('click', (e) => { if (e.target === this.dialog) this.dialog.close(); });
      this.dialog.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowRight') this.show(this.i + 1);
        if (e.key === 'ArrowLeft') this.show(this.i - 1);
      });
      this.dialog.addEventListener('close', () => {
        document.documentElement.style.overflow = '';
        this.opener?.focus({ preventScroll: true });
      });
      let x0 = null;
      this.dialog.addEventListener('touchstart', (e) => { x0 = e.touches[0].clientX; }, { passive: true });
      this.dialog.addEventListener('touchend', (e) => {
        if (x0 === null) return;
        const dx = e.changedTouches[0].clientX - x0;
        if (Math.abs(dx) > 50) this.show(this.i + (dx < 0 ? 1 : -1));
        x0 = null;
      });
    },
    open(i, opener) {
      this.opener = opener;
      this.show(i);
      const multiple = this.items.length > 1;
      $$('[data-lightbox-prev], [data-lightbox-next]', this.dialog).forEach((b) => { b.hidden = !multiple; });
      if (typeof this.dialog.showModal === 'function') this.dialog.showModal(); else this.dialog.setAttribute('open', '');
      document.documentElement.style.overflow = 'hidden';
      $('[data-lightbox-close]', this.dialog).focus({ preventScroll: true });
    },
    show(i) {
      const n = this.items.length;
      this.i = ((i % n) + n) % n;
      const item = this.items[this.i];
      this.img.src = AF.img(item.src);
      this.img.alt = item.alt || item.caption || '';
      this.cap.textContent = item.caption || '';
      this.count.textContent = n > 1 ? `${this.i + 1} / ${n}` : '';
    }
  };

  function gallery() {
    const section = $('#gallery');
    const grid = $('[data-gallery]');
    if (!section || !grid) return;
    const items = D.gallery.items.filter((g) => AF.img(g.src));
    text('[data-gallery-title]', D.gallery.title);
    text('[data-gallery-text]', D.gallery.text);
    fill(grid, ...items.map((g, i) => {
      const btn = el('button', { type: 'button', class: 'gallery__item', 'aria-label': `Open image: ${g.caption || g.alt || `photo ${i + 1}`}` }, [
        el('img', { src: AF.img(g.src), alt: g.alt || g.caption || '', loading: 'lazy', decoding: 'async' }),
        g.caption ? el('span', { class: 'gallery__caption' }, [g.caption]) : null
      ]);
      btn.addEventListener('click', () => Lightbox.open(i, btn));
      return el('li', {}, [btn]);
    }));
    section.dataset.empty = items.length ? '' : '1';
    Lightbox.init(items);
  }

  /* ---------- contact + footer ---------- */
  function contact() {
    const p = D.person; const c = D.contact;
    text('[data-contact-title]', c.title);
    text('[data-contact-text]', c.text);
    text('[data-contact-button-text]', c.button);
    const btn = $('[data-contact-button]');
    if (btn && p.email) btn.href = `mailto:${p.email}?subject=${encodeURIComponent("Let's build something")}`;

    const card = $('[data-contact-card]');
    if (card) {
      const rows = [];
      if (p.email) {
        const copy = el('button', { type: 'button', class: 'contact__copy mono' }, ['copy']);
        copy.addEventListener('click', async () => {
          if (await AF.util.copyEmail(p.email)) { copy.textContent = 'copied'; setTimeout(() => { copy.textContent = 'copy'; }, 1800); }
        });
        rows.push(el('div', { class: 'contact__row contact__row--email' }, [
          el('span', { class: 'mono' }, ['email']), el('a', { href: `mailto:${p.email}` }, [p.email]), copy]));
      }
      [['github', p.github], ['linkedin', p.linkedin], ['facebook', p.facebook]].forEach(([k, url]) => {
        if (!url) return;
        rows.push(el('div', { class: 'contact__row' }, [el('span', { class: 'mono' }, [k]),
          AF.util.extLink(url, url.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, ''))]));
      });
      if (p.location) rows.push(el('div', { class: 'contact__row' }, [el('span', { class: 'mono' }, ['based in']), el('span', {}, [p.location])]));
      fill(card, ...rows);
    }

    text('[data-footer-name]', p.name);
    text('[data-footer-role]', p.role);
    text('[data-footer-stack]', p.stack);
    text('[data-footer-copy]', p.name);
    const links = $('[data-footer-links]');
    if (links) {
      fill(links, ...[['GitHub', p.github], ['LinkedIn', p.linkedin], ['Facebook', p.facebook]]
        .filter(([, u]) => u).map(([n, u]) => el('li', {}, [AF.util.extLink(u, n)])));
    }
  }

  /* ---------- section visibility + numbering ---------- */
  function sections() {
    const S = D.sections;
    const map = { dna: '#systems', experience: '#experience', skills: '#skills', recognition: '#recognition', lab: '#lab', game: '#break', gallery: '#gallery' };
    Object.entries(map).forEach(([key, sel]) => {
      const node = $(sel);
      if (!node) return;
      const off = S[key] === false || (key === 'gallery' && node.dataset.empty === '1');
      node.hidden = off;
      const navItem = $(`.nav__menu a[href="${sel}"]`)?.closest('li');
      if (navItem) navItem.hidden = off;
    });
    const projects = $('#projects');
    if (projects) {
      const list = $('[data-projects]', projects); const code = $('.code', projects);
      if (S.projects === false && list) list.hidden = true;
      if (S.code === false && code) code.hidden = true;
      const off = S.projects === false && S.code === false;
      projects.hidden = off;
      const navItem = $('.nav__menu a[href="#projects"]')?.closest('li');
      if (navItem) navItem.hidden = off;
    }
    // renumber visible scenes so the sequence never skips
    let n = 1;
    $$('main > .section').forEach((sec) => {
      const num = $('.section__path span', sec);
      if (num && !sec.hidden) num.textContent = String(n++).padStart(2, '0');
    });
  }

  function preview() {
    if (!AF.preview) return;
    const bar = $('[data-preview-bar]');
    if (bar) bar.hidden = false;
    const robots = el('meta', { name: 'robots', content: 'noindex' });
    document.head.append(robots);
  }

  AF.render = {
    all() {
      hero(); about(); recognition(); gallery(); contact(); preview();
    },
    sections
  };
})(window.AF);
