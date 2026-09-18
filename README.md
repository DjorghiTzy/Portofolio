# Djorghi Andima — Portfolio

A single-page portfolio for a sales, delivery and customer-service professional
based in Pangkalpinang, Indonesia.

Plain HTML, CSS and vanilla JavaScript. No framework, and the repository root is
the deployable site — nothing is compiled at deploy time. The one build step is
optional and regenerates the vendored three.js bundle (see below).

## Running locally

```bash
npm start          # http://localhost:3000
```

`server.js` is a zero-dependency static server used only for local preview.
Any static server works, including `python3 -m http.server`.

## Layout

```
index.html                 markup for every section
404.html                   standalone not-found page
assets/css/style.css       design tokens, layout, components, print stylesheet
assets/js/data.js          all content (bilingual EN/ID), icon paths
assets/js/main.js          every interaction
assets/js/smooth-scroll.js scroll easing
assets/js/scroll-scene.js  scroll-driven three.js background
assets/js/hero-scene.js    2D canvas fallback when WebGL is unavailable
assets/vendor/             tree-shaken three.js build (generated, do not edit)
build/three-entry.js       the export list that build feeds on
assets/img/                favicon, avatar placeholder, social preview
```

## What's interactive

| Area | Behaviour |
|---|---|
| Scrolling | The page eases toward the real scroll offset instead of snapping to it |
| Background | A three.js scene driven entirely by scroll position — a wireframe core that rotates, recedes and swings aside, a ring, orbiting shards, and a dust field you travel through |
| Command palette | `Ctrl`/`⌘` + `K` — jump to a section, switch theme or language, copy contacts, print the CV |
| Keyboard | `T` theme · `L` language · `C` copy email · `P` print CV · `J`/`K` next/previous section · `?` shortcut sheet · `Esc` close |
| Language | Full EN ⇄ ID switch, remembered between visits |
| Theme | Light/dark plus five accent colours, remembered between visits |
| Skills | Filter by category, self-assessment bars animate into view, pointer-tracked card lighting |
| Experience | Accordion timeline, all panels force-open when printing |
| Certificates / Work | Detail dialog with `←` `→` navigation, focus trap and backdrop dismiss |
| Contact form | Live validation, character counter, draft saved locally, sends through your own email app or WhatsApp |
| Everywhere | Custom cursor, magnetic buttons, ripples, 3-D tilt cards, scroll progress, section dots, animated counters |
| Hidden | The Konami code does something |

## Scrolling and the WebGL background

**Smooth scrolling** (`assets/js/smooth-scroll.js`) does not hijack the wheel.
The window keeps scrolling natively and the document keeps its real height, so
the scrollbar, keyboard, Find-in-page and focus-follows-Tab all behave normally;
the content wrapper is simply translated toward the true offset a few frames
behind. The easing is frame-rate independent, so it feels the same at 60Hz and
144Hz. It is off on touch devices, where the OS already provides momentum and
competing with it feels worse.

Because of that wrapper, two rules matter when editing:

- Anything `position: fixed` must stay **outside** `#smoothContent`, or it will
  inherit the transform and scroll away with the page.
- In-page navigation must go through `goTo()` in `main.js`, never
  `scrollIntoView` — that measures the lerped position and chases its own tail.

**The background** (`assets/js/scroll-scene.js`) reads the eased offset rather
than raw `scrollY`, so the scene travels with the content instead of leading it.
Nothing in it is on a timer: every rotation, scale and position is a function of
scroll progress, which is why it reverses exactly when you scroll back up.

three.js is loaded on demand, so its ~130KB never reaches visitors who cannot or
should not run it — no WebGL, `prefers-reduced-motion`, or a `saveData`
connection all fall back to the lighter 2D canvas field in the hero.

### Regenerating the vendored three.js

`assets/vendor/three.module.js` is committed so the site has no runtime CDN
dependency. It is tree-shaken down to the twenty classes the scene actually uses
(527KB raw, ~132KB gzipped, from a 647KB full build). To update it:

```bash
npm install          # devDependencies only: three + esbuild
npm run build:three
```

The export list lives in `build/three-entry.js`. Adding a new `THREE.Something`
to the scene means adding it there too — a missing export fails at runtime with
"undefined is not a constructor", not at build time.

Everything degrades. `prefers-reduced-motion` disables the animation throughout,
and with JavaScript off the page stays fully readable: the four data-driven
sections (skills, experience, certificates, work) each ship a static `<noscript>`
copy of their content. That copy is a second place to edit — when you change
`assets/js/data.js`, update the matching `<noscript>` block in `index.html` too.

## Deployment

The site is static, so it deploys anywhere without a build step.

**Vercel** (what the repo homepage currently points at) picks this up with no
configuration: framework preset *Other*, no build command, output directory `.`.
It deploys the production branch on every push.

**GitHub Pages** is wired up in `.github/workflows/deploy-pages.yml`. It runs on
pushes to the repository's default branch and publishes the repo root.

It needs one manual step first: **Settings → Pages → Build and deployment →
Source: GitHub Actions**. Only a repository admin can turn Pages on — the
workflow's own token is not allowed to, so until you flip that switch the job
logs a notice and skips rather than failing. Once Pages is on, the next push
deploys to `https://djorghitzy.github.io/Portofolio/`.

If you rename the default branch to `main`, both keep working — the workflow
tracks whichever branch is default rather than a hardcoded name.

## Replacing the portrait

`assets/img/profile.svg` is a monogram placeholder. The previous build shipped
`windah.png` — a meme screenshot of someone else making a rude gesture — which is
not something to put in front of a recruiter, so it was dropped.

To use a real photo, add it as `assets/img/profile.jpg` (square, around 800×800)
and point the `<img src>` inside `.avatar` in `index.html` at it.

## Editing content

All copy lives in `assets/js/data.js` (skills, experience, certificates, projects)
and in `index.html` for the static prose. Each string carries an `en` and an `id`
variant — update both so the language switch stays consistent.
