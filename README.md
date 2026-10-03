# Md. Al Ferdous — Portfolio

**Backend Developer · Python · Django · REST APIs · Scalable Systems**

🔗 Live: [alferdousrana.github.io](https://alferdousrana.github.io/)

A personal portfolio built as an interactive engineering lab — a site that shows how I think about backend systems, not just what I've worked on. Built with plain HTML, CSS and JavaScript. No frameworks, no dependencies, no backend.

## What's inside

**Live system graph** — The hero opens with a short boot sequence, then settles into an animated graph of my stack. Nodes react to the cursor, and clicking one sends data packets across its connections.

**Engineer profile** — A collapsible `engineer.profile` object with my role, focus, stack and working mindset, alongside a short professional story and key metrics.

**Engineering DNA** — Six principles I build by: clean architecture, secure authentication, scalable APIs, database optimization, modular systems and a production mindset. Each card expands to show how it's applied.

**Experience timeline** — A proportional, interactive timeline of my roles at Dhaka Cast Limited and Softvence. Selecting a role shows responsibilities, the stack, and which system areas (API, database, auth, architecture, deployment) it involved.

**Systems I built** — Project cards for LifeSheba, Django Auth Package, Adkom Backend and AlgoVision AI. Each opens a full-screen case study with an animated architecture diagram tracing a request through the system.

**Open source** — Selected GitHub repositories, with stars and descriptions loaded live from the GitHub API and a static fallback if it's unavailable.

**Skills constellation** — An interactive graph of the technologies I use. Hovering a technology highlights what it connects to and explains how I use it.

**Recognition & education** — Awards, degree and certifications.

**The engineering lab**
- *Trace a request* — Send a simulated API request and watch it pass through routing, JWT authentication, role-based permissions, the service layer and the database. Includes success, expired-token (401) and forbidden (403) cases.
- *Kill an N+1 query* — Compare a naive Django ORM loop (13 queries) with `select_related` (1 query).
- *Terminal* — A sandboxed shell. Try `help`, `whoami`, `projects`, `open 1`, `cd lab`. Press `/` anywhere on the page to jump in.

**Debug the node** — A small game: find and patch the corrupted node in a moving cluster before time runs out. Levels get faster and harder; high score is saved in the browser.

**Gallery** — A photo grid with a full-screen viewer (keyboard and swipe navigation). Appears once it has at least one photo.

**Contact** — Email (with copy-to-clipboard), GitHub, LinkedIn and Facebook.

## Admin panel

`/admin.html` controls the whole site without a database — the GitHub repository is the storage.

- Edit profile, photo, hero, about, stats, engineering DNA, experience, projects and case studies, repositories, skills, awards, education, certifications, gallery and contact
- Upload images (resized in the browser) for the profile, projects and gallery
- Show or hide any section; menu and section numbers adjust automatically
- Preview unpublished changes on the real site before publishing
- Publish commits straight to the repository through the GitHub API; the live site updates in about a minute
- Drafts are saved on the device automatically; a raw JSON editor is available for bulk edits

Sign in with a fine-grained GitHub token limited to this repository with *Contents: Read and write*. The token stays in your browser and is only sent to GitHub.

## Details

- Fully responsive, from phones to large desktop screens, with touch support
- Respects reduced-motion settings
- Keyboard accessible, with visible focus states
- Custom cursor and magnetic buttons on desktop
- SEO, Open Graph and structured data included

## Structure

```
├── index.html
├── admin.html           Admin panel
├── css/
│   ├── style.css
│   ├── responsive.css
│   └── admin.css
├── js/
│   ├── data.js          All site content (written by the admin panel)
│   ├── content.js       Content normalization and preview mode
│   ├── render.js        Content-driven sections and gallery
│   ├── admin.js         Admin panel and GitHub publishing
│   ├── utils.js         Shared helpers
│   ├── animations.js    Boot sequence, hero graph, scroll effects
│   ├── lab.js           Request tracer and N+1 experiment
│   ├── terminal.js      Interactive terminal
│   ├── game.js          Debug the node
│   └── main.js          Page rendering and interactions
└── assets/
    ├── icons/
    └── images/          profile.jpg, og-image.png, uploads/ (admin uploads)
```

## Contact

📧 alferdous13@gmail.com · [GitHub](https://github.com/alferdousrana) · [LinkedIn](https://www.linkedin.com/in/al-ferdous-rana/)

---

© 2026 Md. Al Ferdous
