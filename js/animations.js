/* Animation system: boot sequence, live hero graph, scroll reveals, count-ups. */
(function (AF) {
  'use strict';
  const { $, $$, clamp, lerp, easeOutCubic, reducedMotion, onVisible } = AF.util;

  const COLORS = {
    cyan: '89, 208, 255',
    violet: '164, 147, 255',
    green: '91, 227, 161',
    text: '230, 236, 245',
    line: '148, 170, 210'
  };

  /* =========================================================
     HERO GRAPH — canvas, ~8 nodes + a handful of particles
     ========================================================= */
  const HeroGraph = {
    init() {
      this.wrap = $('[data-hero-system]');
      this.canvas = this.wrap && $('.hero__canvas', this.wrap);
      if (!this.canvas || !this.canvas.getContext) return;
      this.ctx = this.canvas.getContext('2d');
      this.tooltip = $('[data-hero-tooltip]');
      const data = window.PORTFOLIO;

      this.nodes = data.heroNodes.map((n, i, arr) => ({
        ...n,
        angle: (i / arr.length) * Math.PI * 2 - Math.PI / 2,
        phase: Math.random() * Math.PI * 2,
        x: 0, y: 0, ox: 0, oy: 0,
        alpha: 0, target: 0, hot: 0,
        tone: n.id === 'jwt' ? COLORS.violet : COLORS.cyan
      }));
      this.byId = Object.fromEntries(this.nodes.map((n) => [n.id, n]));
      this.edges = data.heroEdges.map(([a, b]) => [this.byId[a], this.byId[b]]).filter(([a, b]) => a && b);
      this.packets = [];
      this.particles = Array.from({ length: 34 }, () => ({
        x: Math.random(), y: Math.random(),
        vx: (Math.random() - 0.5) * 0.00004, vy: (Math.random() - 0.5) * 0.00004,
        r: Math.random() * 1.2 + 0.3, depth: Math.random() * 0.8 + 0.2
      }));
      this.mouse = { x: -9999, y: -9999, inside: false };
      this.coreAlpha = 0;
      this.hover = null;
      this.selected = null;
      this.running = false;
      this.visible = true;
      this.lastPacket = 0;
      this.t = 0;

      this.resize = this.resize.bind(this);
      this.frame = this.frame.bind(this);
      this.resize();
      window.addEventListener('resize', this.resize, { passive: true });

      this.canvas.style.pointerEvents = 'auto';
      this.wrap.addEventListener('pointermove', (e) => this.onPointer(e), { passive: true });
      this.wrap.addEventListener('pointerleave', () => { this.mouse.inside = false; this.hover = null; this.setPointer(false); this.requestDraw(); });
      this.wrap.addEventListener('click', (e) => this.onClick(e));

      if ('IntersectionObserver' in window) {
        new IntersectionObserver(([entry]) => {
          this.visible = entry.isIntersecting;
          this.visible ? this.start() : this.stop();
        }).observe(this.wrap);
      }
      document.addEventListener('visibilitychange', () => (document.hidden ? this.stop() : this.start()));
    },

    resize() {
      const rect = this.canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      this.w = rect.width; this.h = rect.height;
      this.canvas.width = Math.round(rect.width * dpr);
      this.canvas.height = Math.round(rect.height * dpr);
      this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      this.cx = this.w * 0.5;
      this.cy = this.h * 0.46;
      const base = Math.min(this.w, this.h);
      this.compact = this.w < 520;
      const labelRoom = this.compact ? 100 : 118;
      this.rx = Math.max(70, Math.min(this.w / 2 - labelRoom, base * 0.5));
      this.ry = base * 0.34;
      this.requestDraw();
    },

    reveal(count) {
      this.nodes.forEach((n, i) => { n.target = i < count ? 1 : 0; });
      this.coreTarget = 1;
      this.requestDraw();
    },
    revealAll() { this.reveal(this.nodes.length); },

    start() {
      if (this.running || !this.visible || document.hidden) return;
      if (reducedMotion()) { this.requestDraw(); return; }
      this.running = true;
      this.last = performance.now();
      requestAnimationFrame(this.frame);
    },
    stop() { this.running = false; },

    requestDraw() {
      if (this.running) return;
      if (this._pending) return;
      this._pending = true;
      requestAnimationFrame(() => {
        this._pending = false;
        if (reducedMotion()) {
          this.nodes.forEach((n) => { n.alpha = n.target; });
          this.coreAlpha = this.coreTarget || 0;
        }
        this.update(16, true);
        this.draw();
      });
    },

    onPointer(e) {
      const r = this.canvas.getBoundingClientRect();
      this.mouse.x = e.clientX - r.left;
      this.mouse.y = e.clientY - r.top;
      this.mouse.inside = true;
      let best = null; let bestD = this.compact ? 30 : 36;
      this.nodes.forEach((n) => {
        if (n.alpha < 0.5) return;
        const d = Math.hypot(n.x - this.mouse.x, n.y - this.mouse.y);
        if (d < bestD) { best = n; bestD = d; }
      });
      this.hover = best;
      this.setPointer(!!best);
      if (best) this.showTip(best);
      else if (!this.selected) this.hideTip();
      this.requestDraw();
    },

    setPointer(on) {
      if (AF.cursor) AF.cursor.setHover(on);
      else this.wrap.style.cursor = on ? 'pointer' : '';
    },

    onClick() {
      if (!this.hover) { this.selected = null; this.hideTip(); return; }
      this.selected = this.hover;
      this.showTip(this.hover);
      this.burst(this.hover);
    },

    showTip(n) {
      if (!this.tooltip) return;
      const cr = this.canvas.getBoundingClientRect();
      const wr = this.wrap.getBoundingClientRect();
      this.tooltip.replaceChildren(
        AF.util.el('strong', { text: n.label.toLowerCase() }),
        document.createTextNode(n.info)
      );
      const x = clamp(n.x + cr.left - wr.left, 120, wr.width - 120);
      this.tooltip.style.left = `${x}px`;
      this.tooltip.style.top = `${n.y + cr.top - wr.top}px`;
      this.tooltip.hidden = false;
    },
    hideTip() { if (this.tooltip) this.tooltip.hidden = true; },

    burst(node) {
      // send packets from the clicked node across all of its edges
      this.edges.forEach(([a, b]) => {
        if (a === node) this.packets.push({ from: a, to: b, t: 0, speed: 0.0016, tone: node.tone });
        if (b === node) this.packets.push({ from: b, to: a, t: 0, speed: 0.0016, tone: node.tone });
      });
      this.packets.push({ from: node, to: null, t: 0, speed: 0.0018, tone: node.tone });
    },

    spawnPacket() {
      const visible = this.nodes.filter((n) => n.alpha > 0.8);
      if (!visible.length) return;
      if (Math.random() < 0.55) {
        const n = visible[(Math.random() * visible.length) | 0];
        const inbound = Math.random() < 0.5;
        this.packets.push({ from: inbound ? n : null, to: inbound ? null : n, t: 0, speed: 0.0009 + Math.random() * 0.0005, tone: n.tone });
      } else {
        const e = this.edges[(Math.random() * this.edges.length) | 0];
        if (e[0].alpha > 0.8 && e[1].alpha > 0.8) this.packets.push({ from: e[0], to: e[1], t: 0, speed: 0.0011, tone: COLORS.cyan });
      }
    },

    point(node) { return node ? { x: node.x, y: node.y } : { x: this.cx, y: this.cy }; },

    update(dt, staticFrame = false) {
      this.t += dt;
      const t = this.t;
      const mx = this.mouse.inside ? this.mouse.x : this.cx;
      const my = this.mouse.inside ? this.mouse.y : this.cy;

      this.coreAlpha = lerp(this.coreAlpha, this.coreTarget || 0, staticFrame ? 1 : 0.06);

      this.nodes.forEach((n) => {
        n.alpha = staticFrame && reducedMotion() ? n.target : lerp(n.alpha, n.target, 0.07);
        const orbit = staticFrame && reducedMotion() ? 0 : t * 0.000025;
        const a = n.angle + orbit;
        const bob = reducedMotion() ? 0 : Math.sin(t * 0.0009 + n.phase) * 6;
        let bx = this.cx + Math.cos(a) * this.rx;
        let by = this.cy + Math.sin(a) * this.ry + bob;
        // cursor reaction: nodes lean slightly away from the cursor
        let tx = 0; let ty = 0;
        if (this.mouse.inside) {
          const dx = bx - mx; const dy = by - my;
          const d = Math.hypot(dx, dy);
          if (d < 160 && d > 0.01) { const f = (1 - d / 160) * 18; tx = (dx / d) * f; ty = (dy / d) * f; }
        }
        n.ox = lerp(n.ox, tx, 0.1); n.oy = lerp(n.oy, ty, 0.1);
        n.x = bx + n.ox; n.y = by + n.oy;
        const isHot = n === this.hover || n === this.selected;
        n.hot = lerp(n.hot, isHot ? 1 : 0, 0.15);
      });

      this.particles.forEach((p) => {
        p.x = (p.x + p.vx * dt + 1) % 1;
        p.y = (p.y + p.vy * dt + 1) % 1;
      });

      if (!staticFrame && !reducedMotion()) {
        if (t - this.lastPacket > 650) { this.spawnPacket(); this.lastPacket = t; }
        this.packets.forEach((p) => { p.t += p.speed * dt; });
        this.packets = this.packets.filter((p) => p.t < 1);
      }
    },

    draw() {
      const { ctx, w, h, cx, cy } = this;
      ctx.clearRect(0, 0, w, h);
      const px = this.mouse.inside ? (this.mouse.x - cx) / w : 0;
      const py = this.mouse.inside ? (this.mouse.y - cy) / h : 0;

      // particles (parallax with depth)
      this.particles.forEach((p) => {
        const x = p.x * w - px * 24 * p.depth;
        const y = p.y * h - py * 24 * p.depth;
        ctx.fillStyle = `rgba(${COLORS.line}, ${0.25 * p.depth})`;
        ctx.beginPath(); ctx.arc(x, y, p.r, 0, Math.PI * 2); ctx.fill();
      });

      // orbit guide
      ctx.strokeStyle = `rgba(${COLORS.line}, ${0.07 * this.coreAlpha})`;
      ctx.setLineDash([2, 6]);
      ctx.beginPath(); ctx.ellipse(cx, cy, this.rx, this.ry, 0, 0, Math.PI * 2); ctx.stroke();
      ctx.setLineDash([]);

      const focus = this.hover || this.selected;

      // spokes: core → node
      this.nodes.forEach((n) => {
        if (n.alpha < 0.02) return;
        const lit = focus === n;
        ctx.strokeStyle = `rgba(${lit ? n.tone : COLORS.line}, ${(lit ? 0.6 : 0.14) * n.alpha})`;
        ctx.lineWidth = lit ? 1.4 : 1;
        ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(n.x, n.y); ctx.stroke();
      });
      // node ↔ node edges
      this.edges.forEach(([a, b]) => {
        const al = Math.min(a.alpha, b.alpha);
        if (al < 0.02) return;
        const lit = focus === a || focus === b;
        ctx.strokeStyle = `rgba(${lit ? COLORS.cyan : COLORS.line}, ${(lit ? 0.5 : 0.1) * al})`;
        ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
      });

      // packets
      this.packets.forEach((p) => {
        const a = this.point(p.from); const b = this.point(p.to);
        const e = AF.util.easeInOut(p.t);
        const x = lerp(a.x, b.x, e); const y = lerp(a.y, b.y, e);
        const fade = Math.sin(p.t * Math.PI);
        const g = ctx.createRadialGradient(x, y, 0, x, y, 9);
        g.addColorStop(0, `rgba(${p.tone}, ${0.9 * fade})`);
        g.addColorStop(1, `rgba(${p.tone}, 0)`);
        ctx.fillStyle = g;
        ctx.beginPath(); ctx.arc(x, y, 9, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = `rgba(255,255,255,${fade})`;
        ctx.beginPath(); ctx.arc(x, y, 1.6, 0, Math.PI * 2); ctx.fill();
      });

      // core
      if (this.coreAlpha > 0.01) {
        const ca = this.coreAlpha;
        const R = this.compact ? 40 : 52;
        const glow = ctx.createRadialGradient(cx, cy, 0, cx, cy, R * 2.4);
        glow.addColorStop(0, `rgba(${COLORS.cyan}, ${0.16 * ca})`);
        glow.addColorStop(1, `rgba(${COLORS.cyan}, 0)`);
        ctx.fillStyle = glow;
        ctx.beginPath(); ctx.arc(cx, cy, R * 2.4, 0, Math.PI * 2); ctx.fill();

        ctx.fillStyle = `rgba(11, 16, 25, ${0.92 * ca})`;
        ctx.strokeStyle = `rgba(${COLORS.cyan}, ${0.7 * ca})`;
        ctx.lineWidth = 1.2;
        ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2); ctx.fill(); ctx.stroke();

        // rotating dashed ring
        const rot = reducedMotion() ? 0 : this.t * 0.0003;
        ctx.save();
        ctx.translate(cx, cy); ctx.rotate(rot);
        ctx.strokeStyle = `rgba(${COLORS.violet}, ${0.45 * ca})`;
        ctx.setLineDash([3, 9]);
        ctx.beginPath(); ctx.arc(0, 0, R + 10, 0, Math.PI * 2); ctx.stroke();
        ctx.setLineDash([]);
        ctx.restore();

        ctx.fillStyle = `rgba(${COLORS.text}, ${ca})`;
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.font = `600 ${this.compact ? 11 : 13}px "Space Grotesk", system-ui, sans-serif`;
        ctx.fillText('AL', cx, cy - 8);
        ctx.fillText('FERDOUS', cx, cy + 8);
      }

      // nodes
      ctx.textBaseline = 'middle';
      this.nodes.forEach((n) => {
        if (n.alpha < 0.02) return;
        const a = n.alpha;
        const r = 4.5 + n.hot * 2.5;
        if (n.hot > 0.05) {
          ctx.strokeStyle = `rgba(${n.tone}, ${0.5 * n.hot * a})`;
          ctx.beginPath(); ctx.arc(n.x, n.y, r + 7, 0, Math.PI * 2); ctx.stroke();
        }
        ctx.fillStyle = `rgba(11, 16, 25, ${a})`;
        ctx.strokeStyle = `rgba(${n.tone}, ${(0.6 + n.hot * 0.4) * a})`;
        ctx.lineWidth = 1.4;
        ctx.beginPath(); ctx.arc(n.x, n.y, r, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
        ctx.fillStyle = `rgba(${n.tone}, ${a})`;
        ctx.beginPath(); ctx.arc(n.x, n.y, 1.8, 0, Math.PI * 2); ctx.fill();

        const right = n.x >= cx;
        ctx.textAlign = right ? 'left' : 'right';
        ctx.font = `${n.hot > 0.5 ? 500 : 400} ${this.compact ? 11 : 12.5}px "JetBrains Mono", ui-monospace, monospace`;
        ctx.fillStyle = `rgba(${COLORS.text}, ${(0.62 + n.hot * 0.38) * a})`;
        ctx.fillText(n.label, n.x + (right ? 13 : -13), n.y);
      });
    },

    frame(now) {
      if (!this.running) return;
      const dt = Math.min(now - this.last, 50);
      this.last = now;
      this.update(dt);
      this.draw();
      requestAnimationFrame(this.frame);
    }
  };

  /* =========================================================
     BOOT SEQUENCE — ~2.5s, once per session, skippable
     ========================================================= */
  const Boot = {
    lines: [
      ['Initializing portfolio…', ''],
      ['Loading engineering modules', 'ok'],
      ['Loading backend systems', 'ok'],
      ['Mounting auth: JWT + OTP', 'ok'],
      ['Connecting projects', 'ok'],
      ['Architecture: READY', 'ok'],
      ['SYSTEM ONLINE', 'final']
    ],

    init() {
      this.panel = $('[data-boot]');
      this.list = $('[data-boot-lines]');
      this.bar = $('[data-boot-bar]');
      this.state = $('[data-boot-state]');
      this.label = $('[data-boot-label]');
      this.done = false;
      $('[data-boot-skip]')?.addEventListener('click', () => this.finish());

      const seen = AF.util.session.get('af-booted');
      if (reducedMotion() || seen) { this.finish(true); return; }
      this.run();
    },

    async run() {
      const total = this.lines.length;
      for (let i = 0; i < total; i++) {
        if (this.done) return;
        const [text, cls] = this.lines[i];
        const li = AF.util.el('li', { class: cls }, [text]);
        if (cls === 'ok') li.append(AF.util.el('span', { class: 'ok' }, ['  ✓']));
        this.list.append(li);
        this.bar.style.transform = `scaleX(${(i + 1) / total})`;
        HeroGraph.reveal(Math.round(((i + 1) / total) * HeroGraph.nodes.length));
        await AF.util.wait(i === 0 ? 420 : 300);
      }
      await AF.util.wait(500);
      this.finish();
    },

    finish(instant = false) {
      if (this.done) return;
      this.done = true;
      AF.util.session.set('af-booted', '1');
      HeroGraph.revealAll();
      if (this.panel) {
        if (instant) this.panel.hidden = true;
        else {
          this.panel.classList.add('is-done');
          setTimeout(() => { this.panel.hidden = true; }, 650);
        }
      }
      this.state?.classList.add('is-online');
      if (this.label) this.label.textContent = 'system online';
      document.dispatchEvent(new CustomEvent('af:online'));
    }
  };

  /* =========================================================
     SCROLL REVEALS · COUNT-UP · GAUGE
     ========================================================= */
  function initReveals() {
    const items = $$('[data-reveal]');
    if (reducedMotion() || !('IntersectionObserver' in window)) {
      items.forEach((el) => el.classList.add('is-visible'));
      return;
    }
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) { e.target.classList.add('is-visible'); io.unobserve(e.target); }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    items.forEach((el) => io.observe(el));
  }

  function countUp(el) {
    const target = Number(el.dataset.count) || 0;
    const fmt = (v) => Math.round(v).toLocaleString('en-US');
    if (reducedMotion()) { el.textContent = fmt(target); return; }
    const duration = 1400;
    const start = performance.now();
    const step = (now) => {
      const p = clamp((now - start) / duration, 0, 1);
      el.textContent = fmt(target * easeOutCubic(p));
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }

  function initCounters() {
    const box = $('[data-metrics]');
    if (!box || reducedMotion()) return; // real values are already in the HTML
    $$('[data-count]', box).forEach((el) => { el.textContent = '0'; });
    onVisible(box, () => $$('[data-count]', box).forEach(countUp), { threshold: 0.35 });
  }

  function initGauge() {
    const fill = $('[data-gauge]');
    if (!fill) return;
    const C = 2 * Math.PI * 50;
    onVisible(fill.closest('.edu'), () => {
      fill.style.strokeDashoffset = String(C * (1 - Number(fill.dataset.gauge)));
    });
  }

  AF.anim = {
    init() {
      HeroGraph.init();
      HeroGraph.start();
      Boot.init();
      initReveals();
      initCounters();
      initGauge();
    },
    hero: HeroGraph
  };
})(window.AF);
