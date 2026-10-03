/* Main controller — renders data-driven sections and wires up global interactions. */
(function (AF) {
  'use strict';
  const { $, $$, el, svg, clamp, lerp, reducedMotion, onVisible, wait } = AF.util;
  const D = window.PORTFOLIO;
  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

  /* =========================================================
     PROFILE PANEL
     ========================================================= */
  function renderProfile() {
    const box = $('[data-profile]');
    if (!box) return;
    box.append(el('p', {}, ['const engineer = {']));
    D.profile.forEach((row, i) => {
      const id = `profile-${row.key}`;
      const key = el('button', { type: 'button', class: 'profile__key', 'aria-expanded': 'true', 'aria-controls': id }, [
        row.key, el('span', {}, [':'])
      ]);
      let value;
      if (row.pipeline) {
        value = el('ul', { class: 'profile__value pipeline', id, dataset: { mindset: '' } },
          row.value.map((v) => el('li', {}, [el('span', {}, [v])])));
      } else {
        value = el('ul', { class: 'profile__value', id },
          row.value.map((v) => el('li', {}, [el('span', { class: 'str' }, [`"${v}"`])])));
      }
      key.addEventListener('click', () => {
        const open = key.getAttribute('aria-expanded') === 'true';
        key.setAttribute('aria-expanded', String(!open));
        value.hidden = open;
      });
      box.append(key, value);
      if (i === D.profile.length - 1) box.append(el('p', {}, ['};']));
    });

    if (D.person.available) $('[data-availability]').hidden = false;

    // light the Build → Test → Optimize → Deploy pipeline once in view, and on hover
    const pipe = $('[data-mindset]', box);
    const light = async () => {
      if (pipe.dataset.running) return;
      pipe.dataset.running = '1';
      const steps = $$('span', pipe);
      steps.forEach((s) => s.classList.remove('is-lit'));
      for (const s of steps) { s.classList.add('is-lit'); await wait(reducedMotion() ? 0 : 280); }
      delete pipe.dataset.running;
    };
    onVisible(pipe, light, { threshold: 1 });
    pipe.addEventListener('pointerenter', light);
  }

  /* =========================================================
     ENGINEERING DNA
     ========================================================= */
  const GLYPHS = {
    layers: [['path', { class: 'g-layer-1', d: 'M20 6 34 13 20 20 6 13Z' }], ['path', { class: 'g-layer-2', d: 'M6 20l14 7 14-7' }], ['path', { class: 'g-layer-3', d: 'M6 27l14 7 14-7' }]],
    lock: [['path', { class: 'g-shackle', d: 'M14 18v-5a6 6 0 0 1 12 0v5' }], ['rect', { x: 10, y: 18, width: 20, height: 15, rx: 2 }], ['path', { d: 'M20 24v4' }]],
    branch: [['circle', { cx: 10, cy: 10, r: 3 }], ['circle', { cx: 10, cy: 30, r: 3 }], ['g', { class: 'g-branch' }, [['circle', { cx: 30, cy: 20, r: 3.5 }]]], ['path', { d: 'M10 13v14M10 20c0-5 6-7 16.5-0' }]],
    database: [['ellipse', { class: 'g-db-top', cx: 20, cy: 10, rx: 12, ry: 4 }], ['path', { d: 'M8 10v20c0 2.2 5.4 4 12 4s12-1.8 12-4V10M8 20c0 2.2 5.4 4 12 4s12-1.8 12-4' }]],
    modules: [['rect', { class: 'g-mod-a', x: 6, y: 6, width: 12, height: 12, rx: 2 }], ['rect', { x: 22, y: 6, width: 12, height: 12, rx: 2 }], ['rect', { x: 6, y: 22, width: 12, height: 12, rx: 2 }], ['rect', { class: 'g-mod-d', x: 22, y: 22, width: 12, height: 12, rx: 2 }]],
    deploy: [['path', { class: 'g-arrow', d: 'M20 27V8M13 15l7-7 7 7' }], ['path', { d: 'M8 33h24' }]]
  };
  function buildGlyph(name) {
    const root = svg('svg', { class: 'dna__glyph', viewBox: '0 0 40 40', 'aria-hidden': 'true' });
    const add = (parent, items) => items.forEach(([tag, attrs, kids]) => {
      const n = svg(tag, attrs);
      if (kids) add(n, kids);
      parent.append(n);
    });
    add(root, GLYPHS[name] || []);
    return root;
  }

  function renderDNA() {
    const list = $('[data-dna]');
    if (!list) return;
    D.dna.forEach((item, i) => {
      const id = `dna-detail-${i}`;
      const card = el('button', { type: 'button', class: 'dna__card', 'aria-expanded': 'false', 'aria-controls': id }, [
        el('span', { class: 'dna__num' }, [String(i + 1).padStart(2, '0')]),
        buildGlyph(item.glyph),
        el('span', { class: 'dna__title' }, [item.title]),
        el('span', { class: 'dna__summary' }, [item.summary]),
        el('span', { class: 'dna__detail', id }, [el('p', {}, [item.detail])]),
        el('span', { class: 'dna__more', 'aria-hidden': 'true' }, ['how it\'s applied +'])
      ]);
      card.addEventListener('click', () => card.setAttribute('aria-expanded', String(card.getAttribute('aria-expanded') !== 'true')));
      trackGlow(card);
      list.append(el('li', { class: 'dna__item' }, [card]));
    });
  }

  function trackGlow(node) {
    node.addEventListener('pointermove', (e) => {
      const r = node.getBoundingClientRect();
      node.style.setProperty('--cx', `${e.clientX - r.left}px`);
      node.style.setProperty('--cy', `${e.clientY - r.top}px`);
    }, { passive: true });
  }

  /* =========================================================
     EXPERIENCE TIMELINE
     ========================================================= */
  const SIGNALS = [
    { id: 'api', label: 'API' }, { id: 'database', label: 'Database' }, { id: 'auth', label: 'Auth' },
    { id: 'architecture', label: 'Architecture' }, { id: 'deployment', label: 'Deployment' }
  ];
  const mi = (d) => d.y * 12 + d.m;

  function renderTimeline() {
    const track = $('[data-timeline-track]');
    const detail = $('[data-timeline-detail]');
    if (!track || !D.experience.length) return;
    const sorted = D.experience.slice().sort((a, b) => mi(a._s) - mi(b._s));
    const start = Math.min(...sorted.map((x) => mi(x._s))) - 5;
    const end = Math.max(...sorted.map((x) => mi(x._e))) + 3;
    const span = Math.max(end - start, 1);
    const pct = (m) => ((m - start) / span) * 100;

    track.append(el('div', { class: 'timeline__axis', 'aria-hidden': 'true' }));
    const y0 = Math.floor(start / 12) + 1; const y1 = Math.floor(end / 12);
    const step = y1 - y0 > 9 ? 2 : 1;
    for (let y = y0; y <= y1; y += step) {
      track.append(el('span', { class: 'timeline__year', style: `left:${pct(y * 12)}%`, 'aria-hidden': 'true' }, [String(y)]));
    }
    for (let i = 0; i < sorted.length - 1; i++) {
      const gs = pct(mi(sorted[i]._e) + 1); const ge = pct(mi(sorted[i + 1]._s));
      if (ge - gs > 1) track.append(el('span', { class: 'timeline__gap', style: `left:${gs}%;width:${ge - gs}%`, title: 'Between roles', 'aria-hidden': 'true' }));
    }

    const buttons = [];
    const select = (exp, focus = false) => {
      buttons.forEach((b) => {
        const on = b.dataset.exp === exp.id;
        b.setAttribute('aria-selected', String(on));
        b.tabIndex = on ? 0 : -1;
        if (on && focus) b.focus();
      });
      renderExperienceDetail(detail, exp);
    };

    sorted.forEach((exp) => {
      const left = pct(mi(exp._s));
      const width = Math.max(pct(mi(exp._e) + 1) - left, 2);
      const nearEnd = left > 60;
      const btn = el('button', {
        type: 'button', role: 'tab', id: `tab-${exp.id}`, 'aria-controls': 'xp-detail',
        class: `timeline__seg${nearEnd ? ' timeline__seg--end' : ''}`,
        style: nearEnd ? `right:${Math.max(100 - left - width, 0)}%;width:${width}%` : `left:${left}%;width:${width}%`,
        dataset: { exp: exp.id }
      }, [
        el('span', { class: 'timeline__seg-label' }, [exp.company]),
        el('span', { class: 'timeline__seg-role' }, [exp.role]),
        el('span', { class: 'timeline__seg-bar', 'aria-hidden': 'true' })
      ]);
      btn.addEventListener('click', () => select(exp));
      btn.addEventListener('keydown', (e) => {
        if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
        e.preventDefault();
        const i = sorted.indexOf(exp);
        select(sorted[(i + (e.key === 'ArrowRight' ? 1 : -1) + sorted.length) % sorted.length], true);
      });
      buttons.push(btn);
      track.append(btn);
    });
    detail.id = 'xp-detail';
    select(sorted[sorted.length - 1]);
  }

  function renderExperienceDetail(box, exp) {
    box.setAttribute('aria-labelledby', `tab-${exp.id}`);
    const links = exp.links.length
      ? el('div', { class: 'xp__links' }, [el('span', { class: 'mono', style: 'color:var(--muted)' }, ['projects:']), ...exp.links.filter((l) => l.url).map((l) => AF.util.extLink(l.url, l.label || l.url))])
      : null;
    box.replaceChildren(
      el('div', {}, [
        el('p', { class: 'xp__period' }, [`${exp.period} · ${exp.duration}`]),
        el('h3', { class: 'xp__role' }, [exp.role]),
        el('p', { class: 'xp__company' }, [exp.company]),
        el('ul', { class: 'xp__points' }, exp.points.map((p) => el('li', {}, [p]))),
        links
      ]),
      el('div', { class: 'xp__side' }, [
        el('div', {}, [
          el('p', { class: 'xp__side-label' }, ['system signals']),
          el('ul', { class: 'signals' }, SIGNALS.map((s) => el('li', { class: `signal${exp.signals.includes(s.id) ? ' is-on' : ''}` }, [el('i', { 'aria-hidden': 'true' }), s.label])))
        ]),
        el('div', {}, [
          el('p', { class: 'xp__side-label' }, ['stack']),
          el('ul', { class: 'chips' }, exp.tech.map((t) => el('li', {}, [t])))
        ])
      ])
    );
  }

  /* =========================================================
     PROJECTS
     ========================================================= */
  const LINK_ICONS = {
    live: 'M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5',
    github: 'M9 19c-4 1.5-4-2-6-2.5m12 5v-3.5c0-1 .1-1.4-.5-2 2.8-.3 5.5-1.4 5.5-6a4.6 4.6 0 0 0-1.3-3.2 4.2 4.2 0 0 0-.1-3.2s-1-.3-3.4 1.3a11.6 11.6 0 0 0-6 0C6.8 2.3 5.8 2.6 5.8 2.6a4.2 4.2 0 0 0-.1 3.2A4.6 4.6 0 0 0 4.4 9c0 4.6 2.7 5.7 5.5 6-.6.6-.6 1.2-.5 2V21',
    package: 'M21 8l-9-5-9 5 9 5 9-5zM3 8v8l9 5 9-5V8M12 13v8'
  };
  function linkPill(l) {
    const icon = svg('svg', { viewBox: '0 0 24 24', 'aria-hidden': 'true' });
    icon.append(svg('path', { d: LINK_ICONS[l.kind] || LINK_ICONS.live }));
    const a = AF.util.extLink(l.url, l.label, 'link-pill');
    a.prepend(icon);
    return a;
  }

  function renderProjects() {
    const list = $('[data-projects]');
    if (!list) return;
    D.projects.forEach((p, i) => {
      const openBtn = el('button', { type: 'button', class: 'btn btn--ghost project__open', 'data-magnetic': '', 'aria-haspopup': 'dialog' }, ['Open case study']);
      const card = el('article', { class: 'project', 'aria-labelledby': `proj-${p.id}` }, [
        el('div', { class: 'project__index', 'aria-hidden': 'true' }, [String(i + 1).padStart(2, '0')]),
        el('div', { class: 'project__main' }, [
          el('p', { class: 'project__type' }, [p.type]),
          el('h3', { class: 'project__name', id: `proj-${p.id}` }, [p.name]),
          el('ul', { class: 'chips' }, p.stack.map((s) => el('li', {}, [s]))),
          el('p', { class: 'project__problem' }, [p.problem]),
          el('p', { class: 'project__meta' }, [p.meta])
        ]),
        el('div', { class: 'project__side' }, [
          el('div', {}, [el('p', { class: 'project__label' }, ['what I built']), el('p', { class: 'project__built' }, [p.built])]),
          el('div', {}, [el('p', { class: 'project__label' }, ['key engineering features']), el('ul', { class: 'project__features' }, p.features.map((f) => el('li', {}, [f])))]),
          el('div', { class: 'project__actions' }, [openBtn, ...p.links.filter((l) => l.url).map(linkPill)])
        ])
      ]);
      openBtn.addEventListener('click', (e) => { e.stopPropagation(); openCase(p.id, openBtn); });
      card.addEventListener('click', (e) => {
        if (e.target.closest('a, button')) return;
        if (window.getSelection().toString()) return;
        openCase(p.id, openBtn);
      });
      trackGlow(card);
      list.append(card);
    });
  }

  /* =========================================================
     CASE STUDY MODAL
     ========================================================= */
  const Case = { loop: null };

  function openCase(id, opener) {
    const p = D.projects.find((x) => x.id === id);
    const dialog = $('[data-case]');
    if (!p || !dialog) return;
    Case.opener = opener || document.activeElement;

    $('[data-case-type]', dialog).textContent = p.type;
    $('[data-case-title]', dialog).textContent = p.name;
    $('[data-case-stack]', dialog).replaceChildren(...p.stack.map((s) => el('li', {}, [s])));
    $('[data-case-links]', dialog).replaceChildren(...p.links.filter((l) => l.url).map(linkPill));
    const cover = $('[data-case-cover]', dialog);
    const coverSrc = AF.img(p.image);
    cover.hidden = !coverSrc;
    if (coverSrc) { cover.src = coverSrc; cover.alt = `${p.name} screenshot`; } else cover.removeAttribute('src');

    const sections = p.case.map((c) => el('section', { class: 'case__section' }, [el('h3', {}, [c.h.toLowerCase()]), el('p', {}, [c.p])]));
    sections.splice(1, 0, el('section', { class: 'case__section' }, [el('h3', {}, ['key features']), el('ul', {}, p.features.map((f) => el('li', {}, [f])))]));
    $('[data-case-sections]', dialog).replaceChildren(...sections);

    const arch = $('[data-case-diagram]', dialog);
    arch.classList.remove('is-drawn');
    const nodes = p.diagram.map((n, i) => {
      const node = el('div', { class: 'arch__node', dataset: { tone: n.tone } }, [el('strong', {}, [n.label]), el('span', {}, [n.sub])]);
      node.style.transitionDelay = reducedMotion() ? '0ms' : `${i * 130}ms`;
      return node;
    });
    const packet = el('span', { class: 'arch__packet', 'aria-hidden': 'true' });
    arch.replaceChildren(...nodes, packet);
    arch.setAttribute('aria-label', `Architecture: ${p.diagram.map((n) => n.label).join(' to ')}`);
    arch.setAttribute('role', 'img');

    if (typeof dialog.showModal === 'function') dialog.showModal();
    else dialog.setAttribute('open', '');
    document.documentElement.style.overflow = 'hidden';
    $('.case__inner', dialog).scrollTop = 0;
    $('[data-case-close]', dialog).focus({ preventScroll: true });

    requestAnimationFrame(() => requestAnimationFrame(() => arch.classList.add('is-drawn')));
    if (!reducedMotion()) {
      setTimeout(() => { if (dialog.open) runPacket(arch, nodes, packet); }, nodes.length * 130 + 450);
    }
  }

  function runPacket(arch, nodes, packet) {
    cancelAnimationFrame(Case.loop);
    const perHop = 650;
    let start = null;
    nodes.forEach((n) => { n.style.transitionDelay = '0ms'; });
    const tick = (now) => {
      if (!$('[data-case]').open) return;
      if (start === null) start = now;
      const total = perHop * nodes.length + 600;
      const t = (now - start) % total;
      const hop = Math.min(Math.floor(t / perHop), nodes.length - 1);
      const frac = Math.min((t - hop * perHop) / perHop, 1);
      const a = nodes[hop]; const b = nodes[Math.min(hop + 1, nodes.length - 1)];
      const ay = a.offsetTop + a.offsetHeight / 2; const by = b.offsetTop + b.offsetHeight / 2;
      const y = hop === nodes.length - 1 ? ay : lerp(ay, by, AF.util.easeInOut(frac));
      packet.style.transform = `translateY(${y - 4}px)`;
      packet.style.opacity = t > perHop * nodes.length ? '0' : '1';
      nodes.forEach((n, i) => n.classList.toggle('is-hit', i === hop && t <= perHop * nodes.length));
      Case.loop = requestAnimationFrame(tick);
    };
    Case.loop = requestAnimationFrame(tick);
  }

  function initCase() {
    const dialog = $('[data-case]');
    if (!dialog) return;
    const close = () => { if (dialog.open) dialog.close(); };
    $('[data-case-close]', dialog).addEventListener('click', close);
    dialog.addEventListener('click', (e) => { if (e.target === dialog) close(); });
    dialog.addEventListener('close', () => {
      cancelAnimationFrame(Case.loop);
      document.documentElement.style.overflow = '';
      if (Case.opener && document.contains(Case.opener)) Case.opener.focus({ preventScroll: true });
    });
  }

  /* =========================================================
     GITHUB REPOSITORIES — static first, live enhancement
     ========================================================= */
  const LANG_COLORS = { Python: '#3572A5', JavaScript: '#f1e05a', HTML: '#e34c26', CSS: '#563d7c', Java: '#b07219' };

  function renderRepos(repos) {
    const list = $('[data-repos]');
    if (!list) return;
    list.replaceChildren(...repos.map((r) => el('li', { class: 'repo' }, [
      (() => {
        const a = AF.util.extLink(`https://github.com/alferdousrana/${encodeURIComponent(r.name)}`, '');
        a.append(
          el('span', { class: 'repo__name' }, [r.name]),
          el('span', { class: 'repo__desc' }, [r.description || 'No description yet.']),
          el('span', { class: 'repo__meta' }, [
            r.language ? el('span', { class: 'repo__lang', style: `--lang:${LANG_COLORS[r.language] || '#7d8aa0'}` }, [r.language]) : null,
            el('span', {}, [`★ ${r.stars || 0}`])
          ])
        );
        return a;
      })()
    ])));
  }

  async function loadRepos() {
    renderRepos(D.repos);
    const sourceEl = $('[data-repo-source]');
    const countEl = $('[data-repo-count]');
    const apply = (live) => {
      const byName = Object.fromEntries(live.map((r) => [r.name, r]));
      const merged = D.repos.map((r) => {
        const l = byName[r.name];
        return l ? { ...r, stars: l.stargazers_count ?? r.stars, language: l.language || r.language, description: l.description || r.description } : r;
      });
      renderRepos(merged);
      if (countEl && live.length) countEl.textContent = `${live.length} public repositories`;
      if (sourceEl) sourceEl.textContent = 'live from the GitHub API';
    };

    const cached = AF.util.session.get('af-gh-repos');
    if (cached) { try { apply(JSON.parse(cached)); return; } catch (_) { /* refetch */ } }

    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 5000);
    try {
      const res = await fetch('https://api.github.com/users/alferdousrana/repos?per_page=100', { signal: ctrl.signal, headers: { Accept: 'application/vnd.github+json' } });
      if (!res.ok) throw new Error(`GitHub API ${res.status}`);
      const json = await res.json();
      if (!Array.isArray(json)) throw new Error('Unexpected payload');
      const slim = json.filter((r) => !r.fork).map((r) => ({ name: r.name, stargazers_count: r.stargazers_count, language: r.language, description: r.description }));
      AF.util.session.set('af-gh-repos', JSON.stringify(slim));
      apply(slim);
    } catch (_) {
      if (sourceEl) sourceEl.textContent = 'static snapshot · live GitHub data unavailable right now';
    } finally {
      clearTimeout(timer);
    }
  }

  /* =========================================================
     SKILLS CONSTELLATION
     ========================================================= */
  function renderConstellation() {
    const root = $('[data-constellation]');
    const info = $('[data-constellation-info]');
    if (!root) return;
    const panel = root.closest('.constellation');
    const { nodes, edges } = D.skills;
    // Narrow screens get their own geometry so labels stay legible instead of scaling down.
    const narrow = root.getBoundingClientRect().width < 600;
    const W = narrow ? 440 : 900; const H = narrow ? 600 : 560; const cx = W / 2; const cy = H / 2;
    const RX = narrow ? 150 : 340; const RY = narrow ? 240 : 215;
    root.setAttribute('viewBox', `0 0 ${W} ${H}`);
    if (narrow) root.classList.add('is-narrow');

    const pos = {};
    nodes.forEach((n, i) => {
      const a = (i / nodes.length) * Math.PI * 2 - Math.PI * 0.85;
      const k = i % 2 ? 0.8 : 1;
      pos[n.id] = { x: cx + Math.cos(a) * RX * k, y: cy + Math.sin(a) * RY * k, ox: 0, oy: 0 };
    });

    const edgeLayer = svg('g');
    const nodeLayer = svg('g');
    root.append(edgeLayer, nodeLayer);

    const lines = [];
    nodes.forEach((n) => {
      const l = svg('line', { class: 'c-edge c-edge--core', x1: cx, y1: cy, x2: pos[n.id].x, y2: pos[n.id].y });
      l.dataset.a = 'core'; l.dataset.b = n.id;
      lines.push(l); edgeLayer.append(l);
    });
    edges.forEach(([a, b]) => {
      const l = svg('line', { class: 'c-edge', x1: pos[a].x, y1: pos[a].y, x2: pos[b].x, y2: pos[b].y });
      l.dataset.a = a; l.dataset.b = b;
      lines.push(l); edgeLayer.append(l);
    });

    const neighbours = (id) => new Set(edges.flatMap(([a, b]) => (a === id ? [b] : b === id ? [a] : [])));

    // core node
    const core = svg('g', { class: 'c-node c-core', transform: `translate(${cx} ${cy})` });
    core.append(svg('circle', { r: narrow ? 50 : 62 }));
    const centre = (D.skills.center.label || 'Backend engineering').trim().split(/\s+/);
    const line1 = centre.length > 1 ? centre.slice(0, Math.ceil(centre.length / 2)).join(' ') : centre[0];
    const line2 = centre.length > 1 ? centre.slice(Math.ceil(centre.length / 2)).join(' ') : '';
    core.append(svg('text', { 'text-anchor': 'middle', y: line2 ? -4 : 5, text: line1 }));
    if (line2) core.append(svg('text', { 'text-anchor': 'middle', y: 15, text: line2 }));
    nodeLayer.append(core);

    const groups = {};
    nodes.forEach((n) => {
      const p = pos[n.id];
      const right = p.x >= cx;
      const g = svg('g', { class: 'c-node', tabindex: '0', role: 'button', 'aria-label': `${n.label}: ${n.text}`, transform: `translate(${p.x} ${p.y})` });
      g.dataset.id = n.id;
      g.append(svg('circle', { class: 'c-halo', r: 17 }));
      g.append(svg('circle', { r: 8 }));
      g.append(narrow
        ? svg('text', { x: 0, y: p.y < cy ? -16 : 25, 'text-anchor': 'middle', text: n.label })
        : svg('text', { x: right ? 16 : -16, y: 4.5, 'text-anchor': right ? 'start' : 'end', text: n.label }));
      groups[n.id] = g;
      nodeLayer.append(g);
      // generous hit area covering the dot and its label
      const bb = g.getBBox();
      g.prepend(svg('rect', { class: 'c-hit', x: bb.x - 6, y: bb.y - 6, width: bb.width + 12, height: bb.height + 12, rx: 8 }));

      const activate = () => focusNode(n);
      g.addEventListener('pointerenter', activate);
      g.addEventListener('focus', activate);
      g.addEventListener('click', activate);
      g.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); activate(); } });
      g.addEventListener('blur', reset);
    });
    root.addEventListener('pointerleave', reset);

    const defaultInfo = { group: (D.skills.center.label || 'backend engineering').toLowerCase(), label: 'The core', text: D.skills.center.text || '' };
    setInfo(defaultInfo.group, defaultInfo.label, defaultInfo.text);

    function setInfo(group, label, text) {
      if (!info) return;
      $('.constellation__group', info).textContent = group;
      $('.constellation__name', info).textContent = label;
      $('.constellation__text', info).textContent = text;
    }

    function focusNode(n) {
      const near = neighbours(n.id);
      panel.classList.add('is-focused');
      Object.entries(groups).forEach(([id, g]) => {
        g.classList.toggle('is-active', id === n.id);
        g.classList.toggle('is-near', near.has(id));
      });
      lines.forEach((l) => l.classList.toggle('is-active', l.dataset.a === n.id || l.dataset.b === n.id));
      setInfo(n.group, n.label, n.text);
    }
    function reset() {
      if (root.contains(document.activeElement) && document.activeElement !== root) return;
      panel.classList.remove('is-focused');
      Object.values(groups).forEach((g) => g.classList.remove('is-active', 'is-near'));
      lines.forEach((l) => l.classList.remove('is-active'));
      setInfo(defaultInfo.group, defaultInfo.label, defaultInfo.text);
    }

    // nodes lean toward the cursor (desktop, motion allowed)
    if (finePointer && !reducedMotion()) {
      let target = null; let raf = null;
      const toSvg = (e) => {
        const r = root.getBoundingClientRect();
        return { x: ((e.clientX - r.left) / r.width) * W, y: ((e.clientY - r.top) / r.height) * H };
      };
      const tick = () => {
        let moving = false;
        nodes.forEach((n) => {
          const p = pos[n.id];
          let tx = 0; let ty = 0;
          if (target) {
            const dx = target.x - p.x; const dy = target.y - p.y; const d = Math.hypot(dx, dy);
            if (d < 150 && d > 1) { const f = (1 - d / 150) * 10; tx = (dx / d) * f; ty = (dy / d) * f; }
          }
          p.ox = lerp(p.ox, tx, 0.15); p.oy = lerp(p.oy, ty, 0.15);
          if (Math.abs(p.ox - tx) > 0.05 || Math.abs(p.oy - ty) > 0.05) moving = true;
          groups[n.id].setAttribute('transform', `translate(${(p.x + p.ox).toFixed(1)} ${(p.y + p.oy).toFixed(1)})`);
        });
        lines.forEach((l) => {
          const a = l.dataset.a === 'core' ? { x: cx, y: cy, ox: 0, oy: 0 } : pos[l.dataset.a];
          const b = pos[l.dataset.b];
          l.setAttribute('x1', (a.x + a.ox).toFixed(1)); l.setAttribute('y1', (a.y + a.oy).toFixed(1));
          l.setAttribute('x2', (b.x + b.ox).toFixed(1)); l.setAttribute('y2', (b.y + b.oy).toFixed(1));
        });
        raf = moving || target ? requestAnimationFrame(tick) : null;
      };
      root.addEventListener('pointermove', (e) => { target = toSvg(e); if (!raf) raf = requestAnimationFrame(tick); }, { passive: true });
      root.addEventListener('pointerleave', () => { target = null; if (!raf) raf = requestAnimationFrame(tick); });
    }
  }

  /* =========================================================
     NAVIGATION · SCROLL PROGRESS
     ========================================================= */
  function initNav() {
    const nav = $('[data-nav]');
    const toggle = $('.nav__toggle', nav);
    const links = $$('.nav__menu a', nav);
    const bar = $('.scroll-progress span');

    const closeMenu = () => {
      nav.classList.remove('is-open');
      toggle.setAttribute('aria-expanded', 'false');
      toggle.setAttribute('aria-label', 'Open menu');
    };
    toggle.addEventListener('click', () => {
      const open = !nav.classList.contains('is-open');
      nav.classList.toggle('is-open', open);
      toggle.setAttribute('aria-expanded', String(open));
      toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    });
    links.forEach((a) => a.addEventListener('click', closeMenu));
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && nav.classList.contains('is-open')) { closeMenu(); toggle.focus(); } });
    document.addEventListener('click', (e) => { if (nav.classList.contains('is-open') && !nav.contains(e.target)) closeMenu(); });

    let ticking = false;
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        const y = window.scrollY;
        nav.classList.toggle('is-compact', y > 40);
        const max = document.documentElement.scrollHeight - window.innerHeight;
        bar.style.transform = `scaleX(${max > 0 ? clamp(y / max, 0, 1) : 0})`;
        ticking = false;
      });
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();

    // active section
    const map = new Map(links.map((a) => [a.getAttribute('href').slice(1), a]));
    const aliases = { recognition: 'skills', break: 'lab' };
    if ('IntersectionObserver' in window) {
      const io = new IntersectionObserver((entries) => {
        entries.forEach((e) => {
          if (!e.isIntersecting) return;
          const id = aliases[e.target.id] || e.target.id;
          links.forEach((a) => a.removeAttribute('aria-current'));
          map.get(id)?.setAttribute('aria-current', 'true');
        });
      }, { rootMargin: '-45% 0px -50% 0px' });
      $$('main > section[id]').forEach((s) => io.observe(s));
    }

    document.addEventListener('af:online', () => { const chip = $('[data-status-chip]'); if (chip) chip.hidden = false; }, { once: true });
  }

  /* =========================================================
     CURSOR · BACKDROP GLOW · MAGNETIC BUTTONS
     ========================================================= */
  function initPointerFX() {
    if (!finePointer || reducedMotion()) return;
    const rootStyle = document.documentElement.style;
    const cursor = $('.cursor');
    const dot = $('.cursor__dot'); const ring = $('.cursor__ring');
    document.documentElement.classList.add('has-cursor');

    const m = { x: -100, y: -100 }; const r = { x: -100, y: -100 };
    let running = false;
    const loop = () => {
      r.x = lerp(r.x, m.x, 0.2); r.y = lerp(r.y, m.y, 0.2);
      dot.style.transform = `translate3d(${m.x}px, ${m.y}px, 0)`;
      ring.style.transform = `translate3d(${r.x}px, ${r.y}px, 0)`;
      rootStyle.setProperty('--mx', `${m.x}px`);
      rootStyle.setProperty('--my', `${m.y}px`);
      rootStyle.setProperty('--gx', `${((m.x / window.innerWidth) - 0.5) * -14}px`);
      rootStyle.setProperty('--gy', `${((m.y / window.innerHeight) - 0.5) * -14}px`);
      if (Math.abs(r.x - m.x) > 0.1 || Math.abs(r.y - m.y) > 0.1) requestAnimationFrame(loop);
      else running = false;
    };
    window.addEventListener('pointermove', (e) => {
      if (e.pointerType !== 'mouse') return;
      m.x = e.clientX; m.y = e.clientY;
      if (!running) { running = true; requestAnimationFrame(loop); }
    }, { passive: true });
    document.addEventListener('pointerleave', () => { m.x = -100; m.y = -100; });

    const interactive = 'a, button, [role="button"], [role="tab"], [role="radio"], .project, label, summary';
    document.addEventListener('pointerover', (e) => { if (e.target.closest(interactive)) cursor.classList.add('is-hover'); });
    document.addEventListener('pointerout', (e) => { if (e.target.closest(interactive)) cursor.classList.remove('is-hover'); });
    document.addEventListener('pointerdown', () => cursor.classList.add('is-down'));
    document.addEventListener('pointerup', () => cursor.classList.remove('is-down'));
    AF.cursor = { setHover: (on) => cursor.classList.toggle('is-hover', on) };

    // magnetic buttons (delegated so dynamically rendered buttons work too)
    document.addEventListener('pointermove', (e) => {
      const btn = e.target.closest('[data-magnetic]');
      $$('[data-magnetic].is-magnet').forEach((b) => { if (b !== btn) { b.classList.remove('is-magnet'); b.style.setProperty('--bx', '0px'); b.style.setProperty('--by', '0px'); } });
      if (!btn) return;
      const rect = btn.getBoundingClientRect();
      const dx = e.clientX - (rect.left + rect.width / 2);
      const dy = e.clientY - (rect.top + rect.height / 2);
      btn.classList.add('is-magnet');
      btn.style.setProperty('--bx', `${clamp(dx * 0.18, -8, 8)}px`);
      btn.style.setProperty('--by', `${clamp(dy * 0.28, -6, 6)}px`);
    }, { passive: true });
  }

  /* =========================================================
     MISC: shortcuts, copy, terminal links, images, year
     ========================================================= */
  function initMisc() {
    $$('[data-copy-email]').forEach((b) => b.addEventListener('click', async () => {
      const ok = await AF.util.copyEmail(b.dataset.copyEmail);
      if (ok) { b.textContent = 'copied'; setTimeout(() => { b.textContent = 'copy'; }, 1800); }
    }));

    $$('[data-open-terminal]').forEach((a) => a.addEventListener('click', (e) => { e.preventDefault(); AF.terminal.focus(); }));

    document.addEventListener('keydown', (e) => {
      if (e.key !== '/' || e.metaKey || e.ctrlKey || e.altKey) return;
      const t = e.target;
      if (t.closest('input, textarea, [contenteditable="true"]') || $('[data-case]')?.open) return;
      e.preventDefault();
      AF.terminal.focus();
    });

    $$('img[data-hide-on-error]').forEach((img) => {
      const hide = () => { img.hidden = true; };
      if (img.complete && img.naturalWidth === 0) hide();
      img.addEventListener('error', hide);
    });

    const year = $('[data-year]');
    if (year) year.textContent = String(new Date().getFullYear());
  }

  /* =========================================================
     BOOT
     ========================================================= */
  function init() {
    document.documentElement.classList.remove('no-js');
    AF.render.all();
    renderProfile();
    renderDNA();
    renderTimeline();
    renderProjects();
    renderConstellation();
    AF.render.sections();
    initCase();
    initNav();
    initPointerFX();
    AF.anim.init();
    AF.lab.init();
    AF.terminal.init();
    AF.game.init();
    initMisc();
    loadRepos();
  }

  AF.main = { openCase };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})(window.AF);
