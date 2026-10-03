# Md. Al Ferdous — Portfolio

Backend Developer · Python · Django · REST APIs · Scalable Systems

A static, framework-free portfolio built as an interactive engineering lab: a live system graph, a request tracer, an N+1 query demo, a sandboxed terminal and a small game. Plain HTML, CSS and JavaScript — no build step, no dependencies, no backend.

## Run locally

Open `index.html` directly in a browser — everything works from `file://` because the scripts are plain (non-module) files.

For a setup closer to production, serve the folder:

```bash
python -m http.server 8000
# then open http://localhost:8000
```

## Deploy to GitHub Pages

**Option A — user site (recommended): `https://alferdousrana.github.io/`**

1. Create a repository named exactly `alferdousrana.github.io`.
2. Push the contents of this folder to the repository root (`index.html` must be at the top level).
3. In **Settings → Pages**, set *Source* to **Deploy from a branch**, branch `main`, folder `/ (root)`.
4. Wait a minute, then open `https://alferdousrana.github.io/`.

**Option B — project site, e.g. `https://alferdousrana.github.io/portfolio/`**

Same steps in any repository. All asset paths are relative, so the site works from a sub-path without changes. Then update the absolute URLs listed below.

> Your existing `portfolio` repository already serves the old site at `/portfolio/`. Either replace its contents with this site or use Option A.

### URLs to update if you change the address

These must be absolute for search engines and link previews. Find and replace `https://alferdousrana.github.io/` in `index.html`:

- `<link rel="canonical">`
- `og:url`, `og:image`, `twitter:image`
- `url` in the JSON-LD block

`.nojekyll` is included so GitHub Pages serves every file as-is.

## Project structure

```
/
├── index.html            Semantic markup, SEO metadata, all section shells
├── css/
│   ├── style.css         Design tokens + components
│   └── responsive.css    Breakpoints: 1100 / 960 / 640 / 380px
├── js/
│   ├── data.js           ← all content lives here (single source of truth)
│   ├── utils.js          DOM builder, toast, clipboard, safe storage
│   ├── animations.js     Boot sequence, hero system graph, reveals, count-ups
│   ├── lab.js            Request tracer + N+1 query experiment
│   ├── terminal.js       Sandboxed terminal (whitelisted commands only)
│   ├── game.js           "Debug the node" mini-game
│   └── main.js           Renders sections, nav, modal, constellation, cursor, GitHub data
├── assets/
│   ├── icons/            favicon.svg, favicon-32.png, apple-touch-icon.png
│   ├── images/           og-image.png (1200×630 link preview)
│   └── fonts/            empty — fonts load from Google Fonts (see below)
├── .nojekyll
└── README.md
```

Two files were added to the suggested structure: `data.js`, so the page, terminal and case studies all read the same facts from one place, and `lab.js`, so the lab experiments don't bloat `animations.js`.

## Editing content

Almost everything is in **`js/data.js`**:

| To change… | Edit |
|---|---|
| Projects and case studies | `projects` (each has `case` sections and a `diagram`) |
| Work history and timeline | `experience` (dates as `YYYY-MM`) |
| Engineering DNA cards | `dna` |
| Skills constellation | `skills.nodes` and `skills.edges` |
| Hero graph nodes | `heroNodes`, `heroEdges` |
| GitHub repo cards | `repos` (static fallback; live stars and descriptions load automatically) |
| "Available for opportunities" badge | `person.available` — set to `false` to hide it |

The about-section story, metrics, awards, education and contact details are plain HTML in `index.html`.

## Assets

- **Profile photo:** intentionally not used in the hero. The GitHub avatar appears in the code section, loaded from GitHub; it hides itself if it can't load. To use a local photo, add `assets/images/profile.jpg` and point that `<img>` at it.
- **Fonts:** Space Grotesk, Inter and JetBrains Mono load from Google Fonts with system fallbacks. To self-host, download the `.woff2` files into `assets/fonts/`, add `@font-face` rules at the top of `style.css`, and remove the Google Fonts `<link>` tags.
- **Link preview image:** regenerate `assets/images/og-image.png` (1200×630) if your title changes.

## How it behaves

- **GitHub data:** repo cards render from static data first, then refresh from the public GitHub API (5-second timeout, cached per session). If the API fails or is rate-limited, the static data stays and the page says so.
- **Boot animation:** plays once per browser session (about 2.5 s) and can be skipped.
- **Reduced motion:** with the OS setting enabled, the boot sequence, ambient motion, packets and custom cursor are all off; content appears immediately.
- **Custom cursor:** only on devices with a precise pointer (mouse/trackpad), never on touch.
- **Game high score:** stored in the browser's `localStorage`; fails silently if storage is blocked.

## Hidden things

- Press `/` anywhere to jump into the terminal.
- Terminal: `help`, `whoami`, `projects`, `open 2`, `cd lab`, `email`, `history`. Tab completes, ↑/↓ recall history, Ctrl+L clears. A few commands aren't listed in `help`.
- Click a node in the hero graph to fire packets across its connections.

## Security

- No API keys or secrets anywhere.
- The terminal never evaluates input: it's length-limited, stripped to `[a-z0-9 ._-/]`, and matched against a fixed command table. All dynamic text is rendered with `textContent`, never `innerHTML`.
- External links use `target="_blank" rel="noopener noreferrer"`.

## Tested

- Chromium at 390, 768, 1024, 1440 and 1920 px widths, with and without reduced motion, touch and mouse.
- No console errors; no horizontal overflow on mobile.
- All project, repository, PyPI and social links verified to resolve.
- Terminal input with HTML/script payloads verified to render as inert text.

---

© 2026 Md. Al Ferdous
