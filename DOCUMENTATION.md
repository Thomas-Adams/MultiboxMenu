# Multibox Menu: How It Works

Notes on how the demo is built, so the same approach can be used for other grids and reveal menus.
Files: `index.html`, `css/base.css`, `js/demo.js`. Libraries: Anime.js 4 (`js/anime.min.js`, a slim build with only `animate`, `stagger` and `utils`) and imagesLoaded. The demo used TweenMax (GSAP 2) until October 2026.
CSS-only variant (no animation library, no tilt): `index-css.html`, `css/menu-css.css`, `js/demo-css.js`. See section 6.
Config-driven template built on the CSS-only variant: `template.html` + `site.config.js`. See `TEMPLATE.md`.

---

## 1. Layer structure (`.frame`, `.content`, `.menu`)

Everything sits inside `<main>`. There are three sibling layers, stacked with `z-index`:

```
<main>                          position: relative (no z-index, so no stacking context)
├── .frame      z-index 199     header, info text, GitHub link (fixed on desktop)
├── .content    z-index 100     its own stacking context
│   ├── .background  z 1        fixed, full viewport, holds the tilt layers
│   ├── .content__title         mix-blend-mode: screen, z 199
│   └── .content__tagline       z 199
└── nav.menu    z-index 200     fixed, full-viewport grid, the boxes
    ├── .menu__item × 5
    ├── .action--menu   z 1000  hamburger button
    └── .action--close  z 1000  close button, same spot, opacity 0
```

What each layer does:

| Layer | Position | Pointer events | Role |
|---|---|---|---|
| `.content` | `relative`; on desktop a flex column, `min-height: 100vh`, centred | normal | Hero with the image, title and tagline |
| `.frame` | desktop: `fixed`, `100vw × 100vh`, a 2×3 grid with `align-content: space-between` | `none`, except `.frame a` (`auto`) | Text in the corners above the hero, but clicks pass through it |
| `.menu` | `fixed`, `100% × 100vh`, `overflow: hidden` | `none` while closed, `auto` with `.menu--open` | Always on top. Closed, it is see-through to the mouse because its boxes are moved out of view |

Points that matter if you build your own version:

- **The background is inside `.content` on purpose.** `mix-blend-mode` only blends with content inside the same stacking context. `.content` (`position: relative; z-index: 100`) is that context, so the red title "screens" against the photo. If you move `.background` out of `.content`, the blend breaks.
- **The title and tagline need `position: relative`.** Without it, `z-index: 199` only works on desktop, where they are flex items of `.content` (`display: flex` at 53em and wider). Under 53em `.content` is a plain block, so the fixed `.background` (z 1) would paint over the text. `css/base.css` sets it on `.content__title` and `.content__tagline` (the template does the same on `.hero__title` / `.hero__tagline`).
- **Fix for the blend flicker** (commit `e4c5f88`): `.background__copy { transform: translate3d(0,0,0) }` puts each copy on its own GPU layer. This stops flicker where the blended title overlaps the animated layers.
- **Buttons:** both buttons sit inside `.menu`, which has `pointer-events: none` while closed. `.action--menu` sets `pointer-events: auto` itself, so it stays clickable. When the menu opens, `.menu--open .action--menu` turns its pointer events off and the close button gets them from `.menu`.
- **Mobile (< 53em):** `body` has `padding-top: 6rem` and `.frame` stays in the normal page flow. Only the desktop media query makes `.frame` fixed and builds its grid.

---

## 2. Background "parallax" (really a multi-layer tilt) — `TiltFx`

There is no scroll parallax. The depth effect comes from **semi-transparent copies of the same image**, each moved by a different amount as the mouse moves.

### Structure

```html
<div class="background" style="background-image:url(img/1.jpg)">   <!-- base image, opacity 1, perspective: 1000px -->
  <div class="background__copy"></div> × 4                           <!-- added by JS, opacity 0.3 each -->
</div>
```

- `TiltFx.layout()` fills `.background` with 4 (`layersTotal`) `.background__copy` divs. The base element keeps its own background image, so you see the base image plus 4 ghost layers.
- All of them are `position: fixed; inset: 0; background-size: cover; background-position: 50% 0`.
- `perspective: 1000px` on `.background` gives the children's `rotationX/Y` a 3D look.

### Motion maths (per layer, on `mousemove`, throttled with `requestAnimationFrame`)

`val = layerIndex + 1`, so 1, 2, 3, 4. Higher layers move more, which is where the depth comes from.
The mouse position is mapped linearly across the element's size: left/top edge gives the first value, right/bottom edge gives the second.

| Property | Range | Driven by |
|---|---|---|
| `x` | `+val px → -val px` | mouse X (moves against the mouse) |
| `y` | `+val px → -val px` | mouse Y |
| `rotationX` | `-2° → 2°` | mouse Y |
| `rotationY` | `-val° → +val°` | mouse X |
| `scale` | `1.03 → 0.97` | mouse Y |

General formula: `value = (to - from) / size * mousePos + from`.

Each update is `animate(layer, { duration: 1500, ease: 'outQuad', ... })`. The **1.5 s ease-out lag** matters as much as the offsets. Every mousemove starts a new animation that replaces the running one (Anime.js's default `composition: 'replace'`), so the layers trail behind the cursor smoothly.

### Gating with `allowTilt`

A global flag turns the effect off:

- menu open, so the tilt stops (it starts again on close)
- hover over the menu button runs `tilt.reset()`: layers stagger back to neutral (`outExpo`, 0.07 s stagger)
- hover over the GitHub link runs `tilt.zoom()`: layers stagger to `scale: 1.1`

### Reuse notes

- `layout()` copies the image from `.background` (`getComputedStyle(this.DOM.main).backgroundImage`), so changing the inline style on `.background` changes all the layers too.
- More layers or a larger `val` gives a stronger ghosting effect. Lower opacity makes it subtler.

---

## 3. Grid layout

`nav.menu` is the grid. Each `.menu__item` is one box (cell).

### Mobile (< 53em)

```css
.menu { display: grid; grid-template-columns: 100%; grid-template-rows: repeat(3, 33.33%); }
.menu__item--4, .menu__item--5 { display: none; }   /* only items 1–3, in source order */
```

### Desktop (≥ 53em)

```css
.menu {
  grid-template-columns: 20% 30% 50%;
  grid-template-rows: 60% 40%;
  grid-template-areas:
    "item3 item2 item1"
    "item4 item5 item1";
}
.menu__item--1 { grid-area: item1; }   /* … one line per item */
```

```
 ┌───────┬───────────┬──────────────────┐
 │ item3 │  item2    │                  │
 │ side- │  map      │     item1        │ 60%
 │ menu  │  (lr)     │     main menu    │
 │ (bt)  │           │     (bt)         │
 ├───────┼───────────┤   spans 2 rows   │
 │ item4 │  item5    │                  │ 40%
 │ (rl)  │  quote(tb)│                  │
 └───────┴───────────┴──────────────────┘
   20%       30%            50%
```

- Percentage rows work because `.menu` has a fixed height (`100vh`).
- Because of `grid-template-areas`, **source order and visual order are independent**. The HTML order (1–5) controls the mobile stack and tab order; the area map controls the desktop layout.
- An area that spans several cells (`item1` in both rows) only needs its name repeated in the template.

### The two-element box (needed for the reveal)

```html
<div class="menu__item menu__item--N" data-direction="bt|tb|lr|rl">   <!-- grid cell, overflow:hidden = the mask -->
  <div class="menu__item-inner">                                       <!-- 100% × 100%, background colour + content -->
    …content…
  </div>
</div>
```

```css
.menu__item       { position: relative; overflow: hidden; }
.menu__item-inner { width: 100%; height: 100%; overflow: hidden;
                    display: flex; flex-direction: column; justify-content: center;
                    transform: translate3d(100%,0,0); }   /* closed state: off to the side, clipped */
```

The box colour belongs on `.menu__item-inner` (`--color-bg-itemN`), **not** on the cell. The cell has to stay transparent so the page shows through while the menu is closed.

---

## 4. Animations when the menu opens and closes

Nearly all of the motion is **JavaScript (Anime.js)**, not CSS animations. CSS only sets the hidden starting states and the small hover transitions. Opening adds or removes `.menu--open` (which only changes pointer events) and starts the animations in `Menu.toggle()`.

### 4.1 The box reveal (counter-movement mask)

For each item, the **cell** and its **inner** element move by the same distance in **opposite directions**:

| `data-direction` | cell starts at | inner starts at |
|---|---|---|
| `bt` bottom → top | `y: 101%` | `y: -101%` |
| `tb` top → bottom | `y: -101%` | `y: 101%` |
| `lr` left → right | `x: -101%` | `x: 101%` |
| `rl` right → left | `x: 101%` | `x: -101%` |
| *(none)* diagonal | `x,y: 101%` | `x,y: -101%` |

Both then animate to `0%` together.

```
open:   utils.set(cell, config); utils.set(inner, configInner);
        animate([cell, inner], { duration: 900, x:'0%', y:'0%', ease: 'outQuint' })
close:  cell → config,  inner → configInner,  600 ms, 'inOutQuart'
```

**Why this works:** transform percentages are relative to the element's own size, and cell and inner are the same size. So `cell + inner = 0` at every frame and the **content stays still on screen**. Only the clipping window (the cell with `overflow: hidden`) slides over it. The result looks like a wipe or curtain reveal, not a sliding panel.

Details:
- `101%` instead of `100%` avoids hairline seams from sub-pixel rounding.
- Mixing directions (bt, lr, rl, tb) across neighbouring boxes is what makes the effect feel like many separate boxes.
- `isAnimating` blocks clicks while the menu animates. It is released when the **last** item's animation finishes. That only works because every item uses the same duration and no delay. If you give items different timings, use an Anime.js timeline (`createTimeline`, not in the slim build) and its `onComplete` instead.

### 4.2 Content and controls (run in parallel with the boxes)

| Target | Open | Close |
|---|---|---|
| `.action--close` | opacity 0→1, rotate 0→180°, 0.6 s `outQuint` | opacity →0, rotate →270°, 0.6 s |
| `.action--menu` | opacity →0, 0.6 s | opacity →1, 0.3 s after a **0.3 s delay** |
| `.mainmenu__item` (big links) | from `y:50%, opacity:0`, 0.9 s, **`stagger(100)`** | to `y:50%, opacity:0`, 0.2 s, **`stagger(100, {from: 'last'})`** (reverse order) |
| `.sidemenu__item-inner` (spans) | from `y:100%`, 0.5 s, `stagger(50)` | to `y:100%`, 0.2 s, `stagger(50, {from: 'last'})` |
| `.menu__item-link` | from `x:10%`, 0.9 s | to `x:10%`, 0.6 s |

The side-menu links use a **line mask**. `.sidemenu__item` (`overflow: hidden`) holds a `span` that starts at `translateY(100%)` (set in CSS) and slides up into view. Staggering `from: 'last'` on close makes the items leave in reverse order.

Easing pattern: **open = `outQuint`** (fast start, soft landing), **close = `inOutQuart`** and shorter. Closing is meant to be quicker than opening.

### 4.3 CSS hover transitions (desktop)

- `.menu__item-map` scales to 1.1 on hover (`0.8s cubic-bezier(0.2,1,0.8,1)`), and `.menu__item-hoverlink` fades in.
- `.mainmenu__item::after` is a red bar that goes from `scaleX(0)` to `scaleX(1)` with `transform-origin: 100% 50%`.
- `.mainmenu__item::before` is a CSS counter numbering (`01`, `02`, …), using `decimal-leading-zero`.
- `.label` elements use `writing-mode: vertical-rl`. The `--vert-mirror` variant adds `rotate(180deg)` so the text reads bottom to top.

---

## 5. Recipe: building a new grid

1. **Plan the areas.** Draw the grid and pick a reveal direction for each box. Neighbouring boxes look better with different directions.
2. **HTML:** for each box, add `.menu__item.menu__item--N[data-direction]` > `.menu__item-inner` > content. Put the open and close buttons inside `nav.menu`.
3. **CSS:**
   - `.menu`: `position: fixed; inset: 0; height: 100vh; overflow: hidden; display: grid; pointer-events: none; z-index` above the page. `.menu--open { pointer-events: auto }`.
   - Set `grid-template-columns/rows/areas` for each breakpoint, and add a `grid-area` to every item. Hide the boxes you don't need on small screens.
   - `.menu__item { overflow: hidden; position: relative }`, plus `.menu__item-inner { 100% × 100%; transform: translate3d(100%,0,0) }` and the colour on the inner element.
   - Give content that will animate its hidden starting state in CSS (e.g. `opacity: 0`, or `translateY(100%)` inside an `overflow: hidden` wrapper). This avoids a flash before the first open.
4. **JS:** the `Menu` class finds every `.menu__item` and reads `data-direction` on its own, so **new boxes need no JS changes**. Only box-specific content animations (like `mainLinks`/`sidemenuLinks`) have to be added to `toggle()`, in matching open and close forms.
5. **Background effect (optional):** keep the background inside the hero's stacking context if you use blend modes, and add `translate3d(0,0,0)` to the animated layers.

### TweenMax → Anime.js 4 (how `demo.js` was ported)

| TweenMax (before) | Anime.js 4 (now) |
|---|---|
| `TweenMax.set(t, vars)` | `utils.set(t, vars)` |
| `TweenMax.to(t, 0.9, vars)` | `animate(t, { duration: 900, ...vars })` (milliseconds) |
| `TweenMax.staggerTo(t, d, vars, 0.1)` / `-0.1` | `animate(t, { ..., delay: stagger(100) })` / `stagger(100, {from: 'last'})` |
| `startAt: {y: '50%'}` + `y: '0%'` | `y: ['50%', '0%']` (`[from, to]`) |
| `Quint.easeOut`, `Quart.easeInOut`, `Quad.easeOut`, `Power1.easeOut`, `Expo.easeOut` | `'outQuint'`, `'inOutQuart'`, `'outQuad'`, `'outQuad'`, `'outExpo'` |
| `rotation`, `rotationX/Y` | `rotate`, `rotateX/Y` |

Anime.js only reads a target's **inline** transform as the starting value (not the CSS one), so set starting states with `utils.set()` or a `[from, to]` array, as `toggle()` does.

`js/anime.min.js` is a slim build (15.7 KB gzipped; the full bundle is 40.5 KB, TweenMax was 38.3 KB). The header of the file has the esbuild command. If you need more of Anime.js (timelines, scroll, SVG), add the export to that command and rebuild.

---

## 6. CSS-only variant (`index-css.html`)

The same menu without an animation library. Every box reveal and content animation is a CSS transition or keyframe animation. The background tilt (`TiltFx`) is left out, so the background is a static image.

| File | Role |
|---|---|
| `index-css.html` | Same markup as `index.html`, plus `--i`/`--n` stagger variables, ARIA attributes on the buttons, and no Anime.js |
| `css/menu-css.css` | Loaded **after** `base.css` and overrides its hidden starting states. Contains all the motion |
| `js/demo-css.js` | About 20 lines: toggles the state classes, closes on Esc, moves focus, preloads images |

### 6.1 The state model

JS only sets classes on `nav.menu`:

| Class | Meaning |
|---|---|
| *(none)* | initial page load, closed |
| `.menu--open` | open |
| `.menu--closed` | closed **after** having been open (only used for the close button's exit animation) |

Every animated element has two rules:

```css
.thing             { /* CLOSED state */ transition: /* used when CLOSING */; }
.menu--open .thing { /* OPEN state   */ transition: /* used when OPENING */; }
```

The browser always uses the `transition` of the state it is moving **to**. That's how opening and closing get different durations and easing curves (0.9 s ease-out in, 0.6 s ease-in-out out), as in the JS version.

Easing equivalents used (as `:root` variables):

| JS easing (TweenMax / Anime.js) | CSS variable | `cubic-bezier` |
|---|---|---|
| `Quint.easeOut` / `outQuint` | `--ease-open` | `0.23, 1, 0.32, 1` |
| `Quart.easeInOut` / `inOutQuart` | `--ease-close` | `0.77, 0, 0.175, 1` |
| `Quint.easeInOut` / `inOutQuint` | `--ease-inout` | `0.86, 0, 0.07, 1` |
| `Quad.easeOut` / `outQuad` | `--ease-fade` | `0.25, 0.46, 0.45, 0.94` |

### 6.2 Box reveal with custom properties

`data-direction` is turned into an offset. The cell moves by the offset and the inner element by its negative:

```css
.menu__item                    { --dx: 0%; --dy: 0%; }
.menu__item[data-direction=bt] { --dy: 101%; }      /* tb: -101%, lr: --dx -101%, rl: --dx 101% */

.menu__item       { transform: translate(var(--dx), var(--dy)); }
.menu__item-inner { transform: translate(calc(-1 * var(--dx)), calc(-1 * var(--dy))); }
.menu--open .menu__item,
.menu--open .menu__item-inner { transform: none; }
```

- The defaults must be `0%`, not `0`. `calc(-1 * 0)` gives a plain number, which is invalid inside `translate()`, and the whole declaration would be dropped.
- To add a new direction, write one rule with the offset. The counter-movement follows automatically.
- `visibility: hidden` on closed cells keeps their links out of keyboard focus. On close, `visibility 0s 0.6s` delays the switch to hidden until the slide-out has finished. On open it switches to visible immediately.
- No `isAnimating` lock is needed. CSS transitions can be interrupted, so clicking or pressing Esc mid-animation simply reverses from the current position.

### 6.3 Staggering without JS

The stagger index is written into the HTML, and the parent holds the item count:

```html
<div class="mainmenu" style="--n:4">
  <a class="mainmenu__item" style="--i:0">…</a>
```
```css
.menu--open .mainmenu__item { transition-delay: calc(var(--i) * 0.1s); }               /* open: first → last */
.mainmenu__item             { transition-delay: calc((var(--n) - 1 - var(--i)) * 0.1s); } /* close: last → first */
```

Custom properties are inherited, so `.sidemenu__item-inner` (the span) uses the `--i` from its parent `<a>`.
When an element also has a hover transition (`color` on `.mainmenu__item`), it has to be repeated in **both** `transition` lists. Otherwise the shorthand removes it.

### 6.4 When a transition is not enough: the close button

The JS version spins the close button 0→180° on open and continues 180→270° on close. A transition can only run backwards (180→0), so this uses two `@keyframes` (`closeCtrlIn`, `closeCtrlOut`).
The exit animation is attached to `.menu--closed`, not to the base state. Otherwise it would play once when the page loads (a flash of the X fading out). That is why there is a third state class.
Trade-off: keyframe animations jump instead of reversing smoothly when interrupted. That's fine for a small icon, but use transitions for the boxes.

### 6.5 Accessibility extras (not in the JS version)

- `aria-label` on both buttons, and `aria-expanded` on the open button
- Esc closes the menu
- Focus moves to the close button on open and back to the open button on close
- `prefers-reduced-motion: reduce` sets every duration and delay inside `.menu` to almost zero

### 6.6 Tested behaviour

Tested in headless Chrome at 1440×900 and 400×800:
- Closed: all cells `visibility: hidden`, and the cell and inner offsets cancel out (e.g. `+909px / -909px`)
- Mid-reveal: the content stays still while the boxes wipe in, and the link staggers are visible
- Open: all transforms `none`
- Close with Esc: everything returns to the start values
- No console errors

### 6.7 Recipe changes compared with section 5

For a new CSS-only grid, steps 1–3 of section 5 stay the same. Then:
- Use the `--dx/--dy` rules instead of `data-direction` being read by JS.
- Add `style="--i:…"` to staggered children and `--n` to their parent.
- Add an open rule and a closed rule (each with its own `transition`) for every animated content element.
- JS is reduced to the class toggle.
