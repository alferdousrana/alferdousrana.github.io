/*
 * Portfolio admin — no database.
 * Content lives in js/data.js inside the GitHub repository. This page reads it,
 * edits it in the browser and commits it back through the GitHub REST API.
 * The token never leaves the browser except in requests to api.github.com.
 */
(function () {
  'use strict';
  const { $, $$, el, fill } = window.AF.util;
  const toast = window.AF.util.toast;

  const DATA_PATH = 'js/data.js';
  const UPLOAD_DIR = 'assets/images/uploads';
  const DRAFT_KEY = 'af-admin-draft';
  const CONN_KEY = 'af-admin-github';
  const HEADER = '/*\n * Portfolio content. This file is written by the admin panel (admin.html).\n * You can also edit it by hand: it must stay valid JSON after "window.PORTFOLIO =".\n */\n';

  const state = { data: null, sha: null, conn: null, pending: {}, dirty: false, panel: 'person', open: new WeakSet() };

  /* =========================================================
     helpers
     ========================================================= */
  const clone = (o) => JSON.parse(JSON.stringify(o));
  const slug = (s) => String(s || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40) || 'image';
  const get = (obj, path) => path.split('.').reduce((o, k) => (o == null ? undefined : o[k]), obj);
  function set(obj, path, value) {
    const keys = path.split('.');
    const last = keys.pop();
    const target = keys.reduce((o, k) => (o[k] && typeof o[k] === 'object' ? o[k] : (o[k] = {})), obj);
    target[last] = value;
  }
  const thisMonth = () => new Date().toISOString().slice(0, 7);

  function b64encode(str) {
    const bytes = new TextEncoder().encode(str);
    let bin = '';
    for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000));
    return btoa(bin);
  }
  function b64decode(b64) {
    const bin = atob(b64.replace(/\s/g, ''));
    const bytes = Uint8Array.from(bin, (c) => c.charCodeAt(0));
    return new TextDecoder().decode(bytes);
  }

  const parseDataFile = (text) => JSON.parse(text.slice(text.indexOf('{'), text.lastIndexOf('}') + 1));
  const serialize = (data) => `${HEADER}window.PORTFOLIO = ${JSON.stringify(data, null, 2)};\n`;

  /* =========================================================
     GitHub API
     ========================================================= */
  async function gh(path, { method = 'GET', body } = {}) {
    const { owner, repo, token } = state.conn;
    const res = await fetch(`https://api.github.com/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}${path}`, {
      method,
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
        ...(body ? { 'Content-Type': 'application/json' } : {})
      },
      body: body ? JSON.stringify(body) : undefined,
      cache: 'no-store'
    });
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      const err = new Error(j.message || `GitHub responded ${res.status}`);
      err.status = res.status;
      throw err;
    }
    return res.status === 204 ? null : res.json();
  }
  const contentsPath = (p) => `/contents/${p.split('/').map(encodeURIComponent).join('/')}`;

  async function fetchFile(path) {
    return gh(`${contentsPath(path)}?ref=${encodeURIComponent(state.conn.branch)}`);
  }
  async function putFile(path, base64, message, sha) {
    return gh(contentsPath(path), { method: 'PUT', body: { message, content: base64, branch: state.conn.branch, ...(sha ? { sha } : {}) } });
  }

  function explain(err) {
    if (err.status === 401) return 'GitHub rejected the token. Check that it is correct and not expired.';
    if (err.status === 403) return 'The token is not allowed to do this. Give it "Contents: Read and write" on this repository.';
    if (err.status === 404) return 'Repository, branch or js/data.js not found. Check owner, repository and branch.';
    if (err.status === 409) return 'The file changed on GitHub while you were editing. Reload and try again.';
    if (err.status === 422) return `GitHub could not accept the change: ${err.message}`;
    if (err instanceof TypeError) return 'Could not reach GitHub. Check your internet connection.';
    return err.message || 'Something went wrong.';
  }

  /* =========================================================
     field schema
     ========================================================= */
  const F = {
    text: (key, label, o = {}) => ({ type: 'text', key, label, ...o }),
    area: (key, label, o = {}) => ({ type: 'textarea', key, label, ...o }),
    num: (key, label, o = {}) => ({ type: 'number', key, label, ...o }),
    bool: (key, label, o = {}) => ({ type: 'bool', key, label, ...o }),
    month: (key, label, o = {}) => ({ type: 'month', key, label, ...o }),
    select: (key, label, options, o = {}) => ({ type: 'select', key, label, options, ...o }),
    multi: (key, label, options, o = {}) => ({ type: 'multi', key, label, options, ...o }),
    tags: (key, label, o = {}) => ({ type: 'tags', key, label, ...o }),
    strings: (key, label, o = {}) => ({ type: 'strings', key, label, ...o }),
    image: (key, label, o = {}) => ({ type: 'image', key, label, ...o }),
    list: (key, label, fields, o = {}) => ({ type: 'list', key, label, fields, ...o }),
    group: (label, fields) => ({ type: 'group', label, fields }),
    row: (fields) => ({ type: 'row', fields })
  };

  const PANELS = [
    {
      id: 'person', title: 'Profile & links', desc: 'Your name, headline, photo and contact links. These appear in the hero, about, contact and footer.',
      fields: [
        F.row([F.text('person.name', 'Full name'), F.text('person.role', 'Role')]),
        F.text('person.stack', 'Stack line', { hint: 'Separate items with •  e.g. Python • Django • REST APIs' }),
        F.area('person.tagline', 'Tagline', { hint: 'One sentence under your name in the hero.' }),
        F.image('person.photo', 'Profile photo', { hint: 'Shown in the About section. Square or portrait works best.' }),
        F.text('person.photoAlt', 'Photo description', { hint: 'For screen readers, e.g. "Portrait of Md. Al Ferdous".' }),
        F.bool('person.available', 'Show "Available for opportunities"'),
        F.group('Contact', [
          F.row([F.text('person.email', 'Email', { input: 'email' }), F.text('person.location', 'Location')]),
          F.text('person.github', 'GitHub URL', { input: 'url' }),
          F.text('person.linkedin', 'LinkedIn URL', { input: 'url' }),
          F.text('person.facebook', 'Facebook URL', { input: 'url' })
        ])
      ]
    },
    {
      id: 'hero', title: 'Hero', desc: 'The quick facts under the hero and the nodes in the animated system graph.',
      fields: [
        F.list('hero.facts', 'Quick facts', [F.text('label', 'Label', { hint: 'One short word, e.g. "led"' }), F.text('text', 'Fact')], { itemTitle: 'text', make: () => ({ label: '', text: '' }) }),
        F.list('heroNodes', 'Graph nodes', [
          F.text('label', 'Label'), F.text('info', 'Tooltip text'),
          F.tags('connects', 'Connects to', { hint: 'Labels of other nodes, comma separated. Every node also links to the centre.' })
        ], { itemTitle: 'label', make: () => ({ label: 'New node', info: '', connects: [] }) })
      ]
    },
    {
      id: 'about', title: 'About', desc: 'Your story, the stats and the engineer.profile panel.',
      fields: [
        F.text('about.title', 'Section title'),
        F.area('about.lede', 'Opening statement'),
        F.strings('about.paragraphs', 'Paragraphs', { multiline: true, addLabel: 'Add paragraph' }),
        F.list('metrics', 'Stats', [F.row([F.num('value', 'Number'), F.text('suffix', 'After the number', { hint: 'e.g. "+" or "+ yrs"' })]), F.text('label', 'Description')],
          { itemTitle: 'label', make: () => ({ value: 0, suffix: '', label: '' }), hint: 'Numbers count up when scrolled into view. Use real figures only.' }),
        F.list('profile', 'engineer.profile rows', [F.text('key', 'Key', { hint: 'Shown like code, e.g. primary_stack' }), F.tags('value', 'Values', { hint: 'Comma separated' }), F.bool('pipeline', 'Show as a → pipeline')],
          { itemTitle: 'key', make: () => ({ key: 'new_key', value: [], pipeline: false }) })
      ]
    },
    {
      id: 'dna', title: 'Engineering DNA', desc: 'The principle cards. The detail text appears when a card is opened.',
      fields: [
        F.list('dna', 'Principles', [
          F.row([F.text('title', 'Title'), F.select('glyph', 'Icon', ['layers', 'lock', 'branch', 'database', 'modules', 'deploy'])]),
          F.text('summary', 'One-line summary'), F.area('detail', 'How it is applied')
        ], { itemTitle: 'title', make: () => ({ title: 'New principle', glyph: 'layers', summary: '', detail: '' }) })
      ]
    },
    {
      id: 'experience', title: 'Experience', desc: 'Roles on the timeline. Durations and labels are calculated from the dates.',
      fields: [
        F.list('experience', 'Roles', [
          F.row([F.text('company', 'Company'), F.text('role', 'Role')]),
          F.row([F.month('start', 'Start'), F.month('end', 'End', { hint: 'Leave empty if current' }), F.bool('current', 'I work here now')]),
          F.strings('points', 'Responsibilities', { multiline: true, addLabel: 'Add responsibility' }),
          F.multi('signals', 'System areas', [['api', 'API'], ['database', 'Database'], ['auth', 'Auth'], ['architecture', 'Architecture'], ['deployment', 'Deployment']]),
          F.tags('tech', 'Stack', { hint: 'Comma separated' }),
          F.list('links', 'Project links', [F.row([F.text('label', 'Label'), F.text('url', 'URL', { input: 'url' })])], { itemTitle: 'label', make: () => ({ label: '', url: '' }) })
        ], { itemTitle: 'company', subtitle: 'role', make: () => ({ company: 'New company', role: '', start: thisMonth(), end: '', current: true, points: [], signals: [], tech: [], links: [] }) })
      ]
    },
    {
      id: 'projects', title: 'Projects', desc: 'Project cards and their case studies. Order here is the order on the site.',
      fields: [
        F.list('projects', 'Projects', [
          F.row([F.text('name', 'Name'), F.text('type', 'Type', { hint: 'e.g. Healthcare platform' })]),
          F.image('image', 'Screenshot (optional)', { hint: 'Shown at the top of the case study.' }),
          F.tags('stack', 'Stack', { hint: 'Comma separated' }),
          F.text('meta', 'Hover detail', { hint: 'Small technical line revealed on hover.' }),
          F.area('problem', 'Problem'), F.area('built', 'What I built'),
          F.strings('features', 'Key features', { addLabel: 'Add feature' }),
          F.list('links', 'Links', [F.row([F.select('kind', 'Type', [['live', 'Live site'], ['github', 'GitHub'], ['package', 'Package']]), F.text('label', 'Label')]), F.text('url', 'URL', { input: 'url' })],
            { itemTitle: 'label', make: () => ({ kind: 'live', label: 'Visit live site', url: '' }) }),
          F.list('case', 'Case study sections', [F.text('h', 'Heading'), F.area('p', 'Text')], { itemTitle: 'h', make: () => ({ h: 'New section', p: '' }) }),
          F.list('diagram', 'Architecture diagram (top to bottom)', [F.row([F.text('label', 'Layer'), F.select('tone', 'Colour', [['cyan', 'Cyan — data'], ['violet', 'Violet — auth'], ['green', 'Green — storage']])]), F.text('sub', 'Detail')],
            { itemTitle: 'label', make: () => ({ label: 'Layer', sub: '', tone: 'cyan' }) })
        ], { itemTitle: 'name', subtitle: 'type', make: () => ({ name: 'New project', type: '', image: '', stack: [], meta: '', problem: '', built: '', features: [], links: [], case: [], diagram: [] }) })
      ]
    },
    {
      id: 'repos', title: 'GitHub repos', desc: 'Repositories shown under "Open source & code". Stars and descriptions refresh live from GitHub when available.',
      fields: [
        F.list('repos', 'Repositories', [F.row([F.text('name', 'Repository name', { hint: 'Exactly as on GitHub' }), F.text('language', 'Language')]), F.area('description', 'Description')],
          { itemTitle: 'name', make: () => ({ name: '', language: 'Python', description: '' }) })
      ]
    },
    {
      id: 'skills', title: 'Skills', desc: 'The technology constellation. Connections are drawn between skills you link together.',
      fields: [
        F.row([F.text('skills.center.label', 'Centre label')]),
        F.area('skills.center.text', 'Centre description'),
        F.list('skills.nodes', 'Technologies', [
          F.row([F.text('label', 'Name'), F.text('group', 'Group', { hint: 'e.g. backend, database, tools' })]),
          F.area('text', 'How you use it'),
          F.tags('connects', 'Connects to', { hint: 'Names of related skills, comma separated' })
        ], { itemTitle: 'label', subtitle: 'group', make: () => ({ label: 'New skill', group: 'backend', text: '', connects: [] }) })
      ]
    },
    {
      id: 'recognition', title: 'Awards & education', desc: 'Recognition cards, degrees and certifications.',
      fields: [
        F.list('awards', 'Awards', [
          F.row([F.text('name', 'Award'), F.text('top', 'Year or rank', { hint: 'e.g. 2021 or Top 30' })]),
          F.row([F.text('honour', 'Honour', { hint: 'e.g. Best Team' }), F.text('issuer', 'Issued by')]),
          F.bool('featured', 'Feature this award (large card)')
        ], { itemTitle: 'name', make: () => ({ top: '', name: 'New award', honour: '', issuer: '', featured: false }) }),
        F.list('education', 'Education', [F.text('degree', 'Degree'), F.text('school', 'Institution'), F.row([F.text('cgpa', 'CGPA'), F.text('scale', 'Out of')])],
          { itemTitle: 'degree', make: () => ({ degree: '', school: '', cgpa: '', scale: '4.00' }) }),
        F.list('certifications', 'Certifications', [F.text('name', 'Course'), F.row([F.text('issuer', 'Provider'), F.text('year', 'Year')])],
          { itemTitle: 'name', make: () => ({ name: '', issuer: '', year: String(new Date().getFullYear()) }) })
      ]
    },
    {
      id: 'gallery', title: 'Gallery', desc: 'Photos from work, events and awards. The section appears on the site once it has at least one photo.',
      fields: [
        F.row([F.text('gallery.title', 'Section title')]),
        F.text('gallery.text', 'Section description'),
        F.list('gallery.items', 'Photos', [F.image('src', 'Photo'), F.text('caption', 'Caption'), F.text('alt', 'Description for screen readers')],
          { itemTitle: 'caption', make: () => ({ src: '', caption: '', alt: '' }), bulkImages: 'src' })
      ]
    },
    {
      id: 'contact', title: 'Contact', desc: 'The closing call to action. Email and links come from Profile & links.',
      fields: [F.text('contact.title', 'Headline'), F.area('contact.text', 'Message'), F.text('contact.button', 'Button text')]
    },
    { divider: true },
    {
      id: 'sections', title: 'Show / hide sections', desc: 'Turn whole sections on or off. Hidden sections disappear from the page and the menu.',
      fields: [F.group('Sections', [
        F.bool('sections.dna', 'Engineering DNA'), F.bool('sections.experience', 'Experience'), F.bool('sections.projects', 'Projects'),
        F.bool('sections.code', 'GitHub repositories'), F.bool('sections.skills', 'Skills'), F.bool('sections.recognition', 'Awards & education'),
        F.bool('sections.gallery', 'Gallery'), F.bool('sections.lab', 'Engineering lab & terminal'), F.bool('sections.game', 'Mini-game')
      ])]
    },
    { id: 'json', title: 'Raw JSON', desc: 'Everything in one place, for bulk edits. Invalid JSON is never saved.', custom: 'json' }
  ];

  /* =========================================================
     field rendering
     ========================================================= */
  function markDirty() {
    state.dirty = true;
    $('[data-dirty]').hidden = false;
    saveDraftSoon();
  }

  function labelled(f, control) {
    return el('label', { class: 'field' }, [
      el('span', { class: 'field__label' }, [f.label]),
      control,
      f.hint ? el('span', { class: 'field__hint' }, [f.hint]) : null
    ]);
  }

  function renderField(f, obj, onTitle) {
    const value = f.key ? get(obj, f.key) : undefined;
    const update = (v) => { set(obj, f.key, v); markDirty(); if (onTitle) onTitle(); };

    switch (f.type) {
      case 'row': return el('div', { class: 'field-row' }, f.fields.map((x) => renderField(x, obj, onTitle)));
      case 'group': return el('div', { class: 'group' }, [el('p', { class: 'group__title' }, [f.label]), ...f.fields.map((x) => renderField(x, obj, onTitle))]);
      case 'text': case 'number': case 'month': {
        const input = el('input', { type: f.type === 'text' ? (f.input || 'text') : f.type, value: value ?? '', spellcheck: f.input ? 'false' : 'true' });
        input.addEventListener('input', () => update(f.type === 'number' ? (input.value === '' ? 0 : Number(input.value)) : input.value));
        return labelled(f, input);
      }
      case 'textarea': {
        const ta = el('textarea', { rows: 3 });
        ta.value = value ?? '';
        ta.addEventListener('input', () => update(ta.value));
        return labelled(f, ta);
      }
      case 'bool': {
        const box = el('input', { type: 'checkbox' });
        box.checked = value !== false && value !== undefined ? !!value : false;
        if (f.key.startsWith('sections.') && value === undefined) box.checked = true;
        box.addEventListener('change', () => update(box.checked));
        return el('label', { class: 'check' }, [box, el('span', {}, [f.label])]);
      }
      case 'select': {
        const sel = el('select', {}, f.options.map((o) => {
          const [v, l] = Array.isArray(o) ? o : [o, o];
          return el('option', { value: v, selected: v === value }, [l]);
        }));
        sel.addEventListener('change', () => update(sel.value));
        return labelled(f, sel);
      }
      case 'multi': {
        const current = new Set(Array.isArray(value) ? value : []);
        const boxes = el('div', { class: 'checks' }, f.options.map(([v, l]) => {
          const box = el('input', { type: 'checkbox' });
          box.checked = current.has(v);
          box.addEventListener('change', () => {
            box.checked ? current.add(v) : current.delete(v);
            update(f.options.map(([x]) => x).filter((x) => current.has(x)));
          });
          return el('label', { class: 'check' }, [box, el('span', {}, [l])]);
        }));
        return el('div', { class: 'field' }, [el('span', { class: 'field__label' }, [f.label]), boxes]);
      }
      case 'tags': {
        const input = el('input', { type: 'text', value: (Array.isArray(value) ? value : []).join(', ') });
        input.addEventListener('input', () => update(input.value.split(',').map((t) => t.trim()).filter(Boolean)));
        return labelled(f, input);
      }
      case 'strings': return renderStrings(f, obj);
      case 'image': return renderImage(f, obj, onTitle);
      case 'list': return renderList(f, obj);
      default: return null;
    }
  }

  function renderStrings(f, obj) {
    const wrap = el('div', { class: 'field' });
    const draw = () => {
      const arr = Array.isArray(get(obj, f.key)) ? get(obj, f.key) : [];
      set(obj, f.key, arr);
      const rows = arr.map((v, i) => {
        const input = f.multiline ? el('textarea', { rows: 3 }) : el('input', { type: 'text' });
        input.value = v;
        input.addEventListener('input', () => { arr[i] = input.value; markDirty(); });
        const up = el('button', { type: 'button', class: 'icon-btn', 'aria-label': 'Move up', disabled: i === 0 }, ['↑']);
        const del = el('button', { type: 'button', class: 'icon-btn icon-btn--danger', 'aria-label': 'Remove' }, ['✕']);
        up.addEventListener('click', () => { [arr[i - 1], arr[i]] = [arr[i], arr[i - 1]]; markDirty(); draw(); });
        del.addEventListener('click', () => { arr.splice(i, 1); markDirty(); draw(); });
        return el('div', { class: 'strings__row' }, [input, up, del]);
      });
      const add = el('button', { type: 'button', class: 'add-btn' }, [`+ ${f.addLabel || 'Add'}`]);
      add.addEventListener('click', () => {
        arr.push(''); markDirty(); draw();
        const inputs = $$('input, textarea', wrap); inputs[inputs.length - 1]?.focus();
      });
      fill(wrap, el('span', { class: 'field__label' }, [f.label]), el('div', { class: 'strings' }, rows), add,
        f.hint ? el('span', { class: 'field__hint' }, [f.hint]) : null);
    };
    draw();
    return wrap;
  }

  function imageSrc(path) {
    if (!path) return '';
    if (state.pending[path]) return state.pending[path].dataUrl;
    if (/^(https?:)?\/\//i.test(path) || /^[\w./-]+$/.test(path)) return path;
    return '';
  }

  async function processImage(file) {
    if (!file.type.startsWith('image/')) throw new Error(`${file.name} is not an image.`);
    if (file.size > 20 * 1024 * 1024) throw new Error(`${file.name} is larger than 20 MB.`);
    const url = URL.createObjectURL(file);
    try {
      const img = new Image();
      img.src = url;
      await img.decode();
      const max = 1600;
      const scale = Math.min(1, max / Math.max(img.naturalWidth, img.naturalHeight));
      const w = Math.round(img.naturalWidth * scale); const h = Math.round(img.naturalHeight * scale);
      const canvas = el('canvas', { width: w, height: h });
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = '#070a10';
      ctx.fillRect(0, 0, w, h);
      ctx.drawImage(img, 0, 0, w, h);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
      const base = file.name.replace(/\.[^.]+$/, '');
      const path = `${UPLOAD_DIR}/${Date.now().toString(36)}-${slug(base)}.jpg`;
      state.pending[path] = { dataUrl, b64: dataUrl.split(',')[1] };
      return path;
    } finally {
      URL.revokeObjectURL(url);
    }
  }

  function renderImage(f, obj, onTitle) {
    const wrap = el('div', { class: 'field' });
    const draw = () => {
      const val = get(obj, f.key) || '';
      const src = imageSrc(val);
      const preview = el('div', { class: 'image-field__preview' }, [src ? el('img', { src, alt: '' }) : 'no image']);
      const img = $('img', preview);
      if (img) img.addEventListener('error', () => fill(preview, 'not found yet'));
      const path = el('input', { type: 'text', value: val, spellcheck: 'false', placeholder: 'assets/images/…', 'aria-label': `${f.label} path` });
      path.addEventListener('change', () => { set(obj, f.key, path.value.trim()); markDirty(); draw(); });
      const file = el('input', { type: 'file', accept: 'image/*', hidden: true });
      const upload = el('button', { type: 'button', class: 'btn btn--ghost btn--sm' }, [val ? 'Replace image' : 'Upload image']);
      upload.addEventListener('click', () => file.click());
      file.addEventListener('change', async () => {
        if (!file.files[0]) return;
        try {
          const p = await processImage(file.files[0]);
          set(obj, f.key, p); markDirty(); draw(); if (onTitle) onTitle();
        } catch (err) { toast(err.message, true); }
      });
      const remove = el('button', { type: 'button', class: 'btn btn--ghost btn--sm', hidden: !val }, ['Remove']);
      remove.addEventListener('click', () => { set(obj, f.key, ''); markDirty(); draw(); });
      fill(wrap, 
        el('span', { class: 'field__label' }, [f.label]),
        el('div', { class: 'image-field' }, [
          preview,
          el('div', { class: 'image-field__body' }, [
            path,
            el('div', { class: 'image-field__actions' }, [upload, remove, file]),
            state.pending[val] ? el('span', { class: 'image-field__badge' }, ['new — uploads when you publish']) : null,
            f.hint ? el('span', { class: 'field__hint' }, [f.hint]) : null
          ])
        ])
      );
    };
    draw();
    return wrap;
  }

  function renderList(f, obj) {
    const wrap = el('div', { class: 'list' });
    const draw = () => {
      let arr = get(obj, f.key);
      if (!Array.isArray(arr)) { arr = []; set(obj, f.key, arr); }
      const head = el('div', { class: 'list__head' }, [
        el('span', { class: 'group__title' }, [f.label]),
        el('span', { class: 'field__hint' }, [`${arr.length} item${arr.length === 1 ? '' : 's'}`])
      ]);
      const items = arr.map((item, i) => {
        const titleEl = el('span', { class: 'item__title' });
        const setTitle = () => {
          const t = item[f.itemTitle] || (typeof item.src === 'string' && item.src ? item.src.split('/').pop() : '');
          titleEl.textContent = [t || 'Untitled', f.subtitle && item[f.subtitle] ? `— ${item[f.subtitle]}` : ''].join(' ');
        };
        setTitle();
        const btn = (label, sym, fn, extra = {}) => {
          const b = el('button', { type: 'button', class: `icon-btn${extra.danger ? ' icon-btn--danger' : ''}`, 'aria-label': label, title: label, disabled: !!extra.disabled }, [sym]);
          b.addEventListener('click', (e) => { e.preventDefault(); e.stopPropagation(); fn(); });
          return b;
        };
        const move = (to) => { arr.splice(to, 0, arr.splice(i, 1)[0]); markDirty(); draw(); };
        const details = el('details', { class: 'item', open: state.open.has(item) }, [
          el('summary', {}, [
            el('span', { class: 'item__index' }, [String(i + 1).padStart(2, '0')]), titleEl,
            btn('Move up', '↑', () => move(i - 1), { disabled: i === 0 }),
            btn('Move down', '↓', () => move(i + 1), { disabled: i === arr.length - 1 }),
            btn('Delete', '✕', () => {
              if (!confirm(`Delete "${titleEl.textContent.trim()}"?`)) return;
              arr.splice(i, 1); markDirty(); draw();
            }, { danger: true })
          ]),
          el('div', { class: 'item__body' }, f.fields.map((x) => renderField(x, item, setTitle)))
        ]);
        details.addEventListener('toggle', () => { details.open ? state.open.add(item) : state.open.delete(item); });
        return details;
      });
      const add = el('button', { type: 'button', class: 'add-btn' }, [`+ Add ${f.label.toLowerCase().replace(/s$/, '')}`]);
      add.addEventListener('click', () => {
        const item = f.make ? f.make() : {};
        arr.push(item); state.open.add(item); markDirty(); draw();
        wrap.querySelector('details:last-of-type')?.scrollIntoView({ block: 'center', behavior: 'smooth' });
      });
      const extras = [];
      if (f.bulkImages) {
        const file = el('input', { type: 'file', accept: 'image/*', multiple: true, hidden: true });
        const bulk = el('button', { type: 'button', class: 'add-btn' }, ['+ Upload several photos']);
        bulk.addEventListener('click', () => file.click());
        file.addEventListener('change', async () => {
          for (const fl of file.files) {
            try {
              const p = await processImage(fl);
              const item = f.make(); item[f.bulkImages] = p; arr.push(item); state.open.add(item);
            } catch (err) { toast(err.message, true); }
          }
          markDirty(); draw();
        });
        extras.push(bulk, file);
      }
      fill(wrap, head,
        f.hint ? el('span', { class: 'field__hint' }, [f.hint]) : null,
        ...(items.length ? items : [el('p', { class: 'list__empty' }, ['Nothing here yet.'])]),
        el('div', { class: 'image-field__actions' }, [add, ...extras]));
    };
    draw();
    return wrap;
  }

  /* =========================================================
     panels
     ========================================================= */
  function renderSidebar() {
    const nav = $('[data-sidebar]');
    fill(nav, ...PANELS.map((p) => {
      if (p.divider) return el('hr');
      const b = el('button', { type: 'button', 'aria-current': String(p.id === state.panel) }, [p.title]);
      b.addEventListener('click', () => { state.panel = p.id; renderSidebar(); renderPanel(); });
      return b;
    }));
  }

  function renderPanel() {
    const panel = PANELS.find((p) => p.id === state.panel) || PANELS[0];
    const ws = $('[data-workspace]');
    const body = panel.custom === 'json' ? renderJsonPanel() : el('div', { class: 'form' }, panel.fields.map((f) => renderField(f, state.data)));
    fill(ws, el('h1', { class: 'workspace__title' }, [panel.title]), el('p', { class: 'workspace__desc' }, [panel.desc]), body);
    ws.scrollTop = 0;
    window.scrollTo({ top: 0 });
  }

  function renderJsonPanel() {
    const ta = el('textarea', { class: 'json-editor', spellcheck: 'false', 'aria-label': 'Content JSON' });
    ta.value = JSON.stringify(state.data, null, 2);
    const err = el('p', { class: 'json-error', role: 'alert' });
    const apply = el('button', { type: 'button', class: 'btn btn--primary btn--sm' }, ['Apply JSON']);
    apply.addEventListener('click', () => {
      try {
        const parsed = JSON.parse(ta.value);
        if (!parsed || typeof parsed !== 'object' || !parsed.person) throw new Error('The JSON must be an object with at least a "person" section.');
        state.data = parsed; markDirty(); err.textContent = ''; toast('JSON applied.');
      } catch (e) { err.textContent = e.message; }
    });
    return el('div', { class: 'form' }, [el('label', { class: 'field' }, [ta]), err, el('div', {}, [apply])]);
  }

  /* =========================================================
     drafts
     ========================================================= */
  let draftTimer = null;
  let quotaWarned = false;
  function referencedPending() {
    const json = JSON.stringify(state.data);
    return Object.keys(state.pending).filter((p) => json.includes(p));
  }
  function saveDraft() {
    const images = Object.fromEntries(referencedPending().map((p) => [p, state.pending[p].dataUrl]));
    const draft = { data: state.data, images, baseSha: state.sha, savedAt: Date.now() };
    try { localStorage.setItem(DRAFT_KEY, JSON.stringify(draft)); return true; } catch (_) {
      try {
        localStorage.setItem(DRAFT_KEY, JSON.stringify({ ...draft, images: {} }));
        if (!quotaWarned) { toast('Draft saved without new images (browser storage is full).', true); quotaWarned = true; }
      } catch (__) { /* storage unavailable */ }
      return false;
    }
  }
  function saveDraftSoon() { clearTimeout(draftTimer); draftTimer = setTimeout(saveDraft, 600); }
  function readDraft() { try { return JSON.parse(localStorage.getItem(DRAFT_KEY) || 'null'); } catch (_) { return null; } }
  function clearDraft() { try { localStorage.removeItem(DRAFT_KEY); } catch (_) { /* ignore */ } }

  function maybeRestoreDraft() {
    const draft = readDraft();
    if (!draft || !draft.data) return;
    if (JSON.stringify(draft.data) === JSON.stringify(state.data)) return;
    const when = new Date(draft.savedAt || Date.now()).toLocaleString();
    const stale = state.sha && draft.baseSha && draft.baseSha !== state.sha;
    const msg = `You have unpublished changes saved on this device (${when}).${stale ? '\n\nThe site has been updated since then — restoring will replace those newer changes when you publish.' : ''}\n\nRestore them?`;
    if (!confirm(msg)) { clearDraft(); return; }
    state.data = draft.data;
    Object.entries(draft.images || {}).forEach(([p, dataUrl]) => { state.pending[p] = { dataUrl, b64: dataUrl.split(',')[1] }; });
    state.dirty = true;
    $('[data-dirty]').hidden = false;
  }

  /* =========================================================
     connect · load · publish
     ========================================================= */
  function readConn() {
    try { return JSON.parse(localStorage.getItem(CONN_KEY) || sessionStorage.getItem(CONN_KEY) || 'null'); } catch (_) { return null; }
  }
  function storeConn(conn, remember) {
    try {
      localStorage.removeItem(CONN_KEY); sessionStorage.removeItem(CONN_KEY);
      (remember ? localStorage : sessionStorage).setItem(CONN_KEY, JSON.stringify(conn));
    } catch (_) { /* storage unavailable */ }
  }

  async function connect(conn, remember) {
    state.conn = conn;
    const repo = await gh('');
    if (repo.permissions && !repo.permissions.push) {
      const e = new Error('This token can read the repository but cannot write to it.'); e.status = 403; throw e;
    }
    const file = await fetchFile(DATA_PATH);
    state.data = parseDataFile(b64decode(file.content));
    state.sha = file.sha;
    storeConn(conn, remember);
  }

  function openEditor() {
    $('[data-connect]').hidden = true;
    $('[data-editor]').hidden = false;
    const label = $('[data-repo-label]');
    const online = !!state.conn;
    label.textContent = online ? `${state.conn.owner}/${state.conn.repo} · ${state.conn.branch}` : 'offline';
    label.classList.toggle('is-online', online);
    $('[data-publish]').hidden = !online;
    $('[data-disconnect]').textContent = online ? 'Sign out' : 'Connect GitHub';
    maybeRestoreDraft();
    renderSidebar();
    renderPanel();
    const bar = $('.topbar');
    const setH = () => document.documentElement.style.setProperty('--topbar-h', `${bar.offsetHeight}px`);
    setH(); window.addEventListener('resize', setH, { passive: true });
  }

  function busy(title) {
    const log = el('div', { class: 'busy__log' });
    const card = el('div', { class: 'busy__card panel', role: 'alertdialog', 'aria-live': 'polite' }, [el('p', { class: 'group__title' }, [title]), log]);
    const layer = el('div', { class: 'busy' }, [card]);
    document.body.append(layer);
    return {
      line: (t, cls = '') => log.append(el('span', { class: cls }, [t])),
      done: (ms = 0) => setTimeout(() => layer.remove(), ms),
      card
    };
  }

  async function publish() {
    if (!state.conn) return;
    if (!state.data?.person?.name) { toast('Add your name in Profile & links before publishing.', true); return; }
    const b = busy('Publishing to GitHub');
    try {
      const uploads = referencedPending();
      for (const path of uploads) {
        b.line(`uploading ${path.split('/').pop()}…`);
        let sha;
        try { sha = (await fetchFile(path)).sha; } catch (e) { if (e.status !== 404) throw e; }
        await putFile(path, state.pending[path].b64, `Add image ${path.split('/').pop()} via admin`, sha);
        delete state.pending[path];
        b.line('  ✓ uploaded', 'ok');
      }
      b.line('checking for changes on GitHub…');
      const latest = await fetchFile(DATA_PATH);
      if (state.sha && latest.sha !== state.sha) {
        const overwrite = confirm('js/data.js was changed on GitHub after you loaded it (maybe from another device).\n\nPublish anyway and replace those changes?');
        if (!overwrite) { b.line('cancelled', 'err'); b.done(1200); return; }
      }
      b.line('saving content…');
      const res = await putFile(DATA_PATH, b64encode(serialize(state.data)), `Update portfolio content via admin (${new Date().toISOString().slice(0, 16).replace('T', ' ')})`, latest.sha);
      state.sha = res.content.sha;
      state.dirty = false;
      $('[data-dirty]').hidden = true;
      clearDraft();
      b.line('✓ published — the live site updates in about a minute', 'ok');
      const site = `https://${state.conn.repo.endsWith('.github.io') ? state.conn.repo : `${state.conn.owner}.github.io/${state.conn.repo}`}/`;
      const close = el('button', { type: 'button', class: 'btn btn--ghost btn--sm' }, ['Close']);
      close.addEventListener('click', () => b.done());
      b.card.append(el('div', { class: 'image-field__actions', style: 'margin-top:1rem' }, [
        el('a', { class: 'btn btn--primary btn--sm', href: site, target: '_blank', rel: 'noopener noreferrer' }, ['Open live site']), close
      ]));
      renderPanel();
    } catch (err) {
      b.line(explain(err), 'err');
      const close = el('button', { type: 'button', class: 'btn btn--ghost btn--sm', style: 'margin-top:1rem' }, ['Close']);
      close.addEventListener('click', () => b.done());
      b.card.append(close);
      saveDraft();
    }
  }

  function download() {
    const blob = new Blob([serialize(state.data)], { type: 'text/javascript' });
    const a = el('a', { href: URL.createObjectURL(blob), download: 'data.js' });
    document.body.append(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
    const imgs = referencedPending();
    imgs.forEach((p, i) => setTimeout(() => {
      const link = el('a', { href: state.pending[p].dataUrl, download: p.split('/').pop() });
      document.body.append(link); link.click(); link.remove();
    }, 300 * (i + 1)));
    toast(imgs.length ? `Downloaded data.js and ${imgs.length} image(s). Put images in ${UPLOAD_DIR}/.` : 'Downloaded data.js — replace js/data.js in your repo.');
  }

  function preview() {
    saveDraft();
    window.open('index.html?preview', '_blank', 'noopener');
  }

  /* =========================================================
     boot
     ========================================================= */
  function init() {
    const form = $('[data-connect-form]');
    const errBox = $('[data-connect-error]');
    const saved = readConn();
    if (saved) {
      ['owner', 'repo', 'branch', 'token'].forEach((k) => { if (saved[k]) form.elements[k].value = saved[k]; });
      form.elements.remember.checked = !!localStorage.getItem(CONN_KEY);
    }

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      errBox.hidden = true;
      const btn = $('[data-connect-submit]');
      btn.disabled = true; btn.textContent = 'Connecting…';
      const conn = {
        token: form.elements.token.value.trim(), owner: form.elements.owner.value.trim(),
        repo: form.elements.repo.value.trim(), branch: form.elements.branch.value.trim() || 'main'
      };
      try {
        await connect(conn, form.elements.remember.checked);
        openEditor();
      } catch (err) {
        state.conn = null;
        errBox.textContent = err instanceof SyntaxError ? 'js/data.js on GitHub is not valid content. Fix it by hand or re-upload the original.' : explain(err);
        errBox.hidden = false;
      } finally {
        btn.disabled = false; btn.textContent = 'Connect';
      }
    });

    $('[data-offline]').addEventListener('click', () => {
      if (!window.PORTFOLIO) { errBox.textContent = 'Could not load js/data.js from this site.'; errBox.hidden = false; return; }
      state.conn = null; state.sha = null;
      state.data = clone(window.PORTFOLIO);
      openEditor();
    });

    $('[data-publish]').addEventListener('click', publish);
    $('[data-download]').addEventListener('click', download);
    $('[data-preview]').addEventListener('click', preview);
    $('[data-disconnect]').addEventListener('click', () => {
      if (state.dirty && !confirm('You have unpublished changes. They stay saved on this device. Continue?')) return;
      if (state.dirty) saveDraft();
      try { localStorage.removeItem(CONN_KEY); sessionStorage.removeItem(CONN_KEY); } catch (_) { /* ignore */ }
      window.location.reload();
    });

    window.addEventListener('beforeunload', (e) => {
      if (!state.dirty) return;
      saveDraft();
      e.preventDefault(); e.returnValue = '';
    });

    if (saved && saved.token) form.requestSubmit();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
