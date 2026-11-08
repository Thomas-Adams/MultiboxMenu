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

## Zope product (`Products.Codrops` in zope-codrops)

### Header Navigation
- [ ] Header with more than one line
- [ ] Hide only part of the header on scroll

### Sidebar
- [ ] More Codrops sidebar demos: Blueprint-SlidePushMenus, MultiLevelPushMenu, MultiLevelMenu
- [ ] Menu from a folder as source (like the header's)

### Carousel
- [ ] Fallback when the font stylesheet doesn't load
- [ ] Option to hide the arrows and the indicators
- [ ] Caption below the image (not only over it)

### Card Grid
- [ ] Masonry layout (Bootstrap's needs a JavaScript library; CSS `grid-template-rows: masonry` is not in all browsers yet)
- [ ] Tabs in the card header that switch the card's content (now plain links, active only for the current page)
- [ ] Check in the Edit tab that the small breakpoint is below the medium one
- [ ] Card Grids inside a Card Grid
- [ ] Spans with automatic columns: when fewer columns fit than an item spans, the grid can get wider than its place (between the medium and the small width)
- [ ] Concept doc `docs/concepts/card-grid.md`

### Generic Content (`docs/concepts/generic-content.md`, steps 1–12 done)
- [ ] The import of definitions still refuses to replace a locked type; it could use the check of step 12 (`ContentType.content_errors()`)
- [ ] Changing a locked type checks all affected content on every save; fine for now, an index or a background check if the amount of content grows
- [ ] Export and import of the content itself (now only the type definitions)
- [ ] Restrict where Content can be added (now anywhere), e.g. only in folders that allow it like the Card Grid's items
- [ ] Line-based fields of Card/Teaser/Carousel (`Links`, …) become proper lists instead of multi-line text
- [ ] Run the components' own checks (e.g. CSS lengths) for embedded Card/Teaser/Carousel too (now only in their own edit forms)
- [ ] An index of references instead of scanning the values of all content before a delete, if the amount of content grows
- [ ] Attachments (images) in rich text; Trix's are switched off for now
- [ ] Optional: `nh3` instead of our own HTML cleaner (`richtext.py`), if the allow-list ever needs attributes or more tags
- [ ] Review the `ContainerAssertions` for `datetime` types (restricted code can read them in the whole instance)
- [ ] Test the editors (LiteVue) in the browser automatically; so far checked by hand with Puppeteer on saved pages

### Multibox Site
- [ ] The *Add Multibox Site* form is still published as `addSite` (`site.py`), unlike the other `manage_add*Form`s

### Deployment
- [ ] Change `user = admin:admin` in `buildout.cfg` before deploying

## Known issues

- [x] Original demos (`index.html`, `index-css.html`), mobile (< 53em): `.content__title` / `.content__tagline` were hidden behind `.background`. Fixed with `position: relative` on both in `css/base.css`.
- [x] `TiltFx.layout()` hardcoded `img/1.jpg`. It now reads the image from `.background` with `getComputedStyle()`.
