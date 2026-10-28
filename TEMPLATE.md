# Multibox Template

A config-driven version of the Multibox Menu. You edit **one file**, `site.config.js`, and `js/template.js` renders the frame, the background/hero and the menu grid from it. All motion is CSS (`css/template.css`) and uses the same techniques as the CSS-only variant (`DOCUMENTATION.md` §6).

| File | Role |
|---|---|
| `template.html` | Page skeleton: icon sprite, `<main id="site">`, scripts. Rarely needs editing. |
| `site.config.js` | **All content and layout.** |
| `js/template.js` | Renderer and grid validation (builds the DOM from the config). |
| `js/multibox.js` | Behaviour: open/close, Esc, loader, Leaflet maps. Shared with the Zope product (`CONCEPT.md`), which renders the HTML on the server. |
| `css/template.css` | Layout, box types, motion. |

`site.config.js` is a plain script (`window.SITE_CONFIG = {...}`), not an ES module. That way `template.html` also works when opened directly from disk (`file://`), where browsers block module scripts.

All config text is inserted as **text, never as HTML**, so `<b>` in a string shows up literally. Use `\n` for a line break in `text` fields.

---

## Top-level keys

```js
window.SITE_CONFIG = {
  title: 'Page title',              // <title>
  lang: 'en',                       // <html lang>
  theme: { ... },                   // colours
  motion: { open: 0.9, close: 0.6 },// seconds
  frame: { ... },                   // 1. corner texts + header navigation
  background: { ... },              // 2. background image
  hero: { title, tagline },
  grid: { ... },                    // 3. grid structure
  boxes: [ ... ]                    // 4. content boxes
};
```

### `theme`

Each key becomes `--color-<key>` on `<html>`. Keys used by the CSS:

| Key | Used for |
|---|---|
| `bg` | page background, loader |
| `text` | text, links, buttons |
| `accent` | link hover, nav underline |
| `muted` | frame info, map status text |
| `alt` | labels, nav numbers, eyebrow |
| `title` | hero title |
| `tagline` | hero tagline, box text |
| `box` | default box background |

Fonts are set with `--font-body` and `--font-display` in `css/template.css`. The demo uses Codrops' Typekit kit (see `TODOS.md`).

## 1. `frame`

```js
frame: {
  title: 'Multibox Menu',                          // top left
  nav: [{ label: 'Tickets', href: '#tickets' }],   // top left, after the title
  info: '12 — 24 May · Stirling',                  // top right (below the title on mobile)
  footer: [{ label: 'Imprint', href: '#' }]        // bottom left
}
```

Every key is optional. The frame is fixed above the hero and lets clicks pass through, except on its links. The menu button always sits top right.

## 2. `background` and `hero`

```js
background: { image: 'img/1.jpg', position: '50% 0%' },   // position = CSS background-position
hero: { title: 'Carmeca', tagline: "Europe's most …" }
```

The background is `position: fixed` inside `.hero`. `.hero` is the stacking context, so the title's `mix-blend-mode: screen` blends with the image. The image is also preloaded before the loader disappears (with a 4 s fallback).

## 3. `grid`

```js
grid: {
  columns: '20% 30% 50%',          // grid-template-columns (desktop ≥ 53em)
  rows: '65% 35%',                 // grid-template-rows
  areas: [                         // one string per row, one name per cell
    'side   osm    main',
    'teaser static mapimg'
  ],
  mobile: {                        // optional, < 53em
    columns: '1fr 1fr',
    rows: 'repeat(3, 40vh)',
    areas: ['main main', 'side osm', 'teaser teaser']
  }
}
```

Rules:
- Each area must be a **rectangle**. Repeat a name to span cells (`main` in both rows = spans 2 rows). Use `.` for an empty cell.
- Every row must have the same number of cells.
- Each box's `area` must appear in `areas`.
- The menu fills the viewport, so `%` / `fr` rows divide the screen height.

`template.js` checks these rules and logs a `[template] …` warning in the console. Without the checks, an invalid template is silently dropped by the browser and the boxes end up in a jumble.

**Without `grid.mobile`:** boxes stack in one column in config order, each at least 40vh tall, and the menu scrolls. Use `mobileOrder` / `mobileHide` on boxes to adjust.

The breakpoint (53em) is fixed in `css/template.css`, because media queries can't read custom properties.

How it works: the renderer puts the values on `.menu` as `--cols`, `--rows`, `--areas` (and `--m-*`), and each box gets `--area`. The CSS only does `grid-template-areas: var(--areas)` and `grid-area: var(--area)`.

## 4. `boxes`

### Common options (all types)

| Option | Values | Default |
|---|---|---|
| `area` | name from `grid.areas` | required on desktop |
| `type` | `static`, `mapimage`, `teaser`, `nav`, `osm` | required |
| `direction` | reveal direction: `bt` (bottom→top), `tb`, `lr`, `rl`, `diag` | `bt` |
| `background` | box background colour | `theme.box` |
| `labels` | `[{ text, position, vertical }]`; position: `topleft`, `topright`, `bottomleft`, `bottomright` (desktop only) | none |
| `mobileHide` | `true` hides the box below 53em | `false` |
| `mobileOrder` | number, order in the stacked mobile layout | `0` |

Inside a box, headlines, text, links and nav items animate in with a stagger after the box opens. The order is automatic: the order they appear in the box.

### 4a. `static`: image, headline and/or text

```js
{ area: 'static', type: 'static', direction: 'tb',
  image: 'img/1.jpg',                                // optional, zooms slightly on hover
  overlay: { color: '#0f1013', opacity: 0.55 },      // optional darkening layer
  headline: 'Hail to thee',                          // optional
  text: 'our infantry, still brave' }                // optional
```

### 4b. `mapimage`: map image with a coloured layer

```js
{ area: 'mapimg', type: 'mapimage', direction: 'rl',
  image: 'img/2.jpg',
  overlay: { color: '#2c35b7', opacity: 0.6, blend: 'multiply' },  // blend = any mix-blend-mode
  link: { label: 'The location', href: '#location' } }             // optional
```

On hover the overlay fades to 40% of its opacity and the link appears. On touch devices the link is always visible.

### 4c. `teaser`: headers, text and links

```js
{ area: 'teaser', type: 'teaser', direction: 'rl', background: '#1d2027',
  eyebrow: 'Join us now',              // small label with a line
  headline: 'Learn how to participate',
  subheadline: 'Season 2026',          // optional
  text: 'Line one\nLine two',
  links: [{ label: 'Registration', href: '#register' }] }   // pinned to the bottom
```

### 4d. `nav`: main or supplementary navigation

```js
{ area: 'main', type: 'nav', variant: 'main',   // 'main' = big numbered links with underline hover
  items: [{ label: 'Story', href: '#story' }],  // 'side' = small uppercase links, line-mask reveal
  ariaLabel: 'Main' }                           // optional
```

The `main` font size follows the box size (container query units `cqi`/`cqh`), so the same nav fits a large or a small cell.

### 4e. `osm`: OpenStreetMap

```js
{ area: 'osm', type: 'osm', direction: 'lr',
  center: [56.0935, -3.9206],     // [lat, lng]
  zoom: 13,
  dark: true,                     // optional: CSS filter that inverts the tiles to a dark map
  scrollZoom: false,              // optional: mouse-wheel zoom (off by default so the page doesn't trap scrolling)
  markers: [{ position: [56.0935, -3.9206], popup: 'Heritage Centre' }],
  tiles: 'https://…/{z}/{x}/{y}.png',   // optional custom tile server
  attribution: '…' }                    // required by most tile servers if you change `tiles`
```

- Leaflet 1.9.4 (BSD-2) is loaded by `multibox.js` from unpkg **only if** an `osm` box exists (`data-leaflet` on the script tag overrides the location). The map options travel as JSON in the box's `data-map` attribute. If loading fails, the box shows "The map could not be loaded."
- Default tiles come from `tile.openstreetmap.org`. They are fine for a demo or low traffic, but the [OSM tile usage policy](https://operations.osmfoundation.org/policies/tiles/) asks heavier users to use their own or a commercial tile provider. Keep the attribution visible.
- The map is created while the menu is closed. The boxes keep their size while hidden, and `invalidateSize()` runs on every open in case the window was resized.

---

## Adding a new box type

1. In `js/template.js`, add a function to `boxTypes` (and, for the Zope product, a box view + template, see `CONCEPT.md`). It receives the box config and returns the children of `.box__inner`. Use `h(tag, props, ...children)` to build elements.
2. Add the class `rise` (fade and rise) or the `mask` + `mask__inner` pair (line reveal) to anything that should animate in. The stagger is assigned automatically.
3. Style it in `css/template.css` under `.box--<type>`. Use `cqi`/`cqh` units if it should scale with the cell.

## Tested

Headless Chrome, 1440×900 and 400×800: all 6 demo boxes are placed in their areas (on mobile: stacked, `static` hidden), the OSM tiles load, closed boxes are `visibility: hidden`, Esc closes the menu, and there are no console errors. A broken config (unknown type, missing area, L-shaped area) produces the matching warnings.
