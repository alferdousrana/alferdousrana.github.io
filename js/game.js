/*
 * DEBUG THE NODE
 * A cluster of moving nodes; one is corrupted. Patch it before the timer runs out.
 * Every level: more nodes, faster movement, a subtler fault, less time.
 */
(function (AF) {
  'use strict';
  const { $, clamp, reducedMotion } = AF.util;

  const HS_KEY = 'af-debug-node-highscore';
  const C = { cyan: '89, 208, 255', coral: '255, 107, 122', green: '91, 227, 161', line: '148, 170, 210', ink: '11, 16, 25' };

  const Game = {
    init() {
      this.canvas = $('[data-game-canvas]');
      if (!this.canvas || !this.canvas.getContext) return;
      this.ctx = this.canvas.getContext('2d');
      this.stage = this.canvas.parentElement;
      this.overlay = $('[data-game-overlay]');
      this.titleEl = $('[data-game-title]');
      this.textEl = $('[data-game-text]');
      this.startBtn = $('[data-game-start]');
      this.ui = {
        score: $('[data-game-score]'), level: $('[data-game-level]'), time: $('[data-game-time]'),
        high: $('[data-game-high]'), timer: $('[data-game-timer]'), status: $('[data-game-status]')
      };
      this.high = parseInt(AF.util.storage.get(HS_KEY, '0'), 10) || 0;
      this.ui.high.textContent = String(this.high);
      this.state = 'idle';
      this.nodes = [];
      this.effects = [];
      this.frame = this.frame.bind(this);

      this.resize();
      window.addEventListener('resize', () => this.resize(), { passive: true });
      this.startBtn.addEventListener('click', () => (this.state === 'paused' ? this.resume() : this.start()));
      this.canvas.addEventListener('pointerdown', (e) => this.onPointer(e));
      document.addEventListener('visibilitychange', () => { if (document.hidden && this.state === 'playing') this.pause(); });

      this.spawnRound(1, true);
      this.draw(performance.now());
    },

    resize() {
      const r = this.canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const oldW = this.w || r.width; const oldH = this.h || r.height;
      this.w = r.width; this.h = r.height;
      this.canvas.width = Math.round(r.width * dpr);
      this.canvas.height = Math.round(r.height * dpr);
      this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      this.nodes.forEach((n) => { n.x = (n.x / oldW) * this.w; n.y = (n.y / oldH) * this.h; });
      this.radius = this.w < 500 ? 11 : 13;
      if (this.state !== 'playing') this.draw(performance.now());
    },

    /* ---------- round setup ---------- */
    spawnRound(level, preview = false) {
      const count = Math.min(5 + level, 20);
      const pad = 30;
      const speed = (preview ? 0.015 : 0.03 + level * 0.008) * (this.w < 500 ? 0.75 : 1);
      this.nodes = [];
      for (let i = 0; i < count; i++) {
        let x; let y; let tries = 0;
        do {
          x = pad + Math.random() * (this.w - pad * 2);
          y = pad + Math.random() * (this.h - pad * 2);
          tries++;
        } while (tries < 30 && this.nodes.some((n) => Math.hypot(n.x - x, n.y - y) < 56));
        const a = Math.random() * Math.PI * 2;
        this.nodes.push({ x, y, vx: Math.cos(a) * speed, vy: Math.sin(a) * speed, corrupt: false, phase: Math.random() * 1000, flash: 0 });
      }
      this.nodes[(Math.random() * count) | 0].corrupt = true;
      // difficulty knobs
      this.faultStrength = clamp(1 - (level - 1) * 0.085, 0.22, 1);   // how red the fault is
      this.glitchEvery = 900 + level * 160;                           // ms between glitches
      this.decoys = level >= 5;                                       // healthy nodes flicker too
      this.roundTime = Math.max(1.7, 5.2 - (level - 1) * 0.32) * 1000;
      this.timeLeft = this.roundTime;
    },

    start() {
      this.score = 0; this.level = 1;
      this.state = 'playing';
      this.overlay.hidden = true;
      this.spawnRound(1);
      this.updateHud();
      this.announce('Level 1. Find the corrupted node.');
      this.last = performance.now();
      requestAnimationFrame(this.frame);
    },

    pause() {
      this.state = 'paused';
      this.showOverlay('Paused', 'The cluster waits for you.', 'Resume');
    },

    resume() {
      this.state = 'playing';
      this.overlay.hidden = true;
      this.last = performance.now();
      requestAnimationFrame(this.frame);
    },

    gameOver() {
      this.state = 'over';
      const isHigh = this.score > this.high;
      if (isHigh) { this.high = this.score; AF.util.storage.set(HS_KEY, String(this.high)); }
      this.updateHud();
      this.showOverlay(
        isHigh ? 'New high score' : 'Node unpatched',
        `Reached level ${this.level} with ${this.score.toLocaleString('en-US')} points.${isHigh ? ' Saved to this browser.' : ''}`,
        'Debug again'
      );
      this.announce(`Game over. Score ${this.score}.`);
    },

    showOverlay(title, text, btn) {
      this.titleEl.textContent = title;
      this.textEl.textContent = text;
      this.startBtn.textContent = btn;
      this.overlay.hidden = false;
      this.startBtn.focus({ preventScroll: true });
    },

    /* ---------- input ---------- */
    onPointer(e) {
      if (this.state !== 'playing') return;
      const r = this.canvas.getBoundingClientRect();
      const x = e.clientX - r.left; const y = e.clientY - r.top;
      const hitR = this.radius + (e.pointerType === 'touch' ? 16 : 9);
      let hit = null; let best = Infinity;
      this.nodes.forEach((n) => {
        const d = Math.hypot(n.x - x, n.y - y);
        if (d < hitR && d < best) { hit = n; best = d; }
      });
      if (!hit) return;
      if (hit.corrupt) {
        const bonus = Math.round((this.timeLeft / 1000) * 25);
        this.score += 100 * this.level + bonus;
        this.effects.push({ x: hit.x, y: hit.y, t: 0, kind: 'ok' });
        this.level += 1;
        this.spawnRound(this.level);
        this.announce(`Patched. Level ${this.level}.`);
      } else {
        hit.flash = 1;
        this.timeLeft -= 1000;
        this.effects.push({ x: hit.x, y: hit.y, t: 0, kind: 'miss' });
        if (!reducedMotion()) {
          this.stage.classList.remove('is-shake');
          void this.stage.offsetWidth;
          this.stage.classList.add('is-shake');
        }
      }
      this.updateHud();
    },

    updateHud() {
      this.ui.score.textContent = (this.score || 0).toLocaleString('en-US');
      this.ui.level.textContent = String(this.level || 1);
      this.ui.high.textContent = this.high.toLocaleString('en-US');
    },

    announce(msg) { if (this.ui.status) this.ui.status.textContent = msg; },

    /* ---------- loop ---------- */
    frame(now) {
      if (this.state !== 'playing') return;
      const dt = Math.min(now - this.last, 50);
      this.last = now;
      this.timeLeft -= dt;
      if (this.timeLeft <= 0) {
        this.timeLeft = 0;
        this.renderTimer();
        this.draw(now);
        this.gameOver();
        return;
      }
      this.step(dt);
      this.renderTimer();
      this.draw(now);
      requestAnimationFrame(this.frame);
    },

    renderTimer() {
      const p = clamp(this.timeLeft / this.roundTime, 0, 1);
      this.ui.timer.style.transform = `scaleX(${p})`;
      this.ui.timer.classList.toggle('is-low', p < 0.3);
      this.ui.time.textContent = `${(this.timeLeft / 1000).toFixed(1)}s`;
    },

    step(dt) {
      const r = this.radius;
      this.nodes.forEach((n) => {
        n.x += n.vx * dt; n.y += n.vy * dt;
        if (n.x < r || n.x > this.w - r) { n.vx *= -1; n.x = clamp(n.x, r, this.w - r); }
        if (n.y < r || n.y > this.h - r) { n.vy *= -1; n.y = clamp(n.y, r, this.h - r); }
        n.flash = Math.max(0, n.flash - dt / 400);
      });
      this.effects.forEach((f) => { f.t += dt / 500; });
      this.effects = this.effects.filter((f) => f.t < 1);
    },

    draw(now) {
      const { ctx, w, h } = this;
      ctx.clearRect(0, 0, w, h);

      // faint grid
      ctx.strokeStyle = `rgba(${C.line}, 0.05)`;
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (let x = 0; x < w; x += 40) { ctx.moveTo(x + 0.5, 0); ctx.lineTo(x + 0.5, h); }
      for (let y = 0; y < h; y += 40) { ctx.moveTo(0, y + 0.5); ctx.lineTo(w, y + 0.5); }
      ctx.stroke();

      // edges: each node to its 2 nearest neighbours
      ctx.strokeStyle = `rgba(${C.line}, 0.16)`;
      ctx.beginPath();
      this.nodes.forEach((n) => {
        this.nodes
          .filter((m) => m !== n)
          .map((m) => ({ m, d: (m.x - n.x) ** 2 + (m.y - n.y) ** 2 }))
          .sort((a, b) => a.d - b.d)
          .slice(0, 2)
          .forEach(({ m }) => { ctx.moveTo(n.x, n.y); ctx.lineTo(m.x, m.y); });
      });
      ctx.stroke();

      const r = this.radius;
      this.nodes.forEach((n) => {
        let tone = C.cyan;
        let jx = 0; let jy = 0; let tint = 0;
        const cycle = (now + n.phase) % (this.glitchEvery || 1200);
        const glitching = cycle < 140;

        if (n.corrupt) {
          tint = this.faultStrength;
          if (glitching && !reducedMotion()) { jx = (Math.random() - 0.5) * 5; jy = (Math.random() - 0.5) * 3; tint = 1; }
        } else if (this.decoys && glitching && n.phase % 3 < 1 && !reducedMotion()) {
          jx = (Math.random() - 0.5) * 3; tint = 0.18;
        }
        if (n.flash > 0) tint = Math.max(tint, n.flash);

        const mix = (a, b, t) => a.split(',').map((v, i) => Math.round(+v + (+b.split(',')[i] - v) * t)).join(',');
        tone = mix(C.cyan, C.coral, tint);

        ctx.fillStyle = `rgba(${C.ink}, 1)`;
        ctx.strokeStyle = `rgba(${tone}, 0.9)`;
        ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.arc(n.x + jx, n.y + jy, r, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
        ctx.fillStyle = `rgba(${tone}, 0.9)`;
        ctx.beginPath(); ctx.arc(n.x + jx, n.y + jy, r * 0.32, 0, Math.PI * 2); ctx.fill();
        if (n.corrupt && glitching && !reducedMotion()) {
          ctx.fillStyle = `rgba(${C.coral}, 0.35)`;
          ctx.fillRect(n.x - r - 4, n.y + jy - 1.5, r * 2 + 8, 3);
        }
      });

      this.effects.forEach((f) => {
        const tone = f.kind === 'ok' ? C.green : C.coral;
        ctx.strokeStyle = `rgba(${tone}, ${1 - f.t})`;
        ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(f.x, f.y, r + f.t * 34, 0, Math.PI * 2); ctx.stroke();
        if (f.kind === 'ok') {
          ctx.fillStyle = `rgba(${C.green}, ${1 - f.t})`;
          ctx.font = '500 12px "JetBrains Mono", monospace';
          ctx.textAlign = 'center';
          ctx.fillText('patched', f.x, f.y - r - 12 - f.t * 14);
        }
      });
    }
  };

  AF.game = { init: () => Game.init() };
})(window.AF);
