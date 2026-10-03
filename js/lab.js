/* The Engineering Lab — request tracer + N+1 query experiment. */
(function (AF) {
  'use strict';
  const { $, $$, el, wait, reducedMotion, easeInOut } = AF.util;

  /* ---------------- icons (stroke paths, 24×24) ---------------- */
  const ICONS = {
    client: 'M3 5h18v11H3zM8 20h8M12 16v4',
    router: 'M4 12h6M14 6h6M14 18h6M10 12l4-6M10 12l4 6',
    auth: 'M7 11V8a5 5 0 0 1 10 0v3M5 11h14v10H5zM12 15v2',
    permission: 'M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6zM9 12l2 2 4-4',
    service: 'M4 7h16M4 12h16M4 17h10',
    database: 'M4 6c0-1.7 3.6-3 8-3s8 1.3 8 3-3.6 3-8 3-8-1.3-8-3zM4 6v12c0 1.7 3.6 3 8 3s8-1.3 8-3V6M4 12c0 1.7 3.6 3 8 3s8-1.3 8-3',
    response: 'M20 12H6M11 7l-5 5 5 5'
  };

  const STAGES = [
    { id: 'client', name: 'Client' },
    { id: 'router', name: 'URL router' },
    { id: 'auth', name: 'JWT auth', auth: true },
    { id: 'permission', name: 'Permissions', auth: true },
    { id: 'service', name: 'Service layer' },
    { id: 'database', name: 'Database' },
    { id: 'response', name: 'Response' }
  ];

  /*
   * Scenarios are illustrative. Error bodies use the real default messages
   * from Django REST Framework and SimpleJWT.
   */
  const SCENARIOS = [
    {
      id: 'ok', method: 'GET', path: '/api/bookings/', ctx: 'patient · valid JWT',
      steps: {
        client: ['Authorization: Bearer eyJhbGciOi…', ''],
        router: ['matched → BookingViewSet.list', ''],
        auth: ['token valid · user_id=17 · exp in 14m', 'auth'],
        permission: ['role=patient → IsPatient ✓', 'auth'],
        service: ['booking_list(user) → scoped to owner', ''],
        database: ['SELECT … FROM bookings WHERE patient_id=17', '']
      },
      status: 200,
      body: { count: 2, results: [{ id: 101, service: 'nurse', date: '2026-10-06', status: 'confirmed' }, { id: 98, service: 'lab_test', date: '2026-10-02', status: 'completed' }] }
    },
    {
      id: 'expired', method: 'GET', path: '/api/bookings/', ctx: 'access token expired',
      steps: {
        client: ['Authorization: Bearer eyJhbGciOi… (expired)', ''],
        router: ['matched → BookingViewSet.list', ''],
        auth: ['exp < now → reject before any query runs', 'err']
      },
      failAt: 'auth',
      hint: 'client retries via POST /api/auth/token/refresh/',
      status: 401,
      body: { detail: 'Given token not valid for any token type', code: 'token_not_valid' }
    },
    {
      id: 'forbidden', method: 'DELETE', path: '/api/doctors/42/', ctx: 'patient tries an admin action',
      steps: {
        client: ['Authorization: Bearer eyJhbGciOi…', ''],
        router: ['matched → DoctorViewSet.destroy', ''],
        auth: ['token valid · user_id=17', 'auth'],
        permission: ['role=patient · requires admin → deny', 'err']
      },
      failAt: 'permission',
      hint: 'RBAC stopped it — the service layer never saw the request',
      status: 403,
      body: { detail: 'You do not have permission to perform this action.' }
    },
    {
      id: 'login', method: 'POST', path: '/api/auth/login/', ctx: 'email + password',
      steps: {
        client: ['{ "email": "patient@example.com", "password": "••••" }', ''],
        router: ['matched → LoginView.post', ''],
        auth: ['public endpoint → no token required', 'auth'],
        permission: ['AllowAny ✓', 'auth'],
        service: ['verify password · check OTP-verified email', ''],
        database: ['SELECT … FROM users WHERE email=%s', '']
      },
      status: 200,
      body: { access: 'eyJhbGciOiJIUzI1NiIs…', refresh: 'eyJhbGciOiJIUzI1NiIs…', role: 'patient' }
    }
  ];

  const Trace = {
    init() {
      this.pipe = $('[data-pipeline]');
      this.scenarioBox = $('[data-scenarios]');
      this.sendBtn = $('[data-trace-send]');
      this.log = $('[data-trace-log]');
      this.resp = $('[data-trace-response]');
      this.statusEl = $('[data-trace-status]');
      if (!this.pipe) return;
      this.current = SCENARIOS[0];
      this.busy = false;

      // build pipeline
      this.pipe.append(el('div', { class: 'trace__wire' }));
      this.packet = el('span', { class: 'trace__packet' });
      this.pipe.append(this.packet);
      this.stageEls = {};
      STAGES.forEach((s) => {
        const icon = AF.util.svg('svg', { viewBox: '0 0 24 24' });
        icon.append(AF.util.svg('path', { d: ICONS[s.id] }));
        const node = el('div', { class: `stage${s.auth ? ' is-auth' : ''}` }, [
          el('div', { class: 'stage__node' }, [icon]),
          el('span', { class: 'stage__name' }, [s.name])
        ]);
        this.stageEls[s.id] = node;
        this.pipe.append(node);
      });

      // scenario radios
      SCENARIOS.forEach((sc, i) => {
        const btn = el('button', {
          type: 'button', class: 'scenario', role: 'radio',
          'aria-checked': i === 0 ? 'true' : 'false', tabindex: i === 0 ? '0' : '-1',
          dataset: { scenario: sc.id }
        }, [
          el('span', { class: 'scenario__req' }, [el('b', {}, [sc.method]), sc.path]),
          el('span', { class: 'scenario__ctx' }, [sc.ctx])
        ]);
        btn.addEventListener('click', () => this.select(sc.id));
        this.scenarioBox.append(btn);
      });
      this.scenarioBox.addEventListener('keydown', (e) => {
        if (!['ArrowRight', 'ArrowDown', 'ArrowLeft', 'ArrowUp'].includes(e.key)) return;
        e.preventDefault();
        const idx = SCENARIOS.indexOf(this.current);
        const dir = e.key === 'ArrowRight' || e.key === 'ArrowDown' ? 1 : -1;
        const next = SCENARIOS[(idx + dir + SCENARIOS.length) % SCENARIOS.length];
        this.select(next.id);
        $(`[data-scenario="${next.id}"]`, this.scenarioBox).focus();
      });

      this.sendBtn.addEventListener('click', () => this.run());
    },

    select(id) {
      if (this.busy) return;
      this.current = SCENARIOS.find((s) => s.id === id) || SCENARIOS[0];
      $$('.scenario', this.scenarioBox).forEach((b) => {
        const on = b.dataset.scenario === id;
        b.setAttribute('aria-checked', String(on));
        b.tabIndex = on ? 0 : -1;
      });
    },

    reset() {
      Object.values(this.stageEls).forEach((s) => s.classList.remove('is-active', 'is-pass', 'is-fail', 'is-skip'));
      this.packet.className = 'trace__packet';
      this.packet.style.opacity = '0';
      this.log.replaceChildren();
      this.statusEl.replaceChildren();
      this.resp.textContent = '…';
    },

    center(id) {
      const node = $('.stage__node', this.stageEls[id]);
      const pr = this.pipe.getBoundingClientRect();
      const nr = node.getBoundingClientRect();
      return { x: nr.left + nr.width / 2 - pr.left, y: nr.top + nr.height / 2 - pr.top };
    },

    placePacket(p) {
      this.packet.style.transform = `translate(${p.x - 5.5}px, ${p.y - 5.5}px)`;
    },

    move(fromId, toId, ms) {
      const a = this.center(fromId); const b = this.center(toId);
      if (reducedMotion()) { this.placePacket(b); return wait(60); }
      return new Promise((resolve) => {
        const start = performance.now();
        const step = (now) => {
          const t = Math.min((now - start) / ms, 1);
          const e = easeInOut(t);
          this.placePacket({ x: a.x + (b.x - a.x) * e, y: a.y + (b.y - a.y) * e });
          if (t < 1) requestAnimationFrame(step); else resolve();
        };
        requestAnimationFrame(step);
      });
    },

    logLine(ms, stage, text, cls) {
      const li = el('li', {}, [
        el('span', { class: 't' }, [`[+${String(ms).padStart(2, ' ')}ms] `]),
        el('span', { class: cls || '' }, [`${stage.padEnd(11, ' ')} ${text}`])
      ]);
      this.log.append(li);
    },

    async run() {
      if (this.busy) return;
      this.busy = true;
      this.sendBtn.disabled = true;
      this.reset();
      const sc = this.current;
      const order = STAGES.map((s) => s.id);
      let clock = 0;
      let prev = 'client';
      this.packet.style.opacity = '1';
      this.placePacket(this.center('client'));

      for (const id of order) {
        if (id === 'response') break;
        if (id !== 'client') await this.move(prev, id, 420);
        const stage = this.stageEls[id];
        stage.classList.add('is-active');
        clock += id === 'database' ? 4 : id === 'client' ? 0 : 1 + Math.round(Math.random() * 2);
        const step = sc.steps[id];
        if (step) this.logLine(clock, id === 'client' ? `${sc.method}` : id, id === 'client' ? sc.path + '  ' + step[0] : step[0], step[1]);
        await wait(reducedMotion() ? 80 : 260);

        if (sc.failAt === id) {
          stage.classList.remove('is-active');
          stage.classList.add('is-fail');
          this.packet.classList.add('is-error');
          order.slice(order.indexOf(id) + 1, -1).forEach((s) => this.stageEls[s].classList.add('is-skip'));
          await this.move(id, 'response', 520);
          prev = 'response';
          break;
        }
        stage.classList.remove('is-active');
        stage.classList.add('is-pass');
        prev = id;
      }

      if (prev !== 'response') await this.move(prev, 'response', 420);
      const resp = this.stageEls.response;
      const ok = sc.status < 400;
      resp.classList.add(ok ? 'is-pass' : 'is-fail');
      if (ok) this.packet.classList.add('is-ok');
      clock += 1;
      this.logLine(clock, 'response', `${sc.status} ${ok ? 'OK' : sc.status === 401 ? 'Unauthorized' : 'Forbidden'}`, ok ? 'ok' : 'err');
      if (sc.hint) this.logLine(clock, 'note', sc.hint, 'auth');

      this.statusEl.append(el('span', { class: `status-code status-code--${ok ? 'ok' : 'err'}` }, [String(sc.status)]));
      this.resp.textContent = JSON.stringify(sc.body, null, 2);

      await wait(500);
      this.packet.style.opacity = '0';
      this.busy = false;
      this.sendBtn.disabled = false;
    }
  };

  /* ---------------- N+1 query experiment ---------------- */
  const CODE = {
    naive: [
      ['c', '# views.py — one query per booking'],
      ['k', 'bookings', ' = Booking.objects.all()[:12]'],
      ['', ''],
      ['k', 'for', ' b ', 'k', 'in', ' bookings:'],
      ['', '    names.append(b.', 'hl', 'patient', '.name)'],
      ['c', '    # ↑ lazy FK access hits the DB every loop']
    ],
    optimized: [
      ['c', '# views.py — one query, joined'],
      ['k', 'bookings', ' = (Booking.objects'],
      ['', '    .', 'hl', 'select_related', '(', 's', '"patient"', ')[:12])'],
      ['', ''],
      ['k', 'for', ' b ', 'k', 'in', ' bookings:'],
      ['', '    names.append(b.patient.name)  ', 'c', '# no extra query']
    ]
  };

  const Query = {
    init() {
      this.codeEl = $('[data-query-code]');
      this.stream = $('[data-query-stream]');
      this.countEl = $('[data-query-count]');
      this.timeEl = $('[data-query-time]');
      this.runBtn = $('[data-query-run]');
      if (!this.codeEl) return;
      this.mode = 'naive';
      $$('[data-query-mode]').forEach((b) => b.addEventListener('click', () => this.setMode(b.dataset.queryMode)));
      this.runBtn.addEventListener('click', () => this.run());
      this.renderCode();
    },

    setMode(mode) {
      if (this.busy) return;
      this.mode = mode;
      $$('[data-query-mode]').forEach((b) => b.setAttribute('aria-checked', String(b.dataset.queryMode === mode)));
      this.renderCode();
      this.stream.replaceChildren();
      this.countEl.textContent = '0'; this.countEl.className = '';
      this.timeEl.textContent = '0 ms'; this.timeEl.className = '';
    },

    renderCode() {
      // each line: alternating [class, text] pairs
      const lines = CODE[this.mode].map((parts) => {
        const frag = document.createDocumentFragment();
        for (let i = 0; i < parts.length; i += 2) {
          const cls = parts[i]; const txt = parts[i + 1] ?? '';
          frag.append(cls ? el('span', { class: cls }, [txt]) : document.createTextNode(txt));
        }
        frag.append('\n');
        return frag;
      });
      this.codeEl.replaceChildren(...lines);
    },

    async run() {
      if (this.busy) return;
      this.busy = true;
      this.runBtn.disabled = true;
      this.stream.replaceChildren();
      let count = 0; let time = 0;
      const push = (sql, cls, ms) => {
        count += 1; time += ms;
        this.stream.append(el('li', { class: cls }, [sql]));
        this.stream.scrollTop = this.stream.scrollHeight;
        this.countEl.textContent = String(count);
        this.timeEl.textContent = `${time.toFixed(1)} ms`;
      };
      const delay = reducedMotion() ? 0 : 110;

      if (this.mode === 'naive') {
        push('SELECT id, patient_id, service FROM booking LIMIT 12', '', 2.4);
        await wait(delay * 2);
        for (let i = 0; i < 12; i++) {
          push(`SELECT id, name FROM patient WHERE id = ${41 + i * 3}`, 'is-repeat', 1.9 + Math.random() * 0.6);
          await wait(delay);
        }
        this.countEl.className = 'is-bad'; this.timeEl.className = 'is-bad';
      } else {
        await wait(delay * 2);
        push('SELECT booking.id, booking.service, patient.id, patient.name FROM booking INNER JOIN patient ON booking.patient_id = patient.id LIMIT 12', 'is-join', 3.1);
        this.countEl.className = 'is-good'; this.timeEl.className = 'is-good';
      }
      this.busy = false;
      this.runBtn.disabled = false;
    }
  };

  /* ---------------- tabs ---------------- */
  function initTabs() {
    const tabs = $$('.lab__tabs [role="tab"]');
    const activate = (tab) => {
      tabs.forEach((t) => {
        const on = t === tab;
        t.setAttribute('aria-selected', String(on));
        t.tabIndex = on ? 0 : -1;
        const panel = document.getElementById(t.getAttribute('aria-controls'));
        if (panel) panel.hidden = !on;
      });
    };
    tabs.forEach((t, i) => {
      t.addEventListener('click', () => activate(t));
      t.addEventListener('keydown', (e) => {
        if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
        e.preventDefault();
        const next = tabs[(i + (e.key === 'ArrowRight' ? 1 : -1) + tabs.length) % tabs.length];
        activate(next); next.focus();
      });
    });
  }

  AF.lab = {
    init() { initTabs(); Trace.init(); Query.init(); }
  };
})(window.AF);
