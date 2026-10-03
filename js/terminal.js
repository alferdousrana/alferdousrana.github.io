/*
 * Sandboxed terminal. Input is never evaluated — it's matched against a fixed
 * command table, and all output is rendered with textContent.
 */
(function (AF) {
  'use strict';
  const { $, el } = AF.util;

  const MAX_LEN = 64;
  const SAFE = /[^a-z0-9 ._\-/]/g;

  const Terminal = {
    init() {
      this.screen = $('[data-terminal-screen]');
      this.out = $('[data-terminal-output]');
      this.form = $('[data-terminal-form]');
      this.input = $('[data-terminal-input]');
      if (!this.input) return;
      this.data = window.PORTFOLIO;
      this.history = [];
      this.hIndex = 0;

      this.commands = this.buildCommands();

      this.form.addEventListener('submit', (e) => {
        e.preventDefault();
        this.execute(this.input.value);
        this.input.value = '';
      });
      this.input.addEventListener('keydown', (e) => this.onKey(e));
      this.screen.addEventListener('click', (e) => {
        if (e.target.closest('a, button')) return;
        if (!window.getSelection().toString()) this.input.focus({ preventScroll: true });
      });

      this.print([
        ['out-muted', 'al-ferdous shell · sandboxed · no real system access\n'],
        ['', 'Type '], ['out-accent', 'help'], ['', ' to list commands. Try '], ['out-accent', 'whoami'], ['', '.']
      ]);
    },

    /* ---------- output helpers ---------- */
    // segments: array of [className, text] or a plain string. Each call = one block.
    print(segments) {
      const block = el('div');
      (Array.isArray(segments) ? segments : [['', segments]]).forEach((seg) => {
        if (seg instanceof Node) { block.append(seg); return; }
        const [cls, text] = seg;
        block.append(cls ? el('span', { class: cls }, [text]) : document.createTextNode(text));
      });
      this.out.append(block);
      this.scroll();
    },
    lines(arr, cls = '') { this.print([[cls, arr.join('\n')]]); },
    scroll() { this.screen.scrollTop = this.screen.scrollHeight; },

    /* ---------- command table ---------- */
    buildCommands() {
      const d = this.data;
      const sections = ['home', 'about', 'systems', 'experience', 'projects', 'skills', 'recognition', 'lab', 'break', 'contact'];
      const link = (href, text) => AF.util.extLink(href, text);

      return {
        help: {
          desc: 'list commands',
          run: () => {
            const names = Object.entries(this.commands).filter(([, c]) => !c.hidden);
            this.print(names.map(([n, c], i) => ['', `${n.padEnd(12, ' ')}${c.desc}${i < names.length - 1 ? '\n' : ''}`]));
          }
        },
        whoami: { desc: 'who runs this system', run: () => this.lines([d.person.name, `${d.person.role} — ${d.person.stack}`], 'out-accent') },
        about: {
          desc: 'short profile',
          run: () => this.lines([
            'Backend developer specializing in Python and Django.',
            'Led backend for a healthcare platform serving 10,000+ users (Dhaka Cast Limited, 2019–2025).',
            'Built Django REST APIs for 2 production client projects at Softvence (2026).',
            'Built a reusable auth package with OTP + JWT, published on PyPI.'
          ])
        },
        stack: {
          desc: 'core technologies',
          run: () => this.lines([
            'backend       Python, Django, Django REST Framework',
            'api & auth    REST APIs, JWT, OTP verification',
            'database      PostgreSQL, MySQL',
            'architecture  Modular design, MVC/MVT, scalable systems',
            'tools         Git, GitHub, Postman'
          ])
        },
        skills: { desc: 'alias for stack', hidden: true, run: () => this.commands.stack.run() },
        projects: {
          desc: 'list systems built',
          run: () => {
            this.print(d.projects.map((p, i) => ['', `${String(i + 1).padStart(2, '0')}  ${p.name.padEnd(22, ' ')}${p.type}${i < d.projects.length - 1 ? '\n' : ''}`]));
            this.lines(['run "open 1" to open a case study'], 'out-muted');
          }
        },
        open: {
          desc: 'open <n> — open a case study',
          run: (args) => {
            const n = parseInt(args[0], 10);
            const p = d.projects[n - 1];
            if (!p) { this.lines([`usage: open <1-${d.projects.length}>`], 'out-err'); return; }
            this.lines([`opening ${p.name}…`], 'out-ok');
            AF.main?.openCase(p.id);
          }
        },
        experience: {
          desc: 'work history',
          run: () => this.lines(d.experience.slice().reverse().map((x) => `${x.period.padEnd(22, ' ')}${x.role} · ${x.company}`))
        },
        awards: {
          desc: 'recognition',
          run: () => this.lines([
            'Digital Bangladesh Award 2021 — Best Team (ICT Division, National)',
            'IdeaTHON Top 30 — ICT Division & Korea Productivity Center',
            'Call for Nation — Honorable Mention'
          ])
        },
        education: { desc: 'degree', run: () => this.lines(['B.Sc. in Computer Science & Engineering', 'Global University Bangladesh · CGPA 3.67 / 4.00']) },
        mission: { desc: 'what this is for', run: () => this.lines(['Build scalable systems that turn complex problems into reliable software.'], 'out-accent') },
        status: {
          desc: 'system status',
          run: () => this.lines(d.person.available ? ['ONLINE · available for opportunities'] : ['ONLINE'], 'out-ok')
        },
        contact: {
          desc: 'ways to reach me',
          run: () => {
            this.print([
              ['', 'email     '], link(`mailto:${d.person.email}`, d.person.email), ['', '\n'],
              ['', 'github    '], link(d.person.github, 'github.com/alferdousrana'), ['', '\n'],
              ['', 'linkedin  '], link(d.person.linkedin, 'linkedin.com/in/al-ferdous-rana'), ['', '\n'],
              ['out-muted', 'run "email" to copy the address']
            ]);
          }
        },
        email: {
          desc: 'copy email to clipboard',
          run: async () => {
            const ok = await AF.util.copyEmail(d.person.email);
            this.lines([ok ? `copied ${d.person.email}` : `copy blocked — ${d.person.email}`], ok ? 'out-ok' : 'out-err');
          }
        },
        github: {
          desc: 'open GitHub profile',
          run: () => { window.open(d.person.github, '_blank', 'noopener,noreferrer'); this.lines(['opening github.com/alferdousrana…'], 'out-ok'); }
        },
        ls: { desc: 'list page sections', run: () => this.lines([sections.join('  ')]) },
        cd: {
          desc: 'cd <section> — jump to a section',
          run: (args) => {
            const target = (args[0] || '').replace(/^[~/.]+/, '');
            if (!sections.includes(target)) { this.lines([`cd: no such section: ${target || '(empty)'}`, `try: ${sections.join(' ')}`], 'out-err'); return; }
            document.getElementById(target)?.scrollIntoView({ behavior: AF.util.reducedMotion() ? 'auto' : 'smooth' });
            this.lines([`→ ~/${target}`], 'out-ok');
          }
        },
        game: { desc: 'jump to the mini-game', run: () => this.commands.cd.run(['break']) },
        date: { desc: 'current date', run: () => this.lines([new Date().toString()]) },
        history: { desc: 'previous commands', run: () => this.lines(this.history.length ? this.history.map((h, i) => `${i + 1}  ${h}`) : ['(empty)']) },
        clear: { desc: 'clear the screen', run: () => this.out.replaceChildren() },
        sudo: { desc: '', hidden: true, run: () => this.lines(['guest is not in the sudoers file. This incident will be reported to /dev/null.'], 'out-err') },
        rm: { desc: '', hidden: true, run: () => this.lines(['rm: read-only portfolio. Nice try.'], 'out-err') },
        hello: { desc: '', hidden: true, run: () => this.lines(['Hello. Run "contact" if you have a system worth building.'], 'out-accent') }
      };
    },

    /* ---------- execution ---------- */
    sanitize(raw) {
      return String(raw).slice(0, MAX_LEN).toLowerCase().replace(SAFE, '').replace(/\s+/g, ' ').trim();
    },

    execute(raw) {
      const clean = this.sanitize(raw);
      this.print([['cmd', clean || ' ']]);
      if (!clean) return;
      this.history.push(clean);
      if (this.history.length > 50) this.history.shift();
      this.hIndex = this.history.length;

      const [name, ...args] = clean.split(' ');
      const cmd = Object.prototype.hasOwnProperty.call(this.commands, name) ? this.commands[name] : null;
      if (!cmd) {
        this.lines([`command not found: ${name}. Type "help".`], 'out-err');
        return;
      }
      cmd.run(args);
    },

    onKey(e) {
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        if (this.hIndex > 0) this.hIndex -= 1;
        this.input.value = this.history[this.hIndex] || '';
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        if (this.hIndex < this.history.length) this.hIndex += 1;
        this.input.value = this.history[this.hIndex] || '';
      } else if (e.key === 'Tab') {
        const v = this.sanitize(this.input.value);
        if (!v || v.includes(' ')) return;
        const matches = Object.keys(this.commands).filter((c) => c.startsWith(v) && !this.commands[c].hidden);
        if (matches.length) e.preventDefault();
        if (matches.length === 1) this.input.value = `${matches[0]} `;
        else if (matches.length > 1) this.lines([matches.join('  ')], 'out-muted');
      } else if (e.key === 'l' && e.ctrlKey) {
        e.preventDefault();
        this.out.replaceChildren();
      }
    },

    focus() {
      const term = $('#terminal');
      term?.scrollIntoView({ behavior: AF.util.reducedMotion() ? 'auto' : 'smooth', block: 'center' });
      setTimeout(() => this.input?.focus({ preventScroll: true }), AF.util.reducedMotion() ? 0 : 450);
    }
  };

  AF.terminal = Terminal;
})(window.AF);
