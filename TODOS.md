# TODOs

## Replace TweenMax / GSAP with an open-source alternative (done: Anime.js)

The demo bundled `js/TweenMax.min.js`, GSAP **1.20.3** (2017): 115 KB raw, about 38 KB gzipped.
GSAP has been free since 2025 (after Webflow bought it), but it uses GreenSock's own proprietary licence, **not an open-source licence**.

Candidates (all MIT or built into the browser):

| Option | Licence | Size (min+gzip, approx.) | Notes |
|---|---|---|---|
| **Web Animations API** | built in | 0 KB | `element.animate()`, `.finished` promise, `.reverse()`. No stagger helper; use a delay per element. |
| **Motion** (motion.dev) | MIT | ~2.5 KB (`animate` mini) to ~18 KB | `stagger()`, sequences, springs, `scroll()`. Runs on WAAPI where possible. Best pick for the tilt effect / larger projects. |
| **Anime.js v4** | MIT | ~10–25 KB (modular) | API closest to GSAP (`animate`, `createTimeline`, `stagger`, `outQuint` easings). Easiest line-by-line port of `demo.js`. |
| tween.js | MIT | ~3 KB | Only tweens numbers; you write to the DOM yourself. Too low-level here. |
| Theatre.js | Apache-2.0 | large | Visual timeline editor. Overkill. |

No longer actively developed: Popmotion (became Motion), Velocity.js. mo.js has had little maintenance.

- [x] Decide: Anime.js 4.5 for `demo.js` (closest to GSAP, easiest port). `js/anime.min.js` is a slim build of `animate`/`stagger`/`utils`, 15.7 KB gzipped. CSS-only stays as `index-css.html`.
- [x] Port the menu animations and `TiltFx` (background tilt) to Anime.js. See `DOCUMENTATION.md` §5 for the mapping.
- [x] Remove `js/TweenMax.min.js`

## Template (`template.html`, see `TEMPLATE.md`)

- [x] Replace Codrops' Typekit kit (`zjs0dpp`) with your own fonts. The Zope page loads UnifrakturMaguntia (title), Cinzel (headlines) and Lato (body) from `/assets/google-fonts` via the `fonts` config (`TEMPLATE.md`). The static `template.html`/`index*.html` load the same fonts self-hosted from `fonts/` (from the `@fontsource` npm packages, OFL).
- [x] Pin Leaflet: `multibox.js` loads unpkg with SRI hashes; the Zope product self-hosts it (`static/leaflet`)
- [ ] Choose an OSM tile provider for production (the `tile.openstreetmap.org` usage policy limits heavy use). Postponed until the site is really hosted (for now it's a playground). Candidates: Stadia Maps, MapTiler, self-hosted Protomaps.
- [ ] Optional: render the page at build time (e.g. a small Node/Vite script) so the content is in the HTML for SEO / no-JS
- [x] Optional: background tilt (`TiltFx`) as a config option: `background.tilt` (`TEMPLATE.md` §2). Done with CSS transitions in `template.css` + `multibox.js`, no animation library.

## Known issues

- [x] Original demos (`index.html`, `index-css.html`), mobile (< 53em): `.content__title` / `.content__tagline` were hidden behind `.background`. Fixed with `position: relative` on both in `css/base.css`.
- [x] `TiltFx.layout()` hardcoded `img/1.jpg`. It now reads the image from `.background` with `getComputedStyle()`.
