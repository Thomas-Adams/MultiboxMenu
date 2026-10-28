# TODOs

## Replace TweenMax / GSAP with an open-source alternative

The bundled `js/TweenMax.min.js` is GSAP **1.20.3** (2017): 115 KB raw, about 38 KB gzipped.
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

- [ ] Decide: CSS-only (done, `index-css.html`) vs. WAAPI vs. Motion vs. Anime.js for remaining JS animations
- [ ] Port `TiltFx` (background tilt) to the chosen option, or rebuild it as JS writing `--mx/--my` + CSS transforms
- [ ] Remove `js/TweenMax.min.js` once nothing uses it

## Template (`template.html`, see `TEMPLATE.md`)

- [ ] Replace Codrops' Typekit kit (`zjs0dpp`) with your own fonts. That kit belongs to Codrops and is only for the demo.
- [x] Pin Leaflet: `multibox.js` loads unpkg with SRI hashes; the Zope product self-hosts it (`static/leaflet`)
- [ ] Choose an OSM tile provider for production (the `tile.openstreetmap.org` usage policy limits heavy use)
- [ ] Optional: render the page at build time (e.g. a small Node/Vite script) so the content is in the HTML for SEO / no-JS
- [ ] Optional: background tilt (`TiltFx`) as a config option, once the animation library is decided (see above)

## Known issues

- [ ] Original demos (`index.html`, `index-css.html`), mobile (< 53em): `.content__title` / `.content__tagline` are hidden behind `.background` (confirmed in Chrome at 400px). Fix: `position: relative` on both. See `DOCUMENTATION.md` §1. Already fixed in the template.
- [ ] `TiltFx.layout()` hardcodes `img/1.jpg` and ignores the inline background image on `.background`.
