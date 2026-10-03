/*
 * Content layer — sits between data.js (written by the admin panel) and the site.
 * - Preview mode: admin.html stores an unpublished draft; ?preview shows it.
 * - Normalization: derives ids, date labels and graph edges so the admin only edits plain fields.
 * - Safety: every URL and image path coming from content goes through safeUrl().
 */
(function (AF) {
  'use strict';

  const DRAFT_KEY = 'af-admin-draft';
  const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  let source = window.PORTFOLIO || {};
  let previewImages = {};
  AF.preview = false;

  if (/[?&]preview\b/.test(window.location.search)) {
    try {
      const draft = JSON.parse(window.localStorage.getItem(DRAFT_KEY) || 'null');
      if (draft && draft.data) {
        source = draft.data;
        previewImages = draft.images || {};
        AF.preview = true;
      }
    } catch (_) { /* no draft available */ }
  }

  /** Allow http(s), mailto, tel and plain relative paths. Anything else (javascript:, data:…) becomes '#'. */
  AF.safeUrl = function (url) {
    const u = String(url || '').trim();
    if (!u) return '#';
    if (/^(https?:|mailto:|tel:)/i.test(u)) return u;
    if (!/^[a-z][a-z0-9+.-]*:/i.test(u) && !u.startsWith('//')) return u;
    return '#';
  };

  /** Image paths: preview drafts can reference images not yet uploaded. */
  AF.img = function (src) {
    if (!src) return '';
    if (previewImages[src]) return previewImages[src];
    const safe = AF.safeUrl(src);
    return safe === '#' ? '' : safe;
  };

  const slug = (s) => String(s || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'item';
  AF.slug = slug;

  const ym = (s) => {
    const m = /^(\d{4})-(\d{2})/.exec(s || '');
    return m ? { y: +m[1], m: +m[2] - 1 } : null;
  };
  const label = (d) => `${MONTHS[d.m]} ${d.y}`;
  const now = new Date();
  const today = { y: now.getFullYear(), m: now.getMonth() };

  function duration(a, b) {
    const months = (b.y * 12 + b.m) - (a.y * 12 + a.m) + 1;
    const y = Math.floor(months / 12); const m = months % 12;
    return [y ? `${y} yr${y > 1 ? 's' : ''}` : '', m ? `${m} mo${m > 1 ? 's' : ''}` : ''].filter(Boolean).join(' ') || '1 mo';
  }

  function edgesFrom(nodes) {
    const ids = new Map(nodes.map((n) => [n.label.trim().toLowerCase(), n.id]));
    const seen = new Set(); const edges = [];
    nodes.forEach((n) => (n.connects || []).forEach((target) => {
      const t = ids.get(String(target).trim().toLowerCase());
      if (!t || t === n.id) return;
      const key = [n.id, t].sort().join('|');
      if (!seen.has(key)) { seen.add(key); edges.push([n.id, t]); }
    }));
    return edges;
  }

  function uniqueIds(list, field) {
    const used = new Set();
    list.forEach((item) => {
      let id = slug(item[field]); let i = 2;
      while (used.has(id)) id = `${slug(item[field])}-${i++}`;
      used.add(id); item.id = id;
    });
  }

  // Work on a deep copy so the raw content stays exactly as the admin wrote it.
  const d = JSON.parse(JSON.stringify(source));
  const arr = (v) => (Array.isArray(v) ? v : []);

  d.sections = Object.assign({ dna: true, experience: true, projects: true, code: true, skills: true, recognition: true, gallery: true, lab: true, game: true }, d.sections || {});
  d.person = d.person || {};
  d.hero = d.hero || { facts: [] };
  d.about = d.about || { paragraphs: [] };
  ['profile', 'metrics', 'dna', 'experience', 'projects', 'repos', 'awards', 'education', 'certifications'].forEach((k) => { d[k] = arr(d[k]); });
  d.gallery = Object.assign({ title: 'Gallery', text: '', items: [] }, d.gallery || {});
  d.gallery.items = arr(d.gallery.items).filter((g) => g && g.src);
  d.contact = d.contact || {};
  d.skills = d.skills || {};
  d.skills.center = d.skills.center || { label: 'Backend engineering', text: '' };
  d.skills.nodes = arr(d.skills.nodes).filter((n) => n && n.label);
  d.heroNodes = arr(d.heroNodes).filter((n) => n && n.label);

  // experience: ids, readable period and duration, newest-first ordering handled by the timeline
  d.experience = d.experience.filter((x) => ym(x.start));
  d.experience.forEach((x) => {
    const s = ym(x.start);
    const e = x.current || !ym(x.end) ? today : ym(x.end);
    x._s = s; x._e = e;
    x.period = `${label(s)} — ${x.current || !ym(x.end) ? 'Present' : label(e)}`;
    x.duration = duration(s, e);
    x.points = arr(x.points); x.signals = arr(x.signals); x.tech = arr(x.tech); x.links = arr(x.links);
  });
  uniqueIds(d.experience, 'company');

  d.projects.forEach((p) => {
    ['stack', 'features', 'links', 'case', 'diagram'].forEach((k) => { p[k] = arr(p[k]); });
  });
  uniqueIds(d.projects, 'name');

  uniqueIds(d.skills.nodes, 'label');
  d.skills.edges = edgesFrom(d.skills.nodes);
  uniqueIds(d.heroNodes, 'label');
  d.heroEdges = edgesFrom(d.heroNodes);

  window.PORTFOLIO = d;
})(window.AF);
