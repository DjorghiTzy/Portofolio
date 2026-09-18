# Djorghi Andima — Portfolio

A single-page portfolio for a sales, delivery and customer-service professional
based in Pangkalpinang, Indonesia.

Plain HTML, CSS and vanilla JavaScript. No framework, no bundler, no build step —
the repository root is the deployable site.

## Running locally

```bash
npm start          # http://localhost:3000
```

`server.js` is a zero-dependency static server used only for local preview.
Any static server works, including `python3 -m http.server`.

## Layout

```
index.html              markup for every section
404.html                standalone not-found page
assets/css/style.css    design tokens, layout, components, print stylesheet
assets/js/data.js       all content (bilingual EN/ID), icon paths
assets/js/hero-scene.js canvas particle field behind the hero
assets/js/main.js       every interaction
assets/img/             favicon, avatar placeholder, social preview
```

## What's interactive

| Area | Behaviour |
|---|---|
| Hero | Canvas particle field that pushes away from the pointer; clicking sends a shockwave |
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
pushes to the repository's default branch and publishes the repo root. Enable it
once under **Settings → Pages → Build and deployment → Source: GitHub Actions**.

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
